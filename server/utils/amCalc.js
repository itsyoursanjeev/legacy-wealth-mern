const { D, ZERO, sum } = require('./amMoney');

/**
 * Ledger + trade domain math for the asset-management admin ("am") modules.
 * This is a deliberate 1:1 port of `legacywealth admin/src/domain/calc.ts` so the server
 * enforces exactly the rules the frontend (and its demo backend) already assume. Keep both
 * files in sync if the policy changes.
 */

/* ------------------------------------------------------------------ *
 * LEDGER
 * Only `confirmed` entries count. A reversal is a separate confirmed
 * entry that posts the opposite effect; the original is never edited.
 * ------------------------------------------------------------------ */

/** Signed effect of an entry on portfolio cash (+ increases cash). */
function cashEffect(tx) {
  const a = D(tx.amount);
  const base = (t) => {
    switch (t) {
      case 'contribution': return a;
      case 'adjustment': return a; // signed
      case 'withdrawal':
      case 'fee':
      case 'distribution': return a.negated();
      default: throw new Error(`Unknown ledger entry type: ${t}`);
    }
  };
  if (tx.type === 'reversal') {
    if (!tx.reversesType) throw new Error('Reversal must reference the type of the entry it reverses');
    return base(tx.reversesType).negated();
  }
  return base(tx.type);
}

function summariseLedger(txs) {
  let contributions = ZERO, withdrawals = ZERO, fees = ZERO, distributions = ZERO, adjustments = ZERO;
  let capital = ZERO;
  for (const t of txs) {
    if (t.status !== 'confirmed') continue;
    const a = D(t.amount);
    const eff = t.type === 'reversal' ? t.reversesType : t.type;
    const sign = t.type === 'reversal' ? -1 : 1;
    switch (eff) {
      case 'contribution': contributions = contributions.plus(a.times(sign)); capital = capital.plus(a.times(sign)); break;
      case 'withdrawal': withdrawals = withdrawals.plus(a.times(sign)); capital = capital.minus(a.times(sign)); break;
      case 'fee': fees = fees.plus(a.times(sign)); break;
      case 'distribution': distributions = distributions.plus(a.times(sign)); break;
      case 'adjustment': adjustments = adjustments.plus(a.times(sign)); break;
      default: break;
    }
  }
  const netCash = sum(txs.filter((t) => t.status === 'confirmed').map(cashEffect));
  return { contributions, withdrawals, fees, distributions, adjustments, netContributedCapital: capital, netCash };
}

class LedgerValidationError extends Error {}

/** Builds (does not persist) the entry that cancels `original`. */
function buildReversal(original, meta) {
  if (original.type === 'reversal') throw new LedgerValidationError('A reversal cannot itself be reversed; post a new entry instead');
  if (original.status !== 'confirmed') throw new LedgerValidationError('Only confirmed entries can be reversed');
  if (original.reversedById) throw new LedgerValidationError('This entry has already been reversed');
  return {
    reference: meta.reference,
    investorId: original.investorId,
    portfolioId: original.portfolioId,
    type: 'reversal',
    amount: original.amount,
    currency: original.currency,
    date: meta.at,
    status: 'pending', // a second person must confirm
    notes: meta.reason,
    reversesId: original.id,
    reversesType: original.type,
    createdBy: meta.createdBy,
  };
}

/* ------------------------------------------------------------------ *
 * TRADES - positions and P&L
 *
 * Cost-basis method: WEIGHTED AVERAGE COST, long-only.
 *   - Buy:  cost added = qty * price + charges  (charges are capitalised)
 *   - Sell: proceeds = qty * price - charges; cost relieved = qty * avgCost
 *           realised P&L = proceeds - cost relieved
 * Suitable for cash-market equity / ETF / fund / bond / spot commodity / spot crypto.
 * NOT applied to F&O or forex (short positions, margin, expiry, FX translation): those
 * are reported as `unsupported` until the company confirms an accounting policy.
 * Only `confirmed` trades are used. A confirmed reversal voids both itself and its target.
 * ------------------------------------------------------------------ */

const COST_BASIS_METHOD = 'Weighted average cost (long-only); charges capitalised on buys and deducted from sale proceeds.';

const SUPPORTED = new Set(['equity', 'etf', 'mutual_fund', 'bond', 'commodity', 'crypto']);
const isCostBasisSupported = (t) => SUPPORTED.has(t);

class TradeValidationError extends Error {}

function activeTrades(trades) {
  const voided = new Set();
  for (const t of trades) {
    if (t.status === 'confirmed' && t.reversesId) {
      voided.add(t.id);
      voided.add(t.reversesId);
    }
  }
  return trades
    .filter((t) => t.status === 'confirmed' && !voided.has(t.id))
    .sort((a, b) => a.tradeAt.localeCompare(b.tradeAt) || a.id.localeCompare(b.id));
}

