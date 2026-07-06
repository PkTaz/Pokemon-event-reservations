# Pokémon Flash Event — Booking Site

Next.js app for trainer slot booking, admin dashboard, and event-day management.

## Local development

```bash
npm install
cp .env.example .env.local   # then edit ADMIN_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin dashboard: `/admin`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes (production) | Password for `/admin` login |
| `SIGNUPS_UNLOCKED` | No | Set to `true` to bypass the countdown during development |
| `SIGNUP_UNLOCK_AT` | No | ISO UTC datetime override for when signups open |

Never commit real passwords. Use `.env.local` locally and Netlify environment variables in production.

## Deploy on Netlify

Netlify supports Next.js 16 with **zero extra config** via the OpenNext adapter. This repo includes a `netlify.toml` that sets the build command and Node 20.

### 1. Push to GitHub (or GitLab/Bitbucket)

Connect the repository in the [Netlify dashboard](https://app.netlify.com).

### 2. Build settings (usually auto-detected)

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | *(leave empty — Netlify sets this for Next.js)* |
| Node version | `20` (set in `netlify.toml`) |

### 3. Set environment variables

In **Site configuration → Environment variables**, add:

```
ADMIN_PASSWORD=<your-admin-password>
```

Use the same value as in your local `.env.local`. Do not commit passwords to git.

Add `SIGNUPS_UNLOCKED` / `SIGNUP_UNLOCK_AT` only if you need to override signup timing in production.

Redeploy after changing env vars.

### 4. Deploy

Netlify runs `npm install` → `npm run build` → deploys serverless functions for Server Actions and dynamic pages.

Your site gets a `*.netlify.app` URL. Add a custom domain under **Domain management** if needed.

### 5. Optional: skew protection

If users might be mid-booking during a redeploy, enable skew protection:

- Add env var `NETLIFY_NEXT_SKEW_PROTECTION=true`
- Redeploy

### Important before go-live: shared data store

Bookings and slot holds currently live in **in-memory server state** (`src/lib/store.ts`). That works on a single long-running process (local dev) but **Netlify runs multiple serverless instances** that do not share memory.

For a real launch with concurrent users, you need a **shared database** (Supabase/Postgres is the intended next step) so every visitor sees the same slot availability and holds.

Until then, the site will deploy and run on Netlify, but double-booking is possible under heavy traffic.

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # run production build locally
npm run lint   # ESLint
```
