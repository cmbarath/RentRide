# RentRide – Tamil Nadu Premier Car & Bike Rental Platform

> **"Your Ride. Your Journey. Your Freedom."**

RentRide is an enterprise-grade, production-quality car and bike rental platform engineered specifically for the **Tamil Nadu region, India**. Inspired by leading mobility services (Zoomcar, Revv, Royal Brothers), RentRide combines a sleek, modern UI with robust backend business logic, atomic double-booking prevention, automated Meta WhatsApp alerts, and end-to-end Razorpay payments.

---

## 🌟 Architecture & Key Modules

RentRide features two complete, interconnected portals:

### 1. Customer Storefront Portal
- **Browse & Filter Fleet**: Search 56 distinct vehicle models across 8 categories (Commuters, Street/Sport, Touring Bikes, Scooters, Hatchbacks, Sedans, SUVs, MPVs, Luxury).
- **Tamil Nadu Regional Engine**: 16 districts (Chennai, Coimbatore, Madurai, Trichy, Salem, Tiruppur, Erode, Vellore, Hosur, Thanjavur, Tirunelveli, Nagercoil, Kanchipuram, Chengalpattu, Ooty, Kodaikanal) with 30+ physical hubs and doorstep delivery radius.
- **KYC Driving Licence Upload**: Front and back driving licence submission with realistic RTO preview cards and validation checks (LMV for cars, MCWG for bikes).
- **Dynamic Pricing Engine**: Real-time breakdown showing Base Rental, Configurable Tamil Nadu GST (18% split into CGST 9% + SGST 9%), refundable Security Deposit, Insurance, and optional Doorstep delivery.
- **WhatsApp Instant Alerts**: Live booking confirmations dispatched to staff and customers via Meta WhatsApp Business Cloud API with seamless Click-to-Chat fallback.
- **Razorpay Checkout**: Seamless order creation and cryptographic HMAC-SHA256 signature verification.
- **Digital Handover OTP / PIN**: 4-digit security code for touchless physical key release at pickup hubs.
- **Customer Trips Dashboard**: Manage active trips, view KYC status, download rental agreements, and request roadside support.

### 2. Business Fleet Admin Portal
- **Operations Telemetry Overview**: Real-time revenue metrics in ₹ INR, fleet utilization gauge, booking status breakdown, and vehicle distribution charts.
- **Rental Bookings & KYC Audit**: Review submitted driving licences with dedicated audit modal, 1-click Approve / Reject with reason, and release physical keys.
- **Full Fleet Inventory CRUD**: Add, edit, or remove vehicles with model-accurate images verified by the central mapping engine, registration numbers (`TN 09 ...`), specs, and hub assignments.
- **Tamil Nadu Hub Management**: Toggle active/inactive status across all 16 districts and add new pickup branches.
- **Dynamic Pricing & Blackout Calendar**: Configure Friday-Sunday weekend surge percentages (0% - 40%), GST rates, and schedule vehicle maintenance blackouts.
- **Customer Accounts & CRM**: Track customer lifetime spend, rental counts, ratings, and driving licence verification badges.
- **Razorpay Payment Ledger**: Complete transaction history with tax invoices showing GSTIN `33AABCR8721K1ZM` and print export.
- **Platform Policy Controls**: Speed governor limits (120 km/h), minimum driver age (21 yrs), and WhatsApp/Razorpay API credentials.

---

## 🛡️ Critical Bug Fixes & Architecture Highlights

### 1. Vehicle Image and Name Mismatch Resolution
In the initial imported Stitch UI, generic vehicle images were recycled across different models (e.g. Meteor 350 shown for Hunter 350, Creta shown for Seltos).
- **Solution**: Developed `lib/vehicle-images.ts` and generated verified, model-specific visual cards for all **56 catalogue models** (30 bikes & scooters, 26 cars).
- Every card is guaranteed to represent the exact model mentioned in the title.
- Fallback placeholders are strictly type-matched (car vs bike) rather than cross-contaminating models.

### 2. Double-Booking Prevention
Concurrent bookings for overlapping dates are prevented at both the application and database tiers:
- **Interval Overlap Verification**: Checks `existing_pickup < new_return` AND `existing_return > new_pickup` in `lib/booking/availability.ts`.
- **Atomic Database Transaction**: Implemented PostgreSQL RPC `create_booking_atomic` in `supabase/migrations/003_double_booking_prevention.sql` utilizing `SELECT ... FOR UPDATE` row locking.

