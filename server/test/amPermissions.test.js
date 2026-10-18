const test = require('node:test');
const assert = require('node:assert/strict');
const { ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS, can } = require('../config/amPermissions');

test('super_admin has every permission', () => {
  for (const p of ALL_PERMISSIONS) assert.equal(can('super_admin', p), true, p);
});

test('compliance is read-mostly: no record/confirm/enter/review/publish/manage permissions', () => {
  for (const p of ['transactions.record', 'transactions.confirm', 'trades.enter', 'trades.review', 'news.edit', 'news.publish', 'users.manage', 'investors.edit']) {
    assert.equal(can('compliance', p), false, p);
  }
  assert.equal(can('compliance', 'audit.view'), true);
  assert.equal(can('compliance', 'documents.review'), true);
});

test('operations can enter trades/transactions but not confirm/review them (separation of duties)', () => {
  assert.equal(can('operations', 'transactions.record'), true);
  assert.equal(can('operations', 'transactions.confirm'), false);
  assert.equal(can('operations', 'trades.enter'), true);
  assert.equal(can('operations', 'trades.review'), false);
});

test('finance can confirm transactions and review trades', () => {
  assert.equal(can('finance', 'transactions.confirm'), true);
  assert.equal(can('finance', 'trades.review'), true);
  assert.equal(can('finance', 'users.manage'), false);
});

test('can() is false for an unknown or missing role', () => {
  assert.equal(can(undefined, 'audit.view'), false);
  assert.equal(can('not_a_role', 'audit.view'), false);
});

test('every role in ROLE_PERMISSIONS is declared in ROLES, and every permission is in ALL_PERMISSIONS', () => {
  for (const role of Object.keys(ROLE_PERMISSIONS)) assert.ok(ROLES.includes(role), role);
  for (const role of ROLES) {
    for (const p of ROLE_PERMISSIONS[role]) assert.ok(ALL_PERMISSIONS.includes(p), `${role}: ${p}`);
  }
});
