# 3X Sports Arena — Admin Panel

Admin-only panel for **3X Sports Arena** (Lahore): bookings on a weekly calendar, courts and prices, expenses, and a business dashboard. Times are Pakistan time (`Asia/Karachi`); money is whole rupees (PKR).

**Stack:** Next.js 16 (App Router, route handlers) · TypeScript · MongoDB Atlas + Mongoose · Auth.js (NextAuth v5, credentials + JWT) · shadcn/ui + Tailwind v4 · shadcn Charts (Recharts) · Redux Toolkit + RTK Query · React Hook Form (no schema library) · date-fns + @date-fns/tz.

## Setup

Requires Node 20+ and a MongoDB **replica set**. Atlas clusters are replica sets; a standalone local `mongod` is not, and booking transactions will fail on it.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run seed                 # creates admins + the two default courts
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string (include the database name, e.g. `/3x-sports-arena`) |
| `AUTH_SECRET` | Session signing secret. Generate one with `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_URL` | Optional. Only needed when the app runs behind a proxy with a different host (not needed on Vercel) |
| `SEED_ADMIN_1_NAME`, `SEED_ADMIN_1_EMAIL`, `SEED_ADMIN_1_PASSWORD` | First admin, used by `npm run seed` |

`.env*` files are git-ignored, except `.env.example`.

## Admins

There's no signup and no admin-management UI. Admins come only from the seed script.

- **Add an admin:** add an entry to `seedAdmins` in [`scripts/seed-data.ts`](scripts/seed-data.ts) that reads its password from new env vars (e.g. `SEED_ADMIN_2_PASSWORD`). Set those vars in `.env.local`, then run `npm run seed`.
- **Reset a password:** set `resetPassword: true` on the entry, run the seed, then remove the flag.
- **Deactivate an admin:** set `isActive: false` on the entry and run the seed. Inactive admins can't sign in.

The seed is idempotent. It upserts admins by email, never overwrites an existing password unless `resetPassword` is set, and creates the default courts only when no courts exist. The courts are Natural Grass at Rs 2,000/h and Artificial Grass at Rs 2,500/h; both prices are placeholders you can edit in the UI.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed admins and courts (reads `.env.local`, then `.env`) |

## Project layout

```
scripts/                 seed.ts, seed-data.ts
src/auth.ts              Auth.js config (credentials provider)
src/auth.config.ts       edge-safe auth config shared with the proxy
src/proxy.ts             route protection (Next 16's name for middleware.ts)
src/app/(auth)/login     login page
src/app/(admin)/…        dashboard, bookings, courts, expense-categories, expenses
src/app/api/…            route handlers (thin: parse → validate → service → respond)
src/services/            business logic: bookings (transactions, overlap), customers, expenses, dashboard
src/lib/                 pricing.ts, time.ts, phone.ts, format.ts, validators.ts, constants.ts, api.ts, db.ts
src/models/              Mongoose models
src/store/               RTK store, RTK Query APIs, calendar/dashboard slices
src/components/          ui (shadcn), layout, shared, and per-feature components
```

## Key behaviour

- **Pricing** is one pure function, `calculateBookingPrice()` in `src/lib/pricing.ts`. The booking dialog uses it for the live preview, and the server uses it as the authority: the server always recalculates and never trusts totals sent by the client.
- **Price locking:** each booking stores `pricePerHourSnapshot`. Changing a court's price never changes existing bookings. Editing a booking's time re-prices it at its snapshot rate. Moving a booking to another court re-prices it at that court's current rate.
- **No overlaps.** The server checks for overlapping bookings inside a MongoDB transaction that also increments the court's `bookingLockVersion`. If two admins book the same slot at the same moment, one booking succeeds and the other gets a `409`. Time ranges are half-open, so 8–9 PM and 9–10 PM don't overlap. Cancelled bookings don't block a slot.
- **Midnight crossing:** an end time at or before the start time means the booking ends the next day. The calendar draws such a booking as two segments. Peak-hours stats split it across the hours it covers.
- **Payments:** a booking with no payment is *pending*. The first payment confirms it. Payment status (unpaid, partial or paid) is derived on every save. Cancelling either refunds the advance (recorded as a refund entry) or keeps it (it stays in collected revenue).

## Deploying to Vercel

1. Push the repo and import it into Vercel.
2. Set `MONGODB_URI` and `AUTH_SECRET` in Project → Settings → Environment Variables.
3. In Atlas → Network Access, allow Vercel to connect: either `0.0.0.0/0` or the Vercel integration.
4. Seed the production database from your machine: point `MONGODB_URI` in `.env.local` at production, then run `npm run seed`.
5. Deploy, then sign in with the seeded admin.

## Implementation notes

- `cacheComponents` is turned off in `next.config.ts` because route handlers use `export const dynamic = 'force-dynamic'`, and the two can't be used together.
- The current shadcn registry no longer ships the `form` component. `src/components/ui/form.tsx` is the classic shadcn Form wrapper for React Hook Form.
