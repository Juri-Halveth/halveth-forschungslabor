// SPDX-License-Identifier: MIT
// Juri Halveth / HALVETH. Developed with AI assistance.

export const VERSION = "1.0.0";
function validateOptions(input) {
  if (
    !input ||
    Object.getPrototypeOf(input) !== Object.prototype ||
    Object.keys(input).some(
      (k) => !["task", "rate", "buildDelay", "copyDelay"].includes(k),
    )
  )
    throw Error("Invalid options");
  const options = {
    task: "fractal",
    rate: 24,
    buildDelay: 1.1,
    copyDelay: 1.5,
    ...input,
  };
  if (
    !["fractal", "wave"].includes(options.task) ||
    !Number.isFinite(options.rate) ||
    options.rate < 1 ||
    options.rate > 60
  )
    throw Error("Invalid workload or rate");
  for (const k of ["buildDelay", "copyDelay"])
    if (!Number.isFinite(options[k]) || options[k] < 0 || options[k] > 8)
      throw Error("Invalid delay");
  return Object.freeze(options);
}
export function outputBytes(world) {
  const output = new Uint8Array(COLS * ROWS * SIZE * SIZE);
  for (const t of world.tiles)
    for (let y = 0; y < SIZE; y++)
      output.set(
        t.bytes.subarray(y * SIZE, (y + 1) * SIZE),
        (Math.floor(t.id / COLS) * SIZE + y) * COLS * SIZE +
          (t.id % COLS) * SIZE,
      );
  return output;
}

("use strict");
const COLS = 8,
  ROWS = 6,
  SIZE = 16,
  TOTAL = COLS * ROWS;
