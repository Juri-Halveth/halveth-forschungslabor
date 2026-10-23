// SPDX-License-Identifier: MIT
import {
  door,
  interpretation033,
  timer,
  timerSample,
  ballot,
  evaluateBallot,
  transition,
  sha256,
} from "./model.mjs";
const $ = (id) => document.getElementById(id),
  el = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
const svg = (tag, attrs) => {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};
const all = Array.from({ length: 1001 }, (_, n) => door(n));
let selected = 555,
  page = 8,
  filtered = all,
  panel = "explore",
  running = false,
  raf = 0,
  elapsed = 0,
  started = 0,
  lastEvent = null;
const events = new Map(),
  memoryNotes = new Map();
function error(message = "") {
  $("global-error").textContent = message;
  $("global-error").hidden = !message;
}
function safe(fn) {
  return (...args) => {
    try {
      error();
      Promise.resolve(fn(...args)).catch((e) => error(e.message));
    } catch (e) {
      error(e.message);
    }
  };
}
function integerText(value, label, max = 1000) {
  if (!/^\d{1,4}$/.test(value))
    throw new Error(`${label}: eine ganze dezimale Zahl eingeben.`);
  const n = Number(value);
  if (n > max) throw new Error(`${label}: maximal ${max}.`);
  return n;
}
function download(name, object) {
  const blob = new Blob([JSON.stringify(object, null, 2) + "\n"], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showPanel(id) {
  if (id !== "pulse" && running) stopPulse();
  panel = id;
  for (const p of document.querySelectorAll(".panel")) p.hidden = p.id !== id;
  for (const b of document.querySelectorAll("[data-panel]")) {
    const active = b.dataset.panel === id;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  }
  error();
  if (id === "pulse") drawPulse();
}
document
  .querySelectorAll("[data-panel]")
  .forEach((b) =>
    b.addEventListener("click", () => showPanel(b.dataset.panel)),
  );
function renderGrid() {
  const start = page * 64;
  const values = filtered.slice(start, start + 64);
  $("door-grid").replaceChildren(
    ...values.map((d) => {
      const b = el(
        "button",
        String(d.number).padStart(3, "0"),
        `${d.design ? "motif " : ""}${d.number === selected ? "selected" : ""}`,
      );
      b.type = "button";
      b.setAttribute(
        "aria-label",
        `Tür ${d.number}${d.design ? " · " + d.design.title : ""}`,
      );
      b.setAttribute("aria-pressed", String(d.number === selected));
      b.addEventListener("click", () => selectDoor(d.number, true));
      return b;
    }),
  );
  $("page-label").textContent = filtered.length
    ? `${start + 1}–${Math.min(start + 64, filtered.length)} / ${filtered.length}`
    : "Keine Einträge";
  $("page-prev").disabled = page === 0;
  $("page-next").disabled = (page + 1) * 64 >= filtered.length;
}
function noteKey() {
  return `HALVETH:DOORS:V2:NOTE:${selected}`;
}
function readNote() {
  try {
    return localStorage.getItem(noteKey()) ?? memoryNotes.get(noteKey()) ?? "";
  } catch {
    return memoryNotes.get(noteKey()) ?? "";
  }
}
function selectDoor(n, focusDetail = false) {
  selected = n;
  const d = all[n];
  $("door-number").value = String(n);
  $("selected-id").textContent = d.id;
  $("selected-number").textContent = n;
  $("selected-title").textContent = d.design?.title ?? `Zahl ${n}`;
  const names = [];
  if (n === 0) names.push("Additive Identität");
  if (n === 1) names.push("Multiplikative Identität");
  if (d.math.isPrime) names.push("Primzahl");
  if (d.math.isComposite) names.push("Zusammengesetzt");
  if (d.math.isPowerOfTwo) names.push("Zweierpotenz");
  if (d.math.isSquare) names.push("Quadratzahl");
  if (d.math.isTriangular) names.push("Dreieckszahl");
  if (d.math.isDecimalPalindrome) names.push("Dezimales Palindrom");
  names.push(d.math.parity === "EVEN" ? "Gerade" : "Ungerade");
  $("traits").replaceChildren(...names.map((n) => el("span", n)));
  $("factors").textContent =
    n === 0
      ? "0 · Primfaktorzerlegung hier nicht definiert"
      : n === 1
        ? "1 · leeres Primfaktorprodukt"
        : `${n} = ${d.math.primeFactors.join(" × ")}`;
  const facts = [
    ["Binär", d.math.binary],
    ["Oktal", d.math.octal],
    ["Hexadezimal", "0x" + d.math.hexadecimal],
    [
      "Bits / sichtbare Binärziffern",
      `${d.math.bitLength} / ${d.math.binaryDisplayDigits}`,
    ],
    ["Ziffernsumme", String(d.math.digitSum)],
    [
      "ASCII",
      d.ascii
        ? `${d.ascii.notation} · ${d.ascii.kind}`
        : "Außerhalb von 7-Bit-ASCII",
    ],
  ];
  if (d.http)
    facts.push(["HTTP-Snapshot", `${d.http.value} · ${d.http.description}`]);
  $("facts").replaceChildren(
    ...facts.flatMap(([k, v]) => [el("dt", k), el("dd", v)]),
  );
  $("door-question").textContent = d.investigation.question;
  $("research-state").textContent =
    `Arithmetik: berechnet. ${d.http ? "HTTP: datierter IANA-Snapshot. " : ""}${[27, 33, 555].includes(n) ? "Technische Primärquelle im jeweiligen Laborbereich." : "Historische Einzelrecherche: offen."}${d.design ? (n === 27 ? " Technischer Referenzeintrag." : " Entwurfsmotiv: aus dem gelieferten Register.") : ""}`;
  const links = [];
  for (const value of [n - 1, n + 1])
    if (value >= 0 && value <= 1000) {
      const b = el("button", `${value < n ? "←" : "→"} Tür ${value}`);
      b.type = "button";
      b.addEventListener("click", () => selectDoor(value));
      links.push(b);
    }
  if ([27, 33, 555, 999, 1000].includes(n)) {
    const target = n === 555 ? "pulse" : n >= 999 ? "gate" : "codes",
      b = el("button", "Versuch öffnen ↗");
    b.addEventListener("click", () => showPanel(target));
    links.push(b);
  }
  $("neighbours").replaceChildren(...links);
  $("note").value = readNote();
  $("note-state").textContent = "";
  $("door-prev").disabled = n === 0;
  $("door-next").disabled = n === 1000;
  const index = filtered.findIndex((x) => x.number === n);
  if (index >= 0) page = Math.floor(index / 64);
  renderGrid();
  if (focusDetail && matchMedia("(max-width:760px)").matches) {
    document
      .querySelector(".detail")
      .scrollIntoView({ block: "start", behavior: "instant" });
    $("selected-title").setAttribute("tabindex", "-1");
    $("selected-title").focus({ preventScroll: true });
  }
}
$("jump-form").addEventListener(
  "submit",
  safe((e) => {
    e.preventDefault();
    selectDoor(integerText($("door-number").value, "Tür"), true);
  }),
);
$("filter").addEventListener("change", () => {
  const f = $("filter").value;
  filtered = all.filter(
    (d) =>
      f === "all" ||
      (f === "prime" && d.math.isPrime) ||
      (f === "power" && d.math.isPowerOfTwo) ||
      (f === "square" && d.math.isSquare) ||
      (f === "triangle" && d.math.isTriangular) ||
      (f === "motif" && d.design),
  );
  page = 0;
  renderGrid();
});
$("page-prev").addEventListener("click", () => {
  page--;
  renderGrid();
});
$("page-next").addEventListener("click", () => {
  page++;
  renderGrid();
});
$("door-prev").addEventListener("click", () => selectDoor(selected - 1));
$("door-next").addEventListener("click", () => selectDoor(selected + 1));
$("save-note").addEventListener("click", () => {
  const value = $("note").value;
  memoryNotes.set(noteKey(), value);
  try {
    localStorage.setItem(noteKey(), value);
    $("note-state").textContent = "In diesem Browser gespeichert.";
  } catch {
    $("note-state").textContent =
      "Browserspeicher gesperrt: nur für diese Sitzung erhalten. JSON-Export bleibt möglich.";
  }
});
$("export-door").addEventListener(
  "click",
  safe(async () => {
    const d = door(selected);
    download(`halveth-door-${String(selected).padStart(4, "0")}.json`, {
      schema: "halveth.doors.local-note.v1",
      record: d,
      recordDigest: await sha256(d),
      note: $("note").value,
      recordedAt: new Date().toISOString(),
      noteEvidence: "USER_ENTERED_UNVERIFIED",
    });
  }),
);
$("interpretations").replaceChildren(
  ...interpretation033().map((row) => {
    const card = el("div", undefined, "card");
    card.append(
      el("code", row.representation),
      el("p", row.value, "value"),
      el("p", row.ascii ?? "Register-ID", "ascii"),
      el("p", row.rule, "hint"),
    );
    const b = el("button", `Tür ${row.value} öffnen`);
    b.addEventListener("click", () => {
      showPanel("explore");
      selectDoor(row.value);
    });
    card.append(b);
    return card;
  }),
);

function pulseConfigs() {
  return [
    { ra: 10000, rb: 68000, c: 0.00001, vcc: 5 },
    { ra: 10000, rb: Number($("rb").value) * 1000, c: 0.00001, vcc: 5 },
  ];
}
function drawPulse() {
  const [a, b] = pulseConfigs(),
    pa = timer(a),
    pb = timer(b),
    duration = 12,
    width = 820,
    left = 55;
  const make = (p, base, cap) =>
    Array.from({ length: 961 }, (_, i) => {
      const t = (i * duration) / 960,
        s = timerSample(t, p),
        x = left + (width * t) / duration,
        y = cap ? 274 - s.capacitor * 16 : base - s.output * 35;
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join("");
  $("wave-a").setAttribute("d", make(a, 70, false));
  $("wave-b").setAttribute("d", make(b, 155, false));
  $("cap-a").setAttribute("d", make(a, 0, true));
  $("cap-b").setAttribute("d", make(b, 0, true));
  const base = [];
  for (let t = 0; t <= 12; t += 2) {
    const x = left + (width * t) / 12;
    base.push(
      svg("line", { x1: x, y1: 15, x2: x, y2: 278, class: "gridline" }),
    );
    const text = svg("text", {
      x,
      y: 297,
      class: "svg-label",
      "text-anchor": "middle",
    });
    text.textContent = `${t} s`;
    base.push(text);
  }
  for (const [label, y] of [
    ["A", 52],
    ["B", 137],
    ["C", 235],
  ]) {
    const t = svg("text", { x: 15, y, class: "svg-label" });
    t.textContent = label;
    base.push(t);
  }
  $("wave-base").replaceChildren(...base);
  $("rb-value").textContent = `${$("rb").value} kΩ`;
  const difference = Math.abs(pa.frequency - pb.frequency);
  const facts = [
    ["Timer A", `${pa.frequency.toFixed(3)} Hz`],
    ["Timer B", `${pb.frequency.toFixed(3)} Hz`],
    [
      "Relative Phase",
      difference < 1e-10
        ? "gleicher Solltakt"
        : `1 Umlauf / ${(1 / difference).toFixed(2)} s`,
    ],
  ];
  $("pulse-facts").replaceChildren(
    ...facts.map(([label, value]) => {
      const e = el("div");
      e.append(el("span", label), el("strong", value));
      return e;
    }),
  );
}
function pulseFrame(now) {
  elapsed = (now - started) / 1000;
  const x = 55 + ((elapsed % 12) / 12) * 820;
  $("time-marker").setAttribute("x1", x);
  $("time-marker").setAttribute("x2", x);
  if (running && !document.hidden && panel === "pulse")
    raf = requestAnimationFrame(pulseFrame);
  else stopPulse();
}
function stopPulse() {
  running = false;
  cancelAnimationFrame(raf);
  $("play-pulse").textContent = "Zeit starten ▷";
  $("play-pulse").setAttribute("aria-pressed", "false");
}
$("play-pulse").addEventListener("click", () => {
  if (running) stopPulse();
  else {
    running = true;
    started = performance.now() - elapsed * 1000;
    $("play-pulse").textContent = "Zeit anhalten Ⅱ";
    $("play-pulse").setAttribute("aria-pressed", "true");
    raf = requestAnimationFrame(pulseFrame);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPulse();
});
$("rb").addEventListener("input", drawPulse);

function gateInputs() {
  return {
    packet: ballot({
      no: integerText($("no-count").value, "Nein", 999),
      missing: integerText($("missing-count").value, "Fehlend", 999),
      veto: integerText($("veto-count").value, "Veto", 999),
    }),
    policy: {
      kind: $("policy").value,
      requiredYes: integerText($("required").value, "Ja-Schwelle", 999),
    },
    window: {
      nowMs: $("window").value === "closed" ? 1000 : 999,
      deadlineMs: 1000,
    },
  };
}
const messages = {
  ELIGIBLE: [
    "Regel erfüllt",
    "Der gebundene lokale Übergang kann ausgelöst werden.",
  ],
  COLLECTING: [
    "Sammelfenster offen",
    "Der Modellzeitpunkt liegt vor der Frist.",
  ],
  DISSENT: [
    "Gegenstimme erhalten",
    "Einstimmigkeit verlangt alle 999 Ja-Stimmen.",
  ],
  INCOMPLETE_AT_DEADLINE: [
    "Antworten fehlen",
    "Fehlende Antworten bleiben MISSING. Die Ja-Schwelle wurde nicht erreicht.",
  ],
  THRESHOLD_NOT_MET: [
    "Ja-Schwelle verfehlt",
    "Die deklarierte Regel bleibt unerfüllt.",
  ],
  BLOCKED_BY_VETO: [
    "Veto erhalten",
    "Die gewählte Regel führt ein Veto als eigenen Blockierungsgrund.",
  ],
};
function renderGate() {
  lastEvent = null;
  $("transition-result").hidden = true;
  $("trigger").disabled = true;
  const { packet, policy, window } = gateInputs(),
    result = evaluateBallot(packet, policy, window),
    circles = [];
  for (let i = 0; i < 999; i++) {
    const answer = packet.votes[i].answer.toLowerCase();
    circles.push(
      svg("circle", {
        cx: 5 + (i % 45) * 10,
        cy: 5 + Math.floor(i / 45) * 10,
        r: 2.7,
        class: `vote-${answer}`,
      }),
    );
  }
  $("vote-map").replaceChildren(...circles);
  $("vote-map").setAttribute(
    "aria-label",
    `999 Modellstimmen: ${result.counts.YES} Ja, ${result.counts.NO} Nein, ${result.counts.MISSING} fehlend, ${result.counts.VETO} Veto`,
  );
  $("vote-counts").replaceChildren(
    ...Object.entries(result.counts).map(([key, n]) =>
      el("span", `${key}: ${n}`),
    ),
  );
  const [label, message] = messages[result.state];
  $("gate-state").textContent = label;
  $("gate-state").classList.toggle("ready", result.state === "ELIGIBLE");
  $("gate-explanation").textContent = message;
  $("trigger").disabled = result.state !== "ELIGIBLE";
}
for (const id of [
  "no-count",
  "missing-count",
  "veto-count",
  "required",
  "window",
])
  $(id).addEventListener("input", safe(renderGate));
$("policy").addEventListener(
  "change",
  safe(() => {
    const unanimous = $("policy").value === "UNANIMOUS";
    $("required").disabled = unanimous;
    $("required").value = unanimous ? "999" : "667";
    renderGate();
  }),
);
document.querySelectorAll("[data-vote]").forEach((b) =>
  b.addEventListener(
    "click",
    safe(() => {
      $("no-count").value = b.dataset.vote === "no" ? "1" : "0";
      $("missing-count").value = b.dataset.vote === "missing" ? "1" : "0";
      $("veto-count").value = b.dataset.vote === "veto" ? "1" : "0";
      renderGate();
    }),
  ),
);
$("trigger").addEventListener(
  "click",
  safe(async () => {
    const { packet, policy, window } = gateInputs();
    $("trigger").disabled = true;
    const event = await transition(packet, policy, window);
    const current = gateInputs();
    if (JSON.stringify(current) !== JSON.stringify({ packet, policy, window }))
      throw new Error(
        "Eingaben haben sich während der Berechnung geändert; erneut prüfen.",
      );
    lastEvent = event;
    events.set(event.eventId, event);
    $("transition-result").hidden = false;
    $("kernel-digest").textContent = event.kernelDigest;
    $("event-count").textContent =
      `${events.size} unterschiedliche Modellereignisse in dieser Sitzung. Derselbe gebundene Zustand erhält dieselbe Ereignis-ID.`;
  }),
);
$("export-event").addEventListener("click", () => {
  if (lastEvent)
    download("halveth-999-kernel-transition.json", {
      ...lastEvent,
      exportedAt: new Date().toISOString(),
    });
});
selectDoor(selected);
drawPulse();
renderGate();
