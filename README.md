# RentRide – Tamil Nadu Self-Drive Car & Bike Rental Platform

> **"Your Ride. Your Journey. Your Freedom."**

RentRide is a full-stack car and two-wheeler rental web application built for **Tamil Nadu, India** using Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL, Auth, and Storage). The platform separates public fleet browsing and customer booking requests from an authenticated administrator fleet operations console, with counter-based in-person payment settlements and atomic double-booking protection.

---

## 1. Project Objectives

- Provide customers across **16 Tamil Nadu cities and 28 seeded pickup hubs** with transparent, server-calculated rental pricing (base daily rate, Tamil Nadu 18% GST breakdown, vehicle insurance, doorstep delivery option, and refundable security deposit).
- Eliminate double bookings and maintenance-window overlaps through an atomic PostgreSQL reservation function (`create_booking_atomic`) with row locking.
- Protect customer PII and private Driving Licence (DL) KYC uploads using private Supabase Storage buckets, short-lived signed URLs, PostgreSQL Row Level Security (RLS), and verified server-side authorization guards.
- Enforce strict separation between **Booking Lifecycle Status** (`pending_review`, `confirmed`, `active`, `completed`, `cancelled`, `rejected`) and **Counter Payment Status** (`not_paid`, `pending`, `paid`, `refunded`).

---

## 2. Customer Portal Features

- **Fleet Showcase & Explore Catalog (`/` and `/vehicles`):** Browse 56 seeded cars and two-wheelers across hatchback, sedan, SUV, MPV, luxury, commuter, street, touring, and scooter categories with server-backed filtering, sorting, and pagination (`/api/vehicles?page=...&limit=...`).
- **Tamil Nadu Hub & Availability Search:** Filter rides by Tamil Nadu city and active pickup hubs (disabled hubs are automatically excluded from customer selection).
- **Vehicle Detail Page (`/vehicles/[id]`):** Live pricing calculator preview (`/api/pricing/calculate`), full vehicle specifications, availability status, and verified approved customer reviews.
- **Booking Request Checkout (`/checkout`):** Submit reservation requests directly without online payment gateways, optionally upload front/back Driving Licence images to private Supabase Storage, and view transparent INR cost breakdowns.
- **Customer Account Portal (`/account`):** View reservations with independent booking vs. counter-payment status badges, digital 4-digit pickup/return handover PINs, self-service booking cancellation, profile updates, KYC uploads/status tracking, and verified booking review submissions.

---

## 3. Administrator Portal Features (`/admin`)

- **Operations Overview (`AdminDashboardOverview`):** Fleet summary cards, booking lifecycle metrics, and pending review alerts.
- **Bookings & KYC Audit (`AdminBookings`):** Inspect customer Driving Licences via short-lived server-generated signed URLs, approve bookings without falsely marking counter payments as paid, reject bookings with reasons, activate/complete trips, and record internal notifications.
- **Fleet Inventory Management (`AdminVehicles`):** Create, edit, and soft-deactivate vehicles with registration numbers, daily/weekend rates, security deposits, hub assignments, and Zod payload validation.
- **Tamil Nadu Hubs Network (`AdminLocations`):** Add new hubs, edit hub metadata/hours, and toggle active/disabled branch status across districts.
- **Pricing Rules & Maintenance Blackouts (`AdminPricing`):** Configure statutory tax/delivery/insurance rules and schedule, edit, complete, or delete inclusive vehicle maintenance blackouts enforced directly in SQL and client availability checks.
- **Customer Directory (`AdminCustomers`):** View customer accounts, booking history summaries, and licence verification states.
- **Counter Settlement Ledger (`AdminPayments`):** Record verified Cash/UPI/Card counter payments and refunds independently of booking approval, with duplicate paid/refunded (`409`) and cancelled booking (`400`) guards.
- **Review Moderation (`AdminReviews`):** Filter all customer reviews (`All`, `Approved`, `Hidden`), approve or hide public reviews, remove reviews, and automatically synchronize vehicle aggregate ratings (`rating`, `review_count`).
- **Platform Settings (`AdminSettings`):** Manage corporate legal registration, GSTIN, support hotlines, speed governor limit (`40–200 km/h`), minimum driver age (`18–30`), fuel policy, and free cancellation grace period (`1–72 hrs`).

