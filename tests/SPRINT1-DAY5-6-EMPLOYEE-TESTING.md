# Sprint 1 Day 5-6: Employee Dashboard Testing Guide

## ✅ Features Implemented

1. **API Routes:**
   - `GET /api/v1/orders/today` - Fetch today's order (auto-create if not exists)
   - `POST /api/v1/orders/opt-out` - Toggle order status (eating ↔ not_eating)
   - `GET /api/v1/orders/history` - Fetch order history with pagination

2. **Components:**
   - `CountdownTimer` - Real-time countdown to 5:00 AM
   - `OrderStatusCard` - Display status + opt-out button

3. **Employee Dashboard:**
   - Order status display
   - Opt-out toggle button
   - Countdown timer
   - Quick stats
   - Instructions

4. **Utilities:**
   - Date helpers (GMT+7 timezone)
   - Deadline checking
   - Time calculations

---

## 🧪 Testing Checklist (TC-003 to TC-007)

### Prerequisites:
- [ ] Database có test user (from seed data)
- [ ] Auth flow working (Day 3-4 tests passed)
- [ ] Dev server running
- [ ] Logged in as Employee

---

### Test Case TC-003: View today's order (US-004)

**Steps:**
1. Login as employee
2. Navigate to `/dashboard/employee`
3. Observe order status card

**Expected:**
- Status card shows "HÔM NAY ĂN CƠM" (default)
- Green background
- 🍚 icon
- Date displayed correctly
- Countdown timer shows time until 5:00 AM
- Button enabled (before deadline)

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-004: Opt-out before 5:00 AM (US-005)

**Precondition:** Current time < 5:00 AM GMT+7

**Steps:**
1. Employee Dashboard loaded
2. Current status: "ĂN CƠM"
3. Click button "Hôm nay tôi NGHỈ ĂN"
4. Observe changes

**Expected:**
- Button shows loading spinner
- Status changes to "HÔM NAY NGHỈ ĂN"
- Background changes to red
- Icon changes to ❌
- Alert shows "✅ Đã xác nhận nghỉ ăn"
- Button text changes to "✅ Hủy nghỉ ăn"

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-005: Undo opt-out (toggle back) (US-007)

**Precondition:** 
- Current status: "NGHỈ ĂN"
- Time < 5:00 AM

**Steps:**
1. Click button "Hủy nghỉ ăn"
2. Observe changes

**Expected:**
- Status changes back to "ĂN CƠM"
- Background changes to green
- Icon changes to 🍚
- Alert shows "✅ Đã hủy nghỉ ăn"

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-006: Opt-out after deadline (US-006)

**Precondition:** Current time >= 5:00 AM GMT+7

**Steps:**
1. Wait until after 5:00 AM (or mock system time)
2. Observe dashboard

**Expected:**
- Countdown timer shows "⏰ Đã hết hạn xác nhận"
- Button disabled
- Tooltip/message: "⚠️ Đã hết hạn xác nhận (deadline 5:00 AM)"
- Cannot click button

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-007: Auto-create order (first visit of day)

**Precondition:** No order exists for today in database

**Steps:**
1. Delete today's order from DB (if exists):
   ```sql
   DELETE FROM orders WHERE user_id = '<user_id>' AND date = CURRENT_DATE;
   ```
2. Reload Employee Dashboard
3. Observe behavior

**Expected:**
- API automatically creates order with status = 'eating'
- Dashboard shows "HÔM NAY ĂN CƠM"
- No errors

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-008: Countdown timer real-time update

**Steps:**
1. Observe countdown timer
2. Wait 5 seconds
3. Check if timer updates

**Expected:**
- Seconds count down: 59 → 58 → 57 → ...
- When reaching 00:00:00 → Shows "Đã hết hạn"
- Updates every second

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

### Test Case TC-009: API error handling

**Steps:**
1. Stop Supabase / disconnect database
2. Try to opt-out
3. Observe error handling

**Expected:**
- Loading spinner stops
- Alert shows error message
- Status doesn't change
- No app crash

**Actual Result:**
- [ ] Pass / [ ] Fail
- Notes: ___________________________________

---

## 🐛 Known Issues / Limitations

1. **Timezone:**
   - Uses browser local time converted to GMT+7
   - May have slight drift if system clock incorrect

2. **Alert messages:**
   - Currently using browser `alert()` (basic)
   - Should replace with toast library (v2)

3. **Refresh behavior:**
   - Manual refresh required to see updates
   - Real-time sync not implemented (v2)

4. **History tab:**
   - Link present but not implemented yet
   - Waiting for US-009 full implementation

---

## 📊 API Testing (Manual via Thunder Client / Postman)

### GET /api/v1/orders/today

**Request:**
```
GET http://localhost:3000/api/v1/orders/today
Headers:
  Cookie: <session_cookie>
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "2026-01-21",
  "status": "eating",
  "locked": false,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### POST /api/v1/orders/opt-out

**Request:**
```
POST http://localhost:3000/api/v1/orders/opt-out
Headers:
  Cookie: <session_cookie>
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "status": "not_eating",
  ...
}
```

**Expected Response (403) if after deadline:**
```json
{
  "code": "ERR_DEADLINE_PASSED",
  "message": "Cannot change order after 5:00 AM"
}
```

---

## ✅ Test Results Summary

**Total test cases:** 9  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___

**Date tested:** _______________  
**Tester:** _______________  
**Environment:** Local development

---

## 📸 Screenshots Checklist

- [ ] Employee Dashboard - Eating status (green)
- [ ] Employee Dashboard - Not eating status (red)
- [ ] Countdown timer active
- [ ] Countdown timer expired
- [ ] Button disabled state
- [ ] Mobile responsive view

---

## ✅ Next Steps (Sprint 1 Day 7-8)

- [ ] Build Kitchen Dashboard
- [ ] API: `GET /api/v1/dashboard/kitchen`
- [ ] Components: KitchenSummary, EmployeeTable
- [ ] Real-time auto-refresh
- [ ] Filter/search functionality
- [ ] Test US-013, US-016
