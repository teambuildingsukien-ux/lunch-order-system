# Apply Platform Owner Migrations
# Run this script to apply all 3 migrations to Supabase database

# Database connection string
$DATABASE_URL = "postgresql://postgres:Congdanh%4079@db.dlekahcgkzfrjyzczxyl.supabase.co:5432/postgres"

Write-Host "🚀 Applying Platform Owner Migrations..." -ForegroundColor Cyan
Write-Host ""

# Migration 1: Add white-label fields to tenants
Write-Host "📝 Migration 1/3: Adding white-label fields to tenants table..." -ForegroundColor Yellow
$migration1 = Get-Content -Path "supabase/migrations/20260201210000_add_whitelabel_fields.sql" -Raw
$migration1 | psql $DATABASE_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration 1 completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration 1 failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""

# Migration 2: Create platform_owners table
Write-Host "📝 Migration 2/3: Creating platform_owners table..." -ForegroundColor Yellow
$migration2 = Get-Content -Path "supabase/migrations/20260201210100_create_platform_owners.sql" -Raw
$migration2 | psql $DATABASE_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration 2 completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration 2 failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""

# Migration 3: Create platform_audit_logs table
Write-Host "📝 Migration 3/3: Creating platform_audit_logs table..." -ForegroundColor Yellow
$migration3 = Get-Content -Path "supabase/migrations/20260201210200_create_platform_audit_logs.sql" -Raw
$migration3 | psql $DATABASE_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration 3 completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration 3 failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "🎉 All migrations applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verifying tables..." -ForegroundColor Cyan

# Verify tables exist
$verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('platform_owners', 'platform_audit_logs')
ORDER BY table_name;
"@

$verifyQuery | psql $DATABASE_URL

Write-Host ""
Write-Host "Done! Check output above to verify tables were created." -ForegroundColor Cyan
