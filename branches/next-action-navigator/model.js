export const AXIS_STATES = Object.freeze(['STABLE', 'MATERIAL_CANDIDATE', 'UNKNOWN', 'EXCLUDED_WITH_REASON']);
export const EVIDENCE_STATES = Object.freeze(['OBSERVED', 'STRONGLY_SUPPORTED', 'INFERRED', 'UNKNOWN', 'NOT_PROVEN', 'FALSIFIED']);

export const TRACKS = Object.freeze({
  security: {
    label: 'Security & Bug Bounty',
    purpose: 'Eine Sicherheitsfrage vom beobachteten Verhalten bis zur kleinsten zulässigen Probe führen.',
    axes: ['ENTRY_SURFACE', 'TRANSPORT_EDGE', 'PARSER_CANONICALIZATION', 'AUTHENTICATED_IDENTITY', 'AUTHORIZATION_OBJECT_BINDING', 'STATE_TRANSITION', 'VERSION_UPDATE', 'DEPENDENCY_ENVIRONMENT', 'OBSERVABILITY_RECOVERY'],
    links: [['Berichtsprüfung', '../security-impact-learning/'], ['Referenzprüfer', '../document-issue-reference-verifier/']],
    checkPrompt: 'Welche lokale oder nach aktueller Programmpolicy erlaubte, schadensfreie Beobachtung trennt Hypothese und Gegenhypothese?',
    finishPrompt: 'Beleggrenze und Fallstatus festhalten. Eine externe Meldung ist ein eigener Schritt.'
  },
  build: {
    label: 'Software bauen',
    purpose: 'Vom gewünschten Verhalten über einen Gegenfall zu einem überprüften Patch gelangen.',
    axes: ['USER_OUTCOME', 'INTERFACE', 'STATE_DATA', 'INTEGRATION', 'FAILURE_RECOVERY', 'SECURITY_PRIVACY', 'ACCESSIBILITY', 'DELIVERY_OBSERVABILITY'],
    links: [['Focus Kernel', '../focus-kernel/'], ['Bildvergleich', '../pixel-region-change-observer/']],
    checkPrompt: 'Welcher kleinste lokale Test unterscheidet den Patch vom bisherigen Verhalten?',
    finishPrompt: 'Patch, Teststand und offene Kante als getrennte Zustände übergeben.'
  },
  research: {
    label: 'Analyse & Forschung',
    purpose: 'Eine Idee mit Quelle, Gegenmodell und unterscheidender Beobachtung prüfen.',
    axes: ['SOURCE', 'DEFINITION', 'MECHANISM', 'COUNTERHYPOTHESIS', 'OBSERVATION', 'MATERIALIZATION_BRIDGE', 'IMPACT', 'UNKNOWN_FRONTIER'],
    links: [['Regelmodell', '../normenwerk-rule-universe/'], ['Optiklabor', '../eye-optics-and-prediction/']],
    checkPrompt: 'Welche kleinste Beobachtung würden die zwei Modelle unterschiedlich vorhersagen?',
    finishPrompt: 'Ergebnis, Abdeckung und genaue Bedingung für eine erneute Prüfung dokumentieren.'
  },
  communicate: {
    label: 'Zeigen & einreichen',
    purpose: 'Eine verständliche Darstellung aus Angebot, Beleg, Kanal und Einwilligung vorbereiten.',
    axes: ['AUDIENCE', 'OBSERVED_NEED', 'OFFER', 'PROOF', 'FRICTION', 'CONSENT_TRUST', 'CHANNEL', 'MEASUREMENT_RETENTION'],
    links: [['Dialogprotokoll', '../binary-inquiry-loop/'], ['Metadatenprüfung', '../bounded-knowledge-reuse-inventory/']],
    checkPrompt: 'Welche lokale Vorschau oder Gegenlesung zeigt, ob die Aussage verständlich und belegt ist?',
    finishPrompt: 'Entwurf, Freigabe, Versand, Empfang und Wirkung separat festhalten.'
  }
});

const hasText = value => typeof value === 'string' && value.trim().length > 0;
const step = (id, title, question, completed, state = 'NEXT') => ({ id, title, question, completed, state });

