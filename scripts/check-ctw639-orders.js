/**
 * Check all B0F1CTW639 orders to find why we have 4 extra units
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // Jan 1 - Jan 29 PST
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-01-30T07:59:59.999Z');

  // Get ALL orders in date range (including Canceled)
  const { data: allOrders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString())
    .order('purchase_date', { ascending: true });

  // Get all B0F1CTW639 items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId)
    .eq('asin', 'B0F1CTW639');

  const orderMap = new Map(allOrders.map(o => [o.amazon_order_id, o]));

  console.log('=== ALL B0F1CTW639 ORDERS IN JAN 1-29, 2026 ===\n');

  const janItems = items.filter(i => orderMap.has(i.amazon_order_id));

  let byStatus = {};
  let totalUnits = 0;
  let nonCanceledUnits = 0;

  janItems.forEach((item, idx) => {
    const order = orderMap.get(item.amazon_order_id);
    const status = order.order_status;
    const date = new Date(order.purchase_date);
    const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);

    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(item);

    totalUnits += item.quantity_ordered;
    if (status !== 'Canceled') {
      nonCanceledUnits += item.quantity_ordered;
    }

    console.log(`${idx + 1}. Order: ${item.amazon_order_id}`);
    console.log(`   Status: ${status}`);
    console.log(`   Date (UTC): ${date.toISOString()}`);
    console.log(`   Date (PST): ${pstDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    console.log(`   Qty: ${item.quantity_ordered}`);
    console.log(`   Price: $${(item.item_price || 0).toFixed(2)}`);
    console.log('');
  });

  console.log('=== SUMMARY BY STATUS ===\n');
  Object.entries(byStatus).forEach(([status, items]) => {
    const units = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
    const sales = items.reduce((sum, i) => sum + (i.item_price || 0), 0);
    console.log(`${status}: ${items.length} orders, ${units} units, $${sales.toFixed(2)}`);
  });

  console.log('\n=== TOTALS ===');
  console.log('Total units (all): ' + totalUnits);
  console.log('Total units (non-Canceled): ' + nonCanceledUnits);
  console.log('Sellerboard target: 11 units');
  console.log('Difference: ' + (nonCanceledUnits - 11) + ' units');

  // Check if any orders are on boundary dates
  console.log('\n=== BOUNDARY DATE ORDERS ===');
  janItems.forEach(item => {
    const order = orderMap.get(item.amazon_order_id);
    const date = new Date(order.purchase_date);
    const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);
    const day = pstDate.getUTCDate();
    const month = pstDate.getUTCMonth() + 1;

    if (day === 1 || day === 29 || day === 30 || day === 31) {
      console.log(`\nBoundary order: ${item.amazon_order_id}`);
      console.log(`  Status: ${order.order_status}`);
      console.log(`  UTC: ${date.toISOString()}`);
      console.log(`  PST Day: ${month}/${day}`);
      console.log(`  Qty: ${item.quantity_ordered}`);
    }
  });
})();
