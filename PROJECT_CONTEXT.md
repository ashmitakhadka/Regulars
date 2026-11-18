# Regulars: project context

Regulars is a multi-tenant digital loyalty platform for local businesses in Nepal (cafes, salons, gyms). It replaces paper stamp cards. Responsive web app, no mobile app.

## Stack
- backend/: Laravel 13, MySQL, Sanctum, Pest
- frontend/: React (JavaScript), React Router, Tailwind CSS, Font Awesome, Zod, Axios
- API testing: Bruno (collection in /bruno at the repo root)
- Two developers, one repo, feature branches, pull requests to main

---

## How the product works

1. **Customer Registration & Login**: Customers register with name, email, password (with confirmation), and phone number, and log in with email and password from the Regulars website.
2. **Customer Data**: Customer data lives in the existing `users` table (`role = 'customer'`, `customer_code`, `phone`). There is NO separate customers table.
3. **Customer Experience**: After logging in, a customer can:
   - View their profile and customer ID (`customer_code`).
   - View their wallet (all joined stamp cards across all businesses).
   - Browse the business directory.
   - View business details along with its active loyalty programs.
   - Join one or several programs (each join yields an individual active stamp card).
   - View stamp card details and progress.
   - View vouchers and targeted offers.
   - Enter promo codes.
4. **QR Codes**: There are two permanent, fixed QR codes (never rotating): a Business QR and a Program QR. My teammate (Dev B) builds the QR generation and decides the exact links. Do not build or assume QR routes yet. Customer pages must still be reachable by a normal URL so a QR code can open them later.
5. **Protected Page Redirects**: If a customer is not logged in and opens a protected page, redirect to `/login?redirect=<path>`, and return to that path after login or registration. Accept only safe internal redirect paths that start with a single `/` (never full URLs, never `//`).
6. **Business Directory**: The business directory shows only businesses that are active and have at least one active program. Suspended businesses are hidden. Customers must be logged in to see businesses and programs.
7. **Visits and Stamps at Counter**: Visits and stamps are recorded by the merchant side (Dev B). The code that awards stamps and updates streaks is written by Dev B. My code only reads the results and never writes that logic.
8. **Voucher Redemption**: The merchant redeems vouchers in their dashboard. The customer only presents their unique voucher code.

---

## My role: Dev A (customer experience)

I own the customer side end to end: React screens, Laravel API, database queries, validation, Bruno and Pest tests. This covers:
- Customer registration and password login.
- Customer session management and profile.
- Business directory and business details with active programs.
- Joining loyalty programs.
- Customer wallet and stamp card detail views.
- Streak and visit history display.
- Voucher list and voucher detail views.
- Offer claiming.
- Promo-code entry and redemption.

My teammate (Dev B) owns merchant features (merchant registration, merchant login, merchant dashboard, program setup, QR generation, recording visits and purchases, voucher redemption, merchant offers, and campaigns). Do not edit their modules unless agreed.

---

## Auth decisions

- **Session Authentication**: Customer auth uses Laravel Sanctum stateful SPA cookie sessions (same style as the merchant login), NOT personal access tokens. The frontend uses `src/services/api.js` with `withCredentials: true`. Do not store tokens in `localStorage`.
- **Endpoints**:
  - `POST /api/register/customer`: Registers a new customer and establishes session.
  - `POST /api/login/customer`: Authenticates a customer and establishes session.
  - `POST /api/logout/customer`: Logs out customer session.
  - `GET /api/customer/me`: Restores customer session and returns authenticated customer profile.
- **Middleware & Protection**: All `/api/customer/*` routes require authentication and the customer role (middleware alias `"customer"`).
- **Response Format**: Customer endpoints return `{ success, data, message }`. Validation errors return `{ success: false, message, errors }` with HTTP status 422.
- **Role Isolation**: Merchant login and customer login each accept only their own role. Attempting to log into the customer endpoint with a merchant account (or vice versa) is rejected. Wrong email or password always returns one vague message: `"Email or password is incorrect"`.
- **Phone Normalization**: Phone numbers are normalized using `App\Services\Customer\NepaliPhoneNormalizer` before saving and must be unique.
- **Rate Limiting**: Customer login is rate-limited to 5 attempts per minute per email and IP.

---

## My teammate's work (do not change)

- Merchant routes: `POST /api/register/merchant`, `POST /api/login/merchant`, `POST /api/logout/merchant`, `GET /api/merchant/me`, `GET /api/merchant/dashboard`, and all `/api/merchant/*`.
- Merchant state: Uses cookie sessions and the `AuthContext` in `frontend/src/auth/AuthContext.jsx`.
- Merchant responses do not always follow the `{ success, data, message }` format.
- Leave her code and routes alone. Customer auth must use a separate `CustomerAuthContext.jsx` to avoid conflicts.

---

## Database rules

- The database is already set up. Read existing migrations and models first.
- Do NOT change existing tables or migrations unless truly necessary.
- If a change is necessary: create a NEW migration (never edit old ones), explain why, and add or update a seeder so my teammate can run `php artisan migrate --seed` and get the same data.
- Never commit `.env`, `vendor/` or `node_modules/`.

---

## Business rules