export function evaluateNavigation(input) {
  if (!input || !Object.hasOwn(TRACKS, input.track)) throw new TypeError('Unbekannter Arbeitsweg');
  const track = TRACKS[input.track];
  const axisStates = input.axisStates ?? {};
  const axisReasons = input.axisReasons ?? {};
  if (typeof axisStates !== 'object' || Array.isArray(axisStates)) throw new TypeError('Ungültiges Achsenregister');
  if (typeof axisReasons !== 'object' || Array.isArray(axisReasons)) throw new TypeError('Ungültige Achsenbegründung');
  for (const [id, value] of Object.entries(axisStates)) {
    if (!track.axes.includes(id) || !AXIS_STATES.includes(value)) throw new TypeError(`Ungültige Achse oder Zustand: ${id}`);
  }
  for (const [id, value] of Object.entries(axisReasons)) {
    if (!track.axes.includes(id) || typeof value !== 'string') throw new TypeError(`Ungültige Achsenbegründung: ${id}`);
  }
  if (input.evidenceState && !EVIDENCE_STATES.includes(input.evidenceState)) throw new TypeError('Ungültiger Evidenzstand');
  const missingAxis = track.axes.find(id => !Object.hasOwn(axisStates, id) || (axisStates[id] === 'EXCLUDED_WITH_REASON' && !hasText(axisReasons[id])));
  const common = [
    step('object', '01 · Gegenstand', 'Was ist die konkrete Frage oder gewünschte Wirkung?', hasText(input.goal)),
    step('source', '02 · Quelle', 'Welche Quelle oder Beobachtung trägt den Ausgangspunkt?', hasText(input.source)),
    step('scope', '03 · Rahmen', 'Für welches Projekt und welchen Geltungsbereich gilt das?', hasText(input.scope)),
    step('axes', '04 · Alle Seiten', missingAxis ? `${missingAxis}: Zustand einordnen oder den Ausschluss begründen. UNKNOWN ist zulässig.` : 'Alle Pflichtachsen sind sichtbar eingeordnet.', !missingAxis),
    step('models', '05 · Gegenmodell', 'Was behauptest du, und welche andere Erklärung passt ebenfalls?', hasText(input.hypothesis) && hasText(input.counter)),
    step('check', '06 · Kleinste Probe', track.checkPrompt, hasText(input.check)),
    step('result', '07 · Ergebnis', 'Was wurde tatsächlich beobachtet und mit welchem Evidenzstand?', hasText(input.result) && !!input.evidenceState),
    step('handoff', '08 · Wiedervorlage', 'Welches Ereignis oder welcher neue Beleg öffnet diesen Stand erneut?', hasText(input.reopen))
  ];
  const next = common.find(item => !item.completed);
  const securityBoundary = input.track === 'security';
  const actionClass = securityBoundary ? 'READ_ONLY_OR_LOCAL_SHADOW' : 'LOCAL_PLANNING_ONLY';
  if (next) {
    const question = next.id === 'models' && !hasText(input.hypothesis)
      ? 'Welche Hypothese erklärt die gebundene Beobachtung?'
      : next.id === 'models' && !hasText(input.counter)
        ? 'Welche Gegenhypothese erklärt dieselbe Beobachtung?'
        : next.question;
    return {
      track: input.track,
      steps: common,
      nextId: next.id,
      nextTitle: next.title,
      nextQuestion: question,
      actionClass,
      boundary: securityBoundary ? 'Dieser Navigator erteilt keine Testfreigabe. Eigentümer, aktuelle Programmpolicy und exakter Scope müssen separat geprüft sein. Hier bleiben nur Lesen und lokale Modelle ausführbar.' : null,
      outcome: next.id === 'handoff' ? 'REOPEN_TRIGGER_NEEDED' : 'IN_PROGRESS'
    };
  }
  return {
    track: input.track,
    steps: common,
    nextId: 'finite',
    nextTitle: 'Endlicher Arbeitsstand',
    nextQuestion: track.finishPrompt,
    actionClass,
    boundary: securityBoundary ? 'Ein lokaler Modellstand autorisiert keinen aktiven Test oder eine externe Meldung.' : null,
    outcome: 'FINITE_SNAPSHOT'
  };
}
