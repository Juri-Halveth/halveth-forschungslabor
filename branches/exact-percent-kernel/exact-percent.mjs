// SPDX-License-Identifier: Apache-2.0
// Pure decimal arithmetic for bounded, explicit percentage calculations.

const MAX_INPUT_CHARS = 256;
const MAX_INPUT_SCALE = 128;

function separatorOption(options) {
  const separator = options?.decimalSeparator ?? '.';
  if (separator !== '.' && separator !== ',') {
    throw new TypeError('decimalSeparator must be "." or ","');
  }
  return separator;
}

function exact(coefficient, scale) {
  if (typeof coefficient !== 'bigint' || !Number.isSafeInteger(scale) || scale < 0 || scale > 260) {
    throw new TypeError('exact value requires a bigint coefficient and a bounded nonnegative scale');
  }
  return Object.freeze({coefficient, scale});
}

export function parseDecimal(input, options = {}) {
  if (typeof input !== 'string' || input.length === 0 || input.length > MAX_INPUT_CHARS) {
    throw new TypeError('decimal input must be a nonempty bounded string');
  }
  const separator = separatorOption(options);
  const text = input.trim();
  const fraction = separator === '.' ? '\\.' : ',';
  const match = new RegExp(`^([+-]?)([0-9]+)(?:${fraction}([0-9]+))?$`).exec(text);
  if (!match) throw new SyntaxError('use ungrouped ASCII decimal digits with the declared separator');
  const scale = match[3]?.length ?? 0;
  if (scale > MAX_INPUT_SCALE) throw new RangeError('too many decimal places');
  const magnitude = BigInt(match[2] + (match[3] ?? ''));
  return exact(match[1] === '-' ? -magnitude : magnitude, scale);
}

export function formatDecimal(value) {
  const v = exact(value?.coefficient, value?.scale);
  const negative = v.coefficient < 0n;
  const digits = (negative ? -v.coefficient : v.coefficient).toString().padStart(v.scale + 1, '0');
  const point = v.scale === 0 ? '' : `.${digits.slice(-v.scale)}`;
  const whole = v.scale === 0 ? digits : digits.slice(0, -v.scale);
  return `${negative ? '-' : ''}${whole}${point}`;
}

function align(left, right) {
  const a = exact(left?.coefficient, left?.scale);
  const b = exact(right?.coefficient, right?.scale);
  const scale = Math.max(a.scale, b.scale);
  return [a.coefficient * 10n ** BigInt(scale - a.scale),
    b.coefficient * 10n ** BigInt(scale - b.scale), scale];
}

export function compareDecimal(left, right) {
  const [a, b] = align(left, right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addDecimal(left, right) {
  const [a, b, scale] = align(left, right);
  return exact(a + b, scale);
}

export function subtractDecimal(left, right) {
  const [a, b, scale] = align(left, right);
  return exact(a - b, scale);
}

export function parsePercent(input, options = {}) {
  if (typeof input !== 'string') throw new TypeError('percent must be a string');
  const text = input.trim();
  const number = parseDecimal(text.endsWith('%') ? text.slice(0, -1) : text, options);
  if (compareDecimal(number, exact(0n, 0)) < 0 || compareDecimal(number, exact(100n, 0)) > 0) {
    throw new RangeError('percent must lie between 0 and 100');
  }
  return number;
}

export function analyzeAllocation(inputs, options = {}) {
  if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > 128) {
    throw new TypeError('allocation requires 1 to 128 percent strings');
  }
  const parts = inputs.map(input => parsePercent(input, options));
  const total = parts.reduce((sum, part) => addDecimal(sum, part), exact(0n, 0));
  const residual = subtractDecimal(exact(100n, 0), total);
  const sign = compareDecimal(residual, exact(0n, 0));
  return Object.freeze({
    parts: Object.freeze(parts), total, residual,
    state: sign === 0 ? 'EXACT_100' : sign > 0 ? 'UNDER_100' : 'OVER_100'
  });
}

export function portion(amount, percent) {
  const value = exact(amount?.coefficient, amount?.scale);
  const rate = exact(percent?.coefficient, percent?.scale);
  if (compareDecimal(rate, exact(0n, 0)) < 0 || compareDecimal(rate, exact(100n, 0)) > 0) {
    throw new RangeError('rate must lie between 0 and 100 percent');
  }
  return exact(value.coefficient * rate.coefficient, value.scale + rate.scale + 2);
}
