const { can } = require('../config/amPermissions');

/**
 * Effective asset-management role for a logged-in user.
 * - Explicit `user.amRole` always wins.
 * - Otherwise, an existing Institute `admin` is treated as `super_admin` for backward
 *   compatibility (documented in docs/IMPLEMENTATION_REPORT.md: "Admin app maps admin -> Super
 *   Admin"). Everyone else (students, staff with no am role) has no access.
 * This mirrors the client-side fallback in `legacywealth admin/src/api/liveRepo.ts` but is the
 * source of truth: the server must not trust a role the client claims.
 */
function effectiveAmRole(user) {
  if (!user) return null;
  if (user.amRole) return user.amRole;
  if (user.role === 'admin') return 'super_admin';
  return null;
}

/** Requires the request to come from `protect` first (req.user set). 403s with no am role at all. */
const requireAmAccess = (req, res, next) => {
  const role = effectiveAmRole(req.user);
  if (!role) {
    res.status(403);
    throw new Error('This account is not provisioned for Asset Management admin access.');
  }
  req.amRole = role;
  next();
};

/** Requires `requireAmAccess` to have run first. */
const requireAmPermission = (perm) => (req, res, next) => {
  if (!req.amRole) {
    res.status(403);
    throw new Error('This account is not provisioned for Asset Management admin access.');
  }
  if (!can(req.amRole, perm)) {
    res.status(403);
    throw new Error('You do not have permission to do that.');
  }
  next();
};

module.exports = { effectiveAmRole, requireAmAccess, requireAmPermission };
