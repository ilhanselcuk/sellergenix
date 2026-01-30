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
    .select('amazon_order_id, order_status')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());

  const orderIds = new Set(orders.map(o => o.amazon_order_id));

  // Get items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, item_price, asin')
    .eq('user_id', userId);

  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));

  // Split by price > 0 vs = 0
  const withPrice = janItems.filter(i => i.item_price > 0);
  const zeroPrice = janItems.filter(i => i.item_price === 0 || i.item_price === null);

  let priceUnits = 0, priceSales = 0;
  withPrice.forEach(i => { priceUnits += i.quantity_ordered; priceSales += i.item_price; });

  let zeroUnits = 0;
  zeroPrice.forEach(i => { zeroUnits += i.quantity_ordered; });

  console.log('=== ITEMS WITH PRICE > 0 ===');
  console.log('Items:', withPrice.length);
  console.log('Units:', priceUnits);
  console.log('Sales: $' + priceSales.toFixed(2));

  console.log('\n=== ITEMS WITH PRICE = 0 ===');
  console.log('Items:', zeroPrice.length);
  console.log('Units:', zeroUnits);

  // Unique orders with price
  const ordersWithPrice = new Set(withPrice.map(i => i.amazon_order_id));
  console.log('\n=== EXCLUDING $0 ORDERS ===');
  console.log('Orders:', ordersWithPrice.size);
  console.log('Units:', priceUnits);
  console.log('Sales: $' + priceSales.toFixed(2));

  console.log('\n=== SELLERBOARD TARGET ===');
  console.log('Orders: 146 | Units: 152 | Sales: $1,837.98');

  // By ASIN
  const byAsin = {};
  withPrice.forEach(item => {
    if (!byAsin[item.asin]) byAsin[item.asin] = { units: 0, sales: 0 };
    byAsin[item.asin].units += item.quantity_ordered;
    byAsin[item.asin].sales += item.item_price;
  });

  console.log('\n=== BY ASIN (with price > 0) ===');
  ['B0FP57MKF9', 'B0F1CTW639', 'B0F1CTMVGB'].forEach(asin => {
    const d = byAsin[asin] || { units: 0, sales: 0 };
    console.log(asin + ': ' + d.units + ' units, $' + d.sales.toFixed(2));
  });

  console.log('\n=== SELLERBOARD BY ASIN ===');
  console.log('B0FP57MKF9: 64 units, $959.36');
  console.log('B0F1CTW639: 11 units, $109.89');
  console.log('B0F1CTMVGB: 77 units, $768.73');

  // Gap analysis
  const sellerboard = { units: 152, sales: 1837.98 };
  console.log('\n=== GAP ANALYSIS ===');
  console.log('Units gap:', priceUnits - sellerboard.units, '(we have', priceUnits > sellerboard.units ? 'MORE' : 'LESS', ')');
  console.log('Sales gap: $' + (priceSales - sellerboard.sales).toFixed(2), '(we have', priceSales > sellerboard.sales ? 'MORE' : 'LESS', ')');
})();
