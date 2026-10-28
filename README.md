# ShopIT ecommerce demo

## Local setup

Use Node 24.11 or newer and MongoDB configured as a replica set (or Atlas). Checkout uses multi-document transactions; standalone mongod cannot run checkout.

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

## Local MongoDB replica set

The existing local database was converted in place to the single-node development replica set `shopit-rs`. A cold backup is at `C:\data\db-before-shopit-rs-20261028-143209`. Existing data remains in `C:\data\db`.

For subsequent starts, run this in PowerShell (do not start a second process while MongoDB is already running):

```powershell
& "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db" --replSet shopit-rs --bind_ip 127.0.0.1 --port 27017
```

Replica-set initialization is already complete and must not be repeated. Use `mongodb://127.0.0.1:27017/shopIt?replicaSet=shopit-rs` for this existing database, including in Compass. Start MongoDB before the API. A single node enables development transactions but provides no failover redundancy. MongoDB 5.0 remains installed; this configuration change is not a database-version upgrade.

## Production blockers identified in targeted review

This is not a completed penetration test or a production certification. Before deployment:

- Add distributed abuse/rate limits to authentication, password recovery, uploads and checkout creation.
- Revoke existing JWT sessions on password reset/change and provide meaningful server-side logout/revocation.
- Implement signature-verified Stripe webhooks and idempotent reconciliation when a browser closes after payment. Handle paid-but-out-of-stock failures with a reservation or refund/reconciliation policy.
- Upgrade the local MongoDB 5.0 deployment through a supported migration path; use supported Atlas or a properly secured production replica set with database users, TLS, network restrictions and tested backups. The loopback-only development node has no authentication or failover.
- Add and verify deployment security headers/CSP and explicit CSRF/origin protection for cookie-authenticated mutations. SameSite=Lax is already present but is not a complete deployment review.
- Enforce production environment validation and HTTPS. Development responses contain stack traces; production mode suppresses them and enables Secure cookies.
- Verify provider credential rotation after historical exposure, and replace broad Cloudinary Master Admin access with permissions sufficient for required operations.

Stripe creation now uses automatic_payment_methods with allow_redirects=never for the existing card form. Actual uncharged test-mode creation/retrieval response and cancellation passed; full browser card success/decline/3DS verification is still required.
