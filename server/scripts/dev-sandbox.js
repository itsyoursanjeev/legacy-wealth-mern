/**
 * Starts a disposable, local-only sandbox: an in-memory MongoDB (mongodb-memory-server) +
 * the real Express app, seeded with the same synthetic cast the E2E suite uses
 * (test/fixtures.js). For manual QA against the admin frontend - never for anything
 * resembling production use.
 *
 * Usage:
 *   node scripts/dev-sandbox.js [port]
 *
 * Then point the admin app at it: VITE_API_BASE_URL=http://localhost:<port>/api
 *
 * Prints the seeded login emails and shared password. Data is lost when this process exits.
 */
const { startTestDb } = require('../test/setupTestDb');
const { PASSWORD, seedCast } = require('../test/fixtures');

const port = Number(process.argv[2]) || 5055;

(async () => {
  await startTestDb(); // sets NODE_ENV=test, JWT_SECRET, connects mongoose to a loopback-only in-memory mongod
  const cast = await seedCast();

  const createApp = require('../app');
  const app = createApp();
  app.listen(port, () => {
    console.log(`\n🧪 Dev sandbox API running on http://localhost:${port}  (NODE_ENV=${process.env.NODE_ENV}, in-memory DB)`);
    console.log(`   Health check: http://localhost:${port}/api/health`);
    console.log(`\n   Seeded accounts (all share one password):  ${PASSWORD}`);
    for (const [key, u] of Object.entries(cast)) console.log(`     ${key.padEnd(14)} ${u.email}`);
    console.log('\n   Ctrl+C to stop. Nothing here touches production.\n');
  });
})().catch((e) => {
  console.error('Failed to start dev sandbox:', e);
  process.exit(1);
});
