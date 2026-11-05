# Regulars: project context

Regulars is a multi-tenant digital loyalty platform for local businesses in Nepal (cafes, salons, gyms). Customers scan a QR code with their phone camera, collect stamps, build visit streaks, and earn vouchers. Merchants manage loyalty programs and redeem vouchers. It is a responsive web app, no mobile app.

## Stack
- backend/: Laravel 13, MySQL, Sanctum, Pest
- frontend/: React (JavaScript), React Router, Tailwind CSS, Font Awesome (react-fontawesome), Zod, Axios
- API testing: Bruno (collection in /bruno at the repo root)
- Two developers, one repo, feature branches, pull requests to main

## My role: Dev A (customer experience)
I own the customer side end to end: React screens, Laravel API, database queries, validation, Bruno and Pest tests. This covers: magic-link login, customer profile, wallet, stamp card progress and streaks, QR visit page and result, voucher list and detail, promo-code entry, offer claiming. My teammate (Dev B) owns merchant features and loyalty program setup. Do not edit their modules unless I say so.

## Database rules
- The database is already set up. Read the existing migrations and models first.
- Do NOT change existing tables or migrations unless truly necessary.
- If a change is necessary: create a NEW migration (never edit old ones), explain why, and add or update a seeder so my teammate can run php artisan migrate --seed and get the same data.
- Never commit .env, vendor/ or node_modules/.

## Business rules
1. One user account has one role: customer, merchant or superadmin.
2. Customers never choose loyalty programs. The backend finds eligible programs from the rules merchants configured. The customer module must not invent loyalty rules.
3. Existing stamp cards keep the program version they started with.
4. One active card per customer per loyalty program.
5. A customer earns at most one qualifying visit stamp per day per merchant. No duplicates, even with two simultaneous requests (use a transaction and a row lock).
6. Streaks are per customer per merchant. Consecutive merchant-local calendar days extend it, several scans on one day count once, a missed day resets it, the longest streak is kept.
7. All date logic uses the merchant's timezone (default Asia/Kathmandu), never the server clock.
8. Every visit attempt is recorded, including rejected ones, with a reason (for example: already stamped today, QR expired, merchant suspended).
9. Suspended merchants cannot award stamps.
10. A completed card creates a voucher with a unique code, a snapshot of the reward, and 30 days validity. A voucher can be redeemed once.
11. Targeted offers must be claimed first. The voucher is created at claim time and its validity starts then.
12. Promo code entry is limited to 5 attempts per minute per user. Codes are single-use or shared with a use limit.
13. QR types: permanent (printed) and rotating (token valid 5 minutes, refreshed every 2).
14. Customers can only see their own data.

## UI rules
- White page background. White cards with NO border, only a soft shadow (for example shadow-sm or 0 2px 12px rgba(35,20,12,0.08)).
- Primary color red #A51D27 for main buttons and key actions.
- Secondary colors: cream #F4F0EA (soft sections, tags, hover/selected areas) and dark brown #23140c (text and ALL icons).
- Clean, calm, plain. No gradients, glassmorphism, emojis or decorative blobs. Short, human copy.
- Mobile-first. Must work at 360px width on a cheap Android phone. Buttons at least 44px tall. Visible focus states.
- Reusable components for Button and Logo. The logo is the word "regulars" with a fire icon (like a streak flame).
- Every list needs loading, empty and error states.

## Code rules
- API calls only in frontend/src/services/, never directly in components.
- Zod schemas in frontend/src/lib/.
- Backend: controllers stay thin, business logic in service classes, input validation with Form Requests, JSON responses in one consistent format.
- Every important rule gets a Pest test. Every endpoint gets a Bruno request.

