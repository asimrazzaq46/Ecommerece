# ShopIT ecommerce demo

## Local setup

Use Node 24.11 or newer and a running local MongoDB server.

1. Run `npm ci` and `npm --prefix client ci`.
2. Copy `server/config/config.env.example` to `server/config/config.env` and supply your own credentials. The real file is ignored by Git.
3. Configure MongoDB, a random JWT secret, Cloudinary credentials with image upload/delete permissions, Stripe test keys and SMTP credentials. Set FRONTEND_URL to http://127.0.0.1:3000 for local use.
4. Run `npm run dev` for the API on port 3002 and `npm --prefix client start` in another terminal for Vite on port 3000.
5. Open http://127.0.0.1:3000.

Custom avatars upload to Cloudinary only. Omitting an avatar uses the bundled default image. There is no local upload fallback. Previously exposed credentials must be rotated at their providers; removing them from Git does not revoke them.

## Demo catalog

`npm run seeder -- --dry-run` validates the 60-product catalog. `npm run seeder` inserts missing products without overwriting existing stock, reviews or edits. An existing admin is required; SEED_USER_ID can select that admin. The catalog spans 11 categories and prices from $1.49 to $2,999.99. Additional demo images come from DummyJSON; image URLs and sources are recorded in the catalog.

## Verification commands

- `npm test`: backend and frontend unit/regression suites; external services mocked.
- `npm run test:database`: disposable database on the local MongoDB server.
- `npm run test:e2e`: temporary MongoDB replica set and API/build integration checks; Stripe, Cloudinary and email mocked. Requires a mongod executable; MONGOD_PATH can override its path.
- `npm --prefix client run build`: production frontend in client/build. Deployment must serve this directory, fall back to index.html for client routes and forward /api to the backend; the API start command alone does not serve the frontend.

## Verified status — 2026-10-28

138 unit/regression tests, API integration checks and production build pass. Live Cloudinary upload, image retrieval, deletion, multipart registration and authenticated profile retrieval were verified with a disposable account and image, then cleaned up. Browser catalog/category/price/empty-result flows and Vite connection were checked previously.

The complete nine-step plan is not yet finished:

- React/Vite/router upgrades and RTK store/cart are implemented. TanStack Query covers catalog/product details/admin product listing and review creation. Remaining user/order/admin mutations still use Redux actions/reducers; completing that migration and removing obsolete reducers remain.
- Automated payment checks cover mocked success/failure and order safeguards. Real Stripe test-mode success/decline/retry checks and real SMTP delivery remain unverified.
- Full mobile, keyboard/focus and all admin browser workflows still need a systematic verification pass.
- No node_modules files are tracked. Git commits and synchronization are handled by the owner. Provider credential rotation and deployment readiness are not certified by these checks.
