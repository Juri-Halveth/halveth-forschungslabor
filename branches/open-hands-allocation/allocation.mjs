// SPDX-License-Identifier: Apache-2.0
// Pure, exact allocation proposal. No wallet, file, or network access.

import {
  analyzeAllocation,
  formatDecimal,
  parseDecimal,
  parsePercent,
  portion
} from '../exact-percent-kernel/exact-percent.mjs';

const MAX_SHARES = 128;
const MAX_AMOUNT_DIGITS = 78;
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function record(value, keys, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be a plain record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${name} must be a plain record`);
  }
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) {
    throw new TypeError(`${name} must contain exactly ${keys.join(', ')}`);
  }
  for (const key of keys) {
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (!property || !Object.hasOwn(property, 'value')) {
      throw new TypeError(`${name}.${key} must be a data value`);
    }
  }
  return value;
}

function label(value, name) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 100 ||
      value.trim() !== value || /[\u0000-\u001F\u007F]/u.test(value)) {
    throw new TypeError(`${name} must be a bounded, nonempty display label`);
  }
  return value;
}

/**
 * Plan integer minor-unit shares with an explicit residual recipient.
 * Percentages are exact decimals; every fractional minor unit stays in the
 * residual. The result is a proposal, not a transfer instruction.
 */
export function planAllocation(input) {
  const {amountMinorUnits, shares, remainderId, remainderLabel} = record(
    input, ['amountMinorUnits', 'shares', 'remainderId', 'remainderLabel'], 'input'
  );
  if (typeof amountMinorUnits !== 'string' ||
      !new RegExp(`^(?:0|[1-9][0-9]{0,${MAX_AMOUNT_DIGITS - 1}})$`).test(amountMinorUnits)) {
    throw new TypeError('amountMinorUnits must be a canonical bounded integer string');
  }
  const amount = BigInt(amountMinorUnits);
  if (typeof remainderId !== 'string' || !ID.test(remainderId)) {
    throw new TypeError('remainderId must be ASCII');
  }
  label(remainderLabel, 'remainderLabel');
  if (!Array.isArray(shares) || shares.length > MAX_SHARES) {
    throw new TypeError(`shares must be an array of at most ${MAX_SHARES} records`);
  }
  if (Array.from({length: shares.length}, (_, index) => Object.hasOwn(shares, index))
    .some(present => !present)) {
    throw new TypeError('shares cannot contain empty positions');
  }

  const seen = new Set();
  const parsed = shares.map((item, index) => {
    const {id, label: displayLabel, percent} = record(
      item, ['id', 'label', 'percent'], `shares[${index}]`
    );
    if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) {
      throw new TypeError(`shares[${index}].id must be unique ASCII`);
    }
    seen.add(id);
    label(displayLabel, `shares[${index}].label`);
    const rate = parsePercent(percent);
    return {id, label: displayLabel, rate};
  });
  if (seen.has(remainderId)) {
    throw new TypeError('remainderId must differ from every share id');
  }

  const analysis = parsed.length === 0 ? null :
    analyzeAllocation(parsed.map(item => formatDecimal(item.rate)));
  if (analysis?.state === 'OVER_100') {
    throw new RangeError('declared shares exceed 100 percent');
  }

  let assigned = 0n;
  const exactAmount = parseDecimal(amountMinorUnits);
  const allocations = parsed.map(item => {
    const exactShare = portion(exactAmount, item.rate);
    const denominator = 10n ** BigInt(exactShare.scale);
    const minorUnits = exactShare.coefficient / denominator;
    assigned += minorUnits;
    return Object.freeze({
      id: item.id,
      label: item.label,
      percent: formatDecimal(item.rate),
      minorUnits: minorUnits.toString()
    });
  });
  if (assigned > amount) throw new Error('allocation invariant violated');
  const residual = amount - assigned;
  const totalPercent = analysis ? formatDecimal(analysis.total) : '0';
  const unallocatedPercent = analysis ? formatDecimal(analysis.residual) : '100';

  return Object.freeze({
    amountMinorUnits,
    allocations: Object.freeze(allocations),
    totalPercent,
    unallocatedPercent,
    remainder: Object.freeze({id: remainderId, label: remainderLabel,
      minorUnits: residual.toString()}),
    roundingRule: 'FLOOR_EACH_SHARE_RESIDUAL_TO_NAMED_RECIPIENT',
    state: 'LOCAL_PROPOSAL_ONLY'
  });
}
