// SPDX-License-Identifier: MIT
import {
  roleProfile,
  routeValues,
  buildJourney,
  validateJourney,
  LocalHive,
  ROUTES,
  ROLE_SOURCES,
  firstOrderDifference,
} from "./role-journey.mjs";
const hive = new LocalHive();
let refreshHive = () => {};
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
const button = (text, fn) => {
  const b = el("button", text);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
};
function download(name, data) {
  const a = el("a"),
    url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function describe(payload) {
  if (payload.kind === "INTEGER") return `${payload.value} · Integer`;
  if (payload.kind === "RADIX_LITERAL")
    return `${payload.text} · Basis ${payload.radix} · Wert ${payload.decodedValue}`;
  if (payload.kind === "RESIDUE_MOD_12")
    return `Rest ${payload.remainder} modulo 12`;
  return `${payload.values.length} mögliche Ursprünge: ${payload.values.slice(0, 6).join(", ")} … ${payload.values.at(-1)}`;
}
export function renderRoleJourney(host, number) {
  const wasOpen = host.open,
    p = roleProfile(number);
  host.replaceChildren();
  host.open = wasOpen;
  host.append(el("summary", `Rollen & Wege · Zahl ${number}`));
  const body = el("div", undefined, "role-body");
  host.append(body);
  body.append(
    el("p", "DIESELBE ZAHL / MEHRERE GEBUNDENE ROLLEN", "eyebrow"),
    el("h3", "Was nimmt die Zahl auf ihrem Weg mit?"),
  );
  body.append(
    el(
      "p",
      `${number} = ${p.decimalPlaces.map((d) => `${d.digit} × 10^${d.power}`).join(" + ")}`,
      "role-equation",
    ),
  );
  const profile = el("dl", undefined, "role-profile");
  const rows = [
    ["Zahlenwert", String(number)],
    [
      "Schreibweisen",
      `${p.representations.decimal} dezimal · ${p.representations.binary} binär · ${p.representations.hexadecimal} hexadezimal`,
    ],
    [
      "Anzahl / Positionen",
      number
        ? `${number} Einträge · Indices 0–${number - 1} · ${p.finiteCardinality.fixedWidthBits} Bits für einen Code fester Länge`
        : "0 Einträge · leere Indexmenge",
    ],
    ["Ungeordnete Paare", String(p.pairCount)],
    [
      "Ordnungsprofil",
      `Probe p ≤ ${number}: ${p.orderRole.yesAnswers} Ja- und ${p.orderRole.noAnswers} Nein-Antworten für p von 0 bis 1000`,
    ],
    [
      "ASCII-Kontext",
      p.ascii
        ? `${p.ascii.notation} · ${p.ascii.kind}`
        : "außerhalb von 7-Bit-ASCII",
    ],
    [
      "HTTP-Kontext",
      p.http
        ? `${p.http.description} · datierter Registerstand`
        : "außerhalb des HTTP-Statusbereichs 100–599",
    ],
  ];
  for (const [key, value] of rows)
    profile.append(el("dt", key), el("dd", value));
  body.append(profile);
  const compareLabel = el(
      "label",
      "Mit einer anderen Zahl vergleichen · 0–1000",
    ),
    compareInput = el("input"),
    compareResult = el("p", undefined, "role-status");
  compareInput.type = "text";
  compareInput.inputMode = "numeric";
  compareInput.maxLength = 4;
  compareInput.value = number <= 988 ? number + 12 : number - 12;
  compareInput.id = "role-compare";
  compareLabel.htmlFor = compareInput.id;
  compareResult.setAttribute("role", "status");
  const compareButton = button("Erste Ordnungsabweichung finden", () => {
    if (
      !/^(0|[1-9][0-9]{0,3})$/.test(compareInput.value) ||
      Number(compareInput.value) > 1000
    ) {
      compareResult.textContent = "Eine ganze Zahl von 0 bis 1000 eingeben.";
      return;
    }
    const other = Number(compareInput.value),
      difference = firstOrderDifference(number, other);
    compareResult.textContent = difference
      ? `Probe ${difference.probe}: ${difference.probe} ≤ ${number} ist ${difference.left ? "wahr" : "falsch"}; ${difference.probe} ≤ ${other} ist ${difference.right ? "wahr" : "falsch"}. Gleicher Rest modulo 12: ${number % 12 === other % 12 ? "ja" : "nein"}.`
      : `Beide Inputs sind ${number}; das vollständige Ordnungsprofil stimmt überein.`;
  });
  body.append(
    compareLabel,
    compareInput,
    compareButton,
    compareResult,
    el(
      "p",
      "Im festgelegten Ordnungsmodell identifizieren alle Proben p ≤ n zusammen die Zahl n. Ein einzelner Rest modulo 12 kann mehrere Ursprünge haben.",
      "hint",
    ),
  );
  const a = routeValues(number, "PLUS_THEN_DOUBLE").at(-1).value,
    b = routeValues(number, "DOUBLE_THEN_PLUS").at(-1).value;
  body.append(
    el(
      "p",
      `Reihenfolge zählt: (${number} + 1) × 2 = ${a}; (${number} × 2) + 1 = ${b}.`,
      "role-equation",
    ),
  );
  const label = el("label", "Weg auswählen"),
    select = el("select");
  select.id = "role-route";
  label.htmlFor = select.id;
  for (const [id, route] of Object.entries(ROUTES)) {
    const option = el("option", route.title);
    option.value = id;
    select.append(option);
  }
  const steps = el("ol", undefined, "role-steps"),
    status = el("p", undefined, "role-status"),
    problem = el("p", undefined, "error");
  status.setAttribute("role", "status");
  problem.setAttribute("role", "alert");
  problem.hidden = true;
  let packet = null,
    generation = 0;
  const showError = (e) => {
    problem.textContent = e.message;
    problem.hidden = false;
  };
  const hiveState = el("p", undefined, "role-hive-status");
  hiveState.setAttribute("role", "status");
  const updateHive = () => {
    const s = hive.summary();
    hiveState.textContent = `HIVE · ${s.runCount} Läufe · ${s.claimCount} verschiedene Rechenbefunde · ${s.provenanceClusterCount} Modell-Provenienzcluster`;
  };
  refreshHive = updateHive;
  const exportRun = button("Lauf als JSON ↓", () => {
    if (packet) download(`halveth-number-journey-${number}.json`, packet);
  });
  exportRun.disabled = true;
  const collect = button("Pollen ins Hive sammeln", async () => {
    if (!packet) return;
    collect.disabled = true;
    problem.hidden = true;
    try {
      const result = await hive.collect(packet);
      refreshHive();
      status.textContent =
        result.state === "ALREADY_COLLECTED"
          ? "Dieser Lauf ist bereits im Hive. Sein Original bleibt erhalten."
          : "Lauf mit Herkunft gesammelt. Eine Wiederholung desselben Rechenwegs bleibt als weiterer Zeuge im selben Modellcluster erkennbar.";
    } catch (e) {
      showError(e);
    } finally {
      collect.disabled = false;
    }
  });
  collect.disabled = true;
  const run = button("Weg ausführen", async () => {
    const request = ++generation,
      route = select.value;
    run.disabled = true;
    collect.disabled = true;
    exportRun.disabled = true;
    problem.hidden = true;
    packet = null;
    steps.replaceChildren();
    try {
      const result = await buildJourney(
        number,
        route,
        `RUN_${crypto.randomUUID()}`,
        new Date().toISOString(),
      );
      await validateJourney(result);
      if (request !== generation) return;
      packet = result;
      result.states.forEach((state, i) => {
        const li = el("li");
        li.append(
          el("span", i ? `Schritt ${i}` : "Start", "role-step-index"),
          el("strong", describe(state.payload)),
          el(
            "small",
            i
              ? result.relations[i - 1].definition.description
              : "Gebundener Modellinput. Der Ausgangsrecord bleibt erhalten.",
          ),
        );
        steps.append(li);
      });
      status.textContent =
        result.route === "MODULO_12"
          ? `${result.evaluation.candidateCount} mögliche Ursprünge im Register. Der Rest allein wählt keinen davon aus. Der ursprüngliche Input liegt separat im Lauf.`
          : result.evaluation.valuePreserved
            ? "Zahlenwert erhalten. Schreibweisen und Zustandsvorkommen bleiben einzeln adressiert."
            : `Das Rechenmodell erreicht ${result.evaluation.lastValue}. Die Operationsreihenfolge ist im Lauf gebunden.`;
      collect.disabled = false;
      exportRun.disabled = false;
    } catch (e) {
      showError(e);
    } finally {
      if (request === generation) run.disabled = false;
    }
  });
  select.addEventListener("change", () => {
    generation++;
    packet = null;
    steps.replaceChildren();
    status.textContent = "Neuer Weg gewählt. Zum Berechnen ausführen.";
    collect.disabled = true;
    exportRun.disabled = true;
    run.disabled = false;
  });
  const controls = el("div", undefined, "role-controls");
  controls.append(run, collect, exportRun);
  body.append(label, select, controls, steps, status, problem);
  const hivePanel = el("div", undefined, "role-hive");
  const actions = el("div", undefined, "role-controls");
  actions.append(
    button("Hive als JSON ↓", () =>
      download("halveth-number-hive.json", hive.export()),
    ),
    button("Sitzungshive leeren", () => {
      hive.clear();
      updateHive();
      status.textContent =
        "Sitzungshive geleert. Heruntergeladene Dateien bleiben erhalten.";
    }),
  );
  hivePanel.append(
    hiveState,
    el(
      "p",
      "Nur diese Browser-Sitzung. Sammlung bedeutet hier: Modellläufe samt Ableitungen und Quellen behalten. Ein erneutes Ausführen liefert keine unabhängige Außenbestätigung.",
      "hint",
    ),
    actions,
  );
  body.append(hivePanel);
  const citations = el("p", undefined, "research-citations");
  for (const key of ["XSD", "PROV", "STIGMERGY"]) {
    const source = ROLE_SOURCES[key],
      a = el("a", `${source.title} ↗`);
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    citations.append(a);
  }
  const report = el(
    "a",
    "Vertiefung: Stellenwert, Yoneda, Herkunft und Hive ↗",
  );
  report.href = "ROLE_JOURNEY_RESEARCH.md";
  citations.append(report);
  body.append(
    citations,
    el(
      "p",
      "Lokales Rechenmodell: Du wählst den Weg. Jeder Schritt zeigt Operator, Zustand und erhaltene Herkunft. Weitere Deutungen bleiben in der Recherche offen.",
      "hint",
    ),
  );
  updateHive();
}
