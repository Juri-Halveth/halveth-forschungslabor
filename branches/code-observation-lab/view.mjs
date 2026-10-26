import {
  LAB_VERSION,
  inspectFormat,
  interference,
  encodeSymbolText,
  decodeSymbolText,
  translateRna,
} from './model.mjs';

const byId = (id) => document.getElementById(id);
const decimals = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const integers = new Intl.NumberFormat('de-DE');
const snapshots = new Map();
const resultStates = new Map();
const liveTimers = new Map();
let signalResult = null;
let activeTab = 'formats';
let symbolDirection = 'encode';
const symbolInputs = { encode: 'Licht', decode: '' };
const mappings = [];
const workplacesByTab = { formats: 'format', signals: 'signal', symbols: 'symbol', rna: 'rna' };
const workplaceNames = { format: 'Formate', signal: 'Signale', symbol: 'Symbolcode', rna: 'Zellcode' };

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function append(parent, ...children) {
  for (const child of children) if (child !== null && child !== undefined) parent.append(child);
  return parent;
}

function setText(id, text) {
  byId(id).textContent = text;
}

function badge(text, variant = '') {
  return element('span', `badge${variant ? ` badge-${variant}` : ''}`, text);
}

function heading(text, aside) {
  const node = element('div', 'subheading');
  append(node, element('h4', '', text));
  if (aside) append(node, element('span', '', aside));
  return node;
}

function announce(workplace, text) {
  window.clearTimeout(liveTimers.get(workplace));
  liveTimers.set(workplace, window.setTimeout(() => setText(`${workplace}-live`, text), 180));
}

function setStatus(workplace, text, variant = '') {
  const node = byId(`${workplace}-status`);
  node.className = `badge${variant ? ` badge-${variant}` : ''}`;
  node.textContent = text;
}

function updateMobileResult(workplace = workplacesByTab[activeTab]) {
  if (workplace !== workplacesByTab[activeTab]) return;
  const snapshot = snapshots.get(workplace);
  const state = snapshot ? 'ready' : resultStates.get(workplace) || 'empty';
  let text = 'Noch kein Ergebnis';
  if (snapshot) {
    const { input, result } = snapshot;
    if (workplace === 'format') {
      const count = result.candidates.length;
      const headerCount = result.candidates.filter((candidate) => ['EXTENSION_AND_HEADER', 'HEADER_ONLY'].includes(candidate.match)).length;
      const headerText = result.byteCount === 0 ? 'nur Dateiname' : `${headerCount} ${headerCount === 1 ? 'Kennung' : 'Kennungen'}`;
      text = `${count} ${count === 1 ? 'Kandidat' : 'Kandidaten'} · ${headerText}`;
    } else if (workplace === 'signal') {
      text = `V ${precise.format(result.visibility)} · D ${precise.format(result.distinguishability)} · I ${precise.format(result.relativeIntensity)}`;
    } else if (workplace === 'symbol') {
      const roundtrip = input.direction === 'decode' ? 'UTF-8 gelesen' : result.equalBytes ? 'Roundtrip gleich' : 'Roundtrip abweichend';
      text = `${integers.format(result.byteLength)} ${result.byteLength === 1 ? 'Byte' : 'Bytes'} · ${roundtrip}`;
    } else if (workplace === 'rna') {
      const count = result.codons.length;
      text = `${integers.format(count)} ${count === 1 ? 'Codon' : 'Codons'} · Rest: ${result.trailingBases || 'keiner'}`;
    }
  } else if (state === 'dirty') text = 'Eingabe geändert · neu auswerten';
  else if (state === 'error') text = 'Eingabe prüfen · kein Ergebnis';
  byId('quick-result').dataset.state = state;
  setText('quick-result-label', `Ergebnis · ${workplaceNames[workplace]}`);
  setText('quick-result-text', text);
  const button = byId('quick-result-button');
  button.disabled = !snapshot;
  button.setAttribute('aria-controls', `${workplace}-result`);
}

function remember(workplace, input, result) {
  snapshots.set(workplace, {
    schema: 'halveth.code-observation-lab.result.v1',
    labVersion: LAB_VERSION,
    workplace,
    computedAt: new Date().toISOString(),
    timeBasis: 'CLIENT_WALL_CLOCK_NOT_CALIBRATED',
    input,
    result,
  });
  resultStates.set(workplace, 'ready');
  byId(`${workplace}-export`).disabled = false;
  updateMobileResult(workplace);
}

