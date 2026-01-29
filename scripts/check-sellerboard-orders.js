// Check if Sellerboard's 8 order IDs exist in our database
// Sellerboard shows these orders for Nov 12, 2025

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrders() {
  // These are the 8 order IDs from Sellerboard for Nov 12, 2025
  const sellerboardOrderIds = [
    '113-8001583-1177835',
    '114-3617321-7926608',
    '113-1312124-2193043',
    '114-4914443-4093050',
    '113-7189438-8489010',
    '111-1295278-8696230',
    '111-6107711-6272264',
    '111-7472548-8371417'
  ];

  console.log('='.repeat(60));
  console.log('Checking Sellerboard order IDs in our database');
  console.log('='.repeat(60));

  // Check orders table
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date, order_status, order_total')
    .in('amazon_order_id', sellerboardOrderIds);

  if (ordersError) {
    console.error('Error querying orders:', ordersError);
    return;
  }

  console.log(`\n📦 Found ${orders?.length || 0} of 8 orders in 'orders' table:`);

  if (orders && orders.length > 0) {
    orders.forEach(order => {
      console.log(`  - ${order.amazon_order_id}`);
      console.log(`    Purchase Date: ${order.purchase_date}`);
      console.log(`    Status: ${order.order_status}`);
      console.log(`    Total: ${order.order_total}`);
    });
  }

  // Check order_items table
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('amazon_order_id, item_price, quantity_ordered, title, created_at')
    .in('amazon_order_id', sellerboardOrderIds);

  if (itemsError) {
    console.error('Error querying order_items:', itemsError);
    return;
  }

  console.log(`\n📋 Found ${items?.length || 0} items in 'order_items' table:`);

  if (items && items.length > 0) {
    items.forEach(item => {
      console.log(`  - Order: ${item.amazon_order_id}`);
      console.log(`    Title: ${item.title?.substring(0, 50)}...`);
      console.log(`    Price: $${item.item_price}, Qty: ${item.quantity_ordered}`);
      console.log(`    Created: ${item.created_at}`);
    });
  }

  // Show which orders are MISSING
  const foundOrderIds = new Set([
    ...(orders || []).map(o => o.amazon_order_id),
    ...(items || []).map(i => i.amazon_order_id)
  ]);

  const missingOrderIds = sellerboardOrderIds.filter(id => !foundOrderIds.has(id));

  console.log(`\n❌ Missing ${missingOrderIds.length} of 8 orders:`);
  missingOrderIds.forEach(id => console.log(`  - ${id}`));

  // Check total orders around that date
  console.log('\n' + '='.repeat(60));
  console.log('Checking orders around Nov 12, 2025 in database');
  console.log('='.repeat(60));

  const { data: nearbyOrders, error: nearbyError } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date, order_status')
    .gte('purchase_date', '2025-11-10T00:00:00Z')
    .lte('purchase_date', '2025-11-14T23:59:59Z')
    .order('purchase_date', { ascending: true });

  if (nearbyError) {
    console.error('Error:', nearbyError);
    return;
  }

  console.log(`\n📅 Orders from Nov 10-14, 2025: ${nearbyOrders?.length || 0}`);
  (nearbyOrders || []).forEach(order => {
    console.log(`  ${order.purchase_date} - ${order.amazon_order_id} (${order.order_status})`);
  });
}

checkOrders().catch(console.error);
