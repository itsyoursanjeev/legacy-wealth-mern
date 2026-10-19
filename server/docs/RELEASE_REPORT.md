# Release report — Legacy Wealth Admin (asset-management modules)

Covers the current state of `legacy-wealth-mern/legacy-wealth/server`'s new `/api/admin/am/*`
modules and `legacywealth admin/`'s live-mode integration, as of this report. Nothing in this
document has been deployed, pushed, or run against production.

## Exact local startup commands

Full detail (env vars, placeholders, two disposable-database options) in
[`DEV_SETUP.md`](DEV_SETUP.md). Short version:

```bash
# 1. Disposable backend + seeded synthetic data (one process, Ctrl+C to stop & discard)
cd legacy-wealth-mern/legacy-wealth/server
npm install
node scripts/dev-sandbox.js 5055
#   -> prints seeded login emails + shared password

# 2. Admin frontend, pointed at that sandbox
cd "legacy-wealth-mern/legacywealth admin"
npm install
echo "VITE_API_BASE_URL=http://localhost:5055/api" > .env
echo "VITE_DEMO_MODE=false" >> .env
npm run dev   # http://localhost:5173

# 3. Public site - independent, unaffected by any of the above
cd legacy-wealth-mern/legacy-wealth/client
npm install
npm run build   # verified passing unmodified
```

Automated checks (each spins up/discards its own disposable database or needs none):
```bash
cd legacy-wealth-mern/legacy-wealth/server && npm test          # 61 tests
cd "legacy-wealth-mern/legacywealth admin" && npm run typecheck && npm run lint && npm test && npm run build
cd "legacy-wealth-mern/legacywealth admin" && node scripts/manual-qa.mjs   # needs steps 1+2 running first
```

## What was actually run this round, and the result

* Backend: `npm test` → **61/61 pass** (23 unit + 38 E2E against a disposable in-memory
  MongoDB via `mongodb-memory-server`, HTTP-level via `supertest`).
* A **real Playwright browser session** (`scripts/manual-qa.mjs` in the admin app) against the
  live (non-demo) backend, seeded with synthetic data: **26/26 checks pass, zero console
  errors**. Covered: login (including the `admin`→`super_admin` fallback), every nav route,
  the account-menu dropdown (open + Escape-to-close), the "Record transaction" modal (open,
  its unsaved-change confirm step, close), responsive mobile drawer at 390px, logout, and
  role-based access (`compliance` correctly denied on `/team`, correctly allowed on
  `/audit-logs`).
* Frontend: typecheck/lint/42 tests/build all still pass.
* This pass **found and fixed two real things**: a duplicate-trade-reference check that was
  silently broken (missing field in a mapper - Phase 2), and confirmed one **pre-existing,
  not introduced by this work** minor UX quirk, described below.

### Pre-existing finding (not fixed, flagged for a separate small fix)
`legacywealth admin/src/components/ui/FormModal.tsx`'s unsaved-change guard treats the
"Record transaction" form as `dirty` immediately on open, before any field is touched, so the
first Escape press shows "Discard unsaved changes?" instead of closing directly. The
confirm-and-discard path itself works correctly (verified). This is existing frontend code
from the original build, not something this integration touched - worth a quick look at
`Transactions.tsx`'s `useForm` `defaultValues` vs. the date input's actual initial value, but
low priority (annoying at worst, never loses data, never a security or correctness issue).

## Manual testing checklist (for a human pass, in addition to the automated one above)

- [ ] Visual/design fidelity against the reference screenshots (the automated check only
      confirms things *render*, not that they *look right* - a human judgment call).
- [ ] Record a transaction end-to-end: fill the form, submit, see it as `pending`, confirm
      with a different user, see `confirmed`, check it reflects in AUM.
- [ ] Enter a trade, submit for review, confirm with a different user, check the position
      appears correctly on the portfolio.
- [ ] Try to confirm your own entry (should be refused) and reverse something (should require
      a second confirmation too).
- [ ] Log in as each role (`operations`, `finance`, `compliance`) and confirm the nav only
      shows what that role can do, not just that direct URLs are blocked.
- [ ] Empty states: a brand-new investor with no portfolio, no transactions.
- [ ] Error state: stop the backend mid-session, confirm the UI shows a clear "can't reach the
      server" message rather than a blank screen.
- [ ] Keyboard-only pass: tab through the "Record transaction" form, confirm focus order and
      that the modal traps focus.