function computePositions(trades) {
  const book = new Map();
  const unsupported = [];
  let realised = ZERO;
  let tradeCash = ZERO;

  for (const t of activeTrades(trades)) {
    if (!isCostBasisSupported(t.instrumentType)) {
      unsupported.push(t);
      continue;
    }
    const qty = D(t.quantity);
    const px = D(t.price);
    const fee = D(t.charges);
    const key = t.symbol.toUpperCase();
    const pos = book.get(key) ?? {
      symbol: key, instrumentType: t.instrumentType, quantity: ZERO, costBasis: ZERO, averageCost: ZERO, realisedPnl: ZERO,
    };

    if (t.side === 'buy') {
      pos.quantity = pos.quantity.plus(qty);
      pos.costBasis = pos.costBasis.plus(qty.times(px)).plus(fee);
      tradeCash = tradeCash.minus(qty.times(px)).minus(fee);
    } else {
      if (qty.gt(pos.quantity)) {
        throw new TradeValidationError(`Sell of ${qty.toString()} ${key} exceeds held quantity ${pos.quantity.toString()} (short selling is not supported)`);
      }
      const costRelieved = pos.quantity.isZero() ? ZERO : pos.costBasis.times(qty).div(pos.quantity);
      const proceeds = qty.times(px).minus(fee);
      const pnl = proceeds.minus(costRelieved);
      pos.realisedPnl = pos.realisedPnl.plus(pnl);
      realised = realised.plus(pnl);
      pos.quantity = pos.quantity.minus(qty);
      pos.costBasis = pos.costBasis.minus(costRelieved);
      tradeCash = tradeCash.plus(proceeds);
    }
    pos.averageCost = pos.quantity.isZero() ? ZERO : pos.costBasis.div(pos.quantity);
    book.set(key, pos);
  }

  return {
    positions: [...book.values()].filter((p) => !p.quantity.isZero() || !p.realisedPnl.isZero()).sort((a, b) => a.symbol.localeCompare(b.symbol)),
    realisedPnl: realised,
    tradeCash,
    unsupported,
  };
}

function valuePositions(positions, marks) {
  const valued = positions.map((p) => {
    const m = marks[p.symbol];
    if (!m || p.quantity.isZero()) return { ...p };
    const price = D(m.price);
    const marketValue = p.quantity.times(price);
    return { ...p, mark: { price, asOf: m.asOf, source: m.source }, marketValue, unrealisedPnl: marketValue.minus(p.costBasis) };
  });
  const open = valued.filter((p) => !p.quantity.isZero());
  return {
    positions: valued,
    unrealisedPnl: sum(valued.map((p) => p.unrealisedPnl ?? ZERO)),
    marketValue: sum(valued.map((p) => p.marketValue ?? ZERO)),
    unpricedSymbols: open.filter((p) => !p.mark).map((p) => p.symbol),
  };
}

function safeDec(v) {
  try { return D(v); } catch { return null; }
}

/** Pre-save consistency checks against the portfolio's existing confirmed trades and cash. */
function checkTrade(input, existing, availableCash) {
  const errors = [];
  const warnings = [];
  const qty = safeDec(input.quantity);
  const px = safeDec(input.price);
  const fee = safeDec(input.charges || '0');

  if (!qty || qty.lte(0)) errors.push('Quantity must be greater than zero');
  if (!px || px.lte(0)) errors.push('Execution price must be greater than zero');
  if (!fee || fee.lt(0)) errors.push('Charges cannot be negative');
  if (!input.symbol || !input.symbol.trim()) errors.push('Instrument is required');
  if (new Date(input.tradeAt).getTime() > Date.now() + 5 * 60_000) errors.push('Trade date cannot be in the future');

  const ref = input.reference?.trim();
  if (ref && existing.some((t) => t.reference?.toLowerCase() === ref.toLowerCase() && t.status !== 'rejected')) {
    errors.push(`Trade reference "${ref}" already exists`);
  }
  if (errors.length) return { errors, warnings };

  if (!isCostBasisSupported(input.instrumentType)) {
    warnings.push('No cost-basis policy is configured for this instrument type; it will be recorded but excluded from P&L until accounting confirms treatment.');
    return { errors, warnings };
  }

  const hypothetical = [...existing.filter((t) => t.portfolioId === input.portfolioId), {
    id: '~new', portfolioId: input.portfolioId, symbol: input.symbol, instrumentType: input.instrumentType, side: input.side,
    tradeAt: input.tradeAt, quantity: input.quantity, price: input.price, charges: input.charges || '0', currency: 'INR',
    status: 'confirmed', source: 'manual', createdBy: '',
  }];
  try {
    computePositions(hypothetical);
  } catch (e) {
    if (e instanceof TradeValidationError) errors.push(e.message);
    else throw e;
  }
  if (input.side === 'buy' && availableCash && qty && px && fee) {
    const cost = qty.times(px).plus(fee);
    if (cost.gt(availableCash)) warnings.push('Cost exceeds the portfolio cash currently recorded in the ledger. Check that contributions are up to date.');
  }
  return { errors, warnings };
}

module.exports = {
  cashEffect, summariseLedger, buildReversal, LedgerValidationError,
  COST_BASIS_METHOD, isCostBasisSupported, TradeValidationError, computePositions, valuePositions, checkTrade,
};
