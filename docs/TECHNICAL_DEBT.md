# Technical Debt & Known Issues

## Overview
This document tracks technical debt, known limitations, and planned improvements for the Cơm Ngon system.

---

## 🔴 HIGH Priority

### 1. Next.js 15 Dynamic Route Audit
**Status:** 🔴 Not Started  
**Category:** Breaking Change Compliance  
**Created:** 2026-02-05

**Issue:**  
Next.js 15 introduces breaking change where `params` in dynamic routes must be awaited. Only `/api/admin/employees/[id]` has been updated so far.

**Impact:**  
- Other dynamic routes may fail with `params.id` being `undefined`
- Potential 404 errors across the app

**Files Requiring Audit:**
```bash
# Search for dynamic routes using old pattern
grep -r "{ params }" app/api/**/*.ts
grep -r "{ params }" app/**/page.tsx
```

**Fix Pattern:**
```typescript
// Before
export async function GET(req, { params }: { params: { id: string } }) {
  const id = params.id;
}

// After
export async function GET(req, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
}
```

**Action Items:**
- [ ] Audit all API routes in `app/api/`
- [ ] Audit all dynamic pages in `app/`
- [ ] Update route handlers to await params
- [ ] Test each updated route
- [ ] Update type definitions if using shared types

**Estimated Effort:** 4-6 hours

---

## 🟡 MEDIUM Priority

### 2. Database Schema: shift VARCHAR → shift_id UUID FK
**Status:** 🟡 Design Phase  
**Category:** Technical Debt / Normalization  
**Created:** 2026-02-05

**Issue:**  
The `users` table currently stores `shift` as a **VARCHAR** (shift name) instead of a foreign key to the `shifts` table. This creates:
- Data duplication (shift name stored multiple times)
- No referential integrity (can insert invalid shift names)
- Difficult to update shift names globally
- Cannot enforce shift deletion rules

**Current Schema:**
```sql
CREATE TABLE users (
  shift VARCHAR  -- ❌ Stores "Ca Sáng", "Ca Chiều", etc.
);
```

**Proposed Schema:**
```sql
CREATE TABLE users (
  shift_id UUID REFERENCES shifts(id)  -- ✅ Foreign key
);
```

**Benefits:**
- Data integrity enforced by database
- Easier global updates (change shift name once)
- Can add metadata to shifts (start_time, end_time)
- Type-safe queries with JOINs

**Migration Plan:**
1. Add `shift_id UUID` column to `users` table
2. Migrate existing data:
   ```sql
   UPDATE users u
   SET shift_id = s.id
   FROM shifts s
   WHERE u.shift = s.name;
   ```
3. Update all API endpoints to use `shift_id`
4. Update frontend components (dropdowns, modals)
5. Test thoroughly (especially Edit Employee flow)
6. Drop `shift VARCHAR` column in final migration

**Risks:**
- Breaking change for existing data
- Requires frontend updates
- Must coordinate with shift management features

**Action Items:**
- [ ] Create migration plan document
- [ ] Write migration SQL scripts
- [ ] Update TypeScript types
- [ ] Update API endpoints
- [ ] Update frontend components
- [ ] Comprehensive testing
- [ ] Deploy to staging
- [ ] Monitor for issues
- [ ] Deploy to production

**Estimated Effort:** 2-3 days

---

### 3. Missing E2E Tests for Employee Management
**Status:** 🟡 Not Started  
**Category:** Testing / Quality Assurance  
**Created:** 2026-02-05

**Issue:**  
No automated end-to-end tests exist for employee CRUD operations. Recent bug (role not persisting) went undetected until manual testing.

**Impact:**
- Regressions not caught early
- Manual testing required for each deploy
- Slower development velocity

