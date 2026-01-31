@echo off
REM Script to add environment variables to Vercel Production

echo Adding NEXT_PUBLIC_SUPABASE_URL...
echo https://dlekahcgkzfrjyzczxyl.supabase.co | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo.
echo Adding NEXT_PUBLIC_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWthaGNna3pmcmp5emN6eHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzIyNjQsImV4cCI6MjA4NDU0ODI2NH0.sN_orjZ_pd9SsxB1mYDUX3f81uSOO3tCSpx9nJYG-YY | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo.
echo Adding SUPABASE_SERVICE_ROLE_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWthaGNna3pmcmp5emN6eHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk3MjI2NCwiZXhwIjoyMDg0NTQ4MjY0fQ.3Z79U1tIlHj7311D1bUPm2LW4vryQfZqMvNH5Y7Qn2Q | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo.
echo Adding DATABASE_URL...
echo postgresql://postgres:Congdanh%%4079@db.dlekahcgkzfrjyzczxyl.supabase.co:5432/postgres | vercel env add DATABASE_URL production

echo.
echo Adding NEXT_PUBLIC_APP_URL...
echo https://lunch-order-system-beryl.vercel.app | vercel env add NEXT_PUBLIC_APP_URL production

echo.
echo Adding NEXT_PUBLIC_TIMEZONE...
echo Asia/Ho_Chi_Minh | vercel env add NEXT_PUBLIC_TIMEZONE production

echo.
echo Adding CRON_SECRET...
echo prod_cron_secret_2026_lunch_order | vercel env add CRON_SECRET production

echo.
echo Adding RATE_LIMIT_MAX_REQUESTS...
echo 60 | vercel env add RATE_LIMIT_MAX_REQUESTS production

echo.
echo Adding RATE_LIMIT_WINDOW_MS...
echo 60000 | vercel env add RATE_LIMIT_WINDOW_MS production

echo.
echo ===================================
echo All environment variables added!
echo Now run: vercel --prod
echo ===================================
