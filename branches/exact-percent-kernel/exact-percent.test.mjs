// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  addDecimal, analyzeAllocation, compareDecimal, formatDecimal,
  parseDecimal, parsePercent, portion
} from './exact-percent.mjs';

test('decimal syntax is explicit and retains significant input scale', () => {
  assert.equal(formatDecimal(parseDecimal('  -0.0100  ')), '-0.0100');
  assert.equal(formatDecimal(parseDecimal('23,25', {decimalSeparator: ','})), '23.25');
  assert.equal(compareDecimal(parseDecimal('0.10'), parseDecimal('0.1')), 0);
  for (const input of ['1 000', '1,000', '1e3', 'NaN', '1.2.3', '.5']) {
    assert.throws(() => parseDecimal(input));
  }
  assert.throws(() => parseDecimal('0.' + '1'.repeat(129)), RangeError);
  assert.throws(() => parseDecimal('1', {decimalSeparator: ';'}), TypeError);
});

test('finite decimal addition avoids binary floating-point residue', () => {
  const sum = addDecimal(parseDecimal('0.1'), parseDecimal('0.2'));
  assert.equal(formatDecimal(sum), '0.3');
  assert.equal(compareDecimal(sum, parseDecimal('0.30')), 0);
});

test('allocation exposes a missing four percent instead of calling it balance', () => {
  const incomplete = analyzeAllocation(['23%', '23%', '23%', '23%', '4%']);
  assert.equal(incomplete.state, 'UNDER_100');
  assert.equal(formatDecimal(incomplete.total), '96');
  assert.equal(formatDecimal(incomplete.residual), '4');
  const balanced = analyzeAllocation(['24%', '24%', '24%', '24%', '4%']);
  assert.equal(balanced.state, 'EXACT_100');
  assert.equal(formatDecimal(balanced.residual), '0');
  assert.equal(analyzeAllocation(['60%', '50%']).state, 'OVER_100');
});

test('percent boundaries, locale, and percent multiplication stay exact', () => {
  assert.equal(formatDecimal(parsePercent('4,00 %', {decimalSeparator: ','})), '4.00');
  assert.throws(() => parsePercent('101%'), RangeError);
  assert.throws(() => parsePercent('-0.1%'), RangeError);
  const result = portion(parseDecimal('50000000'), parsePercent('4%'));
  assert.equal(compareDecimal(result, parseDecimal('2000000')), 0);
  assert.equal(formatDecimal(result), '2000000.00');
});

test('bounded API rejects invalid raw objects and excessive fanout', () => {
  assert.throws(() => formatDecimal({coefficient: 1, scale: 0}), TypeError);
  assert.throws(() => analyzeAllocation([]), TypeError);
  assert.throws(() => analyzeAllocation(Array(129).fill('1%')), TypeError);
  assert.throws(() => portion(parseDecimal('1'), parseDecimal('200')), RangeError);
});

test('source receipt binds the public implementation and test bytes', () => {
  const receipt = JSON.parse(readFileSync(new URL('./SOURCE_RECEIPT.json', import.meta.url), 'utf8'));
  const sha = path => createHash('sha256').update(readFileSync(new URL(path, import.meta.url))).digest('hex');
  assert.equal(receipt.transfer, 'NEW_SMALL_IMPLEMENTATION_NO_SOURCE_BYTE_COPY');
  assert.equal(sha('./exact-percent.mjs'), receipt.implementationSha256);
  assert.equal(sha('./exact-percent.test.mjs'), receipt.testSha256);
});
