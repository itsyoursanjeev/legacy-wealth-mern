# Legacy `Investment` model vs the new am ledger/portfolio model

Read-only analysis. No data was migrated, converted, or modified to produce this report - it
is based on reading `models/Investment.js`, `models/WithdrawalRequest.js`,
`routes/admin.js` (the `/investments/*` section) and `utils/investmentCalc.js`.

## What the legacy `Investment` model actually represents

One document per investor (`user` is `unique: true` - an investor can have at most one). It is
**not a trading account**: there are no instruments, no buy/sell trades, no positions. Instead:

* `monthlyReturnPercent` - a fixed rate agreed with the investor.
* `transactions[]` - a sub-array of `{type: 'deposit'|'withdrawal_credit', amount, date}`.
  `deposit` = money the investor put in; `withdrawal_credit` = money paid out (both the
  return itself and principal withdrawals go through this one type).
* `monthlyReturnLog[]` - a record of each month's return credit, separate from (but also
  mirrored into) `transactions[]` as a `withdrawal_credit`.
* `currentValue` (computed, not stored) = compound growth of **net invested capital** at
  `monthlyReturnPercent` over the months the account has been active
  (`utils/investmentCalc.js:calcInvestment`). This is a **projection formula**, not a
  valuation derived from any market price or trade.
* `kycDocuments[]` - `{label, fileUrl}` only. No status field, so the system cannot say
  whether a document was ever reviewed or approved - this is exactly why the new
  `InvestorDocument` model (which this report does not touch) adds a `status` field.
* Deletable: `DELETE /admin/investments/:id/transaction/:txId` actually removes an entry.
  There is no reversal concept and no audit trail of who changed what.
* `WithdrawalRequest` is a separate, parallel model (investor-initiated withdrawal requests
  with an approve/reject workflow) that is not linked to `Investment.transactions[]` at all
  except by convention (an approved request is expected to later be recorded as a
  `withdrawal_credit`, but nothing enforces that link).

## What the new am model represents

* `Portfolio` - one-to-many per investor (an investor can have several).
* `LedgerEntry` - append-only. `contribution`/`withdrawal`/`fee`/`distribution`/`adjustment`,
  each `pending` until a **different** authorised person `confirm`s it (separation of
  duties). Corrections are posted as a new `reversal` entry, never a delete or edit.
* `Trade` - real buy/sell records against an instrument and quantity, with the same
  maker-checker pattern. Portfolio value and P&L are **derived** from actual trades
  (weighted-average cost) plus, if a live price feed existed, a market price - not from a
  fixed formula.
* `InvestorDocument` - has a real `status` (`pending`/`verified`/`rejected`) and a reviewer.

## Field-by-field correspondence (for a future migration, if ever approved)

| Legacy `Investment` | Nearest am equivalent | Note |
|---|---|---|
| `user` | `Portfolio.investorId` | 1:1 today; am allows many portfolios per investor |
| `transactions[].type: 'deposit'` | `LedgerEntry.type: 'contribution'` | Legacy has no pending/confirmed state or audit trail |
| `transactions[].type: 'withdrawal_credit'` | **Ambiguous** | Legacy conflates a *return payout* and a *principal withdrawal* into one type. These are different `LedgerEntry` types (`distribution` vs `withdrawal`) - a real migration needs a rule (or the original records re-classified by hand) to tell them apart, not a mechanical copy |
| `monthlyReturnPercent` + `currentValue` (computed) | **No equivalent** | There is nothing to map this to. It is a projection formula, not a position or a valuation. Copying it into `Trade`/position data would misrepresent a fixed-return product as if it were market-traded, which is explicitly what this integration was told not to do |
| `kycDocuments[].fileUrl` | `InvestorDocument.fileUrl` | Legacy has no `status` - a migrated record could only ever land as `status: 'pending'` (never `'verified'`), since there is nothing to infer that from honestly |
| `WithdrawalRequest` | **No equivalent yet** | Would need a `LedgerEntry.type: 'withdrawal'` created on approval - not implemented |

## Recommendation

Do not auto-migrate. The `monthlyReturnPercent`/`currentValue` projection has no honest
mapping into a ledger-of-real-cashflows-and-trades model, and the `withdrawal_credit`
ambiguity needs a business decision (or manual review of each record), not a script. If the
owner decides the fixed-return product should be represented in the new system, the
smallest honest step is: create a `Portfolio` per existing active `Investment`, then post one
`LedgerEntry` per legacy `transactions[]` row with `type` chosen by a human (or an explicit,
approved rule) for each `withdrawal_credit`, confirmed by someone who did not create it -
left for a future, separately-reviewed migration script once that rule is approved.
