# Regulars: project context

Regulars is a multi-tenant digital loyalty platform for local businesses in Nepal (cafes, salons, gyms). It replaces paper stamp cards. Responsive web app, no mobile app.

## Stack
- backend/: Laravel 13, MySQL, Sanctum, Pest
- frontend/: React (JavaScript), React Router, Tailwind CSS, Font Awesome, Zod, Axios
- API testing: Bruno (collection in /bruno at the repo root)
- Two developers, one repo, feature branches, pull requests to main

## How the product works (IMPORTANT, read carefully)
1. Each merchant has ONE permanent QR code, printed and placed at the counter. There is NO rotating QR and NO per-visit scanning by customers.
2. The QR is used for joining. A customer scans it with the phone camera, the Regulars website opens at /join/{merchantSlug}, the customer logs in or registers by email magic link, and becomes a member of that merchant's loyalty program(s). A new customer card is created for each eligible active program.
3. After joining, the CUSTOMER DOES NOTHING at the counter. The MERCHANT records each visit (and purchases) from the merchant dashboard. The backend then awards stamps and updates the streak.
4. The customer logs in to Regulars any time to view their wallet: cards from all merchants, stamp progress, streaks, vouchers, offers, and visit history.
5. The merchant redeems vouchers in their dashboard. The customer only shows the voucher code.

## My role: Dev A (customer experience)
I own the customer side end to end: React screens, Laravel API, database queries, validation, Bruno and Pest tests. This covers: magic-link login and registration, joining a merchant through the QR, customer profile, wallet, card detail, streak and visit history display, voucher list and detail, promo-code entry, offer claiming. My teammate (Dev B) owns merchant features (program setup, QR generation, recording visits and purchases, voucher redemption, offers and promo campaigns). Do not edit their modules unless I say so.
Shared logic: the code that awards stamps and updates streaks after a merchant records a visit is shared. It must follow the merchant's configured rules, be one reusable service, and be agreed with my teammate before anyone writes it.

## Database rules
- The database is already set up. Read the existing migrations and models first.
- Do NOT change existing tables or migrations unless truly necessary.
- If a change is necessary: create a NEW migration (never edit old ones), explain why, and add or update a seeder so my teammate can run php artisan migrate --seed and get the same data.
- Never commit .env, vendor/ or node_modules/.

## Business rules
1. One user account has one role: customer, merchant or superadmin.
2. Customers never choose loyalty programs. The backend finds eligible programs from the rules merchants configured.
3. Existing stamp cards keep the program version they started with.
4. One active card per customer per loyalty program.
5. At most one qualifying visit stamp per day per merchant. No duplicates, even with two simultaneous requests (transaction plus row lock).
6. Streaks are per customer per merchant. Consecutive merchant-local calendar days extend it, several visits on one day count once, a missed day resets it, the longest streak is kept.
7. All date logic uses the merchant's timezone (default Asia/Kathmandu), never the server clock.
8. Every visit attempt is recorded, including rejected ones, with a reason.
9. Suspended merchants cannot award stamps or accept new members.
10. A completed card creates a voucher with a unique code, a snapshot of the reward, and 30 days validity. A voucher can be redeemed once.
11. Targeted offers must be claimed first. The voucher is created at claim time and its validity starts then.
12. Promo code entry is limited to 5 attempts per minute per user. Codes are single-use or shared with a use limit.
13. Customers can only see their own data. Joining the same merchant twice must not create duplicate cards.

## Decisions
- Auth: Sanctum personal access tokens, 90-day expiry. Customer accounts are created automatically when an unknown email requests a magic link.
- Magic link verify is POST /api/auth/magic-link/verify. The emailed link opens a React page (/auth/verify?token=...), which calls this endpoint. In local development the link is written to storage/logs/laravel.log.
- QR content: {FRONTEND_URL}/join/{merchantSlug}. The page asks the backend to join this merchant for the logged-in customer.
- Response format for every endpoint: { success, data, message }.

## UI rules
- Follow the look of the existing landing page. Where it differs from the rules below, tell me before choosing.
- White page background. White cards with NO border, only a soft shadow.
- Primary color red #A51D27 for main buttons and key actions. Secondary colors: cream #F4F0EA and dark brown #23140c (text and ALL icons).
- Clean, calm, plain. No gradients, glassmorphism, emojis or decorative blobs. Short, human copy.
- Mobile-first, works at 360px width, buttons at least 44px tall, visible focus states.
- Reusable components for Button (all variants) and Logo (the word "regulars" with a fire icon). Use them everywhere. Never write a button or logo inline.
- Every list needs loading, empty and error states.

## Naming rules (avoid clashes with Dev B)
- Backend: everything I create goes in a Customer namespace or folder: App\Http\Controllers\Api\Customer\, App\Http\Requests\Customer\, App\Http\Resources\Customer\, App\Services\Customer\. Class names carry customer meaning, for example CustomerWalletController.
- Routes: routes/api/customer.php and routes/api/auth.php, with only one include line each added in routes/api.php. Every customer URL starts with /api/customer/. Never create or edit /api/merchant/ or /api/admin/ routes.
- Tests: tests/Feature/Customer/. Bruno: /bruno/customer/ and /bruno/auth/.
- Frontend: src/pages/customer/, src/components/customer/, src/services/customer/. Shared UI (Button, Logo, Card, Input, Tag) lives in src/components/ui/. api.js lives in src/services/.
- Before editing any shared file (User model, routes/api.php, config, shared migrations, package.json), list it and say why. Keep shared-file edits minimal.

## Working rules for every task
- Show a short plan before writing code, and wait if anything is unclear.
- Keep code clean: small focused methods, clear names, no dead code, no commented-out code, no duplicated logic, thin controllers, business logic in service classes, no magic numbers (use constants or config).
- After every task, end with a "What I changed" summary written for a beginner: (1) files created, (2) files edited and why, (3) any database change and its seeder, (4) how to test it step by step, (5) anything my teammate must do.


## Decisions (added)
- Joining a merchant = a user_merchant_stats row plus one active stamp card per active program of that merchant. No new membership table. Joining twice must not create duplicates.
- Merchants find a customer by phone number or by customer_code. Customers see their customer_code in the wallet.
- Stamp awarding and streak updating are written by Dev B (my teammate). My code only reads their results. I must not write that logic.
- UI: reuse the landing page's existing Tailwind @theme tokens (brand, blush, ink, ink-soft) and its fonts (Bricolage Grotesque for headings and logo, DM Sans for body). Do not introduce new hex colors. White cards with no border and a soft shadow.
