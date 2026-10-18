const test = require('node:test');
const assert = require('node:assert/strict');
const {
  cashEffect, summariseLedger, buildReversal, LedgerValidationError,
  isCostBasisSupported, TradeValidationError, computePositions, valuePositions, checkTrade,
} = require('../utils/amCalc');
const { moneyStr } = require('../utils/amMoney');

// --- Ledger ----------------------------------------------------------------

test('cashEffect: contribution increases cash, withdrawal/fee/distribution decrease it', () => {
  assert.equal(cashEffect({ type: 'contribution', amount: '100' }).toString(), '100');
  assert.equal(cashEffect({ type: 'withdrawal', amount: '40' }).toString(), '-40');
  assert.equal(cashEffect({ type: 'fee', amount: '5' }).toString(), '-5');
  assert.equal(cashEffect({ type: 'distribution', amount: '10' }).toString(), '-10');
});

test('cashEffect: adjustment is signed, reversal negates the original effect', () => {
  assert.equal(cashEffect({ type: 'adjustment', amount: '-7' }).toString(), '-7');
  assert.equal(cashEffect({ type: 'reversal', amount: '100', reversesType: 'contribution' }).toString(), '-100');
  assert.equal(cashEffect({ type: 'reversal', amount: '40', reversesType: 'withdrawal' }).toString(), '40');
});

test('cashEffect: reversal without reversesType throws', () => {
  assert.throws(() => cashEffect({ type: 'reversal', amount: '1' }));
});

test('summariseLedger: only confirmed entries count; reversal flips net contributed capital', () => {
  const txs = [
    { type: 'contribution', amount: '1000', status: 'confirmed' },
    { type: 'contribution', amount: '500', status: 'pending' }, // excluded
    { type: 'withdrawal', amount: '200', status: 'confirmed' },
    { type: 'reversal', amount: '200', reversesType: 'withdrawal', status: 'confirmed' },
  ];
  const s = summariseLedger(txs);
  assert.equal(moneyStr(s.netContributedCapital), '1000.00'); // 1000 - 200 + 200 (reversal cancels the withdrawal)
  assert.equal(moneyStr(s.netCash), '1000.00');
});

test('buildReversal: rejects reversing a non-confirmed, already-reversal, or already-reversed entry', () => {
  const meta = { reference: 'TXN-000002', createdBy: 'Finance User', at: new Date().toISOString(), reason: 'typo' };
  assert.throws(() => buildReversal({ id: '1', type: 'contribution', status: 'pending' }, meta), LedgerValidationError);
  assert.throws(() => buildReversal({ id: '1', type: 'reversal', status: 'confirmed' }, meta), LedgerValidationError);
  assert.throws(() => buildReversal({ id: '1', type: 'contribution', status: 'confirmed', reversedById: 'x' }, meta), LedgerValidationError);
});

test('buildReversal: produces a pending entry referencing the original, for a second person to confirm', () => {
  const original = { id: 'orig-1', type: 'contribution', status: 'confirmed', investorId: 'inv-1', portfolioId: 'p-1', amount: '500.00', currency: 'INR' };
  const rev = buildReversal(original, { reference: 'TXN-000002', createdBy: 'Finance User', at: '2026-01-01T00:00:00Z', reason: 'duplicate entry' });
  assert.equal(rev.status, 'pending');
  assert.equal(rev.type, 'reversal');
  assert.equal(rev.reversesId, 'orig-1');
  assert.equal(rev.reversesType, 'contribution');
  assert.equal(rev.amount, '500.00');
});

// --- Trades / positions ------------------------------------------------------

const trade = (over) => ({
  id: 't1', portfolioId: 'p1', symbol: 'INFY', instrumentType: 'equity', side: 'buy',
  tradeAt: '2026-01-01T00:00:00Z', quantity: '10', price: '100', charges: '1', status: 'confirmed', ...over,
});

