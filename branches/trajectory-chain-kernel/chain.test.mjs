import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {buildHistory, verifyHistory} from './chain.mjs';

const digest = text => createHash('sha256').update(text).digest('hex').toUpperCase();
const a = {key: 'a', digest: digest('a')};
const b = {key: 'b', digest: digest('b')};
const a2 = {key: 'a', digest: digest('a2')};
const mutable = value => JSON.parse(JSON.stringify(value));
const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
const boundHash = value => digest(canonical(value) + '\n');

test('initial, unchanged and changed snapshots replay exactly', () => {
  const records = buildHistory([[a], [a], [a2, b], [b]]);
  assert.deepEqual(records.map(item => item.value.state),
    ['INITIAL', 'UNCHANGED', 'CHANGED', 'CHANGED']);
  assert.deepEqual(records[2].event.delta, {added: [b], modified: [a2], removed: []});
  assert.deepEqual(records[3].event.delta, {added: [], modified: [], removed: ['a']});
  const result = verifyHistory(records);
  assert.equal(result.eventCount, 4);
  assert.equal(result.finalEventHash, records[3].eventHash);
  assert.equal(result.state, 'VALID_LOCAL_MODEL');
  assert.ok(Object.isFrozen(records[0].event.delta.added));
});

test('input order does not change the chain', () => {
  const left = buildHistory([[a, b]]);
  const right = buildHistory([[b, a]]);
  assert.equal(left[0].eventHash, right[0].eventHash);
});

test('event mutation breaks the chain', () => {
  const records = mutable(buildHistory([[a], [a, b]]));
  records[0].event.delta.added[0].digest = digest('wrong');
  assert.throws(() => verifyHistory(records), /mismatch/);
});

test('value mutation breaks its separate binding', () => {
  const records = mutable(buildHistory([[a]]));
  records[0].value.changeCount = 100;
  assert.throws(() => verifyHistory(records), /value binding mismatch/);
});

test('recomputed hashes cannot make a false delta replay to the old projection', () => {
  const records = mutable(buildHistory([[a], [a2]]));
  records[1].event.delta.modified = [];
  records[1].eventHash = boundHash(records[1].event);
  records[1].value.eventHash = records[1].eventHash;
  records[1].value.changeCount = 0;
  records[1].value.state = 'UNCHANGED';
  records[1].valueHash = boundHash(records[1].value);
  assert.throws(() => verifyHistory(records), /projection mismatch/);
});

test('broken event order and missing event are rejected', () => {
  const records = mutable(buildHistory([[a], [a, b], [b]]));
  assert.throws(() => verifyHistory([records[0], records[2]]), /mismatch/);
  assert.throws(() => verifyHistory([records[1], records[0]]), /mismatch/);
});

test('invalid snapshots and accessor records are rejected', () => {
  assert.throws(() => buildHistory([]), /at least one/);
  assert.throws(() => buildHistory([[a, a]]), /duplicate/);
  assert.throws(() => buildHistory([[{key: 'a', digest: 'bad'}]]), /SHA-256/);
  assert.throws(() => buildHistory([[{key: '../secret', digest: digest('x')}]]), /ASCII/);
  assert.throws(() => buildHistory([new Array(1)]), /dense/);
  const getter = {key: 'a'};
  Object.defineProperty(getter, 'digest', {get: () => digest('x'), enumerable: true});
  assert.throws(() => buildHistory([[getter]]), /data value/);
});
