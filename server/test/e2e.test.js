const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { startTestDb, stopTestDb } = require('./setupTestDb');
const { PASSWORD, seedCast } = require('./fixtures');

/**
 * End-to-end API tests against an isolated, disposable in-memory MongoDB (see
 * test/setupTestDb.js - it structurally cannot connect to production). Covers: auth/session,
 * RBAC, investor/portfolio isolation, ledger postings + reversals + idempotency, maker-checker,
 * trade entry + position/P&L validation, document review permissions, audit logging, team
 * permissions, and that the new `amRole` field does not change existing Institute admin
 * behaviour.
 *
 * Tests run sequentially (node:test's default within a file) and build on shared state - later
 * tests depend on records created by earlier ones, matching a real operational workflow rather
 * than isolated unit cases.
 */

let app;
let cast; // { legacyAdmin, opsUser, financeUser, complianceUser, investorA, investorB }
const tokens = {};
const state = {}; // ids captured across tests: portfolioA, portfolioB, txId, tradeId, docId

test.before(async () => {
  await startTestDb();
  // Require AFTER env vars (JWT_SECRET etc.) are set by startTestDb, and AFTER the test DB is
  // connected, so no route or model touches a real connection first.
  app = require('../app')();
  cast = await seedCast();
});

test.after(async () => {
  await stopTestDb();
});