1. **One User, One Role**: One user account has exactly one role: `customer`, `merchant`, or `superadmin`.
2. **Program Joining**: Customers choose which active loyalty program(s) of an active business to join. Each joined program creates an individual active stamp card.
3. **No Duplicate Memberships**: Joining a program creates a `user_merchant_stats` row (if the customer has not previously interacted with the merchant) plus one active `stamp_cards` row for that program version. Joining the same program twice must not create duplicates.
4. **Program Versions**: Existing stamp cards keep the program version they started with.
5. **One Active Card Per Program**: One active card per customer per loyalty program.
6. **Daily Stamp Limit**: A customer earns at most one qualifying visit stamp per day per merchant. No duplicates, even with simultaneous requests (enforced via database transaction and row locking).
7. **Streak Tracking**: Streaks are tracked per customer per merchant. Consecutive merchant-local calendar days extend it, several visits on one day count once, a missed day resets it, and the longest streak is preserved.
8. **Timezone**: All date and visit logic uses the merchant's configured timezone (default `Asia/Kathmandu`), never the server clock.
9. **Visit Records**: Every visit attempt is recorded by Dev B's module, including rejected ones, with a reason.
10. **Suspended Merchants**: Suspended merchants cannot award stamps or accept new program joins. In the directory, suspended businesses are hidden; only active businesses with at least one active program are visible.
11. **Voucher Generation**: A completed card creates a voucher with a unique code, a snapshot of the reward, and 30 days validity. A voucher can be redeemed once.
12. **Targeted Offers**: Targeted offers must be claimed first. The voucher is created at claim time and its validity starts then.
13. **Promo Codes**: Promo code entry is limited to 5 attempts per minute per user. Codes are single-use or shared with a use limit.
14. **Data Isolation**: Customers can only see their own data.
15. **Customer Identification**: Merchants find a customer by phone number or by `customer_code` (e.g. `RG-4K7M2P`). Customers view their `customer_code` in their profile/wallet.

---

## UI rules

- **Visual Theme**: Re-use the landing page's existing Tailwind `@theme` tokens (`brand`, `blush`, `ink`, `ink-soft`) and fonts (`Bricolage Grotesque` for headings and logo, `DM Sans` for body text). Do not introduce arbitrary hex colors.
- **Background & Cards**: White page background. White cards with NO border, only a soft shadow (`shadow-sm` or `0 2px 12px rgba(35,20,12,0.08)`), rounded-xl (`rounded-xl` / 8-12px corner radius).
- **Colors**:
  - Primary: Red `#A51D27` (`brand`) for main buttons and key actions.
  - Secondary: Cream `#F4F0EA` (`blush`) for soft backgrounds, tags, hover states.
  - Text & Icons: Dark brown `#23140c` (`ink` and `ink-soft`) for text and ALL icons.
- **Tone**: Clean, calm, plain. No gradients, glassmorphism, emojis, or decorative blobs. Short, human copy.
- **Responsiveness**: Mobile-first design, fully functional at 360px viewport width on mobile devices. Interactive targets and buttons at least 44px tall. Visible focus rings matching landing page style.
- **Reusable UI Components**: Always use reusable UI components from `src/components/ui/` (`Button`, `Logo`, `Card`, `Input`, `Tag`, `Spinner`, `EmptyState`, `ErrorState`). Never write inline buttons or logos.
- **State Handling**: Every list and asynchronous view requires explicit loading, empty, and error states.

---

## Naming rules (avoid clashes with Dev B)

- **Backend Namespaces**: Everything I create goes in dedicated Customer namespaces:
  - `App\Http\Controllers\Api\Customer\`
  - `App\Http\Requests\Customer\`
  - `App\Http\Resources\Customer\`
  - `App\Services\Customer\`
  Class names carry customer meaning (e.g., `CustomerAuthController`, `CustomerDirectoryController`, `CustomerWalletController`).
- **Route Files**: Dedicated customer route files:
  - `routes/api/auth.php` (customer auth: `/api/register/customer`, `/api/login/customer`, `/api/logout/customer`)
  - `routes/api/customer.php` (customer features: `/api/customer/*`)
  Registered via clean single-line `require` statements in `routes/api.php`. Never touch or redefine `/api/merchant/*` or `/api/admin/*` routes.
- **Tests**: `tests/Feature/Customer/` and `tests/Unit/Customer/`.
- **Bruno Testing**: `/bruno/customer/` and `/bruno/auth/`.
- **Frontend Structure**:
  - Customer pages: `src/pages/customer/`
  - Customer components: `src/components/customer/`
  - Customer services: `src/services/customer/`
  - Customer auth: `src/auth/CustomerAuthContext.jsx`
  - Reusable UI: `src/components/ui/`
  - Base HTTP client: `src/services/api.js` (configured with `withCredentials: true`)
- **Shared Files**: Before editing any shared file (`User.php`, `routes/api.php`, config, shared migrations, `App.jsx`, `package.json`), state it clearly and keep changes minimal and non-disruptive.

---

## Working rules for every task

- Show a short plan before writing code, and wait for confirmation if anything is unclear.
- Keep code clean: small focused methods, clear names, no dead code, no commented-out code, no duplicated logic, thin controllers, business logic in service classes, no magic numbers.
- After every task, end with a beginner-friendly "What I changed" summary:
  1. Files created
  2. Files edited and why
  3. Any database change and its seeder
  4. Step-by-step testing instructions
  5. Anything my teammate must do

---

## Rule for every API task

After building any endpoint, the "What I changed" summary must include an **API REFERENCE** section for testing in Bruno. For each endpoint:
- HTTP Method and Full URL (e.g., `POST http://localhost:8000/api/login/customer`).
- Whether login is required.
- Required headers (including `Origin: http://localhost:5173`, `Accept: application/json`, and `X-XSRF-TOKEN` when needed).
- Sample request body (JSON).
- Sample success response (status code and JSON).
- Sample error responses:
  - Validation error (HTTP 422)
  - Unauthorized error (HTTP 401)
  - Forbidden error (HTTP 403)
  - Not Found error (HTTP 404)
- A short list of the Bruno requests created, in the exact sequence to run them.
