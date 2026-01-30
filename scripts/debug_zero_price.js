require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');
  
  // Get orders (non-cancelled)
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());
  
  const orderIds = new Set(orders.map(o => o.amazon_order_id));
  const orderStatusMap = new Map(orders.map(o => [o.amazon_order_id, o.order_status]));
  
  // Get items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, item_price, asin')
    .eq('user_id', userId);
  
  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));
  
  // Items with $0 price
  const zeroItems = janItems.filter(i => i.item_price === 0 || i.item_price === null);
  
  console.log('=== $0 PRICE ITEMS (January 2026) ===');
  console.log('Total: ' + zeroItems.length + ' items\n');
  
  // Group by ASIN
  const byAsin = {};
  zeroItems.forEach(i => {
    if (!byAsin[i.asin]) byAsin[i.asin] = { count: 0, units: 0, orders: [] };
    byAsin[i.asin].count++;
    byAsin[i.asin].units += i.quantity_ordered;
    byAsin[i.asin].orders.push({
      orderId: i.amazon_order_id,
      status: orderStatusMap.get(i.amazon_order_id),
      qty: i.quantity_ordered
    });
  });
  
  console.log('By ASIN:');
  Object.entries(byAsin).forEach(([asin, data]) => {
    console.log('\n' + asin + ': ' + data.units + ' units in ' + data.count + ' items');
    data.orders.forEach(o => {
      console.log('  - ' + o.orderId + ' [' + o.status + '] qty:' + o.qty);
    });
  });
  
  // Total units with $0 price
  const totalZeroUnits = zeroItems.reduce((sum, i) => sum + i.quantity_ordered, 0);
  console.log('\n=== SUMMARY ===');
  console.log('Total $0 price units: ' + totalZeroUnits);
  console.log('If we had real prices, these would add to our totals');
})();
