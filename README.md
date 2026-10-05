# EarningCryptoEH

Full-stack starter for a crypto/earning platform.

## Included
- Responsive public landing page
- Registration/login
- User dashboard
- Balance and transaction records
- Deposit/withdrawal request workflow
- Referral code generation
- Admin dashboard
- SQLite database
- Password hashing
- JWT authentication

## Run
1. Install Node.js 20+
2. `npm install`
3. Copy `.env.example` to `.env` and change secrets
4. `npm start`
5. Open http://localhost:3000

## Production notes
This project intentionally does NOT implement custody of real cryptocurrency, guaranteed returns, or automatic investment payouts. Before enabling real deposits/withdrawals, connect a licensed payment/crypto provider and implement KYC/AML, sanctions screening, audit logging, rate limiting, CSRF protection, secure headers, backups, monitoring, and the legal/compliance requirements applicable to your jurisdiction.

## UI routes
- `/` public site
- `/dashboard` user dashboard
- `/admin` admin dashboard (use the email configured in `ADMIN_EMAIL`)
