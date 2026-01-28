# Lunch Order Management System

Hệ thống quản lý đặt cơm trưa tự động cho công ty với mô hình opt-out (mặc định ăn, chỉ báo khi nghỉ).

## 🎯 Features (MVP v1.0)

- ✅ **Auth:** Magic link login (Supabase)
- ✅ **Employee Dashboard:** Opt-out flow, countdown timer, order history
- ✅ **Kitchen Dashboard:** Real-time orders summary, filtering
- ✅ **Manager Dashboard:** KPIs (waste rate, cost savings), trend charts
- ✅ **Admin Panel:** User management, CSV bulk import
- ✅ **Automation:** Daily cron jobs (create orders, lock, Telegram notifications)

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Vercel
- **Notifications:** Telegram Bot API + SendGrid (email fallback)

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` và điền values:

```bash
cp .env.local.example .env.local
```

**Required ENV vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Telegram Bot token
- `SENDGRID_API_KEY` - SendGrid API key

### 3. Database Setup (Supabase)

**Option A: Using Supabase CLI (Local development)**

```bash
npx supabase init
npx supabase start
npx supabase db push
npx supabase db seed
```

**Option B: Using Supabase Dashboard (Cloud)**

1. Create Supabase project
2. Go to SQL Editor
3. Run migration files từ `supabase/migrations/` theo thứ tự:
   - `20260121000001_create_users.sql`
   - `20260121000002_create_orders.sql`
   - `20260121000003_create_notification_logs.sql`
   - `20260121000004_create_import_logs.sql`
   - `20260121000005_create_triggers.sql`
4. Run seed file: `supabase/seed/seed.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
/app                    # Next.js App Router pages
  /api                  # API routes
  /dashboard            # Dashboard pages (employee/kitchen/manager)
  /admin                # Admin panel
/components             # React components
  /ui                   # Shadcn UI components
  /dashboard            # Dashboard-specific components
 /admin                # Admin-specific components
/lib                   # Utilities
  /supabase            # Supabase clients
  /utils               # Helper functions
  /telegram            # Telegram Bot client
/types                 # TypeScript types
/hooks                 # Custom React hooks
/supabase              # Database
  /migrations          # SQL migration files
  /seed                # Seed data
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (manual for MVP)
# Follow test cases in planning docs
```

## 📚 Documentation

Planning documents tại `.agent/brain/`:
- `00-Project-Map.md` - System overview
- `01-Product-Brief.md` - Business requirements
- `07-DataModel-ERD.md` - Database schema
- `08-API-Contract.md` - API specifications
- `IMPLEMENTATION-PLAN.md` - Development roadmap

## 🚀 Deployment

**Vercel (Automatic):**

```bash
git push origin main  # Auto-deploy to production
git push origin develop  # Auto-deploy to staging
```

**Environment:**
- Production: `https://lunch.company.vn`
- Staging: `https://staging.lunch-order.company.vn

## 📝 Sprint Progress

- [x] Sprint 1 Day 1-2: Project setup ✅
- [ ] Sprint 1 Day 3-4: Auth + Database
- [ ] Sprint 1 Day 5-6: Employee Dashboard
- [ ] Sprint 1 Day 7-8: Kitchen Dashboard
- [ ] Sprint 2: Analytics + Admin
- [ ] Sprint 3: UAT + Production deploy

## 📄 License

Internal company project - Proprietary
