/**
 * Role / permission matrix for the asset-management ("am") admin modules.
 * 1:1 port of `legacywealth admin/src/domain/permissions.ts` (PROPOSED, pending company
 * sign-off - see docs/IMPLEMENTATION_REPORT.md owner actions). Keep both files in sync.
 *
 * Separation of duties: whoever records a transaction or trade must not be the one who
 * confirms it. Enforced in the route handlers (see routes/am/ledger.js, routes/am/trades.js).
 */

const ROLES = ['super_admin', 'operations', 'finance', 'compliance'];

const ALL_PERMISSIONS = [
  'investors.view', 'investors.edit', 'transactions.view', 'transactions.record', 'transactions.confirm',
  'trades.view', 'trades.enter', 'trades.review', 'news.edit', 'news.publish', 'documents.view',
  'documents.review', 'reports.export', 'users.manage', 'audit.view',
];

const ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  operations: [
    'investors.view', 'investors.edit', 'transactions.view', 'transactions.record', 'trades.view',
    'trades.enter', 'news.edit', 'news.publish', 'documents.view', 'reports.export',
  ],
  finance: [
    'investors.view', 'transactions.view', 'transactions.record', 'transactions.confirm', 'trades.view',
    'trades.enter', 'trades.review', 'documents.view', 'reports.export',
  ],
  compliance: ['investors.view', 'transactions.view', 'trades.view', 'documents.view', 'documents.review', 'audit.view'],
};

function can(role, perm) {
  return !!role && !!ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role].includes(perm);
}

module.exports = { ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS, can };
