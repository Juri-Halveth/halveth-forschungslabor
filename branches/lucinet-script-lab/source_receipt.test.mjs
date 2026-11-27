import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = dirname(fileURLToPath(import.meta.url));
const receipt = JSON.parse(readFileSync(join(root, 'SOURCE_RECEIPT.json'), 'utf8'));

test('the declared exact-source files match their public bytes', () => {
  assert.equal(receipt.schema, 'halveth.selected-source-transfer.v1');
  assert.equal(receipt.sourceLicense, 'MIT');
  assert.match(receipt.historicalSourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(receipt.records.length, 3);
  for (const item of receipt.records) {
    assert.equal(item.transfer, 'EXACT_SOURCE_BYTES');
    assert.equal(item.outputSha256, item.sourceSha256);
    assert.match(item.outputPath, /^(src\/lib\.rs|SOURCE_STATUS\.md|LICENSE)$/);
    const digest = createHash('sha256').update(readFileSync(join(root, item.outputPath))).digest('hex');
    assert.equal(digest, item.outputSha256, item.outputPath);
  }
});
