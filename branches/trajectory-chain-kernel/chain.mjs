// SPDX-License-Identifier: Apache-2.0
// Pure local model: content-bound deltas, event links, and a separate value.
import {createHash} from 'node:crypto';

const MAX_EVENTS = 1024;
const MAX_ENTRIES = 4096;
const KEY = /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/;
const HASH = /^[0-9A-F]{64}$/;
const PROJECTION_SCHEMA = 'halveth.trajectory.projection.demo.v1';
const EVENT_SCHEMA = 'halveth.trajectory.event.demo.v1';
const VALUE_SCHEMA = 'halveth.trajectory.value.demo.v1';

function plain(value, name, keys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${name} must be a plain record`);
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) {
    throw new TypeError(`${name} must contain exactly ${keys.join(', ')}`);
  }
  for (const key of keys) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')) {
      throw new TypeError(`${name}.${key} must be a data value`);
    }
  }
  return value;
}

function list(value, name, max) {
  if (!Array.isArray(value) || value.length > max ||
      Reflect.ownKeys(value).length !== value.length + 1) {
    throw new TypeError(`${name} must be a dense bounded array`);
  }
  for (let i = 0; i < value.length; i++) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, i), 'value')) {
      throw new TypeError(`${name}[${i}] must be a data value`);
    }
  }
  return value;
}

function validHash(value, name) {
  if (typeof value !== 'string' || !HASH.test(value)) {
    throw new TypeError(`${name} must be an uppercase SHA-256 hex string`);
  }
  return value;
}

function validKey(value, name) {
  if (typeof value !== 'string' || !KEY.test(value)) {
    throw new TypeError(`${name} must be a bounded ASCII key`);
  }
  return value;
}

function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    list(value, 'canonical array', MAX_ENTRIES);
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object' &&
      [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    const keys = Reflect.ownKeys(value);
    if (keys.some(key => typeof key !== 'string')) {
      throw new TypeError('canonical record cannot contain symbols');
    }
    return `{${keys.sort().map(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!Object.hasOwn(descriptor, 'value')) {
        throw new TypeError('canonical record cannot contain accessors');
      }
      return `${JSON.stringify(key)}:${canonical(descriptor.value)}`;
    }).join(',')}}`;
  }
  throw new TypeError('unsupported canonical value');
}

function hash(value) {
  return createHash('sha256').update(canonical(value) + '\n', 'utf8')
    .digest('hex').toUpperCase();
}

function entry(value, name) {
  const item = plain(value, name, ['key', 'digest']);
  return {key: validKey(item.key, `${name}.key`),
    digest: validHash(item.digest, `${name}.digest`)};
}

function sortedEntries(value, name) {
  const items = list(value, name, MAX_ENTRIES).map((item, i) => entry(item, `${name}[${i}]`));
  items.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  if (items.some((item, i) => i > 0 && item.key === items[i - 1].key)) {
    throw new TypeError(`${name} has duplicate keys`);
  }
  return items;
}

function projectionHash(state) {
  const entries = [...state].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, digest]) => ({key, digest}));
  return hash({schema: PROJECTION_SCHEMA, entries});
}

function difference(before, after) {
  const added = [], modified = [], removed = [];
  for (const [key, digest] of after) {
    if (!before.has(key)) added.push({key, digest});
    else if (before.get(key) !== digest) modified.push({key, digest});
  }
  for (const key of before.keys()) if (!after.has(key)) removed.push(key);
  added.sort((a, b) => a.key < b.key ? -1 : 1);
  modified.sort((a, b) => a.key < b.key ? -1 : 1);
  removed.sort();
  return {added, modified, removed};
}

function applyDelta(before, value) {
  const delta = plain(value, 'delta', ['added', 'modified', 'removed']);
  const added = sortedEntries(delta.added, 'delta.added');
  const modified = sortedEntries(delta.modified, 'delta.modified');
  const removed = list(delta.removed, 'delta.removed', MAX_ENTRIES)
    .map((key, i) => validKey(key, `delta.removed[${i}]`));
  const touched = [...added, ...modified].map(item => item.key).concat(removed);
  if (new Set(touched).size !== touched.length) throw new TypeError('delta overlaps');
  const after = new Map(before);
  for (const item of added) {
    if (after.has(item.key)) throw new TypeError('added key already exists');
    after.set(item.key, item.digest);
  }
  for (const item of modified) {
    if (!after.has(item.key) || after.get(item.key) === item.digest) {
      throw new TypeError('modified key must exist and change');
    }
    after.set(item.key, item.digest);
  }
  for (const key of removed) {
    if (!after.delete(key)) throw new TypeError('removed key must exist');
  }
  if (after.size > MAX_ENTRIES) throw new RangeError('projection too large');
  return {after, changeCount: touched.length};
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}

/** Build a synthetic, local event chain from bounded content-digest snapshots. */
export function buildHistory(observations) {
  const snapshots = list(observations, 'observations', MAX_EVENTS);
  if (snapshots.length === 0) throw new TypeError('at least one observation required');
  const records = [];
  let previous = new Map();
  let previousEventHash = null;
  let previousProjectionHash = null;
  for (const [sequence, snapshot] of snapshots.entries()) {
    const next = new Map(sortedEntries(snapshot, `observations[${sequence}]`)
      .map(item => [item.key, item.digest]));
    const delta = difference(previous, next);
    const event = {schema: EVENT_SCHEMA, sequence, previousEventHash,
      previousProjectionHash, projectionHash: projectionHash(next), delta};
    const eventHash = hash(event);
    const changeCount = delta.added.length + delta.modified.length + delta.removed.length;
    const value = {schema: VALUE_SCHEMA, eventHash, changeCount,
      state: sequence === 0 ? 'INITIAL' : changeCount === 0 ? 'UNCHANGED' : 'CHANGED'};
    records.push(deepFreeze({event, eventHash, value, valueHash: hash(value)}));
    previous = next;
    previousEventHash = eventHash;
    previousProjectionHash = event.projectionHash;
  }
  return Object.freeze(records);
}

/** Replay and verify every event, projection and non-circular value binding. */
export function verifyHistory(records) {
  const items = list(records, 'records', MAX_EVENTS);
  if (items.length === 0) throw new TypeError('at least one record required');
  let state = new Map();
  let previousEventHash = null;
  let previousProjectionHash = null;
  let finalValueHash = null;
  for (const [sequence, raw] of items.entries()) {
    const item = plain(raw, `records[${sequence}]`,
      ['event', 'eventHash', 'value', 'valueHash']);
    const event = plain(item.event, 'event',
      ['schema', 'sequence', 'previousEventHash', 'previousProjectionHash',
        'projectionHash', 'delta']);
    if (event.schema !== EVENT_SCHEMA || event.sequence !== sequence ||
        event.previousEventHash !== previousEventHash ||
        event.previousProjectionHash !== previousProjectionHash ||
        validHash(event.projectionHash, 'event.projectionHash') !== event.projectionHash ||
        validHash(item.eventHash, 'eventHash') !== hash(event)) {
      throw new Error(`event link or digest mismatch at ${sequence}`);
    }
    const replay = applyDelta(state, event.delta);
    if (projectionHash(replay.after) !== event.projectionHash) {
      throw new Error(`projection mismatch at ${sequence}`);
    }
    const value = plain(item.value, 'value',
      ['schema', 'eventHash', 'changeCount', 'state']);
    const expectedState = sequence === 0 ? 'INITIAL' :
      replay.changeCount === 0 ? 'UNCHANGED' : 'CHANGED';
    if (value.schema !== VALUE_SCHEMA || value.eventHash !== item.eventHash ||
        value.changeCount !== replay.changeCount || value.state !== expectedState ||
        validHash(item.valueHash, 'valueHash') !== hash(value)) {
      throw new Error(`value binding mismatch at ${sequence}`);
    }
    state = replay.after;
    previousEventHash = item.eventHash;
    previousProjectionHash = event.projectionHash;
    finalValueHash = item.valueHash;
  }
  return Object.freeze({eventCount: items.length, finalEventHash: previousEventHash,
    finalProjectionHash: previousProjectionHash, finalValueHash,
    state: 'VALID_LOCAL_MODEL'});
}