function clearErrors(workplace) {
  const node = byId(`${workplace}-error`);
  node.hidden = true;
  node.textContent = '';
  for (const control of document.querySelectorAll(`#${workplace}-form [aria-invalid]`)) control.removeAttribute('aria-invalid');
}

function emptyResult(workplace, title, message, symbol = '↻') {
  const empty = element('div', 'empty-state');
  const icon = element('span', 'empty-state-icon', symbol);
  icon.setAttribute('aria-hidden', 'true');
  append(empty, icon, element('h4', '', title), element('p', '', message));
  byId(`${workplace}-content`).replaceChildren(empty);
}

function markDirty(workplace) {
  snapshots.delete(workplace);
  resultStates.set(workplace, 'dirty');
  byId(`${workplace}-export`).disabled = true;
  window.clearTimeout(liveTimers.get(workplace));
  setText(`${workplace}-live`, 'Eingabe geändert. Werte sie aus, um ein neues Ergebnis zu erhalten.');
  clearErrors(workplace);
  setStatus(workplace, 'Eingabe geändert', 'muted');
  emptyResult(workplace, 'Bereit für die neue Eingabe', 'Werte die Eingabe aus, um das dazugehörige Ergebnis zu sehen.');
  updateMobileResult(workplace);
}

function errorMessage(error, workplace) {
  if (workplace === 'format') {
    const raw = byId('format-hex').value;
    if (/[^0-9a-f\s]/i.test(raw)) return 'Die Bytes dürfen nur Hex-Zeichen von 0–9 und A–F sowie Leerzeichen enthalten. Beispiel: 1A 35 01 00.';
    if (raw.replace(/\s/g, '').length % 2 !== 0) return 'Ein Byte braucht genau zwei Hex-Zeichen. Vervollständige das letzte Byte, zum Beispiel 0A statt A.';
    if (!byId('format-name').value.trim()) return 'Gib einen Dateinamen ein, zum Beispiel MAV.ETH.';
  }
  if (workplace === 'rna') {
    const sequence = byId('rna-sequence').value;
    if (!sequence) return 'Gib eine mRNA-Sequenz ein, zum Beispiel AUGGCUUAA.';
    if (/[^ACGU]/.test(sequence)) return 'Verwende nur A, C, G und U in Großbuchstaben, ohne Leerzeichen. Die Eingabe wird nicht automatisch verändert.';
  }
  if (workplace === 'symbol' && symbolDirection === 'decode') {
    const symbols = byId('symbol-input').value;
    if (/[^ACGT]/.test(symbols)) return 'Zum Zurücklesen sind nur A, C, G und T in Großbuchstaben erlaubt, ohne Leerzeichen.';
    if (symbols.length % 4 !== 0) return 'Vier Symbole ergeben ein Byte. Vervollständige die letzte Vierergruppe und verwende dieselbe Zuordnung wie beim Codieren.';
    if (/utf.?8/i.test(String(error?.message))) return 'Diese Folge ergibt mit der gewählten Zuordnung keinen gültigen UTF-8-Text. Prüfe die Folge und die Zeichenzuordnung.';
  }
  const detail = error instanceof Error ? error.message : String(error);
  return `Die Eingabe konnte nicht ausgewertet werden. ${detail || 'Prüfe die angegebenen Werte.'}`;
}

function showError(workplace, error, controlIds = []) {
  snapshots.delete(workplace);
  resultStates.set(workplace, 'error');
  byId(`${workplace}-export`).disabled = true;
  const message = errorMessage(error, workplace);
  const node = byId(`${workplace}-error`);
  node.textContent = message;
  node.hidden = false;
  for (const id of controlIds) byId(id).setAttribute('aria-invalid', 'true');
  setStatus(workplace, 'Eingabe prüfen', 'amber');
  if (workplace !== 'signal') emptyResult(workplace, 'Für diese Eingabe fehlt ein Ergebnis', 'Die Eingabe wurde abgelehnt. Korrigiere sie und starte die Auswertung erneut.', '!');
  announce(workplace, message);
  updateMobileResult(workplace);
}

function limitNote(text, href = './RESEARCH.md', linkText = 'Modell & Grenzen ↗') {
  const note = element('p', 'result-limit', `${text} `);
  const link = element('a', '', linkText);
  link.href = href;
  append(note, link);
  return note;
}

function byteValues(hex) {
  return String(hex).replace(/\s/g, '').match(/.{2}/g) || [];
}

