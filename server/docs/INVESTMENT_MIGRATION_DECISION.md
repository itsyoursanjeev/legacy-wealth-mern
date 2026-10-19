# Should the old investment records move into the new system? — decision needed

Short version: **not yet, and not automatically.** This explains why, in plain terms, and
what would need to be true before it's safe to do. For the full field-level detail, see
[`INVESTMENT_LEDGER_MAPPING.md`](INVESTMENT_LEDGER_MAPPING.md). No production records have
been touched, read-modified, or migrated to produce either document.

## What can be copied over mechanically

Every **deposit** a legacy investor made (`Investment.transactions[].type: 'deposit'`) maps
cleanly to one `contribution` entry in the new ledger. There's no ambiguity here — money came
in, that's what a contribution is.

## What needs a human to look at it first

Every **payout** (`type: 'withdrawal_credit'`) does not map cleanly, because the old system
uses one label for two different things:
- the investor's **monthly return** being credited (this is `distribution` in the new system)
- the investor **withdrawing their own principal** (this is `withdrawal` in the new system)

The old data doesn't record which one happened — both just say `withdrawal_credit`. A script
cannot tell them apart reliably; it would have to guess, and a guess baked into a financial
ledger is exactly the kind of mistake that's expensive to find later. Someone who knows the
account history (or a clear rule, e.g. "anything that also has a matching row in
`monthlyReturnLog` is a distribution, everything else is a withdrawal") needs to classify
each one before it's posted.

## Why the "monthly return" itself isn't a position that can be migrated

The legacy system doesn't track what was actually bought or sold. It tracks one number
(`monthlyReturnPercent`) and a formula that compounds it every month. There is no trade, no
instrument, no market price behind that number — it's a promise of a fixed rate, not a record
of what the money is doing. The new system's portfolios and P&L are the opposite: they only
show what a real trade actually produced. There is nothing to convert, because the two
represent fundamentally different things — one is a fixed-return liability, the other is a
market position. Writing fake trades to make the old number "fit" the new model would mean
the ledger shows something that didn't happen, which is the one thing it exists to prevent.

## What would need to be true before approving a migration

1. **A business decision on what `withdrawal_credit` actually was**, per record or per rule —
   not something inferred from the data as-is.
2. **A decision on whether the fixed-return product continues at all.** If it's being wound
   down, migrating its history into a system built for a different kind of product may not be
   worth doing. If it continues, it may be better represented as its own thing rather than
   force-fit into the trading ledger.
3. **Someone who isn't the person running the migration reviews and confirms the classified
   data** before it's posted — the same separation-of-duties rule the new ledger already
   enforces for every other entry.
4. **A dry run against a copy of the data** (not production) so the classification rule can be
   checked against real numbers before anything touches the live database.

Until those four are in place, the right state is the current one: old product, old panel,
untouched; new ledger, clean slate, used only for genuinely new activity.
