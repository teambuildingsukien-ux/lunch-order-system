# Changelog - Cơm Ngon Lunch Order System

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2026-02-05] - Employee Edit Critical Bug Fix

### 🐛 Fixed
- **Employee Edit Popup Not Saving Changes** - CRITICAL BUG
  - Root Cause #1: Next.js 15 breaking change - `params` must be awaited in dynamic API routes
  - Root Cause #2: Database schema mismatch - `shift` VARCHAR vs attempted `shift_id` UUID
  - Fixed API route `PUT /api/admin/employees/[id]` to await params context
  - Reverted frontend and backend to use `shift` name instead of `shift_id`
  - All employee fields now save correctly
  - Role changes now persist after page reload

### 🔧 Changed
- Updated `app/api/admin/employees/[id]/route.ts`:
  - Function signature now accepts `context: { params: Promise<{ id: string }> }`
  - Added `const params = await context.params` per Next.js 15 requirements
  - Reverted `shift_id` → `shift` to match database schema
  
- Updated `EditEmployeeModal.tsx`:
  - Dropdown now uses `shift.name` values instead of `shift.id`
  - Modal initialization loads `employee.shift` instead of `employee.shift_id`
  - API request sends `shift` name (string) to match VARCHAR column

### 📚 Documentation
- Created comprehensive bug fix walkthrough: `employee_edit_bugfix_complete.md`
- Documented Next.js 15 migration pattern for dynamic routes
- Added task checklist tracking all fix phases

### ✅ Verified
- Role changes persist correctly (Admin → Manager tested)
- Modal auto-closes on successful save
- API returns 200 OK with no errors
- Multi-tenant isolation remains intact (RLS policies unaffected)

**Impact:** HIGH - Restores critical employee management functionality

---

## Next Release Planning

### 🔮 Recommended Improvements
- [ ] Audit all dynamic API routes for Next.js 15 compliance
- [ ] Consider database migration: `shift VARCHAR` → `shift_id UUID FK` for normalization
- [ ] Add Playwright E2E tests for employee CRUD operations
- [ ] Generate TypeScript types from Supabase schema for type safety

---

## Known Issues
None currently blocking production deployment.

---

## Version History Reference
- **v3.2** - Current SaaS Platform (Multi-tenant)
- **v2.1** - Enhanced Premium Version
- **v2.0** - Premium Version
- **v1.0** - Initial MVP
