// SPDX-License-Identifier: MIT
import { FORMAT_CATALOG, CODON_BASE_ORDER, CODON_SYMBOLS, AMINO_ACID_NAMES } from './data.mjs';
export const LAB_VERSION = '1.0.0';
export const CONSTANTS = Object.freeze({ h: 6.62607015e-34, c: 299792458, e: 1.602176634e-19, G: 6.67430e-11 });
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
function finite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(label + ': endliche Zahl erforderlich.');
  return value;
}
function positive(value, label) {
  finite(value, label);
  if (value <= 0) throw new RangeError(label + ': positiver Wert erforderlich.');
  return value;
}
function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(label + ': ganze Zahl von ' + min + ' bis ' + max + ' erforderlich.');
  return value;
}
function scalarText(value, label, maxLength) {
  if (typeof value !== 'string') throw new TypeError(label + ': Text erforderlich.');
  if (value.length > maxLength) throw new RangeError(label + ': Eingabe zu lang.');
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) throw new TypeError(label + ': ungültige Unicode-Skalarfolge.');
      i++;
    } else if (code >= 0xDC00 && code <= 0xDFFF) throw new TypeError(label + ': ungültige Unicode-Skalarfolge.');
  }
  return value;
}
function numericResult(record, positiveKeys = []) {
  if (Object.values(record).some(value => !Number.isFinite(value)) || positiveKeys.some(key => record[key] <= 0))
    throw new RangeError('Ergebnis außerhalb des darstellbaren Zahlenbereichs.');
  return record;
}
export function parseHex(text) {
  scalarText(text, 'Hex', 12288);
  const compact = text.replace(/\s/gu, '');
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(compact)) throw new TypeError('Hex: vollständige Bytepaare ohne 0x-Präfix verwenden.');
  if (compact.length > 8192) throw new RangeError('Hex: höchstens 4096 Bytes.');
  return Uint8Array.from(compact.match(/../g) ?? [], pair => Number.parseInt(pair, 16));
}
const hexOf = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
export function inspectFormat(filename, hexText = '') {
  scalarText(filename, 'Dateiname', 512);
  if (!filename || /[\u0000-\u001F\\/]/u.test(filename)) throw new TypeError('Einen Dateinamen ohne Pfad oder Steuerzeichen eingeben.');
  const dot = filename.lastIndexOf('.');
  const extension = dot > 0 && dot < filename.length - 1 ? filename.slice(dot).toLowerCase() : '';
  const bytes = parseHex(hexText);
  const hex = hexOf(bytes);
  const candidates = [];
  for (const item of FORMAT_CATALOG) {
    const extensionMatch = item.extension === extension;
    const headerMatch = item.signature !== null && hex.length >= item.signature.length && hex.startsWith(item.signature);
    if (!extensionMatch && !headerMatch) continue;
    let match;
    if (headerMatch) match = extensionMatch ? 'EXTENSION_AND_HEADER' : 'HEADER_ONLY';
    else if (item.signature && bytes.length > 0) match = hex.length < item.signature.length && item.signature.startsWith(hex) ? 'INSUFFICIENT_HEADER' : 'HEADER_MISMATCH';
    else match = 'EXTENSION_ONLY';
    candidates.push({ id: item.id, name: item.name, kind: item.kind, sourceStatus: item.sourceStatus, match,
      explanation: item.explanation, sources: [...item.sources] });
  }
  const rank = { EXTENSION_AND_HEADER: 0, HEADER_ONLY: 1, EXTENSION_ONLY: 2, INSUFFICIENT_HEADER: 3, HEADER_MISMATCH: 4 };
  candidates.sort((a, b) => rank[a.match] - rank[b.match] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const namespaceHints = [];
  if (extension === '.eth') namespaceHints.push({ kind: 'ENS_NAME_CANDIDATE', note: 'In einer ENS-Anwendung könnte dieselbe Schreibweise ein Name sein. Registrierung und Auflösung wurden nicht abgefragt.' });
  return { filename, extension, byteCount: bytes.length, hex, candidates, namespaceHints, formatValidated: false, version: LAB_VERSION };
}
export function interference(overlap, phaseRad, humanRead = false, phaseJitterRad = 0) {
  finite(overlap, 'Überlappung'); finite(phaseRad, 'Phase'); finite(phaseJitterRad, 'Phasenrauschen');
  if (overlap < 0 || overlap > 1) throw new RangeError('Überlappung muss zwischen 0 und 1 liegen.');
  if (phaseJitterRad < 0 || phaseJitterRad > 100) throw new RangeError('Phasenrauschen muss zwischen 0 und 100 rad liegen.');
  if (typeof humanRead !== 'boolean') throw new TypeError('Lesemetadatum muss boolesch sein.');
  const visibility = overlap * Math.exp(-0.5 * phaseJitterRad ** 2);
  const distinguishability = Math.sqrt(Math.max(0, 1 - overlap ** 2));
  return { relativeIntensity: 1 + visibility * Math.cos(phaseRad), visibility, idealVisibility: overlap,
    distinguishability, dualitySum: visibility ** 2 + distinguishability ** 2,
    phaseNoiseSigmaRad: phaseJitterRad, humanRead,
    model: 'BALANCED_PATHS_PURE_MARKERS_GAUSSIAN_PHASE_AVERAGE_NO_DIFFRACTION_ENVELOPE',
    evidenceState: 'MODEL_PREDICTION', version: LAB_VERSION };
}
function permutations(items) {
  return items.length ? items.flatMap((item, i) => permutations(items.filter((_, j) => j !== i)).map(tail => [item, ...tail])) : [[]];
}
const mappings = Object.freeze(permutations(['A', 'C', 'G', 'T']).map(x => Object.freeze(x)));
function selectedMapping(index) { integer(index, 0, 23, 'Codierung'); return mappings[index]; }
export function decodeSymbolText(symbols, mappingIndex = 0) {
  scalarText(symbols, 'Symbolfolge', 65536);
  const mapping = selectedMapping(mappingIndex);
  if (!/^[ACGT]*$/.test(symbols)) throw new TypeError('Symbolfolge: ausschließlich A, C, G, T ohne Leerzeichen.');
  if (symbols.length % 4 !== 0) throw new RangeError('Eine Bytefolge benötigt vier Symbole pro Byte.');
  const values = new Map(mapping.map((symbol, index) => [symbol, index]));
  const bytes = new Uint8Array(symbols.length / 4);
  for (let i = 0; i < bytes.length; i++) {
    let value = 0;
    for (let j = 0; j < 4; j++) value = (value << 2) | values.get(symbols[i * 4 + j]);
    bytes[i] = value;
  }
  let text;
  try { text = decoder.decode(bytes); } catch { throw new TypeError('Die Symbolfolge ergibt unter diesem Decoder kein gültiges UTF-8.'); }
  const reencoded = encoder.encode(text);
  if (hexOf(reencoded) !== hexOf(bytes)) throw new TypeError('Nichtkanonische UTF-8-Bytefolge.');
  return { text, byteLength: bytes.length, hex: hexOf(bytes), version: LAB_VERSION };
}
export function encodeSymbolText(text, mappingIndex = 0) {
  scalarText(text, 'Text', 4096);
  const mapping = selectedMapping(mappingIndex);
  const bytes = encoder.encode(text);
  let symbols = '';
  for (const byte of bytes) for (const shift of [6, 4, 2, 0]) symbols += mapping[(byte >> shift) & 3];
  const recovered = decodeSymbolText(symbols, mappingIndex);
  return { text, symbols, mapping: mapping.map((symbol, index) => ({ bits: index.toString(2).padStart(2, '0'), symbol })),
    mappingIndex, byteLength: bytes.length, roundTripText: recovered.text,
    equalBytes: recovered.hex === hexOf(bytes), hex: hexOf(bytes), version: LAB_VERSION };
}
const codonTable = new Map();
let codonIndex = 0;
for (const a of CODON_BASE_ORDER) for (const b of CODON_BASE_ORDER) for (const c of CODON_BASE_ORDER) codonTable.set(a + b + c, CODON_SYMBOLS[codonIndex++]);
export function translateRna(sequence, frame = 0) {
  scalarText(sequence, 'RNA', 6000); integer(frame, 0, 2, 'Leserahmen');
  if (!/^[ACGU]*$/.test(sequence)) throw new TypeError('RNA: ausschließlich Großbuchstaben A, C, G, U ohne Leerzeichen.');
  if (frame > sequence.length) throw new RangeError('Der Leserahmen liegt hinter der vorhandenen Sequenz.');
  const codons = [];
  for (let i = frame; i + 2 < sequence.length; i += 3) {
    const codon = sequence.slice(i, i + 3), symbol = codonTable.get(codon);
    codons.push({ index: i, codon, symbol, name: AMINO_ACID_NAMES[symbol], isStop: symbol === '*' });
  }
  return { sequence, frame, strand: 'mRNA', direction: '5_PRIME_TO_3_PRIME', codons, aminoAcidSymbols: codons.map(c => c.symbol).join(''),
    trailingBases: sequence.slice(frame + codons.length * 3), geneticCode: 1,
    model: 'STANDARD_CODE_1_CODON_LOOKUP_NO_INITIATION_OR_CELL_MODEL', version: LAB_VERSION };
}
export function schwarzschildRadius(massKg) {
  positive(massKg, 'Masse');
  const schwarzschildRadiusM = massKg * (2 * CONSTANTS.G / CONSTANTS.c ** 2);
  numericResult({ schwarzschildRadiusM }, ['schwarzschildRadiusM']);
  return schwarzschildRadiusM;
}
export function weakDeflection(massKg, impactMeters) {
  positive(impactMeters, 'Stoßparameter');
  const schwarzschildRadiusM = schwarzschildRadius(massKg);
  const impactOverRs = impactMeters / schwarzschildRadiusM;
  numericResult({ impactOverRs }, ['impactOverRs']);
  if (impactMeters < 100 * schwarzschildRadiusM) throw new RangeError('Außerhalb dieses Modells: mindestens 100 Schwarzschildradien erforderlich.');
  const deflectionRad = 2 * (schwarzschildRadiusM / impactMeters);
  return { ...numericResult({ schwarzschildRadiusM, impactOverRs, deflectionRad, deflectionArcsec: deflectionRad * 180 / Math.PI * 3600 }, ['deflectionRad']),
    model: 'STATIC_NONROTATING_POINT_LENS_WEAK_FIELD_DISTANT_ENDPOINTS', evidenceState: 'MODEL_PREDICTION', version: LAB_VERSION };
}
export function photonEnergy(wavelengthNm) {
  positive(wavelengthNm, 'Wellenlänge');
  const wavelengthM = wavelengthNm * 1e-9, frequencyHz = CONSTANTS.c / wavelengthM;
  const joules = CONSTANTS.h * frequencyHz;
  return { ...numericResult({ wavelengthM, frequencyHz, joules, electronVolts: joules / CONSTANTS.e }, ['wavelengthM', 'frequencyHz', 'joules', 'electronVolts']),
    model: 'VACUUM_SINGLE_PHOTON', evidenceState: 'MODEL_PREDICTION', version: LAB_VERSION };
}
export function aperture(diameterMicrometers, suppliedWatts) {
  positive(diameterMicrometers, 'Durchmesser'); finite(suppliedWatts, 'Leistung');
  if (suppliedWatts < 0) throw new RangeError('Leistung muss nichtnegativ sein.');
  const diameterM = diameterMicrometers * 1e-6, areaM2 = Math.PI * (diameterM / 2) ** 2;
  numericResult({ diameterM, areaM2 }, ['diameterM', 'areaM2']);
  return { ...numericResult({ diameterM, areaM2, suppliedWatts, wattsPerM2: suppliedWatts / areaM2 }, suppliedWatts > 0 ? ['wattsPerM2'] : []),
    model: 'GEOMETRIC_AVERAGE_GIVEN_TRANSMITTED_POWER_NOT_A_SOURCE_MODEL', evidenceState: 'MODEL_PREDICTION', version: LAB_VERSION };
}
export function compareStateModels(bridge = 'IDENTITY') {
  if (!['IDENTITY', 'REVERSED_LABELS'].includes(bridge)) throw new TypeError('Unbekannte Zustandsbrücke.');
  const h = bridge === 'IDENTITY' ? [0, 1, 2] : [0, 2, 1];
  const rows = [0, 1, 2].map(input => ({ input, bridgeAfterRuleA: h[(input + 1) % 3], ruleBAfterBridge: (h[input] + 2) % 3 }));
  return { bridge, mapping: h, rows: rows.map(r => ({ ...r, equal: r.bridgeAfterRuleA === r.ruleBAfterBridge })),
    equivalentUnderThisBridge: rows.every(r => r.bridgeAfterRuleA === r.ruleBAfterBridge),
    scope: 'ALL_THREE_DECLARED_STATES_NO_UNIVERSAL_EQUIVALENCE_CLAIM', version: LAB_VERSION };
}
function vector(value, label) {
  if (!Array.isArray(value) || value.length !== 3) throw new TypeError(label + ': drei Koordinaten erforderlich.');
  return value.map((v, i) => finite(v, label + '[' + i + ']'));
}
function wrappedAngle(value) { return Math.atan2(Math.sin(value), Math.cos(value)); }
export function simulateCameraCommand(command, observation = null) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) throw new TypeError('Kameraauftrag erforderlich.');
  const allowed = ['requestId', 'frame', 'unit', 'camera', 'target'];
  if (Object.keys(command).length !== allowed.length || Object.keys(command).some(k => !allowed.includes(k))) throw new TypeError('Kameraauftrag hat fehlende oder unbekannte Felder.');
  if (typeof command.requestId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(command.requestId)) throw new TypeError('ASCII-Auftrags-ID erforderlich.');
  const camera = vector(command.camera, 'Kamera'), target = vector(command.target, 'Ziel');
  const intent = { requestId: command.requestId, frame: command.frame, unit: command.unit, camera, target };
  if (command.frame !== 'WORLD_Y_UP') return { intent, accepted: false, reason: 'FRAME_MISMATCH', outcome: 'NO_SIMULATED_EXECUTION', physicalEffect: false };
  if (command.unit !== 'm') return { intent, accepted: false, reason: 'UNIT_MISMATCH', outcome: 'NO_SIMULATED_EXECUTION', physicalEffect: false };
  const [dx, dy, dz] = target.map((value, index) => value - camera[index]);
  numericResult({ dx, dy, dz });
  const distanceM = Math.hypot(dx, dy, dz);
  numericResult({ distanceM }, ['distanceM']);
  const desired = { frame: 'WORLD_Y_UP', angularUnit: 'rad', yawRad: Math.atan2(dx, dz), pitchRad: Math.atan2(dy, Math.hypot(dx, dz)) };
  let observed = null, evaluation = null;
  if (observation !== null) {
    if (!observation || typeof observation !== 'object' || Array.isArray(observation) ||
        Object.keys(observation).length !== 5 ||
        !['kind', 'frame', 'angularUnit', 'yawRad', 'pitchRad'].every(k => Object.hasOwn(observation, k)) ||
        observation.kind !== 'SYNTHETIC_INPUT' || observation.frame !== desired.frame || observation.angularUnit !== 'rad') throw new TypeError('Gebundene synthetische Beobachtung in WORLD_Y_UP / rad erforderlich.');
    finite(observation.yawRad, 'Beobachtetes Yaw'); finite(observation.pitchRad, 'Beobachtetes Pitch');
    if (observation.pitchRad < -Math.PI / 2 || observation.pitchRad > Math.PI / 2) throw new RangeError('Pitch außerhalb des Kameramodells.');
    observed = { ...observation };
    evaluation = { yawErrorRad: wrappedAngle(observed.yawRad - desired.yawRad), pitchErrorRad: observed.pitchRad - desired.pitchRad, kind: 'SYNTHETIC_RESIDUAL_ONLY' };
  }
  return { intent, accepted: true, desired, distanceM, execution: { adapter: 'VIRTUAL_CAMERA', state: 'LOCAL_CALCULATION_ONLY' },
    observed, evaluation, physicalEffect: false, version: LAB_VERSION };
}