function renderBytes(hex, maximum = 16) {
  const values = byteValues(hex);
  const section = element('div', 'byte-section');
  append(section, heading('Byteansicht', `${integers.format(values.length)} ${values.length === 1 ? 'Byte' : 'Bytes'} eingegeben`));
  if (!values.length) {
    append(section, element('p', 'preview-note', 'Keine Bytes eingegeben. Die Einordnung verwendet nur den Dateinamen.'));
    return section;
  }
  const grid = element('div', 'byte-grid');
  grid.setAttribute('aria-label', 'Die eingegebenen Anfangsbytes mit Offset, Hexwert und druckbarem ASCII-Zeichen');
  for (const [index, value] of values.slice(0, maximum).entries()) {
    const number = Number.parseInt(value, 16);
    const cell = element('div', 'byte-cell');
    append(cell,
      element('span', 'byte-offset', index.toString(16).toUpperCase().padStart(2, '0')),
      element('span', 'byte-value', value.toUpperCase()),
      element('span', 'byte-ascii', number >= 32 && number <= 126 ? String.fromCharCode(number) : '·'),
    );
    grid.append(cell);
  }
  append(section, grid);
  if (values.length > maximum) append(section, element('p', 'preview-note', `Ansicht: die ersten ${maximum} von ${integers.format(values.length)} Bytes. Der JSON-Export enthält die vollständige Eingabe.`));
  return section;
}

const matchLabels = {
  EXTENSION_AND_HEADER: ['Endung + Kennung', ''],
  HEADER_ONLY: ['Kennung bei anderer Endung', ''],
  EXTENSION_ONLY: ['nur Endungszuordnung', 'muted'],
  HEADER_MISMATCH: ['Kennung passt nicht', 'amber'],
  INSUFFICIENT_HEADER: ['Kennung unvollständig', 'amber'],
};

function renderFormat(announceResult = true) {
  clearErrors('format');
  const input = { filename: byId('format-name').value, hexText: byId('format-hex').value };
  try {
    const result = inspectFormat(input.filename, input.hexText);
    const content = document.createDocumentFragment();
    const summary = element('p', 'result-summary');
    const extension = result.extension ? `.${String(result.extension).replace(/^\./, '')}` : 'keine Endung';
    append(summary, element('strong', '', result.filename), document.createTextNode(` · ${extension} · ${integers.format(result.byteCount)} ${result.byteCount === 1 ? 'Byte' : 'Bytes'}`));
    append(content, summary, renderBytes(input.hexText));
    const candidates = result.candidates || [];
    append(content, heading('Formatkandidaten', `${candidates.length} ${candidates.length === 1 ? 'Zuordnung' : 'Zuordnungen'}`));
    const list = element('div', 'candidate-list');
    for (const candidate of candidates) {
      const [label, variant] = matchLabels[candidate.match] || ['Katalogzuordnung', 'muted'];
      const isMatch = ['EXTENSION_AND_HEADER', 'HEADER_ONLY'].includes(candidate.match);
      const item = element('article', `candidate${isMatch ? ' is-match' : variant === 'amber' ? ' is-caution' : ''}`);
      const title = element('div', 'candidate-heading');
      append(title, element('h4', '', candidate.name), badge(label, variant));
      append(item, title, element('p', '', candidate.explanation));
      list.append(item);
    }
    if (!candidates.length) append(list, element('p', 'result-summary', 'Für diese Kombination gibt es im gebundenen Katalog keinen Formatkandidaten. Weitere Formate bleiben möglich.'));
    append(content, list);
    for (const hint of result.namespaceHints || []) {
      const note = element('div', 'namespace-note');
      append(note, element('strong', '', 'Ein Name kann mehrere Bedeutungen haben'), element('p', '', hint.note));
      append(content, note);
    }
    append(content, limitNote('Die Kennung erzeugt einen Kandidaten; der vollständige Dateiaufbau wurde nicht geprüft.', './sources.json', 'Quellen der Zuordnung ↗'));
    byId('format-content').replaceChildren(content);
    setStatus('format', `${candidates.length} ${candidates.length === 1 ? 'Kandidat' : 'Kandidaten'}`, candidates.length ? '' : 'muted');
    remember('format', input, result);
    if (announceResult) announce('format', `${candidates.length} Formatkandidaten für ${result.filename}. Der vollständige Dateiaufbau wurde nicht geprüft.`);
  } catch (error) {
    const id = /[^0-9a-f\s]/i.test(input.hexText) || input.hexText.replace(/\s/g, '').length % 2 ? 'format-hex' : 'format-name';
    showError('format', error, [id]);
  }
}

