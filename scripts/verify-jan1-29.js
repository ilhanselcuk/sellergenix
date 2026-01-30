require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // Jan 1 - Jan 29 PST (matching Sellerboard screenshot)
  const startPST = new Date('2026-01-01T08:00:00Z');  // Jan 1 00:00 PST
  const endPST = new Date('2026-01-30T07:59:59.999Z'); // Jan 29 23:59:59 PST

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
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId);

  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));

  let totalUnits = 0, totalSales = 0;
  const byAsin = {};

  janItems.forEach(item => {
    totalUnits += item.quantity_ordered || 0;
    totalSales += item.item_price || 0;
    if (!byAsin[item.asin]) byAsin[item.asin] = { units: 0, sales: 0 };
    byAsin[item.asin].units += item.quantity_ordered || 0;
    byAsin[item.asin].sales += item.item_price || 0;
  });

  console.log('=== JAN 1-29, 2026 (Matching Sellerboard date range) ===');
  console.log('Orders:', orderIds.size);
  console.log('Units:', totalUnits);
  console.log('Sales: $' + totalSales.toFixed(2));

  console.log('\nBy ASIN:');
  ['B0FP57MKF9', 'B0F1CTW639', 'B0F1CTMVGB'].forEach(asin => {
    const d = byAsin[asin] || { units: 0, sales: 0 };
    console.log('  ' + asin + ': ' + d.units + ' units, $' + d.sales.toFixed(2));
  });

  console.log('\n=== SELLERBOARD TARGET ===');
  console.log('Orders: 146');
  console.log('Units: 152');
  console.log('Sales: $1,837.98');
  console.log('  B0FP57MKF9: 64 units, $959.36');
  console.log('  B0F1CTW639: 11 units, $109.89');
  console.log('  B0F1CTMVGB: 77 units, $768.73');

  console.log('\n=== GAP ===');
  console.log('Orders: ' + (orderIds.size - 146) + ' (' + (orderIds.size > 146 ? 'EXTRA' : 'MISSING') + ')');
  console.log('Units: ' + (totalUnits - 152) + ' (' + (totalUnits > 152 ? 'EXTRA' : 'MISSING') + ')');
  console.log('Sales: $' + (totalSales - 1837.98).toFixed(2) + ' (' + (totalSales > 1837.98 ? 'EXTRA' : 'MISSING') + ')');
})();
