require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  
  // January 2026 PST range  
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');
  
  // Get ALL orders
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status')
    .eq('user_id', userId)
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());
  
  console.log('=== ORDER STATUS BREAKDOWN ===');
  const statusCounts = {};
  orders.forEach(o => { statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1; });
  console.log(statusCounts);
  
  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, item_price, asin')
    .eq('user_id', userId);
  
  // Non-cancelled orders
  const nonCancelledOrders = orders.filter(o => o.order_status !== 'Canceled');
  const nonCancelledIds = new Set(nonCancelledOrders.map(o => o.amazon_order_id));
  
  // Calculate totals excluding cancelled
  const nonCancelledItems = items.filter(i => nonCancelledIds.has(i.amazon_order_id));
  
  let units = 0;
  let sales = 0;
  const byAsin = {};
  
  nonCancelledItems.forEach(item => {
    units += (item.quantity_ordered || 0);
    sales += (item.item_price || 0);
    if (!byAsin[item.asin]) byAsin[item.asin] = { units: 0, sales: 0 };
    byAsin[item.asin].units += (item.quantity_ordered || 0);
    byAsin[item.asin].sales += (item.item_price || 0);
  });
  
  console.log('\n=== EXCLUDING CANCELLED ONLY ===');
  console.log('Orders:', nonCancelledIds.size);
  console.log('Units:', units);
  console.log('Sales: $' + sales.toFixed(2));
  
  console.log('\n=== BY ASIN (matching Sellerboard) ===');
  // B0FP57MKF9, B0F1CTW639, B0F1CTMVGB
  ['B0FP57MKF9', 'B0F1CTW639', 'B0F1CTMVGB'].forEach(asin => {
    const d = byAsin[asin] || { units: 0, sales: 0 };
    console.log(asin + ': ' + d.units + ' units, $' + d.sales.toFixed(2));
  });
  
  console.log('\n=== SELLERBOARD TARGET ===');
  console.log('Orders: 146 | Units: 152 | Sales: $1,837.98');
  console.log('\nB0FP57MKF9: 64 units, $959.36');
  console.log('B0F1CTW639: 11 units, $109.89');
  console.log('B0F1CTMVGB: 77 units, $768.73');
})();
