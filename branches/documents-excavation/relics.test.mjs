import test from 'node:test';
import assert from 'node:assert/strict';
import {RELICS, RELATIONS} from './relics.js';

test('public relation graph has unique explicit endpoints and no hidden path exports', () => {
  const ids = new Set(RELICS.map((item) => item.id));
  assert.equal(ids.size, RELICS.length);
  const pairs = new Set();
  for (const relation of RELATIONS) {
    assert.ok(ids.has(relation.from) && ids.has(relation.to));
    assert.notEqual(relation.from, relation.to);
    const key = [relation.from, relation.to].sort().join('|');
    assert.ok(!pairs.has(key), `duplicate pair ${key}`);
    pairs.add(key);
    assert.ok(relation.type && relation.note);
  }
  const serialized = JSON.stringify({RELICS, RELATIONS});
  assert.doesNotMatch(serialized, /[A-Z]:\\|AppData|\.env|seedphrase|private_key/i);
});

test('only explicitly public modules expose outbound source links', () => {
  for (const relic of RELICS) {
    if (relic.href) {
      assert.equal(relic.evidence, 'PUBLIC_SOURCE');
      assert.match(relic.href, /^https:\/\/github\.com\/Juri-Halveth\/halveth-forschungslabor\//);
    }
  }
});
