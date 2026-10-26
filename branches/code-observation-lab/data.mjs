// SPDX-License-Identifier: MIT
// Newly authored factual values are CC0-1.0; linked works retain their rights.
function frozen(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
export const FORMAT_CATALOG = frozen([
  { id: 'MAV_ACCESS', extension: '.mav', name: 'Access: Verknüpfung zu einer Ansicht', kind: 'DATABASE_SHORTCUT',
    sourceStatus: 'MANUFACTURER_DESCRIPTION', sources: ['MS-ACCESS-EXTENSIONS'], signature: null,
    explanation: 'Microsoft beschreibt eine View-Verknüpfung. Ihre Endung ist keine Aussage über den gesamten Dateiaufbau.' },
  { id: 'MAW_ACCESS', extension: '.maw', name: 'Access: Verknüpfung zu einer Data Access Page', kind: 'DATABASE_PAGE_SHORTCUT',
    sourceStatus: 'MANUFACTURER_DESCRIPTION', sources: ['MS-ACCESS-EXTENSIONS', 'MS-DATA-ACCESS-PAGES', 'MS-SHORTCUT-LIST'], signature: null,
    explanation: 'Die Endung gehört zum historischen Access-Kontext. Die eigentliche Data Access Page wurde als HTML-Datei gespeichert.' },
  { id: 'MAV_BAAM', extension: '.mav', name: 'Vortex: Spielarchiv BAAM', kind: 'GAME_ARCHIVE',
    sourceStatus: 'ORIGINAL_RECOGNITION_DEFINITION', sources: ['TRID-MAV'], signature: '4241414D',
    explanation: 'Die Kennung BAAM ist ein dokumentiertes Erkennungsmerkmal dieser Archivvariante; ein vollständiger Decoder ist hier nicht implementiert.' },
  { id: 'MAV_MAV8', extension: '.mav', name: 'Vortex: Spielarchiv MAV8', kind: 'GAME_ARCHIVE',
    sourceStatus: 'ORIGINAL_RECOGNITION_DEFINITION', sources: ['TRID-MAV'], signature: '4D415638',
    explanation: 'MAV8 ist die dokumentierte Anfangskennung einer weiteren Spielarchivvariante.' },
  { id: 'ETH_WINPHAROAH', extension: '.eth', name: 'WinPharoah: Ethernet-Aufzeichnung', kind: 'NETWORK_CAPTURE',
    sourceStatus: 'ORIGINAL_RECOGNITION_DEFINITION', sources: ['TRID-ETH'], signature: '1A350100',
    explanation: 'Eine historische Netzwerkaufzeichnung verwendet diese Endung und Kennung. Das ist keine Ethereum-Transaktion.' },
  { id: 'ETH_ETHER_CATALOG', extension: '.eth', name: 'Ether: Quelltext (Katalogspur)', kind: 'SOURCE_CODE_CANDIDATE',
    sourceStatus: 'CATALOG_ONLY', sources: ['ETHER-CATALOG'], signature: null,
    explanation: 'Ein Dateikatalog nennt Ether/Zoerf. Originales Sprachprojekt und eigene Musterdatei bleiben offen.' },
  { id: 'ETH_ETHNOGRAPH3', extension: '.eth', name: 'Ethnograph 3.0: ASCII-Arbeitstext', kind: 'QUALITATIVE_RESEARCH_TEXT',
    sourceStatus: 'VERSION_BOUND_PRIMARY_USAGE_REPORT', sources: ['ETHNOGRAPH3-ALJUNID'], signature: null,
    explanation: 'Ein Anwenderbericht von 1996 beschreibt DOS/ASCII-Text mit Endung .ETH für Ethnograph 3.0. Das belegt diese historische Nutzung, keine allgemeine Versionserkennung.' }
]);
export const RESEARCH_BRANCHES = frozen([
  { id: 'FORMAT', state: 'IMPLEMENTED', topic: 'Dateiformate und Namensräume', next: 'Konkrete freigegebene Musterdatei strukturell prüfen.' },
  { id: 'INTERFERENCE', state: 'IMPLEMENTED_MODEL', topic: 'Interferenz und Phasenmittelung', next: 'Modellvorhersage mit gebundenem Experiment vergleichen.' },
  { id: 'SYMBOL_CODE', state: 'IMPLEMENTED', topic: 'Reversible UTF-8-/Vierer-Codierung', next: 'Gleiche Daten mit anderem Decoder kontrolliert vergleichen.' },
  { id: 'RNA', state: 'IMPLEMENTED_LOOKUP', topic: 'RNA-Leserahmen und Codontabelle 1', next: 'Biologische Initiation und Zellkontext sind ein eigener Modellanschluss.' },
  { id: 'CAMERA', state: 'SIMULATED_ADAPTER', topic: 'Virtuelle Kamera mit Auftrag und Rückmeldung', next: 'Ein konkreter Hardwareadapter benötigt getrennte Freigabe und Messung.' },
  { id: 'STATE_BRIDGE', state: 'FINITE_MODEL', topic: 'Zustandsregeln und explizite Brücken', next: 'Eine weitere gebundene Zustandsfamilie mit eigenem Oracle prüfen.' },
  { id: 'AUDIO', state: 'HELD_ARCHITECTURE', topic: 'Spektralanalyse und Zeitfenster', next: 'Generische CLI mit synthetischen Signalen; private Medien bleiben lokal.' },
  { id: 'SPARSE_SPACE', state: 'HELD_ARCHITECTURE', topic: 'Adaptive Raum- und Materialzustände', next: 'Datenstruktur, Erhaltungsgesetz und Messkriterium für einen Demonstrator binden.' },
  { id: 'ASTROCHEMISTRY', state: 'SOURCE_RESEARCH', topic: 'Organische Bausteine in Meteoriten und Asteroidenproben', next: 'Stoffnachweis, Entstehungsmechanismus und biologische Funktion getrennt prüfen.' }
]);
export const CODON_CODE_ID = 1;
export const CODON_BASE_ORDER = 'UCAG';
export const CODON_SYMBOLS = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
export const AMINO_ACID_NAMES = frozen({
  F: 'Phenylalanin', L: 'Leucin', S: 'Serin', Y: 'Tyrosin', '*': 'Stop',
  C: 'Cystein', W: 'Tryptophan', P: 'Prolin', H: 'Histidin', Q: 'Glutamin',
  R: 'Arginin', I: 'Isoleucin', M: 'Methionin', T: 'Threonin', N: 'Asparagin',
  K: 'Lysin', V: 'Valin', A: 'Alanin', D: 'Aspartat', E: 'Glutamat', G: 'Glycin'
});