function renderSignal(announceResult = true) {
  clearErrors('signal');
  const input = {
    overlap: Number(byId('signal-overlap').value),
    phaseRad: Number(byId('signal-phase').value),
    humanRead: byId('signal-human').checked,
    phaseJitterRad: Number(byId('signal-noise').value),
  };
  setText('signal-overlap-value', decimals.format(input.overlap));
  setText('signal-noise-value', `${decimals.format(input.phaseJitterRad)} rad`);
  setText('signal-phase-value', `${decimals.format(input.phaseRad)} rad`);
  try {
    const result = interference(input.overlap, input.phaseRad, input.humanRead, input.phaseJitterRad);
    signalResult = { input, result };
    setText('signal-visibility', precise.format(result.visibility));
    setText('signal-distinguishability', precise.format(result.distinguishability));
    setText('signal-intensity', precise.format(result.relativeIntensity));
    setText('signal-duality', precise.format(result.dualitySum));
    setText('signal-reading', `${result.humanRead ? 'Metadaten werden gelesen.' : 'Metadaten werden nicht gelesen.'} Der Lesezustand ändert die Modellkurve nicht. ${input.phaseJitterRad > 0 ? 'Das Phasenrauschen verringert die Sichtbarkeit; die Unterscheidbarkeit bleibt durch die Wegmarkierung bestimmt.' : 'Ohne Phasenrauschen entspricht die Sichtbarkeit der idealen Überlappung.'}`);
    const description = `Berechnete Kurve von ${precise.format(1 - result.visibility)} bis ${precise.format(1 + result.visibility)} relativer Intensität. Sichtbarkeit ${precise.format(result.visibility)}, Unterscheidbarkeit ${precise.format(result.distinguishability)}. Bei Phase ${decimals.format(input.phaseRad)} rad ist die Intensität ${precise.format(result.relativeIntensity)}.`;
    setText('signal-chart-description', description);
    setStatus('signal', 'Rechenmodell', 'amber');
    remember('signal', input, result);
    drawSignalChart();
    if (announceResult) announce('signal', description);
  } catch (error) {
    signalResult = null;
    for (const metric of ['visibility', 'distinguishability', 'intensity', 'duality']) setText(`signal-${metric}`, '—');
    setText('signal-chart-description', 'Für die aktuellen Eingaben konnte keine Kurve berechnet werden.');
    setText('signal-reading', 'Prüfe die Eingaben. Es wird kein vorheriges Ergebnis angezeigt.');
    drawSignalChart();
    showError('signal', error);
  }
}

function drawSignalChart() {
  const canvas = byId('signal-chart');
  const box = canvas.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * ratio);
  canvas.height = Math.round(box.height * ratio);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = box.width;
  const height = box.height;
  context.clearRect(0, 0, width, height);
  if (!signalResult) return;
  const { input, result } = signalResult;
  const plot = { left: 38, right: width - 18, top: 26, bottom: height - 47 };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const x = (phase) => plot.left + phase / (Math.PI * 2) * plotWidth;
  const y = (intensity) => plot.bottom - intensity / 2 * plotHeight;
  context.lineWidth = 1;
  context.font = '9px "Segoe UI", system-ui, sans-serif';
  context.fillStyle = '#8ca3b6';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  for (const intensity of [0, 0.5, 1, 1.5, 2]) {
    context.strokeStyle = intensity === 1 ? '#354b5c' : '#213446';
    context.beginPath(); context.moveTo(plot.left, y(intensity)); context.lineTo(plot.right, y(intensity)); context.stroke();
    if (Number.isInteger(intensity)) context.fillText(`${intensity},0`, plot.left - 9, y(intensity));
  }
  const ticks = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [Math.PI * 1.5, '3π/2'], [Math.PI * 2, '2π']];
  context.textAlign = 'center';
  for (const [phase, label] of ticks) {
    context.strokeStyle = '#213446';
    context.beginPath(); context.moveTo(x(phase), plot.top); context.lineTo(x(phase), plot.bottom); context.stroke();
    context.fillText(label, x(phase), plot.bottom + 14);
  }
  context.textAlign = 'left';
  context.fillText('I', 14, 12);
  context.textAlign = 'center';
  context.fillText('Phase φ', (plot.left + plot.right) / 2, height - 9);

  function curve(visibility) {
    for (let index = 0; index <= 180; index += 1) {
      const phase = index / 180 * Math.PI * 2;
      const px = x(phase);
      const py = y(1 + visibility * Math.cos(phase));
      if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
  }
  const fill = context.createLinearGradient(0, plot.top, 0, plot.bottom);
  fill.addColorStop(0, '#75e4dc20'); fill.addColorStop(1, '#75e4dc02');
  context.beginPath(); curve(result.visibility); context.lineTo(plot.right, plot.bottom); context.lineTo(plot.left, plot.bottom); context.closePath();
  context.fillStyle = fill; context.fill();
  context.beginPath(); context.setLineDash([4, 5]); curve(result.idealVisibility); context.strokeStyle = '#667e93'; context.lineWidth = 1.5; context.stroke();
  context.setLineDash([]);
  context.beginPath(); curve(result.visibility); context.strokeStyle = '#75e4dc'; context.lineWidth = 2.5; context.stroke();
  const markerX = x(input.phaseRad);
  const markerY = y(result.relativeIntensity);
  context.beginPath(); context.moveTo(markerX, plot.top); context.lineTo(markerX, plot.bottom); context.strokeStyle = '#f5c27b66'; context.lineWidth = 1; context.setLineDash([3, 4]); context.stroke(); context.setLineDash([]);
  context.beginPath(); context.arc(markerX, markerY, 6, 0, Math.PI * 2); context.fillStyle = '#0c1926'; context.fill();
  context.beginPath(); context.arc(markerX, markerY, 3.5, 0, Math.PI * 2); context.fillStyle = '#f5c27b'; context.fill();
}

