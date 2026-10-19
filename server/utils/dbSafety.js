/**
 * Shared loopback-only check for MongoDB URIs. Used by both the production connection path
 * (config/db.js - refuses to start if NODE_ENV=test points at a non-loopback URI) and the
 * test harness (test/setupTestDb.js - refuses to connect mongoose to anything mongodb-memory-server
 * didn't itself hand back). One canonical definition so the two can't drift apart.
 */
function isLoopbackMongoUri(uri) {
  return /^mongodb:\/\/(127\.0\.0\.1|localhost|\[::1\])[:/]/i.test(uri || '');
}

/**
 * Called from config/db.js before every connection attempt. If NODE_ENV is 'test' (the value
 * the test suite sets - see test/setupTestDb.js), the target URI MUST be loopback-only;
 * otherwise this throws rather than letting a misconfigured test run reach a real database.
 * No-op for any other NODE_ENV (development/production behave exactly as before).
 */
function assertSafeTestConfig(uri) {
  if (process.env.NODE_ENV === 'test' && !isLoopbackMongoUri(uri)) {
    throw new Error(
      'Refusing to connect: NODE_ENV=test but MONGO_URI is not a loopback address. ' +
      'Tests must only ever target a local/disposable database, never production.',
    );
  }
}

module.exports = { isLoopbackMongoUri, assertSafeTestConfig };
