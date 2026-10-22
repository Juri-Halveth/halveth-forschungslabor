import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const directory = import.meta.dirname;
const receipt = JSON.parse(readFileSync(path.join(directory, 'receipt.json'), 'utf8'));

test('published GENESIS evidence bytes match the bounded receipt', () => {
  assert.equal(receipt.schema, 'halveth.genesis.public-evidence-receipt.v1');
  assert.equal(receipt.visualFiles.length, 3);
  for (const item of [...receipt.visualFiles, receipt.test.log]) {
    assert.match(item.path, /^[a-z0-9-]+\.(?:jpg|txt)$/);
    const bytes = readFileSync(path.join(directory, item.path));
    assert.equal(bytes.length, item.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    if (item.path.endsWith('.jpg')) {
      assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
      assert.equal(item.mediaType, 'image/jpeg');
    }
  }
  const log = readFileSync(path.join(directory, receipt.test.log.path), 'utf8');
  assert.match(log, /tests 148/);
  assert.match(log, /pass 148/);
  assert.match(log, /fail 0/);
  assert.match(log, /Ran 17 tests/);
  assert.match(log, /Ran 29 tests/);
  assert.match(log, /Ran 3 tests/);
});