**Proposed Solution:**  
Add Playwright E2E tests covering:
- ✅ Create employee
- ✅ Edit employee (especially role changes)
- ✅ Delete employee
- ✅ Filter/search employees
- ✅ Custom shift/department creation
- ✅ Multi-tenant isolation (cannot edit other tenant's employees)

**Test Example:**
```typescript
test('Admin can edit employee role and it persists', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Quản trị');
  await page.click('text=Danh sách nhân viên');
  
  const firstEditBtn = page.locator('button[title="Sửa"]').first();
  await firstEditBtn.click();
  
  await page.selectOption('select:nth-of-type(2)', 'manager');
  await page.click('text=Lưu thay đổi');
  
  await expect(page.locator('text=Quản lý')).toBeVisible();
  
  await page.reload();
  await expect(page.locator('text=Quản lý')).toBeVisible(); // ✅ Persists
});
```

**Action Items:**
- [ ] Install Playwright
- [ ] Configure test environment
- [ ] Write employee CRUD tests
- [ ] Add CI/CD integration
- [ ] Document test setup in README

**Estimated Effort:** 1-2 days

---

## 🟢 LOW Priority / Nice to Have

### 4. TypeScript Types from Supabase Schema
**Status:** 🟢 Not Started  
**Category:** Developer Experience  
**Created:** 2026-02-05

**Issue:**  
No auto-generated TypeScript types from Supabase schema. Developers manually define types, risking drift from actual database schema.

**Proposed Solution:**
```bash
npx supabase gen types typescript --project-id hlrbhczmdcxuuofefwtf > types/database.ts
```

**Benefits:**
- Type safety for database queries
- Auto-completion in IDE
- Catch schema mismatches at compile time

**Action Items:**
- [ ] Generate types from Supabase
- [ ] Update imports across codebase
- [ ] Add to build process
- [ ] Document in README

**Estimated Effort:** 4 hours

---

### 5. API Documentation with OpenAPI/Swagger
**Status:** 🟢 Not Started  
**Category:** Documentation  
**Created:** 2026-02-05

**Issue:**  
API docs are in Markdown. No interactive API explorer for developers or third-party integrators.

**Proposed Solution:**  
Create `docs/api/openapi.yaml` and host Swagger UI.

**Benefits:**
- Interactive API testing
- Auto-generated client SDKs
- Better onboarding for new developers

**Action Items:**
- [ ] Write OpenAPI spec
- [ ] Host Swagger UI (Next.js route or static page)
- [ ] Update README with link

**Estimated Effort:** 1 day

---

## 🔵 Monitoring & Observability

### 6. No Error Tracking
**Status:** 🔵 Not Started  
**Category:** Production Monitoring  
**Created:** 2026-02-05

**Issue:**  
No centralized error tracking (e.g., Sentry). Production errors only visible in Vercel logs, which are hard to search.

**Proposed Solution:**  
Integrate Sentry or similar error tracking service.

**Benefits:**
- Real-time error alerts
- Stack traces with source maps
- User context (email, tenant_id)
- Performance monitoring

**Action Items:**
- [ ] Sign up for Sentry
- [ ] Add Sentry SDK to Next.js
- [ ] Configure source maps upload
- [ ] Set up alerts

**Estimated Effort:** 4 hours

---

## Completed Items

### ✅ Employee Edit Bug - Role Not Persisting
**Status:** ✅ FIXED  
**Category:** Critical Bug  
**Completed:** 2026-02-05

**Issue:**  
Employee role changes didn't persist. Modal showed error "Employee not found (404)".

**Root Causes:**
1. Next.js 15: `params` not awaited → `params.id` was undefined
2. Database schema: Using `shift` VARCHAR, but code sent `shift_id` UUID

**Fix:**
- Updated API route to await params
- Reverted frontend/backend to use `shift` name instead of `shift_id`

**Verification:**
- ✅ Role changes persist
- ✅ Modal auto-closes
- ✅ API returns 200 OK
- ✅ No console errors

**Documentation:**
- [Bug Fix Walkthrough](file:///C:/Users/APC/.gemini/antigravity/brain/4476b1a2-af9e-4645-abc8-1dfda5cda56d/employee_edit_bugfix_complete.md)

---

## How to Use This Document

1. **Adding New Items:**
   - Use priority levels: 🔴 HIGH, 🟡 MEDIUM, 🟢 LOW, 🔵 Info
   - Include: Status, Category, Created Date, Issue Description, Action Items, Effort Estimate

2. **Updating Status:**
   - 🔴 Not Started → 🟡 In Progress → 🟢 Testing → ✅ Completed

3. **Review Cadence:**
   - Weekly: Review HIGH priority items
   - Monthly: Triage new items, reprioritize

---

**Last Updated:** 2026-02-05  
**Next Review:** 2026-02-12
