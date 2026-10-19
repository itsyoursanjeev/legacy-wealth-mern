# Local development setup

Three independent apps, three independent dev servers. None of these commands touch
production - follow the "disposable database" section below before starting the backend.

## 1. Disposable/dev database (do this first)

Never point local development at the real Atlas cluster. Two options:

**Option A — ad hoc, no install (what the automated test suite uses):**
```bash
cd server
node -e "
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const m = await MongoMemoryServer.create();
  console.log('MONGO_URI=' + m.getUri() + 'legacy-wealth-dev');
  console.log('(leave this running - Ctrl+C stops the database)');
  await new Promise(() => {}); // keep the process alive
})();
"
```
This prints a `MONGO_URI` value pointing at a throwaway local `mongod`. Copy it into
`server/.env.development` (see below). Data is lost when you stop this process - that's the
point.

**Option B — a real local MongoDB you keep between sessions:** install MongoDB Community
Server, run `mongod --dbpath <some-local-folder>`, and use
`MONGO_URI=mongodb://127.0.0.1:27017/legacy-wealth-dev`.

Either way, the URI **must** start with `mongodb://127.0.0.1`, `mongodb://localhost`, or
`mongodb://[::1]`. This isn't just a convention: if `NODE_ENV=test` and the URI isn't one of
those, `config/db.js` now **refuses to connect** (`utils/dbSafety.js` - see
`test/dbSafety.test.js` for the proof). For plain local development (`NODE_ENV=development`,
not `test`), the guard doesn't fire, so take care to actually use a local URI yourself - it
doesn't auto-protect `npm run dev`, only the automated test path.

## 2. Backend

```bash
cd legacy-wealth-mern/legacy-wealth/server
npm install
cp .env.example .env.development   # then edit it - see "Environment variables" below
NODE_ENV=development node -r dotenv/config server.js dotenv_config_path=.env.development
# or, simpler, if .env.development is just named .env for local-only use:
npm run dev   # nodemon server.js, reads ./.env via server.js's require('dotenv').config()
```
Health check: `http://localhost:5000/api/health`.

**Automated tests** (separate from the above - spins up and tears down its own disposable
database automatically, never touches whatever `.env` you have locally):
```bash
npm test   # node --test test/*.test.js
```

## 3. Admin frontend (`legacywealth admin/`)

```bash
cd "legacy-wealth-mern/legacywealth admin"
npm install
cp .env.example .env
# edit .env: VITE_API_BASE_URL=http://localhost:5000/api   (point at your LOCAL backend above)
#            VITE_DEMO_MODE=false
npm run dev   # http://localhost:5173
```
To exercise the UI without any backend at all: `VITE_DEMO_MODE=true npm run dev` (fictional
in-memory data, no network calls - see the admin app's own README).

## 4. Public site (`legacy-wealth/client/`) — independent of the above

```bash
cd legacy-wealth-mern/legacy-wealth/client
npm install
npm run dev   # http://localhost:5173 by default (same port as the admin app - don't run both at once, or change one's port)
```
Verified in this round of work: `npm run build` succeeds unmodified (confirms the backend/
admin changes did not touch anything the public site depends on).

## Environment variables

### `server/.env` (or `.env.development` for local-only use)
| Key | Local placeholder | Notes |
|---|---|---|
| `PORT` | `5000` | |
| `NODE_ENV` | `development` | Use `test` only via the automated suite, never by hand with a non-loopback `MONGO_URI` - it will refuse to connect. |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/legacy-wealth-dev` | See "Disposable/dev database" above. **Never the real Atlas URI.** |
| `JWT_SECRET` | any long random string, e.g. `openssl rand -hex 32` output | Must differ from the production value. |
| `JWT_EXPIRES_IN` | `30d` | |
| `CLIENT_URL` | `http://localhost:5173` | |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | test-mode values from your own Razorpay dashboard, or leave unset | Not exercised by the am modules. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | anything | Only used by `utils/seed.js`, which **deletes all data first** - safe on a disposable dev database, never on production. |

### `legacywealth admin/.env`
| Key | Local value |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` |
| `VITE_DEMO_MODE` | `false` (or `true` to skip the backend entirely) |

Neither `.env` file is committed (`.gitignore` already excludes them).

## Seeding a usable dev login

The fastest path to a working session: register a normal account via the public site's signup
flow (or `POST /api/auth/register`) against your dev database, then promote it by hand:
```js
// one-off, run with `node -e "..."` against the SAME MONGO_URI as your dev server
const mongoose = require('mongoose');
const User = require('./models/User');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.findOneAndUpdate({ email: 'you@example.test' }, { role: 'admin' });
  // role:'admin' alone is enough to log into the am admin app via the super_admin fallback
  // (middleware/amAuth.js) - no amRole needs to be set for your own first account.
  await mongoose.disconnect();
})();
```
Use only synthetic/your-own test email addresses in a dev database - never copy or re-use a
real investor's details, even locally.
