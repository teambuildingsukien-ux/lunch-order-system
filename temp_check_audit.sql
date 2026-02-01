-- Check audit logs
SELECT 
  action,
  target_tenant_id,
  details->>'tenant_name' as tenant_name,
  details,
  ip_address,
  created_at
FROM platform_audit_logs
ORDER BY created_at DESC
LIMIT 10;
