# API Documentation - Admin Employee Management

## Overview
API endpoints for managing employees in the Cơm Ngon multi-tenant lunch order system.

**Base URL:** `http://localhost:3000/api` (Development)  
**Authentication:** Required - Supabase JWT token via cookies  
**Authorization:** Admin or Manager roles only

---

## Authentication

All endpoints require a valid Supabase session. The API uses server-side cookie authentication via `@/lib/supabase/server` client.

**Headers Required:**
- `Content-Type: application/json`
- Cookies automatically sent by browser (Supabase session)

**Error Responses:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - User lacks required role (admin/manager)

---

## Endpoints

### 1. List Employees
**`GET /api/admin/employees`**

Retrieve all employees in the current user's tenant.

**Authorization:** Admin or Manager

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "employees": [
    {
      "id": "uuid",
      "email": "employee@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "employee",
      "employee_code": "EMP001",
      "shift": "Ca Sáng",
      "department": "Kinh Doanh",
      "group_id": "uuid",
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 50
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not admin/manager

---

### 2. Create Employee
**`POST /api/admin/employees`**

Add a new employee to the system.

**Authorization:** Admin only

**Request Body:**
```json
{
  "email": "new.employee@example.com",
  "full_name": "Trần Thị B",
  "password": "SecurePassword123!",
  "role": "employee",
  "employee_code": "EMP002",
  "shift": "Ca Chiều",
  "department": "Marketing",
  "group_id": "uuid-of-meal-group"
}
```

**Required Fields:**
- `email` (valid email format)
- `full_name` (non-empty string)
- `password` (min 6 characters)
- `role` (one of: `employee`, `manager`, `admin`)

**Optional Fields:**
- `employee_code` (string)
- `shift` (VARCHAR - shift name, e.g., "Ca Sáng")
- `department` (string)
- `group_id` (UUID - meal group assignment)

**Response (201 Created):**
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "email": "new.employee@example.com",
    "full_name": "Trần Thị B",
    "role": "employee"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing required fields, invalid email, etc.)
- `403` - Not admin
- `409` - Email already exists

---

### 3. Update Employee ⚠️ Recently Fixed
**`PUT /api/admin/employees/[id]`**

Update an existing employee's information.

**Authorization:** Admin or Manager

**⚠️ IMPORTANT - Next.js 15 Compatibility:**
This endpoint was recently updated to support Next.js 15's async `params` pattern. The route handler now awaits the `params` Promise before accessing the employee ID.

**URL Parameters:**
- `id` (UUID) - Employee ID to update

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn A (Updated)",
  "role": "manager",
  "employee_code": "EMP001-NEW",
  "shift": "Ca Tối",
  "department": "IT",
  "group_id": "uuid-of-new-meal-group"
}
```

**Required Fields:**
- `full_name` (non-empty string)

**Optional Fields (all):**
- `role` (one of: `employee`, `manager`, `admin`)
- `employee_code` (string or null)
- `shift` (VARCHAR - shift **name**, NOT UUID)
- `department` (string or null)
- `group_id` (UUID or null)

**⚠️ CRITICAL:** The `shift` field expects a **shift name** (VARCHAR), not a `shift_id` (UUID). This matches the current database schema where the `users` table has a `shift VARCHAR` column.

**Response (200 OK):**
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "email": "employee@example.com",
    "full_name": "Nguyễn Văn A (Updated)",
    "role": "manager",
    "shift": "Ca Tối",
    "department": "IT"
  }
}
```

**Error Responses:**
- `400` - Validation error (e.g., `full_name` missing)
- `403` - Not admin/manager
- `404` - Employee not found (or not in same tenant)
- `500` - Database error (e.g., column mismatch)

**Technical Notes:**
- Uses tenant isolation via RLS policies
- Prevents admin role changes for non-admin users
- Automatically trims string values
- Allows setting fields to `null` for optional fields

---

### 4. Delete Employee
**`DELETE /api/admin/employees/[id]`**

Remove an employee from the system.

**Authorization:** Admin only

**URL Parameters:**
- `id` (UUID) - Employee ID to delete

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Error Responses:**
- `403` - Not admin
- `404` - Employee not found
- `409` - Cannot delete (e.g., has pending orders)

---

### 5. Get Unassigned Employees
**`GET /api/admin/employees/unassigned`**

Retrieve employees not assigned to any meal group.

**Authorization:** Admin or Manager

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "employees": [
    {
      "id": "uuid",
      "full_name": "Nguyễn Văn C",
      "email": "nvc@example.com",
      "department": "HR",
      "group_id": null
    }
  ],
  "total": 5
}
```

---

## Database Schema Reference

### `users` Table (Employee Data)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  employee_code VARCHAR,
  shift VARCHAR,  -- ⚠️ NOT shift_id! Stores shift name directly
  department VARCHAR,
  group_id UUID REFERENCES meal_groups(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Notes:**
- `shift` is a **VARCHAR** field storing the shift name (e.g., "Ca Sáng")
- It is **NOT** a foreign key to the `shifts` table
- This differs from normalized design but matches current production schema

---

## RLS (Row-Level Security) Policies

All employee endpoints enforce tenant isolation via Supabase RLS:

1. **SELECT Policy:** Users can only view employees in their own tenant
2. **INSERT Policy:** Only admins can create employees, restricted to their tenant
3. **UPDATE Policy:** Admins/managers can update employees in their tenant
4. **DELETE Policy:** Only admins can delete, restricted to their tenant

**Policy Example:**
```sql
CREATE POLICY "Users can view employees in same tenant"
ON users FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

---

## Error Codes Summary

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields, invalid format |
| 401 | Unauthorized | No valid session cookie |
| 403 | Forbidden | Insufficient role (not admin/manager) |
| 404 | Not Found | Employee ID doesn't exist or wrong tenant |
| 409 | Conflict | Email already exists, cannot delete |
| 500 | Internal Error | Database error, schema mismatch |

---

## Next.js 15 Migration Notes

### Dynamic Route Params Pattern (Updated 2026-02-05)

**Problem:** In Next.js 15, `params` in API routes is now a `Promise` and must be awaited.

**Old Pattern (Next.js 14):**
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const employeeId = params.id; // ❌ undefined in Next.js 15
}
```

**New Pattern (Next.js 15):**
```typescript
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params; // ✅ Must await
  const employeeId = params.id;
}
```

**Impact:** All dynamic API routes (`/api/[...path]/route.ts`) must be updated to await params.

---

## Testing

### Manual Testing (Postman/cURL)
```bash
# Get all employees
curl http://localhost:3000/api/admin/employees \
  -H "Cookie: sb-access-token=..." \
  -H "Cookie: sb-refresh-token=..."

# Update employee
curl -X PUT http://localhost:3000/api/admin/employees/[id] \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"full_name": "Test User", "role": "manager", "shift": "Ca Sáng"}'
```

### Browser DevTools
```javascript
// Update employee via console
await fetch('/api/admin/employees/[id]', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'Test User',
    role: 'manager',
    shift: 'Ca Sáng'
  })
}).then(r => r.json()).then(console.log);
```

---

## Changelog
- **2026-02-05:** Fixed `PUT /api/admin/employees/[id]` for Next.js 15 compatibility
- **2026-02-05:** Clarified `shift` field is VARCHAR (name), not UUID (shift_id)
- **2026-01-31:** Initial API documentation created

---

**Last Updated:** 2026-02-05  
**Maintained By:** Development Team
