import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const routes = JSON.parse(readFileSync(new URL('../catalog/evidence-routes.json', import.meta.url), 'utf8'));

test('public evidence routes bind a unique subject, commit, path and claim ceiling', () => {
  assert.equal(routes.schema, 'halveth.evidence-routes.v1');
  assert.equal(routes.coverage, 'SELECTED_PUBLIC_ROUTES');
  assert.ok(Array.isArray(routes.routes) && routes.routes.length > 0);
  const ids = new Set();
  for (const route of routes.routes) {
    assert.match(route.id, /^[A-Z][A-Z0-9_]+$/);
    assert.equal(ids.has(route.id), false, `duplicate ${route.id}`);
    ids.add(route.id);
    assert.match(route.repository, /^Juri-Halveth\/[A-Za-z0-9._-]+$/);
    assert.match(route.commit, /^[a-f0-9]{40}$/);
    assert.ok(route.path && !route.path.includes('..') && !route.path.includes('\\'));
    assert.ok(route.claimCeiling && route.claimCeiling !== 'PROVEN');
    assert.ok(['PUBLIC_DRAFT_PR', 'PUBLIC_MAIN_SOURCE'].includes(route.publicationState));
    const expected = `https://github.com/${route.repository}/blob/${route.commit}/${route.path}`;
    assert.equal(route.url, expected);
  }
});
