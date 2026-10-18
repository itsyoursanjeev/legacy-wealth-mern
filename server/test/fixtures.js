const User = require('../models/User');

/**
 * Deterministic, clearly-fake synthetic data for integration tests. Every email uses the
 * `.test` TLD (IANA-reserved for testing, RFC 2606) and an `e2e-` prefix so it can never
 * collide with, or be mistaken for, a real investor or staff record.
 */
const PASSWORD = 'E2eTestPass123!';

async function makeUser({ name, email, role = 'user', amRole = null, isActive = true }) {
  return User.create({ name, email, password: PASSWORD, role, amRole, isActive });
}

async function seedCast() {
  const legacyAdmin = await makeUser({ name: 'E2E Legacy Admin', email: 'e2e-legacy-admin@example.test', role: 'admin' });
  const opsUser = await makeUser({ name: 'E2E Ops User', email: 'e2e-ops@example.test', amRole: 'operations' });
  const financeUser = await makeUser({ name: 'E2E Finance User', email: 'e2e-finance@example.test', amRole: 'finance' });
  const complianceUser = await makeUser({ name: 'E2E Compliance User', email: 'e2e-compliance@example.test', amRole: 'compliance' });
  const investorA = await makeUser({ name: 'E2E Investor Alpha', email: 'e2e-investor-a@example.test' });
  const investorB = await makeUser({ name: 'E2E Investor Beta', email: 'e2e-investor-b@example.test' });
  return { legacyAdmin, opsUser, financeUser, complianceUser, investorA, investorB };
}

module.exports = { PASSWORD, makeUser, seedCast };
