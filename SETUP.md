# Quick Setup Guide - Lunch Order System

## 🚀 Setup Supabase & Run Project

### Option 1: Supabase Local (Recommended cho Dev)

**1. Install Supabase CLI:**
```bash
# If not installed
npm install -g supabase
```

**2. Start Supabase local:**
```bash
cd c:\Users\APC\Downloads\Dua_an_an_trua\lunch-order-system
npx supabase start
```

Lưu output - mày sẽ cần:
- API URL: `http://localhost:54321`
- anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- service_role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**3. Run migrations:**
```bash
npx supabase db push
```

**4. Seed data:**
```bash
npx supabase db seed
```

**5. Create `.env.local`:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_step_2>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_step_2>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Keep these for now (not used in auth flow)
NEXT_PUBLIC_APP_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=not_needed_yet
SENDGRID_API_KEY=not_needed_yet
```

**6. Run dev server:**
```bash
npm run dev
```

Open: `http://localhost:3000`

**7. Test login:**
- Email: `kitchen@company.vn` (from seed data)
- Check inbox: `http://localhost:54324` (Supabase Inbucket)

---

### Option 2: Supabase Cloud

**1. Create project:**
- Go to `https://supabase.com`
- Create new project
- Wait for setup (~2 mins)

**2. Run migrations via SQL Editor:**
- Go to SQL Editor
- Copy-paste content từ `supabase/migrations/` files
- Run theo thứ tự (00001 → 00005)

**3. Run seed:**
- Copy-paste `supabase/seed/seed.sql`
- Run

**4. Get credentials:**
- Settings → API
- Copy: Project URL + anon/public key

**5. Create `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=<your_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
DATABASE_URL=<your_direct_connection_string>
```

**6. Configure Auth:**
- Authentication → Configuration
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`
- Email Templates: Enable magic link

**7. Run:**
```bash
npm run dev
```

---

## 🧪 Testing

Follow: `tests/SPRINT1-DAY3-4-AUTH-TESTING.md`

---

## 🐛 Troubleshooting

**Issue: "Invalid login credentials"**
- Check: Email exists trong `users` table?
- Run seed: `npx supabase db seed`

**Issue: "Failed to fetch"**
- Check: Supabase running? `npx supabase status`
- Check: `.env.local` values correct?

**Issue: Magic link broken**
- Check: Redirect URLs configured?
- Local: Should work automatically
- Cloud: Add `http://localhost:3000/auth/callback` to allowed URLs

**Issue: TypeScript errors**
- Run: `npm install`
- Restart VSCode TypeScript server

---

## ✅ Success Criteria

Auth flow completed khi:
- [ ] Login page accessible (`http://localhost:3000`)
- [ ] Can submit email (valid @company.vn)
- [ ] Magic link received (Inbucket/Email)
- [ ] Clicking link → Redirect to dashboard
- [ ] Dashboard shows user name + role
- [ ] Protected routes require login

---

## 📊 Sprint 1 Day 3-4 Progress

- [x] Database migrations created
- [x] Supabase clients configured
- [x] Login page built
- [x] Auth callback route
- [x] Middleware + protected routes
- [x] Dashboard placeholders
- [ ] **→ Testing auth flow (mày cần test!)**

---

**Ready to test!** 🎯
