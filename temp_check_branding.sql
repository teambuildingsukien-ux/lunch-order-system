-- Check branding data persisted
SELECT 
  name,
  slug,
  custom_logo_url,
  custom_primary_color,
  custom_secondary_color,
  custom_fonts->>'heading' as heading_font,
  custom_fonts->>'body' as body_font,
  updated_at
FROM tenants
WHERE id = 'c2ffc5dc-f236-46d6-b801-87ace1dd4177';