---

## 4. Technology Stack

- **Frontend:** Next.js `15.5.28` (App Router), React `19`, TypeScript (`strict`), Tailwind CSS `v4`, `lucide-react`
- **Backend & APIs:** Next.js Route Handlers (`app/api/**`), Zod request validation (`zod`)
- **Database, Auth & Storage:** Supabase PostgreSQL, `@supabase/ssr` & `@supabase/supabase-js`, Row Level Security (RLS), Supabase Storage
- **Testing & Quality:** Vitest (`v5.1.0`), React Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`), `jsdom`, Playwright (`playwright`), ESLint (`next lint`)

---

## 5. Application Architecture

RentRide follows a layered Next.js App Router architecture with dual-client Supabase security isolation:

1. **Client & SSR Layer (`app/`, `components/`, `context/AppContext.tsx`):** Hydrates storefront catalog, active hubs, public reviews, pricing rules, and session-scoped customer/admin views without exposing privileged secrets.
2. **Middleware & Route Guards (`middleware.ts`, `lib/supabase/auth-guard.ts`):** Refreshes cookie sessions and validates authentication (`requireAuthUser`) or verified staff privileges (`requireAdminUser` reading `public.profiles.role IN ('admin', 'fleet_manager')`).
3. **Dual Supabase Server Clients (`lib/supabase/`):**
   - **User-Scoped SSR / Bearer Client (`createClient` in `server.ts` / `auth-guard.ts`):** Preserves authenticated caller identity (`auth.uid()`) so PostgreSQL RLS enforces tenant isolation automatically.
   - **Restricted Admin Client (`createAdminClient` in `admin.ts`):** Backed by `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`; used strictly on the server after verifying identity/role (`requireAdminUser` or explicit owner verification for booking cancellation and aggregate rating recalculation).
4. **Domain & Data Services (`lib/pricing/`, `lib/booking/`, `lib/reviews/`, `services/`):** Encapsulate availability interval checks, INR tax/deposit calculations, transaction recording, notifications, and database mappers.

---

## 6. Folder Structure

```text
RentRide/
├── app/                         # Next.js App Router pages, callbacks & API route handlers
│   ├── account/                 # Customer portal page
│   ├── admin/                   # Fleet admin operations console page
│   ├── auth/                    # Auth callback (/auth/callback) & password reset page
│   ├── checkout/                # Reservation checkout & KYC page
│   ├── vehicles/                # Explore catalog & /vehicles/[id] detail pages
│   └── api/                     # REST endpoints (auth, bookings, customers, locations,
│                                # maintenance, notifications, payments, pricing, reviews, settings, vehicles)
├── components/
│   ├── admin/                   # AdminDashboardOverview, AdminBookings, AdminVehicles, AdminLocations,
│   │                            # AdminPricing, AdminCustomers, AdminPayments, AdminReviews, AdminSettings
│   ├── customer/                # HeroSection, SearchPanel, HomePage, ExplorePage, VehicleCard,
│   │                            # VehicleDetailPage, CheckoutPage, CustomerDashboard, AuthModal
│   └── layout/                  # Navbar, Footer, AdminSidebar, AdminHeader
├── context/                     # AppContext.tsx global storefront & portal state provider
├── lib/
│   ├── booking/                 # availability.ts double-booking & maintenance blackout checks
│   ├── pricing/                 # calculator.ts INR pricing, GST, insurance & deposit math
│   ├── reviews/                 # recalculate-rating.ts server rating aggregator
│   ├── supabase/                # client.ts, server.ts, admin.ts, auth-guard.ts, storage.ts, middleware.ts, mappers.ts
│   ├── seed-catalog.ts          # 56-vehicle catalog metadata
│   ├── tn-locations.ts          # 16 Tamil Nadu districts & pickup hub mappings
│   └── vehicle-images.ts        # Model-to-asset image lookup
├── public/images/               # Static hero images, SVG/JPG car & bike fleet assets, sample DL SVGs
├── scripts/                     # Seed helpers, security audit & Phase 4–7 verification scripts
├── services/                    # Server data access services (booking, vehicle, customer, payment, notification, admin)
├── supabase/
│   ├── migrations/              # Sequential SQL migrations (001_initial_schema.sql .. 006_auth_profiles_hardening.sql)
│   ├── seed.sql                 # Idempotent hubs & 56-vehicle seed script
│   └── all_in_one_setup.sql     # Combined standalone SQL schema + seed bundle
├── tests/
│   ├── unit/                    # Vitest unit tests (pricing, availability, auth guards)
│   └── components/              # React Testing Library component tests (AdminSettings, AdminReviews)
├── types/                       # Shared TypeScript interfaces (booking, vehicle, payment, customer, index)
├── .env.example                 # Safe placeholder environment template
├── .gitignore                   # Exclusion rules for secrets, build caches & temp QA artifacts
├── middleware.ts                # Session refresh middleware entry point
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies & npm scripts
├── tsconfig.json                # Strict TypeScript config
└── vitest.config.mts            # Vitest & jsdom test configuration
```

---

## 7. Supabase Database Overview

- **Core Tables (14):** `profiles`, `driving_licences`, `pickup_locations`, `vehicles`, `vehicle_images`, `vehicle_maintenance`, `bookings`, `booking_status_history`, `payments`, `reviews`, `pricing_rules`, `notification_logs`, `application_settings`, `admin_audit_logs`.
- **Integrity & Concurrency:**
  - `19` foreign key constraints, `162` check constraints, and `28` indexes.
  - `32` Row Level Security (RLS) policies isolating customer bookings, payments, profiles, and driving licences while limiting catalog/settings/moderation writes to verified staff.
  - `create_booking_atomic` RPC enforces `SELECT ... FOR UPDATE` serialization, rejects overlapping active bookings, and enforces inclusive `vehicle_maintenance` blackout date ranges (`start_date <= p_return_date AND end_date >= p_pickup_date` when `is_completed = false`).
- **Storage Buckets:**
  - `driving-licences` (**Private**): Uploaded under customer user folders; viewed only via signed URLs issued after ownership/admin authorization.
  - `vehicle-images` (**Public**): Stores uploaded fleet media.
  - `customer-avatars` (**Public**): Reserved for profile avatars.

---

## 8. Authentication Architecture

- Powered by **Supabase Auth** integrated with `@supabase/ssr` cookies on web routes and `Authorization: Bearer <jwt>` support on API endpoints.
- PostgreSQL trigger `handle_new_user()` (`public.profiles`) provisions a customer profile on registration and strictly forces `role = 'customer'`, blocking role-escalation via signup metadata.
- RLS policies on `public.profiles` block customers from updating their own `role` column directly (`new row violates row-level security policy`).
- Privileged consoles (`/admin` and staff APIs) require verified `admin` or `fleet_manager` role stored in `public.profiles`.
- Password recovery (`resetPasswordForEmail`), verification callback (`/auth/callback` with open-redirect protection), password update (`/auth/reset-password`), and global session revocation (`DELETE /api/auth/session`) are implemented end-to-end.

---

## 9. Supabase & Environment Setup

### Prerequisites
- Node.js `v20+` and `npm`
- A Supabase project (`supabase.com`)

### Environment Configuration
Copy `.env.example` to `.env.local` (never commit `.env.local`):

```bash
cp .env.example .env.local
```

Populate `.env.local` using placeholders from `.env.example`:
- `NEXT_PUBLIC_APP_URL` — Local URL (`http://localhost:3000`) or deployed app origin
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project public API key
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Server-only privileged key (required for `createAdminClient()`)