function renderMapping(mapping) {
  const grid = element('div', 'mapping-grid');
  grid.setAttribute('aria-label', 'Zuordnung von jeweils zwei Bits zu einem Symbol');
  for (const item of mapping) {
    const node = element('div', 'mapping-item');
    append(node, element('small', '', item.bits), element('span', '', '→'), element('strong', `base-${item.symbol.toLowerCase()}`, item.symbol));
    grid.append(node);
  }
  return grid;
}

function renderSymbolStream(symbols, maximum = 256) {
  const section = element('div', 'symbol-section');
  append(section, heading('Symbolfolge', `${integers.format(symbols.length)} Zeichen`));
  const stream = element('div', 'symbol-stream');
  stream.setAttribute('aria-label', 'Symbolfolge in Gruppen von vier Zeichen je Byte');
  const preview = symbols.slice(0, maximum);
  for (let index = 0; index < preview.length; index += 4) {
    const group = element('span', 'symbol-byte');
    for (const symbol of preview.slice(index, index + 4)) append(group, element('span', `base-${symbol.toLowerCase()}`, symbol));
    stream.append(group);
  }
  if (!symbols.length) append(stream, element('p', 'preview-note', 'Leere Eingabe · keine Symbole'));
  append(section, stream);
  append(section, element('p', 'preview-note', symbols.length > maximum ? `Ansicht: die ersten ${maximum} von ${integers.format(symbols.length)} Symbolen. Der JSON-Export enthält die vollständige Folge.` : 'Jede Vierergruppe stellt genau ein UTF-8-Byte dar.'));
  return section;
}

