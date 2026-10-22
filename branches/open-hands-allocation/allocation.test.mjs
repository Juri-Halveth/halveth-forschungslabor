import test from 'node:test';
import assert from 'node:assert/strict';
import {planAllocation} from './allocation.mjs';

const share = (id, percent) => ({id, label: id, percent});

test('four 23-percent shares and one 4-percent share leave 4 percent visible', () => {
  const result = planAllocation({
    amountMinorUnits: '1000',
    shares: [share('a', '23'), share('b', '23'), share('c', '23'),
      share('d', '23'), share('e', '4')],
    remainderId: 'reserve', remainderLabel: 'named-reserve'
  });
  assert.deepEqual(result.allocations.map(row => row.minorUnits),
    ['230', '230', '230', '230', '40']);
  assert.equal(result.totalPercent, '96');
  assert.equal(result.unallocatedPercent, '4');
  assert.deepEqual(result.remainder,
    {id: 'reserve', label: 'named-reserve', minorUnits: '40'});
  assert.equal(result.state, 'LOCAL_PROPOSAL_ONLY');
});

test('fractional minor units remain in the explicitly named residual', () => {
  const result = planAllocation({
    amountMinorUnits: '1', shares: [share('a', '50'), share('b', '50')],
    remainderId: 'reserve', remainderLabel: 'rounding-reserve'
  });
  assert.deepEqual(result.allocations.map(row => row.minorUnits), ['0', '0']);
  assert.equal(result.unallocatedPercent, '0');
  assert.equal(result.remainder.minorUnits, '1');
});

test('one large exact integer cannot lose units through floating point', () => {
  const amountMinorUnits = '9999999999999999999999999999999999999999';
  const result = planAllocation({
    amountMinorUnits, shares: [share('a', '0.1'), share('b', '99.9')],
    remainderId: 'reserve', remainderLabel: 'dust'
  });
  const distributed = result.allocations.reduce(
    (sum, row) => sum + BigInt(row.minorUnits), 0n
  );
  assert.equal(distributed + BigInt(result.remainder.minorUnits), BigInt(amountMinorUnits));
  assert.equal(result.totalPercent, '100.0');
});

test('every stored share is validated before it can affect the total', () => {
  const base = {amountMinorUnits: '100', remainderId: 'reserve', remainderLabel: 'reserve'};
  assert.throws(() => planAllocation({...base, shares: [share('a', '5'), share('bad', 'oops')]}),
    SyntaxError);
  assert.throws(() => planAllocation({...base, shares: [share('a', '60'), share('b', '41')]}),
    RangeError);
  assert.throws(() => planAllocation({...base, shares: [share('a', '5'), share('a', '5')]}),
    TypeError);
  assert.throws(() => planAllocation({...base, shares: [share('reserve', '5')]}),
    TypeError);
});

test('strict input shape rejects noncanonical, sparse, and accessor-backed values', () => {
  const base = {amountMinorUnits: '100', shares: [], remainderId: 'reserve', remainderLabel: 'reserve'};
  assert.throws(() => planAllocation({...base, amountMinorUnits: '001'}), TypeError);
  assert.throws(() => planAllocation({...base, amountMinorUnits: '-1'}), TypeError);
  assert.throws(() => planAllocation({...base, amountMinorUnits: '1e3'}), TypeError);
  assert.throws(() => planAllocation({...base, shares: new Array(1)}), TypeError);
  assert.throws(() => planAllocation({...base, surprise: true}), TypeError);
  const accessor = {id: 'a', label: 'a'};
  Object.defineProperty(accessor, 'percent', {get() { throw Error('must not run'); }, enumerable: true});
  assert.throws(() => planAllocation({...base, shares: [accessor]}), TypeError);
});

test('empty shares produce a fully visible residual without mutating input', () => {
  const input = Object.freeze({
    amountMinorUnits: '7', shares: Object.freeze([]), remainderId: 'reserve',
    remainderLabel: 'unassigned'
  });
  const result = planAllocation(input);
  assert.equal(result.totalPercent, '0');
  assert.equal(result.unallocatedPercent, '100');
  assert.equal(result.remainder.minorUnits, '7');
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.allocations));
});
