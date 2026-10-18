const mongoose = require('mongoose');

// Atomic sequence generator for human-readable references (e.g. TXN-000123).
// `findOneAndUpdate` with `$inc` is a single atomic operation in MongoDB, so concurrent
// requests can never be handed the same number.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

async function nextSeq(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return doc.seq;
}

module.exports = { Counter, nextSeq };