*(Optional local `QA_ADMIN_EMAIL` and `QA_ADMIN_PASSWORD` variables in `.env.local` are only needed if running integration/E2E scripts under `scripts/` locally; customer test accounts are created ephemerally per run and cleaned up automatically.)*

---

## 10. Migration Management Workflow

Sequential database migrations are stored under `supabase/migrations/`:

1. `001_initial_schema.sql` — Tables, indexes, check constraints, and constraints
2. `002_rls_policies.sql` — Row Level Security policies and `is_admin()` helper
3. `003_double_booking_prevention.sql` — Atomic `create_booking_atomic()` RPC with booking overlap and inclusive maintenance blackout enforcement
4. `004_storage_buckets.sql` — Storage bucket initialization & access policies
5. `005_internal_notifications.sql` — Notification table enhancements
6. `006_auth_profiles_hardening.sql` — Profile role-escalation RLS hardening and `handle_new_user()` trigger

Idempotent seed data lives in `supabase/seed.sql` (28 pickup locations + 56 vehicles + default settings), and `supabase/all_in_one_setup.sql` provides a combined bootstrap script.

**Important Workflow Note:** If migrations were applied directly via SQL Editor / Management API rather than `supabase db push`, check tracked migrations before running automated Supabase CLI pushes or GitHub branch deployments so already-applied schema files (`001`–`006`) are marked applied cleanly rather than re-executed out of order.

