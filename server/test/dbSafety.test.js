const test = require('node:test');
const assert = require('node:assert/strict');
const { isLoopbackMongoUri, assertSafeTestConfig } = require('../utils/dbSafety');

test('isLoopbackMongoUri accepts 127.0.0.1, localhost and ::1; rejects everything else', () => {
  assert.equal(isLoopbackMongoUri('mongodb://127.0.0.1:27017/test'), true);
  assert.equal(isLoopbackMongoUri('mongodb://localhost:27017/test'), true);
  assert.equal(isLoopbackMongoUri('mongodb://[::1]:27017/test'), true);
  assert.equal(isLoopbackMongoUri('mongodb+srv://user:pass@cluster0.tktehuf.mongodb.net/legacy-wealth'), false);
  assert.equal(isLoopbackMongoUri('mongodb://some-remote-host:27017/legacy-wealth'), false);
  assert.equal(isLoopbackMongoUri(undefined), false);
  assert.equal(isLoopbackMongoUri(''), false);
});

test('assertSafeTestConfig: refuses a non-loopback URI when NODE_ENV=test', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    assert.throws(
      () => assertSafeTestConfig('mongodb+srv://user:pass@cluster0.tktehuf.mongodb.net/legacy-wealth'),
      /non-loopback|loopback/i,
    );
    assert.doesNotThrow(() => assertSafeTestConfig('mongodb://127.0.0.1:27017/test'));
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('assertSafeTestConfig: does nothing outside test mode (production/development URIs are untouched)', () => {
  const prev = process.env.NODE_ENV;
  for (const env of ['production', 'development', undefined]) {
    process.env.NODE_ENV = env;
    assert.doesNotThrow(() => assertSafeTestConfig('mongodb+srv://user:pass@cluster0.tktehuf.mongodb.net/legacy-wealth'));
  }
  process.env.NODE_ENV = prev;
});