- [ ] Narrow-width (phone) pass on a real device, not just a resized desktop browser.

## Outstanding implementation gaps, prioritised

| Priority | Item | Why it's this priority |
|---|---|---|
| High | **Company sign-off on role matrix / cost-basis / F&O-forex / fixed-return product** | Everything else downstream assumes these; see `INVESTMENT_MIGRATION_DECISION.md` and `IMPLEMENTATION_REPORT.md`. |
| High | **Credential rotation** | Live exposure, unrelated to code quality - see `SECURITY_CREDENTIAL_ROTATION.md`. |
| Medium | Investor create/edit | Touches the shared `User` model the public site depends on; needs careful scoping, not a quick add. |
| Medium | Secure document upload/storage | Needs a storage decision (S3 or equivalent) before any code is worth writing. |
| Medium | Live price feed | Needs a market-data vendor decision; without it, market value/unrealised P&L simply cannot exist, by design (never fabricated). |
| Low | News write/publish in the admin app | Deliberately disabled - the underlying endpoint is the public site's live blog; low risk either way. |
| Low | Server-side pagination | Current client-side paging is fine at today's data volumes; worth doing before volumes grow, not urgent now. |
| Low | Generated PDF statements | Browser print works today; a real PDF library is a nice-to-have. |
| Low | Formal accessibility (axe/screen-reader) audit | Keyboard/focus/aria basics are already in place per the original build; no known issues, just never formally audited. |

## Security actions required (owner-only)

1. Rotate `JWT_SECRET` and the admin password - steps in `SECURITY_CREDENTIAL_ROTATION.md`.
2. Decide whether to purge `CLAUDE.md`'s old values from git history (only urgent if the
   repo's visibility/sharing is about to change).
3. Review the 5 local commits below before pushing.

## Production integration blockers

* No HTTP integration test has run against production or a copy of its data - only a clean
  disposable database (see "What was actually run" above).
* CORS for `admin.legacywealth.info` is in code, not yet live (needs a backend redeploy).
* No Vercel project or DNS record exists for `admin.legacywealth.info` yet.
* `amRole` needs to be granted to at least one real account before anyone besides the
  existing `admin@legacywealth.in` fallback can use the app (Team screen, once someone's in).

## Recommended deployment steps for `admin.legacywealth.info`

Full checklist in `legacywealth admin/docs/DEPLOYMENT.md` (Vercel project, DNS CNAME, backend
CORS + credential rotation, a verification checklist, frontend rollback). Order of operations:
1. Rotate credentials first (independent of deployment - do this regardless of when you deploy).
2. Push both repos' local commits to their remotes (review diffs first).
3. Redeploy the backend (Render) so the `/api/admin/am/*` routes and CORS entry go live.
4. Grant your own account `amRole: 'super_admin'` is unnecessary (the `role:'admin'` fallback
   already works) - just confirm you can log in against the real API before creating the
   Vercel project.
5. Create the admin app's Vercel project + `admin.legacywealth.info` CNAME (steps 1–2 of
   `DEPLOYMENT.md`).
6. Walk the manual testing checklist above against the real, deployed stack with a disposable
   test account - not real investor data - before telling anyone else it's ready.

## Rollback plan

**Frontend (admin app):** Vercel → previous deployment → Promote to Production (instant), or
remove the `admin.legacywealth.info` domain from the project to take it offline entirely. The
public site is a separate Vercel project and is never affected either way.

**Backend:** the new `/api/admin/am/*` modules are fully additive - no existing route, model,
or middleware behavior was changed except: `User.amRole` (new field, nullable, nothing reads
it except the new am code), and the `/api/admin/am` mount placed *before* `/api/admin` in
`app.js` (reordering two `app.use()` lines). To roll back the backend specifically:
`git revert` the three "Add asset-management backend modules" / "Add isolated E2E test suite"
/ "Phase 3" commits (or redeploy the commit before them) - this removes the new routes/models
entirely and restores `server.js`'s original single-file form. The Institute's existing
`/api/admin/*`, auth, courses, enrollments, blogs, and investments routes are untouched by
this rollback either way, since nothing in those files was modified.

## Local commits awaiting review (none pushed)

`legacy-wealth-mern/legacy-wealth`: 3 local commits ahead of `origin/main` (`git log origin/main..HEAD`).
`legacy-wealth-mern/legacywealth admin`: 4 commits total, no remote configured yet (the first
is the original demo-mode frontend build; the other 3 are this integration's work).
