# Pokémon Flash Event — Booking Site

Next.js app for trainer slot booking, admin dashboard, and event-day management. Bookings are stored in **PostgreSQL** so every user and admin sees the same slot availability.

## Local development

```bash
npm install
cp .env.example .env.local   # then edit ADMIN_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin dashboard: `/admin`.

Without `DATABASE_URL`, the app uses in-memory storage (fine for UI work; bookings reset when the dev server restarts). For local persistence, run Postgres and set:

```
DATABASE_URL=postgresql://user:password@localhost:5432/pokemon_event
```

The schema is created automatically on first use.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes (production) | PostgreSQL connection string (Render provides this when you link a database) |
| `ADMIN_PASSWORD` | Yes (production) | Password for `/admin` login |
| `SIGNUPS_UNLOCKED` | No | Set to `true` to bypass the countdown during development |
| `SIGNUP_UNLOCK_AT` | No | ISO UTC datetime override for when signups open |

Never commit real passwords or database URLs. Use `.env.local` locally and Render environment variables in production.

## Deploy on Render

This repo includes a [`render.yaml`](render.yaml) Blueprint for a web service plus PostgreSQL database.

### Option A: Blueprint (recommended)

1. Push this repo to GitHub.
2. In [Render](https://render.com), click **New → Blueprint** and connect the repository.
3. Render creates:
   - **Web service** — runs `npm run build` and `npm start`
   - **PostgreSQL database** — linked via `DATABASE_URL`
4. When prompted, set `ADMIN_PASSWORD` (sync: false in the blueprint).
5. Deploy. Tables are created automatically on first request.

### Option B: Manual setup

1. Create a **PostgreSQL** database on Render. Copy the **Internal Database URL**.
2. Create a **Web Service** from this repo:
   - **Build command:** `npm ci && npm run build`
   - **Start command:** `npm start`
   - **Node version:** 20
3. Add environment variables:
   - `DATABASE_URL` — paste the database URL
   - `ADMIN_PASSWORD` — your admin password
4. Deploy.

### After deploy

- Visit your Render URL. Admin: `/admin`.
- The admin dashboard shows **PostgreSQL connected** when the database is wired correctly.
- Use **Re-add a lost booking** in admin if you need to manually enter bookings from before the migration.

## Scripts

```bash
npm run dev    # development server
npm run build  # production build
npm run start  # run production build locally
npm run lint   # ESLint
```