function pixel(x, y, task = "fractal") {
  if (task === "wave")
    return Math.round(
      127.5 *
        (1 + Math.sin(x * 0.12 + Math.cos(y * 0.11) * 2) * Math.cos(y * 0.09)),
    );
  let cr = (x / 128) * 3.35 - 2.35,
    ci = (y / 96) * 2.25 - 1.125,
    zr = 0,
    zi = 0,
    n = 0;
  while (zr * zr + zi * zi < 4 && n < 48) {
    const rr = zr * zr - zi * zi + cr;
    zi = 2 * zr * zi + ci;
    zr = rr;
    n++;
  }
  return n === 48 ? 255 : Math.round(255 * Math.sqrt(n / 48));
}
function rowBytes(id, row, task = "fractal") {
  const a = new Uint8Array(SIZE);
  for (let x = 0; x < SIZE; x++)
    a[x] = pixel(
      (id % COLS) * SIZE + x,
      Math.floor(id / COLS) * SIZE + row,
      task,
    );
  return a;
}
function canonical(id, task = "fractal") {
  if (
    !Number.isSafeInteger(id) ||
    id < 0 ||
    id >= TOTAL ||
    !["fractal", "wave"].includes(task)
  )
    throw Error("Invalid tile");
  const a = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) a.set(rowBytes(id, y, task), y * SIZE);
  return a;
}
function equal(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function digest(a) {
  let h = 2166136261;
  for (const v of a) {
    h ^= v;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
class World {
  constructor(input = {}) {
    this.options = validateOptions(input);
    this.epoch = 0;
    this.tick = 0;
    this.time = 0;
    this.consent = true;
    this.guard = true;
    this.tiles = Array.from({ length: TOTAL }, (_, id) => ({
      id,
      bytes: new Uint8Array(SIZE * SIZE),
      rows: 0,
      owner: null,
      done: false,
      corrupted: false,
      revision: 0,
    }));
    this.host = { id: "host", job: null, budget: 0, contributed: 0 };
    this.partner = {
      id: "partner",
      job: null,
      budget: 0,
      contributed: 0,
      active: false,
      requested: false,
      status: "bereit",
    };
    this.visitor = { active: false, status: "bereit", copies: [], started: 0 };
    this.writer = { active: false, status: "bereit", started: 0 };
    this.flights = [];
    this.events = [];
    this.denied = 0;
    this.finished = false;
    this.completedAt = null;
    this.lastDelivery = null;
    this.emit(
      "START",
      `Das eigene System berechnet ${this.options.task === "wave" ? "eine Wellentextur" : "ein Fraktalbild"}. Jede sichtbare Kachel enthält 256 Bildwerte.`,
    );
  }
  emit(kind, text) {
    this.events.push({
      id: `E-${this.events.length}`,
      tick: this.tick,
      time: this.time,
      kind,
      text,
    });
  }
  get done() {
    return this.tiles.filter((t) => t.done).length;
  }
  authorize(actor, effect, ids = []) {
    if (effect === "WRITE") return actor === "writer" && !this.guard;
    if (!this.consent) return false;
    if (actor === "partner" && effect === "BUILD") return true;
    return (
      actor === "visitor" &&
      effect === "COPY" &&
      ids.length === 3 &&
      new Set(ids).size === 3 &&
      ids.every((id) => Number.isInteger(id) && this.tiles[id]?.done)
    );
  }
  setConsent(v) {
    if (typeof v !== "boolean") throw Error("Freigabe muss boolesch sein");
    if (this.consent !== v) this.epoch++;
    this.consent = v;
    if (!v) {
      const p = this.partner;
      if (p.job !== null) {
        const tile = this.tiles[p.job];
        tile.owner = null;
        tile.rows = 0;
        tile.bytes.fill(0);
        tile.revision++;
        p.job = null;
      }
      p.active = false;
      p.status = "Freigabe fehlt";
    } else if (this.partner.requested) {
      this.partner.active = true;
      this.partner.status = "arbeitet mit";
    }
    this.emit(
      "CONSENT",
      v
        ? "Mitarbeit und drei Kopien freigegeben."
        : "Freigabe entzogen. Vorhandene Besucherkopien bleiben erhalten.",
    );
  }
  setGuard(v) {
    if (typeof v !== "boolean") throw Error("Schutz muss boolesch sein");
    this.guard = v;
    this.emit(
      "GUARD",
      v
        ? "Fremdes Überschreiben gesperrt."
        : "Modellgrenze geöffnet: Ein neuer Schreibversuch kann Bildbytes verändern.",
    );
  }
  command(kind) {
    if (!["partner", "visit", "write"].includes(kind))
      throw Error("Unbekannte Aktion");
    this.finished = false;
    this.completedAt = null;
    if (kind === "partner") {
      const p = this.partner;
      p.requested = true;
      p.active = this.authorize("partner", "BUILD");
      p.status = p.active ? "arbeitet mit" : "Freigabe fehlt";
      if (!p.active) this.denied++;
      this.emit(
        p.active ? "PARTNER" : "DENY",
        p.active
          ? "Partner übernimmt eigene Rechenaufträge und liefert geprüfte Bildkacheln zurück."
          : "Partner erhält keinen Rechenauftrag: Freigabe fehlt.",
      );
    } else if (kind === "visit") {
      if (this.visitor.copies.length === 3) {
        this.emit("KEPT", "Der Besucher besitzt bereits drei Kopien.");
        return;
      }
      if (this.visitor.active) return;
      this.visitor.active = true;
      this.visitor.started = this.time;
      this.visitor.status = "kommt an";
      this.emit("REQUEST", "Besucher fragt drei fertige Bildkacheln an.");
    } else if (kind === "write") {
      if (this.writer.active) return;
      this.writer.active = true;
      this.writer.started = this.time;
      this.writer.status = "kommt an";
      this.emit(
        "REQUEST",
        "Ein anderes System fordert das Überschreiben einer fertigen Bildkachel an.",
      );
    } else throw Error("Unbekannte Aktion");
  }
  nextJob(worker) {
    if (worker.job !== null) return;
    const t = this.tiles.find((t) => !t.done && t.owner === null);
    if (t) {
      t.owner = worker.id;
      worker.job = t.id;
      worker.jobEpoch = this.epoch;
    }
  }
  buildRow(worker) {
    this.nextJob(worker);
    if (worker.job === null) return;
    const t = this.tiles[worker.job];
    t.bytes.set(rowBytes(t.id, t.rows, this.options.task), t.rows * SIZE);
    t.rows++;
    t.revision++;
    if (t.rows === SIZE) {
      if (worker.id === "partner") {
        this.flights.push({
          kind: "build",
          tileId: t.id,
          bytes: t.bytes.slice(),
          epoch: worker.jobEpoch,
          start: this.time,
          duration: this.options.buildDelay,
        });
        worker.status = "liefert Kachel " + (t.id + 1);
      } else {
        t.done = true;
        worker.contributed++;
        this.lastDelivery = { tileId: t.id, by: "host", time: this.time };
      }
      worker.job = null;
    }
  }
  finishFlight(f) {
    const t = this.tiles[f.tileId];
    if (f.kind === "build") {
      if (
        this.canDeliver(f) &&
        !t.done &&
        t.owner === "partner" &&
        equal(f.bytes, canonical(f.tileId, this.options.task))
      ) {
        t.bytes = f.bytes.slice();
        t.rows = SIZE;
        t.done = true;
        t.revision++;
        this.partner.contributed++;
        this.lastDelivery = { tileId: t.id, by: "partner", time: this.time };
        this.emit(
          "DELIVERY",
          "Partnerkachel " +
            (t.id + 1) +
            " angekommen: alle 256 Bildwerte stimmen mit der Berechnungsregel überein.",
        );
      } else {
        t.owner = null;
        t.rows = 0;
        t.bytes.fill(0);
        t.revision++;
        this.emit(
          "DENY",
          "Partnerlieferung gestoppt; der Auftrag geht zurück in die eigene Warteschlange.",
        );
      }
    } else if (f.kind === "copy") {
      if (this.canDeliver(f)) {
        this.visitor.copies = f.copies.map((x) => ({
          id: x.id,
          bytes: x.bytes.slice(),
          digest: digest(x.bytes),
          grantEpoch: f.epoch,
        }));
        this.visitor.deliveredAt = this.time;
        this.visitor.status = "mit 3 Kopien weiter";
        this.visitor.active = false;
        this.emit(
          "COPY",
          "Drei Kacheln beim Besucher angekommen. Die Originale bleiben im Bild.",
        );
      } else {
        this.visitor.active = false;
        this.visitor.status = "Übergabe gestoppt";
        this.denied++;
        this.emit("DENY", "Kopien unterwegs gestoppt: Freigabe fehlt.");
      }
    }
  }
  step(dt = 1 / 60) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.1)
      throw Error("Ungültiger Zeitschritt");
    if (this.finished) return;
    this.time += dt;
    this.tick++;
    for (const w of [this.host, this.partner]) {
      if (w.id === "partner" && !w.active) continue;
      w.budget += dt * this.options.rate;
      let count = 0;
      while (w.budget >= 1 && count < 4) {
        w.budget--;
        this.buildRow(w);
        count++;
      }
    }
    const arrived = this.flights.filter(
      (f) => this.time - f.start >= f.duration,
    );
    this.flights = this.flights.filter((f) => this.time - f.start < f.duration);
    for (const f of arrived) this.finishFlight(f);
    const v = this.visitor;
    if (
      v.active &&
      !this.flights.some((f) => f.kind === "copy") &&
      this.time - v.started > 0.8
    ) {
      const ids = this.tiles
        .filter((t) => t.done)
        .slice(0, 3)
        .map((t) => t.id);
      if (!this.consent) {
        v.active = false;
        v.status = "zurückgewiesen";
        this.denied++;
        this.emit(
          "DENY",
          "Besucher zurückgewiesen. Er erhält keine Bildkacheln.",
        );
      } else if (ids.length < 3) v.status = "wartet auf Bildkacheln";
      else {
        const copies = ids.map((id) => ({
          id,
          bytes: this.tiles[id].bytes.slice(),
        }));
        this.flights.push({
          kind: "copy",
          tileId: ids[0],
          ids,
          copies,
          bytes: copies[0].bytes,
          epoch: this.epoch,
          start: this.time,
          duration: this.options.copyDelay,
        });
        v.status = "Kopien unterwegs";
      }
    }
    const w = this.writer;
    if (w.active && this.time - w.started > 0.8) {
      const t = this.tiles.find((t) => t.done);
      if (!t) {
        w.status = "wartet auf eine Kachel";
      } else {
        w.active = false;
        if (this.authorize("writer", "WRITE")) {
          for (let i = 0; i < t.bytes.length; i++)
            t.bytes[i] = 255 - t.bytes[i];
          t.revision++;
          t.corrupted = true;
          w.status = "Kachel " + (t.id + 1) + " verändert";
          this.emit(
            "WRITE",
            "Schutz offen: Bildkachel " +
              (t.id + 1) +
              " enthält jetzt tatsächlich andere Bildbytes.",
          );
        } else {
          w.status = "an Grenze gestoppt";
          this.denied++;
          this.emit(
            "DENY",
            "Schreibversuch gestoppt. Kein Bildwert wurde verändert.",
          );
        }
      }
    }
    if (
      this.done === TOTAL &&
      this.flights.length === 0 &&
      !v.active &&
      !w.active
    ) {
      if (this.completedAt === null) this.completedAt = this.time;
      if (this.time - this.completedAt > 2) {
        this.finished = true;
        this.partner.status = "Arbeit fertig";
        this.emit(
          "END",
          "Bild fertig: " +
            this.host.contributed +
            " eigene und " +
            this.partner.contributed +
            " geprüfte Partnerkacheln.",
        );
      }
    }
    if (this.time > 90) {
      this.finished = true;
      this.emit("END", "Modellzeit beendet.");
    }
  }
  repair() {
    let n = 0;
    for (const t of this.tiles)
      if (t.corrupted) {
        t.bytes = canonical(t.id, this.options.task);
        t.revision++;
        t.corrupted = false;
        n++;
      }
    if (n) this.writer.status = "Bild repariert";
    this.emit(
      "REPAIR",
      n +
        " Kachel(n) anhand der ursprünglichen Berechnungsregel wiederhergestellt.",
    );
  }
  advanceTo(t) {
    if (!Number.isFinite(t) || t < this.time || t > 90)
      throw Error("Ungültiges Ziel");
    while (this.time < t - 1e-8 && !this.finished)
      this.step(Math.min(1 / 60, t - this.time));
    return this.inspect();
  }
  snapshot() {
    return { ...structuredClone({ ...this }), done: this.done };
  }
  canDeliver(f) {
    return (
      f.epoch === this.epoch &&
      (f.kind === "build"
        ? this.authorize("partner", "BUILD")
        : this.authorize("visitor", "COPY", f.ids))
    );
  }
  inspect() {
    return {
      version: VERSION,
      task: this.options.task,
      tick: this.tick,
      epoch: this.epoch,
      time: this.time,
      done: this.done,
      consent: this.consent,
      guard: this.guard,
      partner: this.partner.contributed,
      host: this.host.contributed,
      copies: this.visitor.copies.map((x) => ({
        id: x.id,
        digest: x.digest,
        bytes: Array.from(x.bytes),
      })),
      corrupted: this.tiles.filter((t) => t.corrupted).map((t) => t.id),
      denied: this.denied,
      finished: this.finished,
      flights: this.flights.length,
      events: this.events.map((e) => ({ ...e })),
    };
  }
}
export const Core = Object.freeze({
  World,
  canonical,
  digest,
  equal,
  SIZE,
  COLS,
  ROWS,
  TOTAL,
});

export { World, canonical, digest, equal, SIZE, COLS, ROWS, TOTAL };
