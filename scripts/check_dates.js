require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  
  // Get all orders
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: true });
  
  console.log('Date range of all orders:');
  console.log('First order:', orders[0]?.purchase_date, orders[0]?.order_status);
  console.log('Last order:', orders[orders.length-1]?.purchase_date, orders[orders.length-1]?.order_status);
  
  // January PST range
  const janStartPST = new Date('2026-01-01T08:00:00Z'); // Jan 1 midnight PST = Jan 1 08:00 UTC
  const janEndPST = new Date('2026-02-01T07:59:59.999Z'); // Jan 31 23:59 PST = Feb 1 07:59 UTC
  
  console.log('\nJanuary PST range:');
  console.log('Start:', janStartPST.toISOString());
  console.log('End:', janEndPST.toISOString());
  
  // Count by status for January
  const janOrders = orders.filter(o => {
    const d = new Date(o.purchase_date);
    return d >= janStartPST && d <= janEndPST;
  });
  
  const statusCounts = {};
  janOrders.forEach(o => {
    statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
  });
  
  console.log('\nJanuary orders by status:', statusCounts);
  console.log('Total January orders:', janOrders.length);
  
  // What Sales API likely counts: Shipped only
  const shippedCount = janOrders.filter(o => o.order_status === 'Shipped').length;
  console.log('\nShipped only:', shippedCount);
  
  // Now get items with units for shipped only
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, asin, item_price')
    .eq('user_id', userId);
  
  const janOrderIds = new Set(janOrders.map(o => o.amazon_order_id));
  const shippedOrderIds = new Set(janOrders.filter(o => o.order_status === 'Shipped').map(o => o.amazon_order_id));
  
  const janItems = items.filter(i => janOrderIds.has(i.amazon_order_id));
  const shippedItems = items.filter(i => shippedOrderIds.has(i.amazon_order_id));
  
  let shippedUnits = 0;
  let shippedSales = 0;
  shippedItems.forEach(i => {
    shippedUnits += (i.quantity_ordered || 0);
    shippedSales += (i.item_price || 0);
  });
  
  console.log('Shipped only units:', shippedUnits);
  console.log('Shipped only sales:', shippedSales.toFixed(2));
  
  // By ASIN for Products table calculation
  const byAsin = {};
  janItems.forEach(i => {
    if (byAsin[i.asin] === undefined) byAsin[i.asin] = { units: 0, sales: 0 };
    byAsin[i.asin].units += (i.quantity_ordered || 0);
    byAsin[i.asin].sales += (i.item_price || 0);
  });
  
  console.log('\n--- BY ASIN (ALL JANUARY) ---');
  let totalUnits = 0;
  let totalSales = 0;
  Object.entries(byAsin).forEach(([asin, data]) => {
    console.log(asin + ':', data.units, 'units,', '$' + data.sales.toFixed(2));
    totalUnits += data.units;
    totalSales += data.sales;
  });
  console.log('TOTAL:', totalUnits, 'units,', '$' + totalSales.toFixed(2));
})();
