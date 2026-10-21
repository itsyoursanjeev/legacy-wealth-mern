/**
 * One-time migration: legacy Investment.transactions[] -> Portfolio + LedgerEntry (am system).
 *
 * Default rule (confirmed with the owner, see docs/INVESTMENT_MIGRATION_DECISION.md):
 *   - 'deposit'            -> LedgerEntry type 'contribution'
 *   - 'withdrawal_credit'  -> LedgerEntry type 'distribution' (treated as a return payout, not
 *                             a principal withdrawal - there is no field in the legacy data to
 *                             tell the two apart; this is the agreed default, not a certainty)
 *
 * Migrated entries are inserted already `confirmed` (they are historical facts, not new
 * proposals awaiting maker-checker review) with createdBy/confirmedBy = 'migration' and a note
 * pointing back to the source Investment + sub-transaction id. References use a separate
 * `MIG-NNNNNN` counter so they're visually distinguishable from organically-created `TXN-` entries.
 *
 * Idempotent: re-running is safe. Each LedgerEntry gets `idempotencyKey: migration:<subdoc _id>`,
 * which the existing unique index already enforces; each investor gets at most one
 * 'Primary Portfolio' (looked up before creating, never duplicated).
 *
 * SAFETY: dry-run by default. Nothing is written unless --commit is passed. This intentionally
 * does NOT use utils/dbSafety.js's loopback-only guard - this script's entire purpose is to run
 * against a real database (production or a copy of it), so that guard would be wrong here.
 * Instead: it always prints which host it's about to touch (credentials redacted) and requires
 * the explicit --commit flag for anything beyond printing a plan.
 *
 * Usage:
 *   MONGO_URI=... node scripts/migrate-investments-to-ledger.js            # dry run (default)
 *   MONGO_URI=... node scripts/migrate-investments-to-ledger.js --commit   # actually writes
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Investment = require('../models/Investment');
const Portfolio = require('../models/Portfolio');
const LedgerEntry = require('../models/LedgerEntry');
const { Counter } = require('../models/Counter');
const { moneyStr, D, ZERO } = require('../utils/amMoney');

const COMMIT = process.argv.includes('--commit');

function redactedHost(uri) {
  try { return new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://')).hostname; }
  catch { return '(could not parse host)'; }
}

async function nextMigrationRef() {
  const doc = await Counter.findOneAndUpdate({ _id: 'ledger-migration' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `MIG-${String(doc.seq).padStart(6, '0')}`;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set.');
  console.log(`${COMMIT ? '!! COMMIT MODE - WILL WRITE !!' : 'DRY RUN (no writes - pass --commit to actually migrate)'}`);
  console.log(`Target database host: ${redactedHost(uri)}\n`);

  await mongoose.connect(uri);

  const investments = await Investment.find().populate('user', 'name email isActive');
  let grandContrib = ZERO, grandDist = ZERO, portfoliosCreated = 0, portfoliosExisting = 0, entriesCreated = 0, entriesSkipped = 0;

  for (const inv of investments) {
    if (!inv.user) { console.log(`- SKIP Investment ${inv._id}: no linked user (orphaned record)`); continue; }
    const label = `${inv.user.name} <${inv.user.email}>`;

    let portfolio = await Portfolio.findOne({ investorId: inv.user._id, name: 'Primary Portfolio' });
    if (!portfolio) {
      portfoliosCreated += 1;
      if (COMMIT) {
        portfolio = await Portfolio.create({
          investorId: inv.user._id, name: 'Primary Portfolio', baseCurrency: 'INR',
          status: inv.user.isActive ? 'active' : 'paused', openedAt: inv.startDate,
        });
      }
    } else {
      portfoliosExisting += 1;
    }

    let invContrib = ZERO, invDist = ZERO, invCreated = 0, invSkipped = 0;
    for (const tx of inv.transactions) {
      const idempotencyKey = `migration:${tx._id}`;
      const already = await LedgerEntry.findOne({ idempotencyKey });
      if (already) { invSkipped += 1; entriesSkipped += 1; continue; }

      const type = tx.type === 'deposit' ? 'contribution' : 'distribution'; // the agreed default rule
      const amt = D(tx.amount);
      if (type === 'contribution') invContrib = invContrib.plus(amt); else invDist = invDist.plus(amt);
      invCreated += 1; entriesCreated += 1;

      if (COMMIT) {
        await LedgerEntry.create({
          reference: await nextMigrationRef(),
          investorId: inv.user._id,
          portfolioId: portfolio._id,
          type,
          amount: moneyStr(amt),
          currency: 'INR',
          date: tx.date,
          status: 'confirmed',
          notes: `Migrated from legacy Investment ${inv._id}, transaction ${tx._id}${tx.note ? `: ${tx.note}` : ''}`,
          createdBy: 'migration',
          confirmedBy: 'migration',
          confirmedAt: new Date(),
          idempotencyKey,
        });
      }
    }
    grandContrib = grandContrib.plus(invContrib); grandDist = grandDist.plus(invDist);
    console.log(`- ${label}: ${invCreated} entries to migrate (contrib ${moneyStr(invContrib)}, distribution ${moneyStr(invDist)})${invSkipped ? `, ${invSkipped} already migrated (skipped)` : ''}`);
  }

  console.log(`\nTotals: ${investments.length} legacy investment accounts, ${portfoliosCreated} portfolios to create (${portfoliosExisting} already existed), ${entriesCreated} ledger entries to create (${entriesSkipped} already migrated), contributions ${moneyStr(grandContrib)}, distributions ${moneyStr(grandDist)}.`);
  console.log(COMMIT ? '\nDone - written to the database above.' : '\nThis was a dry run. Re-run with --commit to actually write these records.');

  await mongoose.disconnect();
}

main().catch((e) => { console.error('Migration failed:', e); process.exit(1); });