---

## 11. Local Installation, Development & Production Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Access the storefront at `http://localhost:3000` and the admin console at `http://localhost:3000/admin`.

### Testing & Verification Commands
```bash
# Vitest unit & React Testing Library component tests (mocked fetch/SSR, safe offline)
npm run test:unit

# Static lint & TypeScript check
npm run lint
npx tsc --noEmit

# Full integration & Playwright suites (require running server + local QA env vars; mutates/cleans QA test records)
node scripts/test-phase4-backend.mjs
node scripts/test-phase5-auth.mjs
node scripts/test-phase6-e2e.mjs
node scripts/test-phase7-qa.mjs
```

### Production Build & Start
```bash
npm run build
npm run start
```

---

## 12. Git & GitHub Workflow

- Primary repository: `https://github.com/cmbarath/RentRide.git` on branch `main`.
- **Pre-Commit Security Hygiene:**
  - Ensure `.env.local`, `.vercel`, `.next/`, `supabase/.temp/`, temporary test artifacts (`scripts/.tmp*`), logs, and real customer documents remain excluded via `.gitignore`.
  - Never commit API secrets, service-role keys, SMTP credentials, plaintext passwords, or customer PII inside code, seed scripts, or QA scripts; use environment variables (`process.env`) and `.env.example` placeholders only.

---

## 13. Deployment Roadmap

1. **Credential Hygiene & Custom SMTP:** Configure a custom SMTP provider in Supabase Auth before onboarding live public users (removing reliance on Supabase's built-in 2 emails/hr quota).
2. **Production Hosting (Vercel – Phase 9):** Connect the `main` branch, configure server/public environment variables securely in project settings, update Supabase Auth redirect URLs (`https://<your-domain>/auth/callback`), and verify health checks post-deploy.
3. **Database Migration Alignment:** Align `supabase/migrations/` history with Supabase CLI/GitHub integration (`supabase migration repair` where needed) prior to enabling automated migration execution on `main`.

---

## 14. Known Limitations

1. **Custom SMTP Required for Email Delivery:** Supabase's default built-in mailer enforces a strict `2 emails/hour` rate limit; live signup confirmation, resend verification, and password recovery emails require configuring custom SMTP in production.
2. **Weekend Surge Pricing Auto-Calculation:** Dynamic weekend surge percentages can be configured in `pricing_rules` and previewed inside the Admin Pricing screen, but [`calculateBookingPrice`](file:///c:/Full%20Stack/Prjcts/RentRide/lib/pricing/calculator.ts) currently calculates rentals using the flat daily rate without automatically multiplying Fri–Sun dates.
3. **Excluded Payment & Messaging Integrations:** Razorpay, online payment gateways, WhatsApp Cloud API, and Meta integrations have been permanently removed from scope and will not be processed in checkout or notifications.
4. **Counter-Based Settlement Workflow:** Customers submit reservation requests without online payment; administrators inspect KYC documents, approve/reject requests, and record real Cash/UPI/Card counter settlements separately ledgered against the booking.

---

© 2026 RentRide Mobility Private Limited.
