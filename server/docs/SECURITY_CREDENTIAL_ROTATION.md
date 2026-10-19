# Credential rotation — action required

**No secret values are reproduced in this document.** This only records *where* the exposure
is and the steps to fix it.

## Where the exposure is

The repo root [`CLAUDE.md`](../../CLAUDE.md) contains the live admin account's email and
password, and the live `JWT_SECRET` value, in plaintext, under "Current Admin Credentials"
and the environment variable table. `CLAUDE.md` is a **tracked** file (confirmed via
`git ls-files`), and has been since an early commit (confirmed via `git log -- CLAUDE.md`) —
so these values are not just in the current working tree, they are in git history across
multiple commits.

Checked and confirmed clean:
- `server/.env.example` — placeholders only (e.g. `ChangeThisAdminPass2026!`), not the real values.
- `server/utils/seed.js` — reads from `process.env.ADMIN_EMAIL`/`ADMIN_PASSWORD` with a
  generic placeholder fallback, never the real password.
- `.gitignore` already excludes `.env`, `.env.local`, `.env.production` — the real `.env` file
  itself was never committed.

So the fix is scoped: one file's plaintext values, repeated across its commit history.

## Rotation steps (in order — rotating first means the leaked values stop being useful even
before history is cleaned up)

1. **Generate a new `JWT_SECRET`** (e.g. `openssl rand -hex 32`, or any long random string
   generator — do this locally, don't ask an AI to generate and show you "a random secret" in
   chat where it could be logged). Set it in the Render dashboard's environment variables for
   the backend service. This immediately invalidates every existing login session/token
   (everyone signed in will need to log in again) — expected and fine for a one-time rotation.
2. **Change the admin account's password.** Easiest: log in as the current admin, use the
   existing `PUT /api/auth/me` endpoint (already in `routes/auth.js`) with a new password —
   this goes through the model's bcrypt hashing, so nothing needs to be typed into a database
   console. Alternatively, update the `ADMIN_PASSWORD` env var and re-run `utils/seed.js` — but
   that script **deletes all users and courses** first; do not use it on the live database.
3. **Edit `CLAUDE.md`** to remove the literal values — replace with something like "stored in
   the team password manager" and a pointer to wherever you actually keep it (1Password,
   Bitwarden, etc.), not another plaintext copy.
4. **Decide whether to purge git history.** For a private repo with a small, trusted
   contributor list, steps 1–3 remove the live risk (the leaked values no longer work and
   won't be re-committed). History still technically contains the *old* password/secret.
   Purge it (`git filter-repo` or BFG Repo-Cleaner, then a coordinated force-push) only if the
   repo's visibility or sharing scope is about to change (made public, new outside
   collaborator, etc.) — it's disruptive (rewrites every commit hash) and not worth doing
   reactively on its own.
5. Repeat step 2's logic for any other account that was given `amRole` using the same
   password pattern, if any exist.

## Why this wasn't done automatically

Rotating the live admin password and `JWT_SECRET` requires dashboard access (Render, and
whatever you use to log in and change the password) that this session doesn't have and
shouldn't be given for a production credential change — this is explicitly an owner action.