test('computePositions: weighted average cost on a buy then partial sell', () => {
  const trades = [
    trade({ id: 't1', side: 'buy', quantity: '10', price: '100', charges: '1' }),  // cost = 1001
    trade({ id: 't2', side: 'buy', quantity: '10', price: '120', charges: '1', tradeAt: '2026-01-02T00:00:00Z' }), // cost = 1201, total cost 2202, qty 20, avg 110.1
    trade({ id: 't3', side: 'sell', quantity: '5', price: '150', charges: '1', tradeAt: '2026-01-03T00:00:00Z' }), // proceeds 749, cost relieved 5*110.1=550.5, pnl 198.5
  ];
  const result = computePositions(trades);
  const pos = result.positions.find((p) => p.symbol === 'INFY');
  assert.ok(pos);
  assert.equal(pos.quantity.toString(), '15');
  assert.equal(moneyStr(pos.averageCost), '110.10');
  assert.equal(moneyStr(result.realisedPnl), '198.50');
});

test('computePositions: selling more than held throws TradeValidationError (no short selling)', () => {
  const trades = [trade({ id: 't1', side: 'buy', quantity: '5' }), trade({ id: 't2', side: 'sell', quantity: '10', tradeAt: '2026-01-02T00:00:00Z' })];
  assert.throws(() => computePositions(trades), TradeValidationError);
});

test('computePositions: a confirmed reversal voids both itself and the trade it reverses', () => {
  const trades = [
    trade({ id: 't1', side: 'buy', quantity: '10' }),
    trade({ id: 't2', side: 'sell', quantity: '10', reversesId: 't1', tradeAt: '2026-01-02T00:00:00Z' }),
  ];
  const result = computePositions(trades);
  assert.equal(result.positions.length, 0); // both voided, no net position or P&L
});

test('computePositions: F&O and forex are excluded from cost-basis P&L (unsupported)', () => {
  assert.equal(isCostBasisSupported('equity'), true);
  assert.equal(isCostBasisSupported('fno'), false);
  assert.equal(isCostBasisSupported('forex'), false);
  const result = computePositions([trade({ instrumentType: 'fno' })]);
  assert.equal(result.positions.length, 0);
  assert.equal(result.unsupported.length, 1);
});

test('valuePositions: a symbol with no mark price is left unvalued, never guessed', () => {
  const positions = [{ symbol: 'TCS', instrumentType: 'equity', quantity: trade().quantity, costBasis: '0', averageCost: '0', realisedPnl: '0' }];
  const { unpricedSymbols } = valuePositions(
    computePositions([trade({ symbol: 'TCS' })]).positions,
    {}, // no marks
  );
  assert.deepEqual(unpricedSymbols, ['TCS']);
});

test('checkTrade: rejects zero/negative quantity, price, negative charges, missing symbol, future date', () => {
  const base = { portfolioId: 'p1', symbol: 'INFY', instrumentType: 'equity', side: 'buy', quantity: '1', price: '1', charges: '0', tradeAt: new Date().toISOString() };
  assert.ok(checkTrade({ ...base, quantity: '0' }, []).errors.length > 0);
  assert.ok(checkTrade({ ...base, price: '-1' }, []).errors.length > 0);
  assert.ok(checkTrade({ ...base, charges: '-1' }, []).errors.length > 0);
  assert.ok(checkTrade({ ...base, symbol: '  ' }, []).errors.length > 0);
  assert.ok(checkTrade({ ...base, tradeAt: '2099-01-01T00:00:00Z' }, []).errors.length > 0);
  assert.deepEqual(checkTrade(base, []).errors, []);
});

test('checkTrade: rejects a duplicate, non-rejected trade reference', () => {
  const base = { portfolioId: 'p1', symbol: 'INFY', instrumentType: 'equity', side: 'buy', quantity: '1', price: '1', charges: '0', tradeAt: new Date().toISOString(), reference: 'REF-1' };
  const existing = [{ reference: 'REF-1', status: 'confirmed' }];
  assert.ok(checkTrade(base, existing).errors.some((e) => e.includes('already exists')));
  const existingRejected = [{ reference: 'REF-1', status: 'rejected' }];
  assert.deepEqual(checkTrade(base, existingRejected).errors, []);
});

test('checkTrade: unsupported instrument types are allowed through with a warning, not an error', () => {
  const base = { portfolioId: 'p1', symbol: 'NIFTY-FUT', instrumentType: 'fno', side: 'buy', quantity: '1', price: '1', charges: '0', tradeAt: new Date().toISOString() };
  const result = checkTrade(base, []);
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.length > 0);
});
