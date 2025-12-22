/**
 * Insert Sample Products for Testing
 * This is temporary data for testing COGS functionality
 */

-- Get the first user ID (you can replace this with your actual user ID)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user from profiles table
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  -- If no user exists, create a test user (you may need to adjust this)
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please create a user first through Supabase Auth.';
    RETURN;
  END IF;

  -- Insert sample products
  INSERT INTO products (
    user_id,
    asin,
    sku,
    title,
    image_url,
    price,
    currency,
    marketplace,
    fba_stock,
    fbm_stock,
    cogs,
    cogs_type,
    weight_lbs,
    product_category,
    is_active
  ) VALUES
  (
    test_user_id,
    'B0XXYYZZ11',
    'YM-001',
    'Premium Yoga Mat - Non-Slip Extra Thick Exercise Mat',
    NULL,
    49.99,
    'USD',
    'US',
    487,
    0,
    NULL, -- COGS not set
    'constant',
    3.5,
    'Sports & Outdoors',
    true
  ),
  (
    test_user_id,
    'B0AABBCC22',
    'RB-002',
    'Resistance Bands Set - 5 Pack Exercise Bands',
    NULL,
    34.99,
    'USD',
    'US',
    623,
    0,
    12.50, -- COGS set
    'constant',
    1.2,
    'Sports & Outdoors',
    true
  ),
  (
    test_user_id,
    'B0DDEEFF33',
    'FR-003',
    'Foam Roller for Muscle Recovery',
    NULL,
    29.99,
    'USD',
    'US',
    312,
    0,
    9.75,
    'constant',
    2.1,
    'Sports & Outdoors',
    true
  ),
  (
    test_user_id,
    'B0GGHHII44',
    'EB-004',
    'Exercise Ball with Pump - 65cm',
    NULL,
    24.99,
    'USD',
    'US',
    198,
    0,
    8.25,
    'constant',
    2.8,
    'Sports & Outdoors',
    true
  ),
  (
    test_user_id,
    'B0JJKKLL55',
    'YB-005',
    'Yoga Blocks 2 Pack - High Density Foam',
    NULL,
    19.99,
    'USD',
    'US',
    542,
    0,
    NULL, -- COGS not set
    'constant',
    1.5,
    'Sports & Outdoors',
    true
  )
  ON CONFLICT (user_id, asin) DO NOTHING;

  RAISE NOTICE 'Sample products inserted successfully for user: %', test_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting products: %', SQLERRM;
END $$;
