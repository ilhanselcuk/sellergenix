/**
 * Check all B0F1CTMVGB order items and their prices
 * to find why we have 78 units at $718.76 instead of 77 units at $768.73
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // Jan 1 - Jan 29 PST (matching Sellerboard screenshot)
  const startPST = new Date('2026-01-01T08:00:00Z');  // Jan 1 00:00 PST
  const endPST = new Date('2026-01-30T07:59:59.999Z'); // Jan 29 23:59:59 PST

  // Get non-canceled orders in date range
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());

  const orderIds = new Set(orders.map(o => o.amazon_order_id));
  const orderStatusMap = new Map(orders.map(o => [o.amazon_order_id, o.order_status]));
  const orderDateMap = new Map(orders.map(o => [o.amazon_order_id, o.purchase_date]));

  // Get all B0F1CTMVGB items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId)
    .eq('asin', 'B0F1CTMVGB');

  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));

  console.log('=== B0F1CTMVGB DETAILED ANALYSIS ===\n');
  console.log('Expected product price: $9.98');
  console.log('Sellerboard: 77 units @ $768.73 ($9.98/unit)\n');

  let totalUnits = 0;
  let totalSales = 0;
  let wrongPriceItems = [];

  janItems.forEach(item => {
    const status = orderStatusMap.get(item.amazon_order_id);
    const date = orderDateMap.get(item.amazon_order_id);
    const expectedPrice = 9.98 * item.quantity_ordered;
    const actualPrice = item.item_price || 0;
    const isWrong = Math.abs(actualPrice - expectedPrice) > 0.01;

    totalUnits += item.quantity_ordered;
    totalSales += actualPrice;

    if (isWrong) {
      wrongPriceItems.push({
        orderId: item.amazon_order_id,
        status,
        date: new Date(date).toLocaleDateString(),
        qty: item.quantity_ordered,
        expected: expectedPrice,
        actual: actualPrice,
        diff: actualPrice - expectedPrice
      });
    }
  });

  console.log('Total items:', janItems.length);
  console.log('Total units:', totalUnits);
  console.log('Total sales: $' + totalSales.toFixed(2));
  console.log('Expected sales: $' + (totalUnits * 9.98).toFixed(2));
  console.log('Difference: $' + (totalSales - totalUnits * 9.98).toFixed(2));

  if (wrongPriceItems.length > 0) {
    console.log('\n=== ITEMS WITH WRONG PRICES ===\n');
    wrongPriceItems.forEach(item => {
      console.log(`Order: ${item.orderId}`);
      console.log(`  Status: ${item.status}`);
      console.log(`  Date: ${item.date}`);
      console.log(`  Qty: ${item.qty}`);
      console.log(`  Expected: $${item.expected.toFixed(2)}`);
      console.log(`  Actual: $${item.actual.toFixed(2)}`);
      console.log(`  Diff: $${item.diff.toFixed(2)}`);
      console.log('');
    });
  }

  // Check B0F1CTW639 too
  console.log('\n=== B0F1CTW639 ANALYSIS ===\n');
  const { data: items2 } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId)
    .eq('asin', 'B0F1CTW639');

  const janItems2 = items2.filter(i => orderIds.has(i.amazon_order_id));

  let totalUnits2 = 0;
  let totalSales2 = 0;

  janItems2.forEach(item => {
    totalUnits2 += item.quantity_ordered;
    totalSales2 += item.item_price || 0;
  });

  console.log('Total units:', totalUnits2);
  console.log('Total sales: $' + totalSales2.toFixed(2));
  console.log('Sellerboard: 11 units @ $109.89');
  console.log('Gap: ' + (totalUnits2 - 11) + ' units, $' + (totalSales2 - 109.89).toFixed(2));
})();
