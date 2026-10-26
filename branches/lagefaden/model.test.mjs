import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePacket} from './model.mjs';
import {cases} from './cases.mjs';

test('copies do not add a declared origin, and old observations remain old', () => {
  const r = evaluatePacket(cases[0].packet);
  assert.equal(r.reportCount, 3);
  assert.equal(r.originalReportCount, 2);
  assert.equal(r.freshDeclaredOrigins, 1);
  assert.equal(r.status, 'REVIEW_GAP');
  assert.equal(r.rows[1].rootId, 'A');
  assert.equal(r.rows[2].timeState, 'STALE_OBSERVATION');
});
test('fresh conflicting origins remain unresolved', () => {
  const r = evaluatePacket(cases[1].packet);
  assert.equal(r.status, 'REVIEW_CONFLICT');
  assert.equal(r.freshDeclaredOrigins, 2);
  assert.equal(r.worldState, 'UNKNOWN');
});
test('new direct observation is not collapsed with a copy', () => {
  const r = evaluatePacket(cases[2].packet);
  assert.equal(r.originalReportCount, 2);
  assert.equal(r.freshDeclaredOrigins, 2);
  assert.equal(r.status, 'PROVISIONAL_CONSISTENT');
});
test('fresh receipt cannot freshen an old observation', () => {
  const r = evaluatePacket(cases[3].packet);
  assert.equal(r.rows[1].timeState, 'STALE_OBSERVATION');
  assert.equal(r.freshDeclaredOrigins, 0);
});
test('invented origin IDs remain declared, never authenticated', () => {
  const r = evaluatePacket(cases[4].packet);
  assert.equal(r.freshDeclaredOrigins, 2);
  assert.equal(r.sourceAuthentication, 'NOT_PERFORMED');
  assert.equal(r.worldState, 'UNKNOWN');
  assert.equal(r.action, 'HUMAN_REVIEW_ONLY');
});
test('inconsistent copy is rejected rather than silently counted', () => {
  const p = structuredClone(cases[0].packet);
  p.reports[1].finding = 'alternative_explanation';
  assert.throws(() => evaluatePacket(p), /COPY_CHANGED_OBSERVATION/);
});
test('unsupported provenance fields and time errors are rejected', () => {
  const p = structuredClone(cases[0].packet);
  p.reports[0].authenticated = true;
  assert.throws(() => evaluatePacket(p), /INVALID_REPORT/);
  delete p.reports[0].authenticated;
  p.reports[0].observedAt = '2026-10-19T10:09:00+02:00';
  assert.throws(() => evaluatePacket(p), /INCONSISTENT_TIME/);
});
test('cycles and missing parents fail', () => {
  const p = structuredClone(cases[0].packet);
  p.reports[0].parentId = 'B';
  assert.throws(() => evaluatePacket(p), /COPY_CYCLE/);
  p.reports[0].parentId = 'Z';
  assert.throws(() => evaluatePacket(p), /MISSING_PARENT/);
});
test('one declared origin or an unresolved finding never yields a consistent label', () => {
  const p = structuredClone(cases[0].packet);
  p.reports = p.reports.slice(0,2);
  assert.equal(evaluatePacket(p).status, 'REVIEW_SINGLE_SOURCE');
  p.reports[0].finding = 'unresolved';
  p.reports[1].finding = 'unresolved';
  assert.equal(evaluatePacket(p).status, 'REVIEW_UNRESOLVED');
});
