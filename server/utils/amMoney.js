const Decimal = require('decimal.js');

// Monetary rounding: 2 dp, half-up. Quantities keep up to 8 dp (crypto / fractional units).
// Intermediate maths is never rounded; round only when a value is posted or displayed.
// Mirrors legacywealth admin/src/domain/money.ts - keep both in sync.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const MONEY_DP = 2;
const QTY_DP = 8;

const D = (v) => new Decimal(v === '' || v === undefined || v === null ? 0 : v);
const ZERO = new Decimal(0);

function isDecimalString(v) {
  return typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim());
}

function roundMoney(v) {
  return D(v).toDecimalPlaces(MONEY_DP, Decimal.ROUND_HALF_UP);
}

function moneyStr(v) {
  return roundMoney(v).toFixed(MONEY_DP);
}

function sum(values) {
  return values.reduce((a, b) => a.plus(b), ZERO);
}

module.exports = { Decimal, D, ZERO, MONEY_DP, QTY_DP, isDecimalString, roundMoney, moneyStr, sum };
