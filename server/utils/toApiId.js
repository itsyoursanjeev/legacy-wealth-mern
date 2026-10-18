/**
 * Shared Mongoose `toJSON` transform for the am models: turns `_id` into a string `id`
 * (matching the frontend's `id`-keyed domain types) and strips Mongo-internal fields.
 */
function idTransform(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

module.exports = { idTransform };