function renderSymbol(announceResult = true) {
  clearErrors('symbol');
  const input = { direction: symbolDirection, value: byId('symbol-input').value, mappingIndex: Number(byId('symbol-mapping').value) };
  symbolInputs[symbolDirection] = input.value;
  try {
    const result = symbolDirection === 'encode' ? encodeSymbolText(input.value, input.mappingIndex) : decodeSymbolText(input.value, input.mappingIndex);
    const symbols = symbolDirection === 'encode' ? result.symbols : input.value;
    const mapping = symbolDirection === 'encode' ? result.mapping : mappings[input.mappingIndex];
    const text = symbolDirection === 'encode' ? result.roundTripText : result.text;
    if (symbolDirection === 'encode') symbolInputs.decode = result.symbols;
    else symbolInputs.encode = result.text;
    const content = document.createDocumentFragment();
    append(content, element('p', 'result-summary', `${integers.format(result.byteLength)} UTF-8-${result.byteLength === 1 ? 'Byte' : 'Bytes'} · ${integers.format(symbols.length)} Symbole · Zuordnung ${input.mappingIndex + 1} von 24`));
    append(content, heading('Zwei Bits, ein Symbol'), renderMapping(mapping), renderSymbolStream(symbols));
    const roundtrip = element('div', 'roundtrip-card');
    const roundtripHeading = heading(symbolDirection === 'encode' ? 'Zurückgelesener Text' : 'Decodierter Text');
    append(roundtripHeading, badge(symbolDirection === 'encode' ? result.equalBytes ? 'Bytes erhalten' : 'Abweichung' : 'UTF-8 gelesen', result.equalBytes === false ? 'amber' : ''));
    append(roundtrip, roundtripHeading, element('blockquote', '', text || '(leerer Text)'), element('p', '', symbolDirection === 'encode' ? 'Der Roundtrip verwendet dieselbe Zuordnung. Die Bytegleichheit wird im Modell geprüft.' : 'Die gewählte Zuordnung bestimmt, welche Bytes aus den Symbolen entstehen.'));
    const hex = element('div', 'hex-line');
    append(hex, element('span', 'tiny-label', 'UTF-8 als Hex'), element('code', '', byteValues(result.hex).slice(0, 48).join(' ').toUpperCase() || '(leer)'));
    if (byteValues(result.hex).length > 48) append(hex, element('p', 'preview-note', 'Ansicht: erste 48 Bytes. Vollständige Werte im JSON-Export.'));
    append(content, roundtrip, hex, limitNote('Dies ist ein selbst definierter Softwarecode mit vier Symbolen. Die Zeichen stehen hier für Bits; ein genetischer Mechanismus wird nicht modelliert.'));
    byId('symbol-content').replaceChildren(content);
    setText('symbol-result-title', symbolDirection === 'encode' ? 'Text in vier Zeichen' : 'Vier Zeichen zurücklesen');
    setStatus('symbol', 'Softwarecode');
    remember('symbol', input, result);
    if (announceResult) announce('symbol', symbolDirection === 'encode' ? `${result.byteLength} UTF-8-Bytes wurden in ${symbols.length} Symbole übersetzt. ${result.equalBytes ? 'Die Bytes sind nach dem Roundtrip gleich.' : 'Der Roundtrip zeigt eine Abweichung.'}` : `${result.byteLength} Bytes wurden als Text zurückgelesen: ${text.slice(0, 120)}`);
  } catch (error) {
    showError('symbol', error, ['symbol-input']);
  }
}

function setSymbolDirection(direction, evaluate = true) {
  symbolInputs[symbolDirection] = byId('symbol-input').value;
  symbolDirection = direction;
  for (const radio of document.querySelectorAll('[name="symbol-direction"]')) radio.checked = radio.value === direction;
  byId('symbol-input').value = symbolInputs[direction];
  byId('symbol-input').maxLength = direction === 'encode' ? 512 : 8192;
  byId('symbol-input').classList.toggle('code-input', direction === 'decode');
  setText('symbol-input-label', direction === 'encode' ? 'Dein Text' : 'Deine Symbolfolge');
  setText('symbol-input-hint', direction === 'encode' ? 'Bis zu 512 Eingabezeichen. Auch Umlaute und Emoji werden als UTF-8 codiert.' : 'Nur A, C, G und T in Großbuchstaben, ohne Leerzeichen. Vier Symbole ergeben ein Byte. Maximal 8.192 Symbole.');
  const submit = byId('symbol-submit');
  submit.replaceChildren(document.createTextNode(direction === 'encode' ? 'In Symbole übersetzen ' : 'Als Text zurücklesen '), element('span', '', '→'));
  submit.lastElementChild.setAttribute('aria-hidden', 'true');
  if (evaluate) renderSymbol();
}

