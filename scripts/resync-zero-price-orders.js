/**
 * Re-sync orders with $0 item_price from Amazon API
 *
 * This script:
 * 1. Finds all order items with $0 price in January 2026
 * 2. Fetches correct item_price from Amazon Orders API
 * 3. Updates the database with real prices
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Amazon SP-API client setup
const SellingPartner = require('amazon-sp-api');

async function createAmazonClient(refreshToken) {
  return new SellingPartner({
    region: 'na',
    refresh_token: refreshToken,
    credentials: {
      SELLING_PARTNER_APP_CLIENT_ID: process.env.AMAZON_SP_API_CLIENT_ID,
      SELLING_PARTNER_APP_CLIENT_SECRET: process.env.AMAZON_SP_API_CLIENT_SECRET,
    },
  });
}

async function getOrderItems(client, orderId) {
  try {
    const response = await client.callAPI({
      operation: 'getOrderItems',
      endpoint: 'orders',
      path: { orderId },
    });
    return response.OrderItems || response.payload?.OrderItems || [];
  } catch (error) {
    console.error(`  ❌ Error fetching items for order ${orderId}:`, error.message);
    return null;
  }
}

async function main() {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // Get refresh token
  const { data: connection, error: connError } = await supabase
    .from('amazon_connections')
    .select('refresh_token')
    .eq('user_id', userId)
    .single();

  if (connError || !connection) {
    console.error('Failed to get connection:', connError?.message);
    return;
  }

  console.log('=== RE-SYNC $0 PRICE ORDERS ===\n');

  // Create Amazon client
  const client = await createAmazonClient(connection.refresh_token);

  // January 2026 PST range
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');

  // Get all orders in January (excluding Canceled)
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());

  const orderIds = new Set(orders.map(o => o.amazon_order_id));
  console.log(`📊 Found ${orderIds.size} non-canceled orders in January 2026\n`);

  // Get order items with $0 price
  const { data: items } = await supabase
    .from('order_items')
    .select('order_item_id, amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId);

  const zeroItems = items.filter(i =>
    orderIds.has(i.amazon_order_id) &&
    (i.item_price === 0 || i.item_price === null)
  );

  console.log(`🔍 Found ${zeroItems.length} items with $0 price\n`);

  if (zeroItems.length === 0) {
    console.log('✅ No items to re-sync');
    return;
  }

  // Group by order
  const orderMap = new Map();
  zeroItems.forEach(item => {
    if (!orderMap.has(item.amazon_order_id)) {
      orderMap.set(item.amazon_order_id, []);
    }
    orderMap.get(item.amazon_order_id).push(item);
  });

  console.log(`📦 Orders to re-sync: ${orderMap.size}\n`);

  // Process each order
  let updated = 0;
  let failed = 0;

  for (const [orderId, orderItems] of orderMap) {
    console.log(`\n📦 Processing order: ${orderId}`);

    // Fetch from Amazon API
    const amazonItems = await getOrderItems(client, orderId);

    if (!amazonItems) {
      failed++;
      continue;
    }

    console.log(`   Amazon returned ${amazonItems.length} items`);

    // Match and update
    for (const localItem of orderItems) {
      const amazonItem = amazonItems.find(a =>
        (a.OrderItemId || a.orderItemId) === localItem.order_item_id
      );

      if (!amazonItem) {
        console.log(`   ⚠️ No match for item ${localItem.order_item_id}`);
        continue;
      }

      // Get price from Amazon
      const itemPrice = amazonItem.ItemPrice || amazonItem.itemPrice;
      const priceAmount = itemPrice ? parseFloat(itemPrice.Amount || itemPrice.amount || '0') : 0;

      console.log(`   📍 Item ${localItem.order_item_id} (${localItem.asin}): $${priceAmount}`);

      if (priceAmount > 0) {
        // Update database
        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            item_price: priceAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('order_item_id', localItem.order_item_id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          failed++;
        } else {
          console.log(`   ✅ Updated to $${priceAmount}`);
          updated++;
        }
      } else {
        console.log(`   ⚠️ Amazon also returned $0 - might be a promo/gift`);
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Zero items found: ${zeroItems.length}`);
}

main().catch(console.error);