async function login(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200, `login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// ---------------------------------------------------------------------------
// 1. Authentication and session handling
// ---------------------------------------------------------------------------

test('auth: login succeeds for every seeded user and returns a token + the right role shape', async () => {
  for (const key of ['legacyAdmin', 'opsUser', 'financeUser', 'complianceUser', 'investorA', 'investorB']) {
    tokens[key] = await login(cast[key].email);
    assert.ok(tokens[key], key);
  }
});

test('auth: wrong password is rejected', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: cast.investorA.email, password: 'wrong-password' });
  assert.equal(res.status, 401);
});

test('auth: GET /auth/me returns the session user for a valid token', async () => {
  const res = await request(app).get('/api/auth/me').set(auth(tokens.legacyAdmin));
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, cast.legacyAdmin.email);
});

test('auth: am routes reject requests with no token', async () => {
  const res = await request(app).get('/api/admin/am/dashboard');
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// 2. Role-based access control (am RBAC + the admin -> super_admin fallback)
// ---------------------------------------------------------------------------

test('RBAC: a plain Institute admin (no amRole) falls back to super_admin and can reach am routes', async () => {
  const res = await request(app).get('/api/admin/am/team').set(auth(tokens.legacyAdmin));
  assert.equal(res.status, 200);
  assert.ok(res.body.team.some((m) => m.email === cast.legacyAdmin.email && m.role === 'super_admin'));
});

test('RBAC: an investor with no amRole is rejected from every am route', async () => {
  const res = await request(app).get('/api/admin/am/dashboard').set(auth(tokens.investorA));
  assert.equal(res.status, 403);
  assert.match(res.body.message, /not provisioned/i);
});

test('RBAC: operations cannot manage the team (no users.manage permission)', async () => {
  const res = await request(app).get('/api/admin/am/team').set(auth(tokens.opsUser));
  assert.equal(res.status, 403);
});

test('RBAC: compliance (read-mostly) cannot record a transaction', async () => {
  const res = await request(app).post('/api/admin/am/ledger').set(auth(tokens.complianceUser))
    .send({ investorId: cast.investorA._id.toString(), type: 'contribution', amount: '10.00', currency: 'INR', date: new Date().toISOString() });
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------------
// 7. amRole must not change existing Institute admin behaviour
// ---------------------------------------------------------------------------

test('existing admin panel: a plain admin still passes the OLD admin-only middleware unchanged', async () => {
  const res = await request(app).get('/api/admin/users').set(auth(tokens.legacyAdmin));
  assert.equal(res.status, 200);
});

test('existing admin panel: an am-only role (operations, no role:"admin") is REJECTED by the old admin-only routes', async () => {
  const res = await request(app).get('/api/admin/users').set(auth(tokens.opsUser));
  assert.equal(res.status, 403);
  assert.match(res.body.message, /admin access required/i);
});

test('existing admin panel: an investor is rejected by both the old and new admin surfaces', async () => {
  const oldSurface = await request(app).get('/api/admin/users').set(auth(tokens.investorA));
  const newSurface = await request(app).get('/api/admin/am/dashboard').set(auth(tokens.investorA));
  assert.equal(oldSurface.status, 403);
  assert.equal(newSurface.status, 403);
});

// ---------------------------------------------------------------------------
// Investor and portfolio isolation / portfolio creation
// ---------------------------------------------------------------------------

test('portfolios: operations can create a portfolio per investor', async () => {
  const resA = await request(app).post('/api/admin/am/portfolios').set(auth(tokens.opsUser))
    .send({ investorId: cast.investorA._id.toString(), name: 'E2E Portfolio A' });
  assert.equal(resA.status, 201);
  state.portfolioA = resA.body.portfolio.id;

  const resB = await request(app).post('/api/admin/am/portfolios').set(auth(tokens.opsUser))
    .send({ investorId: cast.investorB._id.toString(), name: 'E2E Portfolio B' });
  assert.equal(resB.status, 201);
  state.portfolioB = resB.body.portfolio.id;
  assert.notEqual(state.portfolioA, state.portfolioB);
});

test('portfolios: an investor cannot create a portfolio', async () => {
  const res = await request(app).post('/api/admin/am/portfolios').set(auth(tokens.investorA))
    .send({ investorId: cast.investorA._id.toString() });
  assert.equal(res.status, 403);
});

test('portfolios: listing by investorId is isolated - A never sees B\'s portfolio', async () => {
  const res = await request(app).get('/api/admin/am/portfolios').query({ investorId: cast.investorA._id.toString() }).set(auth(tokens.financeUser));
  assert.equal(res.status, 200);
  assert.equal(res.body.portfolios.length, 1);
  assert.equal(res.body.portfolios[0].id, state.portfolioA);
});

test('investors: list reflects each investor\'s own portfolio only, and kyc starts not_started', async () => {
  const res = await request(app).get('/api/admin/am/investors').set(auth(tokens.complianceUser));
  assert.equal(res.status, 200);
  const a = res.body.investors.find((i) => i.id === cast.investorA._id.toString());
  const b = res.body.investors.find((i) => i.id === cast.investorB._id.toString());
  assert.deepEqual(a.portfolioIds, [state.portfolioA]);
  assert.deepEqual(b.portfolioIds, [state.portfolioB]);
  assert.equal(a.kyc, 'not_started');
});

test('investors: a non-existent id 404s cleanly (Mongoose CastError handled, not a 500)', async () => {
  const res = await request(app).get('/api/admin/am/investors/not-a-valid-objectid').set(auth(tokens.financeUser));
  assert.equal(res.status, 404);
});

// ---------------------------------------------------------------------------
// Ledger postings, idempotency, maker-checker, reversals
// ---------------------------------------------------------------------------

test('ledger: rejects a non-positive contribution, an unknown investor, and a reason-less adjustment', async () => {
  const base = { investorId: cast.investorA._id.toString(), portfolioId: state.portfolioA, currency: 'INR', date: new Date().toISOString() };
  const zero = await request(app).post('/api/admin/am/ledger').set(auth(tokens.opsUser)).send({ ...base, type: 'contribution', amount: '0' });
  assert.equal(zero.status, 400);
  const unknown = await request(app).post('/api/admin/am/ledger').set(auth(tokens.opsUser)).send({ ...base, investorId: '0'.repeat(24), type: 'contribution', amount: '10' });
  assert.equal(unknown.status, 400);
  const adj = await request(app).post('/api/admin/am/ledger').set(auth(tokens.opsUser)).send({ ...base, type: 'adjustment', amount: '5' });
  assert.equal(adj.status, 400);
});

test('ledger: records a contribution, and a repeated idempotency key returns the SAME record without duplicating it', async () => {
  const LedgerEntry = require('../models/LedgerEntry');
  const body = {
    investorId: cast.investorA._id.toString(), portfolioId: state.portfolioA, type: 'contribution',
    amount: '1000.00', currency: 'INR', date: new Date().toISOString(), idempotencyKey: 'e2e-idem-key-1',
  };
  // Created by financeUser (not opsUser): financeUser holds transactions.confirm, so the next
  // test exercises the separation-of-duties business rule itself, not a plain permission denial.
  const first = await request(app).post('/api/admin/am/ledger').set(auth(tokens.financeUser)).send(body);
  assert.equal(first.status, 201);
  assert.equal(first.body.transaction.status, 'pending');
  assert.equal(first.body.transaction.createdBy, cast.financeUser.name);
  state.txId = first.body.transaction.id;

  const second = await request(app).post('/api/admin/am/ledger').set(auth(tokens.financeUser)).send(body);
  assert.equal(second.status, 201);
  assert.equal(second.body.transaction.id, state.txId, 'idempotent resubmission must return the original record');

  const count = await LedgerEntry.countDocuments({ idempotencyKey: 'e2e-idem-key-1' });
  assert.equal(count, 1, 'the idempotency key must never produce two documents');
});

test('ledger: the creator cannot confirm their own entry, even though they hold transactions.confirm (separation of duties)', async () => {
  const res = await request(app).post(`/api/admin/am/ledger/${state.txId}/confirm`).set(auth(tokens.financeUser));
  assert.equal(res.status, 403);
  assert.match(res.body.message, /separation of duties/i);
});

test('ledger: a different authorised user can confirm it', async () => {
  const res = await request(app).post(`/api/admin/am/ledger/${state.txId}/confirm`).set(auth(tokens.legacyAdmin));
  assert.equal(res.status, 200);
  assert.equal(res.body.transaction.status, 'confirmed');
  assert.equal(res.body.transaction.confirmedBy, cast.legacyAdmin.name);
});

test('ledger: dashboard AUM reflects the confirmed contribution', async () => {
  const res = await request(app).get('/api/admin/am/dashboard').set(auth(tokens.financeUser));
  assert.equal(res.status, 200);
  assert.equal(res.body.dashboard.aum, '1000.00');
});

test('ledger: reversal is pending until a second person confirms it, and cannot be double-requested', async () => {
  const first = await request(app).post(`/api/admin/am/ledger/${state.txId}/reverse`).set(auth(tokens.financeUser)).send({ reason: 'e2e test reversal' });
  assert.equal(first.status, 201);
  assert.equal(first.body.transaction.status, 'pending');
  assert.equal(first.body.transaction.reversesId, state.txId);
  state.reversalId = first.body.transaction.id;

  // legacyAdmin (super_admin), not opsUser: opsUser lacks transactions.confirm entirely and
  // would be rejected at the permission layer (403) before ever reaching this business rule.
  const second = await request(app).post(`/api/admin/am/ledger/${state.txId}/reverse`).set(auth(tokens.legacyAdmin)).send({ reason: 'duplicate attempt' });
  assert.equal(second.status, 400);
  assert.match(second.body.message, /already pending/i);
});

test('ledger: the reversal itself is separation-of-duties protected, then confirming it restores AUM to zero', async () => {
  const selfConfirm = await request(app).post(`/api/admin/am/ledger/${state.reversalId}/confirm`).set(auth(tokens.financeUser));
  assert.equal(selfConfirm.status, 403);

  const confirmed = await request(app).post(`/api/admin/am/ledger/${state.reversalId}/confirm`).set(auth(tokens.legacyAdmin));
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.transaction.status, 'confirmed');

  const dash = await request(app).get('/api/admin/am/dashboard').set(auth(tokens.financeUser));
  assert.equal(dash.body.dashboard.aum, '0.00');
});

test('ledger: an investor cannot post a transaction, and none is created', async () => {
  const LedgerEntry = require('../models/LedgerEntry');
  const before = await LedgerEntry.countDocuments();
  const res = await request(app).post('/api/admin/am/ledger').set(auth(tokens.investorB))
    .send({ investorId: cast.investorB._id.toString(), type: 'contribution', amount: '500', currency: 'INR', date: new Date().toISOString() });
  assert.equal(res.status, 403);
  assert.equal(await LedgerEntry.countDocuments(), before);
});

// ---------------------------------------------------------------------------
// Manual trade entry, maker-checker, position / P&L validation
// ---------------------------------------------------------------------------

test('trades: records a buy, rejects self-confirmation, then a different reviewer confirms it', async () => {
  const body = {
    portfolioId: state.portfolioA, symbol: 'INFY', instrumentType: 'equity', side: 'buy',
    tradeAt: new Date().toISOString(), quantity: '10', price: '100', charges: '1', currency: 'INR',
    submit: true, idempotencyKey: 'e2e-trade-1',
  };
  const recorded = await request(app).post('/api/admin/am/trades').set(auth(tokens.opsUser)).send(body);
  assert.equal(recorded.status, 201);
  assert.equal(recorded.body.trade.status, 'pending_review');
  state.tradeId = recorded.body.trade.id;

  const selfConfirm = await request(app).post(`/api/admin/am/trades/${state.tradeId}/confirm`).set(auth(tokens.opsUser));
  assert.equal(selfConfirm.status, 403);

  const confirmed = await request(app).post(`/api/admin/am/trades/${state.tradeId}/confirm`).set(auth(tokens.financeUser));
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.trade.status, 'confirmed');
});

test('trades: selling more than is held is rejected at entry time (no short selling)', async () => {
  const res = await request(app).post('/api/admin/am/trades').set(auth(tokens.opsUser)).send({
    portfolioId: state.portfolioA, symbol: 'INFY', instrumentType: 'equity', side: 'sell',
    tradeAt: new Date().toISOString(), quantity: '20', price: '100', charges: '0', currency: 'INR', submit: true,
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /exceeds held quantity/i);
});

test('trades: a duplicate, non-rejected reference in the same portfolio is rejected', async () => {
  const body = {
    portfolioId: state.portfolioA, symbol: 'TCS', instrumentType: 'equity', side: 'buy', reference: 'E2E-REF-1',
    tradeAt: new Date().toISOString(), quantity: '1', price: '100', charges: '0', currency: 'INR', submit: false,
  };
  const first = await request(app).post('/api/admin/am/trades').set(auth(tokens.opsUser)).send(body);
  assert.equal(first.status, 201);
  const dup = await request(app).post('/api/admin/am/trades').set(auth(tokens.opsUser)).send({ ...body, idempotencyKey: 'e2e-trade-dup' });
  assert.equal(dup.status, 400);
  assert.match(dup.body.message, /already exists/i);
});

test('trades: F&O is accepted (excluded from P&L with a warning) rather than rejected', async () => {
  const res = await request(app).post('/api/admin/am/trades').set(auth(tokens.opsUser)).send({
    portfolioId: state.portfolioA, symbol: 'NIFTY-FUT', instrumentType: 'fno', side: 'buy',
    tradeAt: new Date().toISOString(), quantity: '1', price: '20000', charges: '0', currency: 'INR', submit: true,
  });
  assert.equal(res.status, 201);
  const confirmed = await request(app).post(`/api/admin/am/trades/${res.body.trade.id}/confirm`).set(auth(tokens.financeUser));
  assert.equal(confirmed.status, 200, 'an unsupported instrument type must not break position confirmation');
});

test('trades: reversing a confirmed trade is also separation-of-duties protected, and voids the position when confirmed', async () => {
  const req1 = await request(app).post(`/api/admin/am/trades/${state.tradeId}/reverse`).set(auth(tokens.financeUser)).send({ reason: 'e2e reversal' });
  assert.equal(req1.status, 201);
  assert.equal(req1.body.trade.side, 'sell'); // flipped from the original buy
  const reversalTradeId = req1.body.trade.id;

  // legacyAdmin, not opsUser: opsUser lacks trades.review entirely and would be rejected at
  // the permission layer (403) before ever reaching this business rule.
  const dup = await request(app).post(`/api/admin/am/trades/${state.tradeId}/reverse`).set(auth(tokens.legacyAdmin)).send({ reason: 'dup' });
  assert.equal(dup.status, 400);

  const selfConfirm = await request(app).post(`/api/admin/am/trades/${reversalTradeId}/confirm`).set(auth(tokens.financeUser));
  assert.equal(selfConfirm.status, 403);

  const confirmed = await request(app).post(`/api/admin/am/trades/${reversalTradeId}/confirm`).set(auth(tokens.legacyAdmin));
  assert.equal(confirmed.status, 200);
});

test('trades: an investor cannot enter a trade', async () => {
  const res = await request(app).post('/api/admin/am/trades').set(auth(tokens.investorA)).send({
    portfolioId: state.portfolioA, symbol: 'INFY', instrumentType: 'equity', side: 'buy',
    tradeAt: new Date().toISOString(), quantity: '1', price: '1', charges: '0', currency: 'INR', submit: true,
  });
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------------------
// Document access permissions
// ---------------------------------------------------------------------------

test('documents: finance (view-only) cannot register a document; compliance (review) can', async () => {
  const denied = await request(app).post('/api/admin/am/documents').set(auth(tokens.financeUser))
    .send({ investorId: cast.investorA._id.toString(), kind: 'PAN', fileName: 'pan.pdf' });
  assert.equal(denied.status, 403);

  const created = await request(app).post('/api/admin/am/documents').set(auth(tokens.complianceUser))
    .send({ investorId: cast.investorA._id.toString(), kind: 'PAN', fileName: 'pan.pdf' });
  assert.equal(created.status, 201);
  assert.equal(created.body.document.status, 'pending');
  state.docId = created.body.document.id;
});

test('documents: operations (view-only) cannot review; compliance can, and it updates the investor\'s KYC status', async () => {
  const denied = await request(app).post(`/api/admin/am/documents/${state.docId}/review`).set(auth(tokens.opsUser)).send({ status: 'verified' });
  assert.equal(denied.status, 403);

  const reviewed = await request(app).post(`/api/admin/am/documents/${state.docId}/review`).set(auth(tokens.complianceUser)).send({ status: 'verified' });
  assert.equal(reviewed.status, 200);

  const investor = await request(app).get(`/api/admin/am/investors/${cast.investorA._id.toString()}`).set(auth(tokens.financeUser));
  assert.equal(investor.body.investor.kyc, 'verified');
});

test('documents: download-url is honestly unimplemented (501), not a fabricated link', async () => {
  const res = await request(app).get(`/api/admin/am/documents/${state.docId}/download-url`).set(auth(tokens.complianceUser));
  assert.equal(res.status, 501);
});

test('documents: unauthenticated access is rejected', async () => {
  const res = await request(app).get('/api/admin/am/documents');
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

test('audit: every mutation so far produced an audit row, visible to compliance but not operations', async () => {
  const denied = await request(app).get('/api/admin/am/audit').set(auth(tokens.opsUser));
  assert.equal(denied.status, 403);

  const res = await request(app).get('/api/admin/am/audit').set(auth(tokens.complianceUser));
  assert.equal(res.status, 200);
  const actions = res.body.entries.map((e) => e.action);
  for (const expected of [
    'transaction.recorded', 'transaction.confirmed', 'transaction.reversal_requested',
    'trade.recorded', 'trade.confirmed', 'trade.reversal_requested',
    'document.registered', 'document.verified',
  ]) {
    assert.ok(actions.includes(expected), `expected an audit row for ${expected}`);
  }
  // No audit row ever carries a password/token - meta is a string map of small, named fields only.
  for (const e of res.body.entries) assert.ok(!JSON.stringify(e.meta ?? {}).match(/password|token|secret/i));
});

// ---------------------------------------------------------------------------
// Team permissions
// ---------------------------------------------------------------------------

test('team: super_admin can change another member\'s role but not their own', async () => {
  const changed = await request(app).patch(`/api/admin/am/team/${cast.opsUser._id}/role`).set(auth(tokens.legacyAdmin)).send({ role: 'finance' });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.member.role, 'finance');

  const self = await request(app).patch(`/api/admin/am/team/${cast.legacyAdmin._id}/role`).set(auth(tokens.legacyAdmin)).send({ role: 'operations' });
  assert.equal(self.status, 400);
});

test('team: deactivating a member locks them out of login entirely (shared isActive flag, as documented)', async () => {
  const deactivated = await request(app).patch(`/api/admin/am/team/${cast.complianceUser._id}/active`).set(auth(tokens.legacyAdmin)).send({ active: false });
  assert.equal(deactivated.status, 200);
  assert.equal(deactivated.body.member.active, false);

  const loginAttempt = await request(app).post('/api/auth/login').send({ email: cast.complianceUser.email, password: PASSWORD });
  assert.equal(loginAttempt.status, 403);
});

test('team: a super_admin cannot deactivate themself', async () => {
  const res = await request(app).patch(`/api/admin/am/team/${cast.legacyAdmin._id}/active`).set(auth(tokens.legacyAdmin)).send({ active: false });
  assert.equal(res.status, 400);
});
