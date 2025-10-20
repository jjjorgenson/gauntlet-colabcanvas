# How to Check Supabase for AI-Created Shapes

## Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your CanvasCollab project

## Step 2: Check Shapes Table
1. Click "Table Editor" in the left sidebar
2. Click on the "shapes" table
3. Look for recent rows with:
   - `created_at` timestamp from when you ran AI commands
   - `type` = 'circle', 'rectangle', or 'text'
   - `x` = 200, `y` = 200 (from AI API)
   - `width` = 100, `height` = 100

## Step 3: What to Look For
- **If rows exist**: Shapes are being created in database ✅
- **If no rows**: Database insertion is failing ❌
- **Check `created_by` field**: Should match your user ID
- **Check `color` field**: Should be the color from AI command

## Step 4: Test Query
Run this SQL in the SQL Editor:
```sql
SELECT * FROM shapes 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

## Expected Results:
- Should see shapes with `x: 200, y: 200`
- Colors like `#ff0000` (red), `#0000ff` (blue)
- Types: `circle`, `rectangle`, `text`
