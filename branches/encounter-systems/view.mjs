// SPDX-License-Identifier: MIT
import { Core } from "./model.mjs";

(() => {
  "use strict";
  const root = document.getElementById("halveth-encounter-work");
  if (!root) return;
  const $ = (id) => root.querySelector("#" + id),
    canvas = $("ew-canvas"),
    ctx = canvas.getContext("2d"),
    motion = matchMedia("(prefers-reduced-motion: reduce)");
  let world,
    historyView = null,
    playing = !motion.matches,
    view = "3D",
    yaw = 0.1,
    pitch = 0.53,
    width = 736,
    height = 480,
    theme = {},
    raf = null,
    last = null,
    accumulator = 0,
    drag = null,
    lastText = "",
    cache = new Map(),
    lastMetric = -1,
    themeRevision = 0,
    example = false;
  const published = new Set(),
    saved = window.openai?.widgetState?.modelContent;
  if (
    saved?.model === "encounter-build-v1" &&
    (saved.view === "2D" || saved.view === "3D")
  )
    view = saved.view;
  function lockHistory(value) {
    for (const id of [
      "ew-partner",
      "ew-visit",
      "ew-write",
      "ew-consent",
      "ew-guard",
      "ew-play",
      "ew-repair",
      "ew-demo",
    ])
      $(id).disabled = value;
  }
  function fresh() {
    example = false;
    historyView = null;
    lockHistory(false);
    world = new Core.World({ task: $("ew-task").value });
    cache.clear();
    lastText = "";
    lastMetric = -1;
    accumulator = 0;
    last = null;
    playing = !motion.matches;
    $("ew-consent").checked = true;
    $("ew-guard").checked = true;
    ui();
    draw();
    schedule();
  }
  function colors() {
    const probe = document.createElement("span");
    probe.hidden = true;
    root.append(probe);
    const read = (n) => {
      probe.style.color = "var(" + n + ")";
      return getComputedStyle(probe).color;
    };
    theme = {
      fg: read("--foreground"),
      muted: read("--muted-foreground"),
      border: read("--border"),
      bg: read("--background"),
      series: [1, 2, 3, 4].map((i) => read("--viz-series-" + i)),
      font: getComputedStyle(root).fontFamily,
    };
    probe.remove();
    const p = document.createElement("canvas");
    p.width = 256;
    p.height = 1;
    const c = p.getContext("2d"),
      g = c.createLinearGradient(0, 0, 255, 0);
    g.addColorStop(0, theme.bg);
    g.addColorStop(0.25, theme.series[0]);
    g.addColorStop(0.65, theme.series[1]);
    g.addColorStop(0.93, theme.series[0]);
    g.addColorStop(1, theme.fg);
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 1);
    theme.palette = c.getImageData(0, 0, 256, 1).data;
    themeRevision++;
    cache.clear();
  }
  function project(x, y, z = 0) {
    const ay = view === "3D" ? yaw : 0,
      ax = view === "3D" ? pitch : 0,
      xx = x * Math.cos(ay) + z * Math.sin(ay),
      zz = -x * Math.sin(ay) + z * Math.cos(ay),
      yy = y * Math.cos(ax) - zz * Math.sin(ax);
    const s =
      width < 480
        ? Math.min(width / 400, height / 500)
        : Math.min(width / 510, height / 310);
    return {
      x: width / 2 + xx * s,
      y: height * (width < 480 ? 0.5 : 0.52) + yy * s,
      z: zz,
      s,
    };
  }
  function poly(pts, fill, stroke, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function path(pts, col, width = 1, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function text(t, x, y, small = false) {
    const base = parseFloat(getComputedStyle(root).fontSize) || 14;
    ctx.font = (small ? Math.max(12, base * 0.86) : base) + "px " + theme.font;
    ctx.fillStyle = small ? theme.muted : theme.fg;
    ctx.textAlign = "center";
    const half = ctx.measureText(t).width / 2;
    x = Math.max(half + 4, Math.min(width - half - 4, x));
    ctx.fillText(t, x, y);
  }
  function quad(x, y, z, w, h) {
    return [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + h, z],
      [x, y + h, z],
    ].map((p) => project(...p));
  }
  function texture(bytes, rows, key, revision) {
    const stamp = key + ":" + revision + ":" + themeRevision;
    if (cache.has(stamp)) return cache.get(stamp);
    const image = document.createElement("canvas");
    image.width = image.height = Core.SIZE;
    const c = image.getContext("2d"),
      data = c.createImageData(Core.SIZE, Core.SIZE);
    for (let i = 0; i < Core.SIZE * rows; i++) {
      const offset = bytes[i] * 4;
      data.data.set(theme.palette.slice(offset, offset + 3), i * 4);
      data.data[i * 4 + 3] = 255;
    }
    c.putImageData(data, 0, 0);
    if (cache.size > 160) cache.clear();
    cache.set(stamp, image);
    return image;
  }
  function imageOnPlane(image, x, y, z, w, h) {
    const pts = quad(x, y, z, w, h),
      a = pts[0],
      b = pts[1],
      d = pts[3];
    ctx.save();
    ctx.transform(
      (b.x - a.x) / image.width,
      (b.y - a.y) / image.width,
      (d.x - a.x) / image.height,
      (d.y - a.y) / image.height,
      a.x,
      a.y,
    );
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
  function slab(x, y, z, w, h, col) {
    const front = quad(x, y, z, w, h),
      back = quad(x, y, z - 7, w, h);
    poly([front[2], front[3], back[3], back[2]], col, theme.border, 0.18);
    poly([front[1], front[2], back[2], back[1]], col, theme.border, 0.25);
    poly(front, theme.bg, theme.border);
  }
  const positions = {
    partner: [-185, -70, 10],
    visitor: [180, -80, 10],
    writer: [180, 100, 10],
  };
  const ports = {
    partner: [
      [-90, -35, 12],
      [-150, -70, 12],
    ],
    visitor: [
      [90, -35, 12],
      [145, -80, 12],
    ],
    writer: [
      [90, 40, 12],
      [145, 100, 12],
    ],
  };
  function route(kind, t) {
    const [a, b] = ports[kind];
    return a.map(
      (v, i) => v + (b[i] - v) * t + (i === 2 ? Math.sin(t * Math.PI) * 23 : 0),
    );
  }
  function port(pos, open, col) {
    const p = project(...pos),
      r = 7 * p.s;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r, r * (view === "3D" ? 0.75 : 1), 0, 0, Math.PI * 2);
    ctx.fillStyle = theme.bg;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (!open)
      path(
        [
          { x: p.x - r * 0.65, y: p.y - r * 0.65 },
          { x: p.x + r * 0.65, y: p.y + r * 0.65 },
        ],
        col,
        2,
      );
  }
  function connection(kind, active, open, col) {
    const points = Array.from({ length: 30 }, (_, i) =>
      project(...route(kind, i / 29)),
    );
    if (active) {
      path(points, col, 7, 0.09);
      path(points, theme.border, 1, 0.9);
    }
    port(ports[kind][0], active && open, col);
    port(ports[kind][1], active && open, col);
  }
  function body(kind, label, subtitle, col) {
    const pos = positions[kind],
      w = kind === "partner" ? 60 : 68,
      h = 46;
    slab(pos[0] - w / 2, pos[1] - h / 2, pos[2], w, h, col);
    const p = project(pos[0], pos[1] - h / 2, pos[2]);
    text(label, p.x, p.y - 35);
    text(subtitle, p.x, p.y - 16, true);
    return pos;
  }
  function draw() {
    const active = world;
    if (historyView) world = historyView;
    try {
      drawScene();
    } finally {
      world = active;
    }
  }
  function drawScene() {
    ctx.clearRect(0, 0, width, height);
    if (!world) return;
    if (width < 480) {
      Object.assign(positions, {
        partner: [-132, -170, 10],
        visitor: [132, -170, 10],
        writer: [0, 260, 10],
      });
      Object.assign(ports, {
        partner: [
          [-55, -65, 12],
          [-107, -147, 12],
        ],
        visitor: [
          [55, -65, 12],
          [107, -147, 12],
        ],
        writer: [
          [55, 65, 12],
          [0, 237, 12],
        ],
      });
    } else {
      Object.assign(positions, {
        partner: [-185, -70, 10],
        visitor: [180, -80, 10],
        writer: [180, 100, 10],
      });
      Object.assign(ports, {
        partner: [
          [-90, -35, 12],
          [-150, -70, 12],
        ],
        visitor: [
          [90, -35, 12],
          [145, -80, 12],
        ],
        writer: [
          [90, 40, 12],
          [145, 100, 12],
        ],
      });
    }
    if (world.visitor.deliveredAt !== undefined) {
      const depart = Math.min(
        1,
        (world.time - world.visitor.deliveredAt) / 1.3,
      );
      positions.visitor[1] -= depart * 26;
      ports.visitor[1][1] -= depart * 26;
    }
    connection(
      "partner",
      world.partner.requested && !world.finished,
      world.consent,
      theme.series[1],
    );
    connection("visitor", world.visitor.active, world.consent, theme.series[2]);
    connection(
      "writer",
      world.writer.active || world.writer.status !== "bereit",
      !world.guard,
      theme.series[3],
    );
    slab(-88, -65, 10, 176, 132, theme.series[0]);
    for (const t of world.tiles) {
      const x = -88 + (t.id % 8) * 22,
        y = -65 + Math.floor(t.id / 8) * 22;
      const col = t.corrupted
        ? theme.series[3]
        : t.owner === "partner"
          ? theme.series[1]
          : theme.border;
      if (t.rows) {
        const img = texture(t.bytes, t.rows, "tile" + t.id, t.revision);
        imageOnPlane(img, x + 0.5, y + 0.5, 11, 21, 21);
      }
      path(
        [...quad(x, y, 11, 22, 22), project(x, y, 11)],
        col,
        0.6,
        t.done ? 0.65 : 0.3,
      );
    }
    const hostLabel = project(0, 91, 10);
    text("Eigenes System", hostLabel.x, hostLabel.y);
    text(
      world.done + " von 48 Bildkacheln",
      hostLabel.x,
      hostLabel.y + 19,
      true,
    );
    const p = body("partner", "Partner", world.partner.status, theme.series[1]);
    if (world.partner.job !== null) {
      const t = world.tiles[world.partner.job];
      imageOnPlane(
        texture(t.bytes, t.rows, "tile" + t.id, t.revision),
        p[0] - 17,
        p[1] - 15,
        12,
        34,
        32,
      );
    }
    const v = body(
      "visitor",
      "Besucher",
      world.visitor.status,
      theme.series[2],
    );
    for (const [i, c] of world.visitor.copies.entries())
      imageOnPlane(
        texture(c.bytes, 16, "copy" + c.id, 0),
        v[0] - 29 + i * 19,
        v[1] - 10,
        12,
        18,
        23,
      );
    const w = body(
      "writer",
      "Schreibversuch",
      world.writer.status,
      theme.series[3],
    );
    if (world.writer.status.includes("verändert")) {
      const t = world.tiles.find((t) => t.corrupted);
      if (t)
        imageOnPlane(
          texture(t.bytes, 16, "tile" + t.id, t.revision),
          w[0] - 14,
          w[1] - 14,
          12,
          28,
          28,
        );
    } else {
      const center = project(w[0], w[1] + 5, 12);
      text("WRITE", center.x, center.y, true);
    }
    for (const f of world.flights) {
      const t = Math.max(0, Math.min(1, (world.time - f.start) / f.duration)),
        kind = f.kind === "build" ? "partner" : "visitor",
        u = f.kind === "build" ? 1 - t : t,
        pos = route(kind, u);
      imageOnPlane(
        texture(f.bytes, 16, "flight" + f.kind + f.tileId, 0),
        pos[0] - 8,
        pos[1] - 8,
        pos[2] + 2,
        16,
        16,
      );
    }
    if (world.visitor.active && !world.flights.some((f) => f.kind === "copy")) {
      const t = Math.max(0, 1 - (world.time - world.visitor.started) / 0.8),
        q = project(...route("visitor", t));
      text("?", q.x, q.y - 6);
    }
    if (world.writer.active) {
      const t = Math.max(0, 1 - (world.time - world.writer.started) / 0.8),
        q = project(...route("writer", t));
      ctx.fillStyle = theme.series[3];
      ctx.fillRect(q.x - 3, q.y - 3, 6, 6);
    }
  }
  function ui() {
    const active = world;
    if (historyView) world = historyView;
    try {
      uiScene();
    } finally {
      world = active;
    }
    root.dispatchEvent(
      new CustomEvent("encounter-frame", {
        detail: { historical: Boolean(historyView) },
      }),
    );
  }
  function uiScene() {
    if (!world) return;
    $("ew-demo").textContent=example?"Beispiel neu starten":"Beispiel starten";
    $("ew-demo-status").textContent=example
      ? world.finished
        ? `Fertig: ${world.done}/48 Kacheln · ${world.partner.contributed} vom Partner · ${world.visitor.copies.length}/3 Kopien · ${world.writer.status}.`
        : `${playing?"Läuft":"Pausiert"}: ${world.done}/48 Kacheln · ${world.visitor.copies.length}/3 Kopien · ${world.writer.status}.`
      : "In etwa 20 Sekunden: gemeinsames Bild, drei Kopien, ein gestoppter Schreibversuch.";
    const text = world.events.at(-1).text;
    if (lastText !== text) {
      $("ew-event").textContent = text;
      lastText = text;
    }
    if (world.time - lastMetric > 0.12 || !playing) {
      $("ew-done").textContent = world.done + " / 48";
      $("ew-contribution").textContent = world.partner.contributed;
      $("ew-copies").textContent = world.visitor.copies.length + " / 3";
      lastMetric = world.time;
    }
    $("ew-play").textContent = playing
      ? "Pause"
      : world.finished
        ? "Fertig"
        : "Weiter";
    $("ew-view").textContent = view;
    $("ew-view").setAttribute("aria-pressed", String(view === "3D"));
    $("ew-repair-slot").hidden = !world.tiles.some((t) => t.corrupted);
  }
  function store() {
    const state = {
      model: "encounter-build-v1",
      view,
      consent: world.consent,
      guard: world.guard,
    };
    published.add(JSON.stringify(state));
    window.openai
      ?.setWidgetState?.({
        modelContent: state,
        privateContent: { yaw, pitch },
      })
      ?.catch(() => {});
  }
  function schedule() {
    if (playing && !document.hidden) {
      if (raf === null) raf = requestAnimationFrame(frame);
    } else if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
      last = null;
    }
  }
  function frame(now) {
    raf = null;
    if (!root.isConnected) return;
    if (last !== null) {
      accumulator += Math.min(0.06, (now - last) / 1000);
      while (accumulator >= 1 / 60) {
        world.step();
        accumulator -= 1 / 60;
      }
    }
    last = now;
    if (world.finished) playing = false;
    ui();
    draw();
    schedule();
  }
  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(2, devicePixelRatio || 1);
    width = r.width;
    height = r.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  for (const [id, kind] of [
    ["ew-partner", "partner"],
    ["ew-visit", "visit"],
    ["ew-write", "write"],
  ])
    $(id).addEventListener("click", () => {
      world.command(kind);
      if (motion.matches) {world.advanceTo(world.time+60);playing=false;}
      else playing = true;
      ui();
      draw();
      schedule();
      store();
    });
  $("ew-consent").addEventListener("change", (e) => {
    world.setConsent(e.target.checked);
    ui();
    draw();
    store();
  });
  $("ew-guard").addEventListener("change", (e) => {
    world.setGuard(e.target.checked);
    ui();
    draw();
    store();
  });
  $("ew-repair").addEventListener("click", () => {
    world.repair();
    cache.clear();
    ui();
    draw();
  });
  $("ew-play").addEventListener("click", () => {
    if (world.finished) return;
    playing = !playing;
    last = null;
    ui();
    schedule();
  });
  $("ew-reset").addEventListener("click", () => {
    fresh();
    store();
  });
  $("ew-demo").addEventListener("click",()=>{
    fresh();example=true;
    for(const command of ["partner","visit","write"])world.command(command);
    if(motion.matches){world.advanceTo(60);playing=false;}
    else playing=true;
    last=null;ui();draw();schedule();store();
  });
  $("ew-view").addEventListener("click", () => {
    view = view === "3D" ? "2D" : "3D";
    ui();
    draw();
    store();
  });
  $("ew-task").addEventListener("change", fresh);
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw, pitch };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || view !== "3D") return;
    yaw = Math.max(
      -0.8,
      Math.min(0.8, drag.yaw + (e.clientX - drag.x) * 0.004),
    );
    pitch = Math.max(
      0.05,
      Math.min(0.9, drag.pitch + (e.clientY - drag.y) * 0.004),
    );
    draw();
  });
  canvas.addEventListener("pointerup", () => {
    drag = null;
    store();
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  document.addEventListener("visibilitychange", () => {
    last = null;
    schedule();
  });
  motion.addEventListener("change", (e) => {
    if (e.matches) {
      playing = false;
      ui();
      schedule();
    }
  });
  window.addEventListener("openai:set_globals", (e) => {
    const s = e.detail?.globals?.widgetState?.modelContent;
    if (s?.model !== "encounter-build-v1" || published.has(JSON.stringify(s)))
      return;
    if (s.view === "2D" || s.view === "3D") view = s.view;
    ui();
    draw();
  });
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(() => {
    colors();
    draw();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  root.__encounter = {
    inspect: () => world.inspect(),
    advanceTo: (t) => {
      playing = false;
      world.advanceTo(t);
      ui();
      draw();
      schedule();
      return world.inspect();
    },
    world: () => world,
    snapshot: () => world.snapshot(),
    historical: () => Boolean(historyView),
    showHistory: (s) => {
      playing = false;
      historyView = structuredClone(s);
      lockHistory(true);
      ui();
      draw();
      schedule();
    },
    showPresent: () => {
      historyView = null;
      lockHistory(false);
      ui();
      draw();
      schedule();
    },
  };
  colors();
  fresh();
  resize();
})();
