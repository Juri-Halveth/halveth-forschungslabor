// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LAB_VERSION, parseHex, inspectFormat, interference, encodeSymbolText, decodeSymbolText,
  translateRna, schwarzschildRadius, weakDeflection, photonEnergy, aperture,
  compareStateModels, simulateCameraCommand
} from './model.mjs';
import { FORMAT_CATALOG, RESEARCH_BRANCHES } from './data.mjs';
const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' != ' + expected);
test('header candidates remain candidates when filename changes', () => {
  const correct = inspectFormat('archive.mav', '42 41 41 4d');
  const renamed = inspectFormat('MAV.ETH', '4241414D');
  assert.equal(correct.candidates.find(c => c.id === 'MAV_BAAM').match, 'EXTENSION_AND_HEADER');
  assert.equal(renamed.candidates.find(c => c.id === 'MAV_BAAM').match, 'HEADER_ONLY');
  assert.equal(renamed.candidates.find(c => c.id === 'ETH_WINPHAROAH').match, 'HEADER_MISMATCH');
  assert.equal(correct.formatValidated, false);
  assert.equal(renamed.formatValidated, false);
  assert.equal(renamed.extension, '.eth');
});
test('MAV does not become the extension of MAV.ETH', () => {
  const result = inspectFormat('MAV.ETH');
  assert.equal(result.extension, '.eth');
  assert.ok(result.candidates.every(c => c.id.startsWith('ETH_')));
  assert.equal(result.namespaceHints[0].kind, 'ENS_NAME_CANDIDATE');
  assert.equal(inspectFormat('MAW.T').extension, '.t');
  assert.equal(inspectFormat('.eth').extension, '');
});
test('same suffix has several candidates and source states remain distinct', () => {
  const eth = inspectFormat('example.eth').candidates;
  assert.equal(eth.find(c => c.id === 'ETH_ETHER_CATALOG').sourceStatus, 'CATALOG_ONLY');
  assert.equal(eth.find(c => c.id === 'ETH_ETHNOGRAPH3').sourceStatus, 'VERSION_BOUND_PRIMARY_USAGE_REPORT');
  const mav = inspectFormat('sample.mav').candidates;
  assert.ok(mav.some(c => c.id === 'MAV_ACCESS'));
  assert.ok(mav.some(c => c.id === 'MAV_MAV8'));
});
test('short headers stay incomplete and a foreign header cannot validate Access', () => {
  const short = inspectFormat('record.eth', '1A35');
  assert.equal(short.candidates.find(c => c.id === 'ETH_WINPHAROAH').match, 'INSUFFICIENT_HEADER');
  assert.equal(inspectFormat('record.eth', 'FF').candidates.find(c => c.id === 'ETH_WINPHAROAH').match, 'HEADER_MISMATCH');
  const foreign = inspectFormat('view.mav', '1A350100');
  assert.equal(foreign.candidates.find(c => c.id === 'ETH_WINPHAROAH').match, 'HEADER_ONLY');
  assert.equal(foreign.candidates.find(c => c.id === 'MAV_ACCESS').match, 'EXTENSION_ONLY');
});
test('hex and filename reject malformed data instead of guessing', () => {
  assert.deepEqual([...parseHex('00 FF\n1a\t35')], [0, 255, 26, 53]);
  for (const bad of ['0', '0x00', 'GG', '00,FF', '00;alert(1)', 'A'.repeat(8194)]) assert.throws(() => parseHex(bad));
  for (const bad of ['', '../example.eth', 'C:\\example.eth', 'foo\n.eth', '\uD800']) assert.throws(() => inspectFormat(bad));
  assert.throws(() => inspectFormat('file.eth', null));
});
test('physics reaches distinguishable and coherent endpoint cases', () => {
  const coherent = interference(1, 0);
  near(coherent.relativeIntensity, 2); near(coherent.visibility, 1); near(coherent.distinguishability, 0);
  near(interference(1, Math.PI).relativeIntensity, 0);
  const marked = interference(0, 0);
  near(marked.relativeIntensity, 1); near(marked.visibility, 0); near(marked.distinguishability, 1);
});
test('human-read flag changes metadata only across phases and overlaps', () => {
  for (const overlap of [0, 0.25, 0.8, 1]) for (const phase of [-Math.PI, 0, 0.5, Math.PI]) {
    const { humanRead: a, ...left } = interference(overlap, phase, false, 0.3);
    const { humanRead: b, ...right } = interference(overlap, phase, true, 0.3);
    assert.equal(a, false); assert.equal(b, true); assert.deepEqual(left, right);
  }
});
test('phase averaging removes fringes without path distinguishability', () => {
  for (const phase of [-2, 0, 0.7, Math.PI]) {
    const values = [0, Math.PI/2, Math.PI, 3*Math.PI/2].map(offset => interference(1, phase + offset));
    near(values.reduce((s, v) => s + v.relativeIntensity, 0) / values.length, 1);
    assert.ok(values.every(v => v.distinguishability === 0));
  }
  const noisy = interference(1, 0, false, 3);
  assert.equal(noisy.distinguishability, 0);
  assert.ok(noisy.visibility < 0.012);
  assert.ok(noisy.dualitySum < 1);
});
test('finite numerical contracts reject bad values', () => {
  for (const args of [[-0.1, 0], [1.1, 0], [NaN, 0], [1, Infinity], [1, 0, 'yes'], [1, 0, false, -1]]) assert.throws(() => interference(...args));
});
test('all 24 mappings roundtrip Unicode and preserve a leading BOM', () => {
  const inputs = ['', 'MAV.ETH', 'MAW.T', 'Licht 🧬 🌙', 'é', 'e\u0301', '\uFEFFA', '\u0000', 'אבג العربية', '𝄞'];
  for (let mapping = 0; mapping < 24; mapping++) for (const text of inputs) {
    const result = encodeSymbolText(text, mapping);
    assert.equal(result.roundTripText, text);
    assert.equal(result.equalBytes, true);
    assert.equal(result.symbols.length, result.byteLength * 4);
    assert.equal(decodeSymbolText(result.symbols, mapping).text, text);
  }
});
test('canonical equivalence does not silently erase source-byte distinctions', () => {
  const composed = encodeSymbolText('é'), decomposed = encodeSymbolText('e\u0301');
  assert.notEqual(composed.hex, decomposed.hex);
  assert.notEqual(composed.symbols, decomposed.symbols);
  assert.equal(composed.text.normalize('NFC'), decomposed.text.normalize('NFC'));
  assert.notEqual(encodeSymbolText('MAV.ETH').hex, encodeSymbolText('MAW.T').hex);
});
test('one passing sample cannot certify a decoder for all strings', () => {
  // These mappings agree on A/C and differ on G/T: this particular byte never uses G/T.
  const example = encodeSymbolText('A', 0);
  assert.equal(decodeSymbolText(example.symbols, 1).text, 'A');
  const diverse = encodeSymbolText('z', 0);
  assert.notEqual(decodeSymbolText(diverse.symbols, 1).text, 'z');
});
test('malformed Unicode, mappings, symbols and UTF-8 fail explicitly', () => {
  for (const bad of ['\uD800', '\uDC00', '\uD800x']) assert.throws(() => encodeSymbolText(bad));
  for (const mapping of [-1, 24, 0.1, '0', true]) assert.throws(() => encodeSymbolText('A', mapping));
  for (const bad of ['AAA', 'AAAX', 'AAAA ', 'TTTT']) assert.throws(() => decodeSymbolText(bad));
});
test('standard codon lookup binds its reading frame and reports remaining bases', () => {
  assert.equal(translateRna('AUG').strand, 'mRNA');
  assert.equal(translateRna('AUG').direction, '5_PRIME_TO_3_PRIME');
  const a = translateRna('AUGGCUUAA');
  assert.equal(a.aminoAcidSymbols, 'MA*');
  assert.equal(a.geneticCode, 1);
  assert.equal(a.trailingBases, '');
  assert.deepEqual(a.codons.map(c => c.index), [0, 3, 6]);
  assert.equal(translateRna('AUGGCUUAA', 1).aminoAcidSymbols, 'WL');
  assert.equal(translateRna('AUGGCUUAA', 1).trailingBases, 'AA');
  assert.equal(translateRna('AUGGCUUAA', 2).aminoAcidSymbols, 'GL');
  assert.equal(translateRna('AUGGCUUAA', 2).trailingBases, 'A');
});
test('all 64 standard codons resolve and exactly three are stops', () => {
  const bases = 'ACGU', rows = [];
  for (const a of bases) for (const b of bases) for (const c of bases) rows.push(translateRna(a+b+c).codons[0]);
  assert.equal(rows.length, 64);
  assert.ok(rows.every(row => row.name && row.symbol));
  assert.deepEqual(rows.filter(row => row.isStop).map(row => row.codon).sort(), ['UAA','UAG','UGA']);
  assert.equal(translateRna('UGG').aminoAcidSymbols, 'W');
  assert.equal(translateRna('UUU').aminoAcidSymbols, 'F');
});
test('codon lookup does not pretend to simulate initiation or termination', () => {
  assert.equal(translateRna('GCUAUGUAAGGU').aminoAcidSymbols, 'AM*G');
  assert.match(translateRna('GCU').model, /NO_INITIATION_OR_CELL_MODEL/);
  assert.deepEqual(translateRna('').codons, []);
  for (const bad of ['ATG', 'aug', 'AUG GCU', 'AUN']) assert.throws(() => translateRna(bad));
  assert.throws(() => translateRna('', 2));
  assert.throws(() => translateRna('AUG', true));
});
test('known physical reference magnitudes and dimensions match', () => {
  near(photonEnergy(500).electronVolts, 2.479683968664005, 1e-12);
  near(weakDeflection(1.98847e30, 6.957e8).deflectionArcsec, 1.751, 0.003);
  const original = aperture(100, 1), half = aperture(50, 1);
  near(half.wattsPerM2 / original.wattsPerM2, 4);
  assert.equal(aperture(100, 0).wattsPerM2, 0);
});
test('deflection regression stays positive when the old denominator overflowed', () => {
  const result = weakDeflection(1e290, 1e300);
  assert.ok(result.deflectionRad > 0);
  near(result.deflectionRad / 2.970464107647466e-37, 1, 1e-14);
  const r = schwarzschildRadius(1e20);
  assert.throws(() => weakDeflection(1e20, 99*r));
  assert.ok(weakDeflection(1e20, 100*r).deflectionRad > 0);
});
test('underflow and overflow are reported rather than plausible-looking zeroes', () => {
  for (const call of [() => photonEnergy(1e308), () => photonEnergy(Number.MIN_VALUE), () => aperture(1e-250, 1), () => aperture(1e308, 1), () => aperture(1e7, Number.MIN_VALUE), () => aperture(1e150, 1e-300), () => schwarzschildRadius(Number.MIN_VALUE)]) assert.throws(call);
});
test('weak-field boundary accepts the declared bound across one to one hundred solar masses', () => {
  for (let factor = 1; factor <= 100; factor++) {
    const mass = factor * 1.98847e30;
    const bound = 100 * schwarzschildRadius(mass);
    near(weakDeflection(mass, bound).deflectionRad, 0.02);
    assert.throws(() => weakDeflection(mass, bound * (1 - 1e-10)));
  }
});
test('changed dynamics may be equivalent under a different bound bridge', () => {
  const sameLabels = compareStateModels('IDENTITY');
  assert.equal(sameLabels.equivalentUnderThisBridge, false);
  assert.ok(sameLabels.rows.every(r => !r.equal));
  const reverse = compareStateModels('REVERSED_LABELS');
  assert.deepEqual(reverse.mapping, [0, 2, 1]);
  assert.equal(reverse.equivalentUnderThisBridge, true);
  assert.equal(reverse.rows.length, 3);
  assert.throws(() => compareStateModels('universal'));
});
const camera = { requestId: 'EXAMPLE_1', frame: 'WORLD_Y_UP', unit: 'm', camera: [0,0,0], target: [1,1,1] };
test('camera contract separates accepted intent from synthetic observation', () => {
  const planned = simulateCameraCommand(camera);
  assert.equal(planned.accepted, true);
  assert.equal(planned.observed, null); assert.equal(planned.evaluation, null); assert.equal(planned.physicalEffect, false);
  near(planned.desired.yawRad, Math.PI/4);
  const checked = simulateCameraCommand(camera, { kind:'SYNTHETIC_INPUT', frame:'WORLD_Y_UP', angularUnit:'rad', yawRad:planned.desired.yawRad+0.1, pitchRad:planned.desired.pitchRad });
  near(checked.evaluation.yawErrorRad, 0.1);
  near(checked.evaluation.pitchErrorRad, 0);
  assert.equal(checked.execution.state, 'LOCAL_CALCULATION_ONLY');
});
test('camera denies wrong units or frames and rejects invalid coordinates', () => {
  assert.equal(simulateCameraCommand({...camera,unit:'cm'}).reason, 'UNIT_MISMATCH');
  assert.equal(simulateCameraCommand({...camera,frame:'NED'}).reason, 'FRAME_MISMATCH');
  assert.throws(() => simulateCameraCommand({...camera,target:[0,0,0]}));
  assert.throws(() => simulateCameraCommand({...camera,target:[1,NaN,1]}));
  assert.throws(() => simulateCameraCommand({...camera,extra:true}));
  assert.throws(() => simulateCameraCommand(camera, {kind:'PHYSICAL_SENSOR',frame:'WORLD_Y_UP',angularUnit:'rad',yawRad:0,pitchRad:0}));
});
test('catalog sources resolve and every declared research branch stays visible', () => {
  const sourceList = JSON.parse(fs.readFileSync(new URL('./sources.json', import.meta.url), 'utf8')).sources;
  const sourceIds = new Set(sourceList.map(s => s.id));
  for (const entry of FORMAT_CATALOG) for (const id of entry.sources) assert.ok(sourceIds.has(id), 'Missing source '+id);
  assert.equal(new Set(RESEARCH_BRANCHES.map(r => r.id)).size, RESEARCH_BRANCHES.length);
  assert.ok(RESEARCH_BRANCHES.some(r => r.id === 'AUDIO' && r.state === 'HELD_ARCHITECTURE'));
  assert.ok(RESEARCH_BRANCHES.some(r => r.id === 'CAMERA' && r.state === 'SIMULATED_ADAPTER'));
  assert.equal(LAB_VERSION, '1.0.0');
});
