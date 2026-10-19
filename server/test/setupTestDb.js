const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { isLoopbackMongoUri } = require('../utils/dbSafety');

/**
 * Isolated, disposable database for integration tests. `mongodb-memory-server` downloads and
 * runs a real, throwaway `mongod` bound to 127.0.0.1 on a random free port - it never touches
 * the project's `.env` or any real cluster. This module is the ONLY thing in the test suite
 * allowed to call `mongoose.connect`; it never requires `server.js` or `config/db.js`, and
 * never calls `dotenv.config()`, so the real `.env` file is structurally never read here.
 *
 * `assertSafeUri` is a defence-in-depth check, not just documentation: even though
 * `MongoMemoryServer` is trusted to return a local URI, every connection this module makes is
 * verified to be loopback-only before use (same canonical check `config/db.js` uses - see
 * utils/dbSafety.js). If this ever throws, STOP - do not relax the check to make it pass.
 */
function assertSafeUri(uri) {
  if (!isLoopbackMongoUri(uri)) {
    throw new Error(
      `Refusing to run tests against a non-loopback MongoDB URI (${uri.replace(/\/\/.*@/, '//<redacted>@')}). ` +
      'Integration tests must only ever run against an in-memory/local database, never production.',
    );
  }
}

let mongod;

async function startTestDb() {
  if (mongod) throw new Error('startTestDb() called twice without stopTestDb()');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  assertSafeUri(uri);

  // Test-only secrets. Never read from the real .env (dotenv.config() is never called in the
  // test path - see module comment above).
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'e2e-test-secret-never-used-in-production';
  process.env.JWT_EXPIRES_IN = '1h';
  delete process.env.RECAPTCHA_SECRET_KEY; // ensure captcha checks stay skipped in tests

  await mongoose.connect(uri);
  return uri;
}

async function stopTestDb() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
}

/** Wipes all collections between tests so fixtures stay deterministic. */
async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { startTestDb, stopTestDb, clearTestDb, assertSafeUri };
