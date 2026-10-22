export const RESPONSES = Object.freeze(['offen', 'kooperiert', 'blockiert']);

export function evaluateFork({ entry = true, a = 'offen', b = 'offen' } = {}) {
  if (typeof entry !== 'boolean' || !RESPONSES.includes(a) || !RESPONSES.includes(b)) {
    throw new TypeError('Ungültiger Modellzustand');
  }

  const paths = entry ? ['A', 'B', 'C'] : ['A', 'B'];
  if (!entry) {
    return {
      paths,
      state: 'TWO_ACTOR',
      title: 'C wartet außerhalb',
      detail: 'A und B bleiben die sichtbaren Wege. Über einen späteren Eintritt ist nichts entschieden.',
      nextQuestion: 'Welche konkrete Lücke würde C einen eigenen Eintritt ermöglichen?'
    };
  }

  if (a === 'blockiert' && b === 'blockiert') {
    return {
      paths,
      state: 'EXCLUSION_CANDIDATE',
      title: 'C trifft auf zwei Sperren',
      detail: 'C hat einen eigenen Weg eröffnet. Beide Seiten blockieren ihn im Modell; ein Ausgang folgt daraus noch nicht.',
      nextQuestion: 'Welche Ressource oder Regel trägt die Sperren tatsächlich?'
    };
  }

  if (a === 'kooperiert' && b === 'kooperiert') {
    return {
      paths,
      state: 'THREE_WAY_CANDIDATE',
      title: 'Drei Seiten können verhandeln',
      detail: 'A und B reagieren offen auf C. Ein gemeinsamer Vorschlag braucht noch konkrete Bedingungen und Zustimmung.',
      nextQuestion: 'Welche Lösung schützt die Interessen aller drei Seiten?'
    };
  }

  if (a === 'kooperiert' || b === 'kooperiert') {
    const partner = a === 'kooperiert' ? 'A' : 'B';
    return {
      paths,
      state: 'PAIR_CANDIDATE',
      title: `${partner} und C prüfen eine Verbindung`,
      detail: `Eine Reaktion von ${partner} öffnet eine Zweierverbindung. C bleibt ein eigener Akteur; die andere Seite verschwindet nicht.`,
      nextQuestion: 'Was gewinnt oder verliert die dritte Seite durch diese Verbindung?'
    };
  }

  if (a === 'blockiert' || b === 'blockiert') {
    const blocker = a === 'blockiert' ? 'A' : 'B';
    return {
      paths,
      state: 'CONTESTED_ENTRY',
      title: 'C bleibt im Streitfeld',
      detail: `${blocker} blockiert den neuen Weg. Die andere Seite hat noch keine Kooperation erklärt.`,
      nextQuestion: 'Kann C den eigenen Weg ohne Zugriff auf fremde Rechte fortsetzen?'
    };
  }

  return {
    paths,
    state: 'INDEPENDENT_ENTRY',
    title: 'Dritte Gabel ist offen',
    detail: 'C nutzt die Lücke für einen eigenen Weg. Die Reaktionen von A und B sind noch offen.',
    nextQuestion: 'Welche beobachtbare Reaktion folgt im nächsten Zug?'
  };
}