function renderRna(announceResult = true) {
  clearErrors('rna');
  const input = { sequence: byId('rna-sequence').value, frame: Number(byId('rna-frame').value) };
  try {
    const result = translateRna(input.sequence, input.frame);
    const content = document.createDocumentFragment();
    append(content, element('p', 'result-summary', `${integers.format(result.sequence.length)} Basen · Leserahmen ${result.frame} · ${integers.format(result.codons.length)} vollständige ${result.codons.length === 1 ? 'Dreiergruppe' : 'Dreiergruppen'}`));
    append(content, heading('Leseraster', `Start ab Base ${result.frame + 1}`));
    const ruler = element('div', 'sequence-ruler');
    ruler.setAttribute('aria-label', 'Sequenz mit markierten übersprungenen Basen, vollständigen Codons und Endrest');
    const completeEnd = result.frame + result.codons.length * 3;
    for (const [index, base] of [...result.sequence.slice(0, 96)].entries()) {
      const className = index < result.frame ? 'sequence-skipped' : index >= completeEnd ? 'sequence-rest' : `sequence-active${Math.floor((index - result.frame) / 3) % 2 ? ' alternate' : ''}`;
      append(ruler, element('span', className, base));
    }
    append(content, ruler);
    const legend = element('div', 'sequence-legend');
    for (const [className, text] of [['', 'vollständige Codons'], ['skip-key', 'vor dem Start'], ['rest-key', 'Endrest']]) {
      const item = element('span'); const key = element('i', className); key.setAttribute('aria-hidden', 'true'); append(item, key, document.createTextNode(text)); append(legend, item);
    }
    append(content, legend);
    if (result.sequence.length > 96) append(content, element('p', 'preview-note', `Leseraster: erste 96 von ${integers.format(result.sequence.length)} Basen. Vollständige Sequenz im JSON-Export.`));
    append(content, heading('Codon → Zuordnung', `Standardtabelle ${result.geneticCode}`));
    const chain = element('div', 'codon-chain');
    for (const [index, codon] of result.codons.slice(0, 24).entries()) {
      const card = element('div', `codon-card${codon.isStop ? ' is-stop' : ''}`);
      const arrow = element('span', 'codon-arrow', '↓'); arrow.setAttribute('aria-hidden', 'true');
      append(card, element('span', 'codon-number', `TRIPLET ${index + 1}`), element('strong', 'codon-triplet', codon.codon), arrow, element('span', 'codon-symbol', codon.isStop ? 'Stop' : codon.symbol), element('span', 'codon-name', codon.name));
      chain.append(card);
    }
    if (!result.codons.length) append(chain, element('p', 'preview-note', 'In diesem Leserahmen liegt keine vollständige Dreiergruppe vor.'));
    append(content, chain);
    if (result.codons.length > 24) append(content, element('p', 'preview-note', `Ansicht: erste 24 von ${result.codons.length} Codons. Alle Zuordnungen stehen im JSON-Export.`));
    const amino = element('div', 'amino-result');
    const sequence = element('div');
    const aminoText = result.aminoAcidSymbols.length > 80 ? `${result.aminoAcidSymbols.slice(0, 80)}…` : result.aminoAcidSymbols || '—';
    append(sequence, element('span', 'tiny-label', 'Aminosäurezeichen · * = Stop'), element('code', '', aminoText));
    const remainder = element('p', 'remainder-note');
    append(remainder, document.createTextNode('Endrest: '), result.trailingBases ? element('code', '', result.trailingBases) : document.createTextNode('keiner'));
    append(amino, sequence, remainder);
    append(content, amino, limitNote('Zuordnung nach Standardtabelle 1. Der Arbeitsplatz simuliert keine Zelle; Startregulation, Transport und Proteinfaltung sind nicht modelliert.', './sources.json', 'Referenztabelle ↗'));
    byId('rna-content').replaceChildren(content);
    setStatus('rna', 'Standardtabelle 1', 'amber');
    remember('rna', input, result);
    if (announceResult) announce('rna', `${result.codons.length} vollständige Codons im Leserahmen ${result.frame}. Aminosäurezeichen: ${result.aminoAcidSymbols || 'keine'}. Endrest: ${result.trailingBases || 'keiner'}.`);
  } catch (error) {
    showError('rna', error, ['rna-sequence']);
  }
}

function selectExample(attribute, value) {
  for (const button of document.querySelectorAll(`[${attribute}]`)) button.classList.toggle('is-current', button.getAttribute(attribute) === value);
}

function selectTab(name, focus = false) {
  activeTab = name;
  for (const button of document.querySelectorAll('[data-tab]')) {
    const selected = button.dataset.tab === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus({ preventScroll: true });
  }
  for (const panel of document.querySelectorAll('[role="tabpanel"]')) panel.hidden = panel.id !== `panel-${name}`;
  updateMobileResult();
  if (name === 'signals') drawSignalChart();
}

byId('quick-result-button').addEventListener('click', () => {
  const workplace = workplacesByTab[activeTab];
  if (!snapshots.has(workplace)) return;
  const target = byId(`${workplace}-result`);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
});

for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => selectTab(button.dataset.tab));
  button.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const index = tabs.indexOf(button);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next].dataset.tab, true);
  });
}

