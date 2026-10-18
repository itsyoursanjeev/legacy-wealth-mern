const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const { ROLES } = require('../../config/amPermissions');
const { requireAmPermission, effectiveAmRole } = require('../../middleware/amAuth');
const { writeAudit } = require('../../utils/amAudit');

const router = express.Router();

// "Team" = staff who have (or could have) am access: an explicit amRole, or the existing
// Institute `admin` role (which falls back to super_admin - see middleware/amAuth.js).
// There is no invite/create-team-member endpoint: a person must already have logged in to
// the public site (or been created by an Institute admin) before they can be granted a role
// here. `active` reuses the same `User.isActive` flag the Institute admin panel uses, so
// deactivating someone here also locks them out of the public site - it is one account.
router.get('/', requireAmPermission('users.manage'), asyncHandler(async (req, res) => {
  const users = await User.find({ $or: [{ amRole: { $ne: null } }, { role: 'admin' }] }).sort({ name: 1 });
  const team = users.map((u) => ({
    id: u._id.toString(), name: u.name, email: u.email, role: effectiveAmRole(u), active: u.isActive,
  }));
  res.json({ success: true, team });
}));

router.patch('/:id/role', requireAmPermission('users.manage'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) { res.status(400); throw new Error(`role must be one of ${ROLES.join(', ')}`); }
  if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error('You cannot change your own role'); }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  const from = effectiveAmRole(user);
  user.amRole = role;
  await user.save();
  await writeAudit(req, 'user.role_changed', 'user', user._id.toString(), { from: from || '(none)', to: role });
  res.json({ success: true, member: { id: user._id.toString(), name: user.name, email: user.email, role: effectiveAmRole(user), active: user.isActive } });
}));

router.patch('/:id/active', requireAmPermission('users.manage'), asyncHandler(async (req, res) => {
  const { active } = req.body;
  if (typeof active !== 'boolean') { res.status(400); throw new Error('active must be true or false'); }
  if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error('You cannot deactivate yourself'); }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = active;
  await user.save();
  await writeAudit(req, active ? 'user.activated' : 'user.deactivated', 'user', user._id.toString());
  res.json({ success: true, member: { id: user._id.toString(), name: user.name, email: user.email, role: effectiveAmRole(user), active: user.isActive } });
}));

module.exports = router;
