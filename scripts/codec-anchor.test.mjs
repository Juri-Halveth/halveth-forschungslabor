// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juri Halveth. Developed with AI assistance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAnchor } from '../research/codec-001/verify.mjs';

const base = new URL('../research/codec-001/', import.meta.url);
const anchor = JSON.parse(readFileSync(new URL('ANCHOR.json', base), 'utf8'));

test('published dossier matches its exact-byte anchor', () => {
  assert.deepEqual(verifyAnchor(anchor), {
    matchedFiles: 5, evidence: 'BYTES_MATCH_THIS_MANIFEST',
  });
});

test('one changed byte is rejected without altering the source file', () => {
  assert.throws(() => verifyAnchor(anchor, (name) => {
    const bytes = Buffer.from(readFileSync(new URL(name, base)));
    if (name === 'RIGHTS.md') bytes[0] ^= 1;
    return bytes;
  }), /Payload differs: RIGHTS.md/);
});

test('an added or substituted path is rejected before file access', () => {
  const substituted = structuredClone(anchor);
  substituted.files[0].path = '../private.txt';
  let reads = 0;
  assert.throws(() => verifyAnchor(substituted, () => { reads++; }), /Invalid fixed payload/);
  assert.equal(reads, 0);
  const added = structuredClone(anchor);
  added.files.push({ path: 'extra.txt', bytes: 0, sha256: '0'.repeat(64) });
  assert.throws(() => verifyAnchor(added, () => { reads++; }), /Unexpected payload count/);
  assert.equal(reads, 0);
});
