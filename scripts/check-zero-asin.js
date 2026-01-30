require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');

  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());

  const orderIds = new Set(orders.map(o => o.amazon_order_id));

  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, item_price, asin')
    .eq('user_id', userId);

  const zeroItems = items.filter(i => orderIds.has(i.amazon_order_id) && (i.item_price === 0 || i.item_price === null));

  console.log('=== $0 PRICE ITEMS BY ASIN ===');
  const byAsin = {};
  zeroItems.forEach(i => {
    if (!byAsin[i.asin]) byAsin[i.asin] = 0;
    byAsin[i.asin] += i.quantity_ordered;
  });
  Object.entries(byAsin).forEach(([asin, units]) => console.log(asin + ': ' + units + ' units'));

  console.log('\nTotal $0 units:', Object.values(byAsin).reduce((a, b) => a + b, 0));

  // B0F1CTMVGB specific
  console.log('\n=== B0F1CTMVGB ANALYSIS ===');
  const allB0F1 = items.filter(i => orderIds.has(i.amazon_order_id) && i.asin === 'B0F1CTMVGB');
  const withPrice = allB0F1.filter(i => i.item_price > 0);
  const noPrice = allB0F1.filter(i => i.item_price === 0 || i.item_price === null);

  console.log('With price: ' + withPrice.reduce((s, i) => s + i.quantity_ordered, 0) + ' units');
  console.log('Without price ($0): ' + noPrice.reduce((s, i) => s + i.quantity_ordered, 0) + ' units');
  console.log('Total: ' + allB0F1.reduce((s, i) => s + i.quantity_ordered, 0) + ' units');
  console.log('Sellerboard target: 77 units');

  // Check if $0 items are promo (Amazon returns $0)
  console.log('\n$0 orders for B0F1CTMVGB:');
  noPrice.forEach(i => console.log('  Order: ' + i.amazon_order_id + ', qty: ' + i.quantity_ordered));
})();
