import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256 } from '../src/sha256.mjs';
test('portable digest matches published SHA-256 vectors', () => {
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256('a'.repeat(1000000)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
});
test('portable implementation matches Node crypto across padding and UTF-8 boundaries', () => {
  for (const n of [0,1,31,55,56,63,64,65,127,128,255,1024,8192]) {
    const bytes = Uint8Array.from({length:n},(_,i)=>(i*31+n)%256);
    assert.equal(sha256(bytes), createHash('sha256').update(bytes).digest('hex'));
  }
  for (const text of ['Licht 🧬', '\uFEFFhello', 'é', 'e\u0301', 'אבג العربية', '\u0000\uD800'])
    assert.equal(sha256(text), createHash('sha256').update(text).digest('hex'));
  assert.throws(()=>sha256({}));
});
