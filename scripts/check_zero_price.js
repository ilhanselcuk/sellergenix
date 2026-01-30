require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');
  
  // Get ALL orders (non-cancelled)
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());
  
  const orderIds = new Set(orders.map(o => o.amazon_order_id));
  
  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, item_price, asin')
    .eq('user_id', userId);
  
  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));
  
  // Split by price
  const withPrice = janItems.filter(i => i.item_price > 0);
  const zeroPrice = janItems.filter(i => i.item_price === 0 || i.item_price === null);
  
  console.log('=== ITEMS WITH PRICE > 0 ===');
  let units1 = 0, sales1 = 0;
  withPrice.forEach(i => { units1 += i.quantity_ordered; sales1 += i.item_price; });
  console.log('Items:', withPrice.length);
  console.log('Units:', units1);
  console.log('Sales: $' + sales1.toFixed(2));
  
  console.log('\n=== ITEMS WITH PRICE = 0 ===');
  let units2 = 0;
  zeroPrice.forEach(i => { units2 += i.quantity_ordered; });
  console.log('Items:', zeroPrice.length);
  console.log('Units:', units2);
  
  // Count unique orders with price
  const ordersWithPrice = new Set(withPrice.map(i => i.amazon_order_id));
  console.log('\n=== EXCLUDING $0 PRICE ORDERS ===');
  console.log('Orders:', ordersWithPrice.size);
  console.log('Units:', units1);
  console.log('Sales: $' + sales1.toFixed(2));
  
  console.log('\n=== SELLERBOARD TARGET ===');
  console.log('Orders: 146 | Units: 152 | Sales: $1,837.98');
  
  // By ASIN excluding $0
  const byAsin = {};
  withPrice.forEach(item => {
    if (!byAsin[item.asin]) byAsin[item.asin] = { units: 0, sales: 0 };
    byAsin[item.asin].units += item.quantity_ordered;
    byAsin[item.asin].sales += item.item_price;
  });
  
  console.log('\n=== BY ASIN (excluding $0 price) ===');
  ['B0FP57MKF9', 'B0F1CTW639', 'B0F1CTMVGB'].forEach(asin => {
    const d = byAsin[asin] || { units: 0, sales: 0 };
    console.log(asin + ': ' + d.units + ' units, $' + d.sales.toFixed(2));
  });
})();