byId('format-form').addEventListener('submit', (event) => { event.preventDefault(); renderFormat(); });
for (const id of ['format-name', 'format-hex']) byId(id).addEventListener('input', () => { markDirty('format'); selectExample('data-format-example', ''); });
const formatExamples = {
  eth: ['MAV.ETH', '1A 35 01 00'],
  archive: ['archiv.mav', '42 41 41 4D'],
  mav: ['fremd.bin', '4D 41 56 38'],
};
for (const button of document.querySelectorAll('[data-format-example]')) button.addEventListener('click', () => {
  const [filename, hex] = formatExamples[button.dataset.formatExample];
  byId('format-name').value = filename; byId('format-hex').value = hex;
  selectExample('data-format-example', button.dataset.formatExample); renderFormat();
});

byId('signal-form').addEventListener('submit', (event) => { event.preventDefault(); renderSignal(); });
for (const id of ['signal-overlap', 'signal-noise', 'signal-phase']) byId(id).addEventListener('input', () => { selectExample('data-signal-example', ''); renderSignal(); });
byId('signal-human').addEventListener('change', () => renderSignal());
const signalExamples = { coherent: [1, 0], distinct: [0, 0], noise: [1, 1.4] };
for (const button of document.querySelectorAll('[data-signal-example]')) button.addEventListener('click', () => {
  const [overlap, noise] = signalExamples[button.dataset.signalExample];
  byId('signal-overlap').value = String(overlap); byId('signal-noise').value = String(noise); byId('signal-phase').value = '0';
  selectExample('data-signal-example', button.dataset.signalExample); renderSignal();
});

byId('symbol-form').addEventListener('submit', (event) => { event.preventDefault(); renderSymbol(); });
byId('symbol-input').addEventListener('input', () => { markDirty('symbol'); selectExample('data-symbol-example', ''); });
byId('symbol-mapping').addEventListener('change', () => renderSymbol());
for (const radio of document.querySelectorAll('[name="symbol-direction"]')) radio.addEventListener('change', () => setSymbolDirection(radio.value));
const symbolExamples = { light: 'Licht', unicode: 'Licht ☀ – 光', hello: 'Hallo Welt' };
for (const button of document.querySelectorAll('[data-symbol-example]')) button.addEventListener('click', () => {
  const text = symbolExamples[button.dataset.symbolExample];
  symbolInputs.encode = text;
  if (symbolDirection === 'decode') setSymbolDirection('encode', false);
  byId('symbol-input').value = text;
  selectExample('data-symbol-example', button.dataset.symbolExample); renderSymbol();
});

byId('rna-form').addEventListener('submit', (event) => { event.preventDefault(); renderRna(); });
byId('rna-sequence').addEventListener('input', () => { markDirty('rna'); selectExample('data-rna-example', ''); });
byId('rna-frame').addEventListener('change', () => renderRna());
const rnaExamples = { simple: ['AUGGCUUAA', 0], frame: ['AAUGGCUUAA', 0], remainder: ['AUGGCUUA', 0] };
for (const button of document.querySelectorAll('[data-rna-example]')) button.addEventListener('click', () => {
  const [sequence, frame] = rnaExamples[button.dataset.rnaExample];
  byId('rna-sequence').value = sequence; byId('rna-frame').value = String(frame);
  selectExample('data-rna-example', button.dataset.rnaExample); renderRna();
});

for (const workplace of ['format', 'signal', 'symbol', 'rna']) byId(`${workplace}-export`).addEventListener('click', () => {
  const snapshot = snapshots.get(workplace);
  if (!snapshot) return;
  const blob = new Blob([`${JSON.stringify(snapshot, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `code-messung-${workplace}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(workplace, 'Das aktuelle Ergebnis wurde als JSON zum Download bereitgestellt.');
});

try {
  const options = document.createDocumentFragment();
  for (let index = 0; index < 24; index += 1) {
    const mapping = encodeSymbolText('Licht', index).mapping;
    mappings.push(mapping);
    const option = element('option', '', `${index + 1} · ${mapping.map((item) => item.symbol).join('  ')}   (00 · 01 · 10 · 11)`);
    option.value = String(index);
    options.append(option);
  }
  byId('symbol-mapping').replaceChildren(options);
} catch (error) {
  showError('symbol', error);
}

setText('lab-version', `Modellversion ${LAB_VERSION}`);
renderFormat(false);
renderSignal(false);
renderSymbol(false);
renderRna(false);
if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (activeTab === 'signals') drawSignalChart(); }).observe(byId('signal-chart'));
else window.addEventListener('resize', drawSignalChart);

// Fresh documents start at the entrance; browser history keeps its own position.
window.addEventListener('pageshow', (event) => {
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!event.persisted && navigation?.type !== 'back_forward') window.scrollTo({ top: 0, behavior: 'instant' });
}, { once: true });