### 3. Meta WhatsApp Business Cloud API & Fallback
- Direct integration with Meta Graph API `v22.0` (`lib/whatsapp/client.ts`).
- Generates rich WhatsApp messages with booking IDs, customer phone, pickup date, vehicle name, and total amount.
- **WhatsApp Click-to-Chat Fallback**: When API tokens are not configured in local development, generates an instant `https://wa.me/<phone>?text=...` deep link so notifications never fail.

### 4. Razorpay Server-Side Payment & Webhook Verification
- Server-side order creation using `razorpay` Node SDK (`app/api/payments/razorpay/order/route.ts`).
- Cryptographic signature validation via HMAC-SHA256 (`crypto.createHmac`).
- Idempotent webhook handler with replay-attack protection (`app/api/payments/razorpay/webhook/route.ts`).

---

## 📁 Project Structure

```
c:\Full Stack\Prjcts\RentRide\
├── app/                              # Next.js App Router
│   ├── api/                          # Server API Route Handlers
│   │   ├── bookings/                 # Atomic booking creation & status updates
│   │   ├── payments/razorpay/        # Order creation, verification & webhooks
│   │   ├── notifications/whatsapp/   # WhatsApp dispatch & webhook verification
│   │   ├── vehicles/                 # Fleet querying & management
│   │   └── locations/                # Tamil Nadu cities & hubs
│   ├── vehicles/                     # Explore Fleet & Vehicle Details
│   ├── checkout/                     # KYC & Razorpay Checkout
│   ├── account/                      # Customer Trips & Handover PIN Pass
│   ├── admin/                        # Super Admin Dashboard
│   ├── globals.css                   # Tailwind CSS v4 styling
│   ├── layout.tsx                    # Root Layout with Font & AppProvider
│   └── page.tsx                      # Primary App View
├── components/
│   ├── customer/                     # VehicleCard, SearchPanel, HeroSection,
│   │                                 # HomePage, ExplorePage, VehicleDetailPage,
│   │                                 # CheckoutPage, CustomerDashboard, AuthModal
│   ├── admin/                        # DashboardOverview, Bookings, Vehicles,
│   │                                 # Locations, Pricing, Customers, Payments, Settings
│   └── layout/                       # Navbar, Footer, AdminSidebar, AdminHeader
├── context/
│   └── AppContext.tsx                # Central State, LocalStorage Sync & Business Logic
├── lib/
│   ├── seed-catalog.ts               # Complete 56-vehicle seed catalogue
│   ├── tn-locations.ts               # 16 Tamil Nadu cities & 30+ hubs
│   ├── vehicle-images.ts             # Central model-to-image mapping engine
│   ├── pricing/calculator.ts         # Pricing, surge, deposit & GST breakdown
│   ├── booking/availability.ts       # Double-booking interval overlap engine
│   ├── payments/razorpay.ts          # Razorpay order & signature validation
│   └── whatsapp/client.ts            # Meta WhatsApp Cloud API client
├── public/
│   ├── images/
│   │   ├── vehicles/cars/            # Model-specific verified car assets
│   │   ├── vehicles/bikes/           # Model-specific verified bike assets
│   │   └── licences/                 # Tamil Nadu driving licence vector cards
├── services/                         # Database services for all core entities
├── supabase/
│   ├── migrations/                   # 001_initial_schema.sql to 004_storage_buckets.sql
│   └── seed.sql                      # Complete PostgreSQL seed file (16 cities, 56 vehicles)
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18.17+` or `v20+`
- npm or pnpm

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials for Supabase, Razorpay, and Meta WhatsApp Business.
*(The application includes rich local fallback mock state and test mode if credentials are left blank)*.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in sequence:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_double_booking_prevention.sql`
   - `supabase/migrations/004_storage_buckets.sql`
   - `supabase/seed.sql`
4. Copy the Project URL and Anon Key into your `.env.local`.

---

## 🧪 Quick Test Accounts (1-Click Demo)

The login modal contains 1-click test accounts pre-configured with Tamil Nadu driving licences:
- **Rohan Sharma** (`rohan.sharma@gmail.com`): Chennai renter with 6 completed trips and verified KYC.
- **Priya Nambiar** (`priya.nambiar@outlook.com`): Coimbatore renter with 1 booking pending KYC review.
- **Fleet Administrator Console**: Instant toggle to access the full admin suite.

---

## 📄 License
© 2026 RentRide Mobility Private Limited. All rights reserved.
