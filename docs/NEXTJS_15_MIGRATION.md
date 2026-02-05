# Next.js 15 Migration Guide

## Overview
This document tracks the migration from Next.js 14 to Next.js 15 for the Cơm Ngon project.

**Migration Status:** 🟡 IN PROGRESS  
**Started:** 2026-02-05  
**Target Completion:** TBD

---

## Breaking Changes

### 1. 🔴 CRITICAL: `params` is now a Promise in Dynamic Routes

**Affected Files:** All API routes and pages using dynamic segments `[id]`, `[slug]`, etc.

#### The Change

In Next.js 15, `params` and `searchParams` are now **Promises** and must be awaited.

**Why?**  
- Improves performance for static generation
- Aligns with React's async component model
- Prepares for future partial prerendering features

**Official Docs:** [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)

---

#### Migration Pattern

##### API Route Handlers

**❌ Old (Next.js 14):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id; // Direct access
  // ...
}
```

**✅ New (Next.js 15):**
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params; // Must await!
  const userId = params.id;
  // ...
}
```

##### Page Components

**❌ Old (Next.js 14):**
```typescript
export default function ProductPage({
  params
}: {
  params: { slug: string }
}) {
  return <div>Product: {params.slug}</div>;
}
```

**✅ New (Next.js 15):**
```typescript
export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params; // Must await!
  return <div>Product: {slug}</div>;
}
```

---

### 2. Common Pitfalls

#### ❌ Pitfall #1: Destructuring Without Await
```typescript
// ❌ WRONG - params is still a Promise!
export async function PUT(req, { params }: { params: Promise<{ id: string }> }) {
  const id = params.id; // TypeError: Cannot read property 'id' of Promise
}

// ✅ CORRECT
export async function PUT(req, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
}
```

#### ❌ Pitfall #2: Forgetting to Make Page/Route Async
```typescript
// ❌ WRONG - Cannot await in non-async function
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // SyntaxError
}

// ✅ CORRECT - Must be async
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

#### ❌ Pitfall #3: Optional Chaining on Promise
```typescript
// ❌ WRONG - Cannot use ?. on Promise
export async function PUT(req, { params }: { params: Promise<{ id: string }> }) {
  const id = params?.id; // Still a Promise!
}

// ✅ CORRECT
export async function PUT(req, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params?.id;
}
```

---

## Migration Checklist

### Phase 1: API Routes ✅ 1/X Completed

- [x] ✅ `app/api/admin/employees/[id]/route.ts` - FIXED 2026-02-05
- [ ] `app/api/admin/employees/[id]/DELETE`
- [ ] `app/api/meals/[id]/route.ts`
- [ ] `app/api/orders/[id]/route.ts`
- [ ] `app/api/announcements/[id]/route.ts`
- [ ] ... (to be audited)

**How to Find All:**
```bash
# Search for dynamic API routes
find app/api -name "[*]" -type d

# Search for old pattern in route handlers
grep -r "{ params }" app/api/**/route.ts
```

---

### Phase 2: Dynamic Pages

- [ ] `app/dashboard/[tenant]/page.tsx`
- [ ] `app/products/[slug]/page.tsx`
- [ ] ... (to be audited)

**How to Find All:**
```bash
# Search for dynamic pages
find app -name "[*]" -type d | grep -v api

# Search for old pattern in pages
grep -r "{ params }" app/**/page.tsx
```

---

### Phase 3: Layouts with Dynamic Segments

- [ ] `app/dashboard/[tenant]/layout.tsx`
- [ ] ... (to be audited)

---

### Phase 4: generateMetadata Functions

Dynamic pages using `generateMetadata` also need updates:

**❌ Old:**
```typescript
export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Product ${params.id}` };
}
```

**✅ New:**
```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Product ${id}` };
}
```

---

## Testing Strategy

### Manual Testing Checklist

For each updated route/page:
1. ✅ Code compiles without TypeScript errors
2. ✅ Route loads successfully in browser
3. ✅ Dynamic parameter is correctly extracted
4. ✅ Data fetching works (no 404s from undefined IDs)
5. ✅ No runtime errors in console
6. ✅ Page/API behavior matches pre-migration

### Automated Testing

**Add Playwright test for each critical flow:**
```typescript
test('Employee edit uses correct ID from params', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Quản trị');
  await page.click('button[title="Sửa"]').first();
  
  // Capture API request
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/admin/employees/')),
    page.click('text=Lưu thay đổi')
  ]);
  
  expect(response.status()).toBe(200); // Not 404!
});
```

---

## Rollback Plan

If critical issues arise:

1. **Verify Next.js version:**
   ```bash
   npm list next
   ```

2. **Downgrade if needed:**
   ```json
   // package.json
   {
     "dependencies": {
       "next": "14.2.x" // Revert to 14
     }
   }
   ```

3. **Reinstall:**
   ```bash
   npm install
   ```

4. **Revert code changes:**
   ```bash
   git revert [commit-hash]
   ```

---

## Known Issues & Workarounds

### Issue #1: Employee Edit 404 Error
**Status:** ✅ FIXED (2026-02-05)

**Problem:**  
`PUT /api/admin/employees/[id]` returned 404 because `params.id` was undefined.

**Solution:**  
Updated route to await params:
```typescript
export async function PUT(req, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const employeeId = params.id;
}
```

**Files Changed:**
- `app/api/admin/employees/[id]/route.ts`

**Reference:** [Bug Fix Walkthrough](file:///C:/Users/APC/.gemini/antigravity/brain/4476b1a2-af9e-4645-abc8-1dfda5cda56d/employee_edit_bugfix_complete.md)

---

## Performance Considerations

### Before (Next.js 14)
- `params` available synchronously
- Immediate access to dynamic segments

### After (Next.js 15)
- `params` requires async operation
- May add ~1-5ms overhead per request
- **Trade-off:** Better static optimization, future React features

**Impact:** Negligible for most routes. Monitor if experiencing latency issues.

---

## Future Next.js Features Enabled

By migrating to async params, the project is now ready for:
- ✅ Partial Prerendering (PPR)
- ✅ React Server Components optimizations
- ✅ Improved static generation

---

## Resources

- [Next.js 15 Release Blog](https://nextjs.org/blog/next-15)
- [Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Codemod Tool](https://nextjs.org/docs/app/building-your-application/upgrading/codemods) (automates migration)

**Codemod Example:**
```bash
npx @next/codemod@latest upgrade latest
```

---

## Migration Progress

**Last Updated:** 2026-02-05

| Phase | Status | Completed | Total | %
|-------|--------|-----------|-------|---
| API Routes | 🟡 In Progress | 1 | ~15 | 7%
| Dynamic Pages | 🔴 Not Started | 0 | ~5 | 0%
| Layouts | 🔴 Not Started | 0 | ~2 | 0%
| Metadata | 🔴 Not Started | 0 | ~3 | 0%

**Overall:** 🟡 **4% Complete**

---

**Next Steps:**
1. Complete audit of all dynamic routes
2. Update remaining API handlers
3. Test each updated route
4. Update dynamic pages
5. Full regression testing
6. Deploy to staging
7. Monitor for issues
8. Deploy to production
