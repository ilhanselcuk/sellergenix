/**
 * Show all orders grouped by date to identify extra orders
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';

  // Jan 1 - Jan 29 PST
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-01-30T07:59:59.999Z');

  // Get ALL orders in date range
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString())
    .order('purchase_date', { ascending: true });

  // Get all items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, quantity_ordered, item_price')
    .eq('user_id', userId);

  const orderIds = new Set(orders.map(o => o.amazon_order_id));
  const janItems = items.filter(i => orderIds.has(i.amazon_order_id));

  // Build order-to-items map
  const orderItemsMap = new Map();
  janItems.forEach(item => {
    if (!orderItemsMap.has(item.amazon_order_id)) {
      orderItemsMap.set(item.amazon_order_id, []);
    }
    orderItemsMap.get(item.amazon_order_id).push(item);
  });

  // Group orders by PST date
  const byDate = {};
  orders.forEach(order => {
    const date = new Date(order.purchase_date);
    const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);
    const dateKey = pstDate.toISOString().split('T')[0];

    if (!byDate[dateKey]) {
      byDate[dateKey] = { orders: 0, units: 0, sales: 0, pending: 0, shipped: 0, unshipped: 0 };
    }

    const orderItems = orderItemsMap.get(order.amazon_order_id) || [];
    const orderUnits = orderItems.reduce((sum, i) => sum + i.quantity_ordered, 0);
    const orderSales = orderItems.reduce((sum, i) => sum + (i.item_price || 0), 0);

    byDate[dateKey].orders++;
    byDate[dateKey].units += orderUnits;
    byDate[dateKey].sales += orderSales;

    if (order.order_status === 'Pending') byDate[dateKey].pending++;
    else if (order.order_status === 'Shipped') byDate[dateKey].shipped++;
    else if (order.order_status === 'Unshipped') byDate[dateKey].unshipped++;
  });

  console.log('=== ORDERS BY DATE (PST) - JAN 2026 ===\n');
  console.log('Date       | Orders | Units | Sales     | Shipped | Pending | Unshipped');
  console.log('-----------+--------+-------+-----------+---------+---------+----------');

  let totalOrders = 0, totalUnits = 0, totalSales = 0;
  let totalPending = 0, totalShipped = 0, totalUnshipped = 0;

  Object.keys(byDate).sort().forEach(date => {
    const d = byDate[date];
    const dayNum = parseInt(date.split('-')[2]);
    if (dayNum >= 1 && dayNum <= 29) {
      console.log(
        `${date} | ${d.orders.toString().padStart(6)} | ${d.units.toString().padStart(5)} | $${d.sales.toFixed(2).padStart(8)} | ${d.shipped.toString().padStart(7)} | ${d.pending.toString().padStart(7)} | ${d.unshipped.toString().padStart(8)}`
      );
      totalOrders += d.orders;
      totalUnits += d.units;
      totalSales += d.sales;
      totalPending += d.pending;
      totalShipped += d.shipped;
      totalUnshipped += d.unshipped;
    }
  });

  console.log('-----------+--------+-------+-----------+---------+---------+----------');
  console.log(
    `TOTAL      | ${totalOrders.toString().padStart(6)} | ${totalUnits.toString().padStart(5)} | $${totalSales.toFixed(2).padStart(8)} | ${totalShipped.toString().padStart(7)} | ${totalPending.toString().padStart(7)} | ${totalUnshipped.toString().padStart(8)}`
  );

  console.log('\n=== COMPARISON WITH SELLERBOARD ===');
  console.log('Sellerboard: 146 orders, 152 units, $1,837.98');
  console.log(`We have:     ${totalOrders} orders, ${totalUnits} units, $${totalSales.toFixed(2)}`);
  console.log(`Difference:  ${totalOrders - 146} orders, ${totalUnits - 152} units, $${(totalSales - 1837.98).toFixed(2)}`);

  console.log('\n=== IF WE EXCLUDE PENDING ORDERS ===');
  const shippedOrders = totalOrders - totalPending;
  const shippedUnits = totalUnits - byDate['2026-01-26']?.pending * 2 - byDate['2026-01-28']?.pending - byDate['2026-01-29']?.pending * 4;
  console.log(`Orders without Pending: ${shippedOrders} (Sellerboard: 146)`);

  // Check special order IDs (S01- prefix)
  console.log('\n=== SPECIAL ORDER IDs (S01- prefix) ===');
  orders.forEach(order => {
    if (order.amazon_order_id.startsWith('S01-')) {
      const items = orderItemsMap.get(order.amazon_order_id) || [];
      const units = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
      const sales = items.reduce((sum, i) => sum + (i.item_price || 0), 0);
      console.log(`${order.amazon_order_id}: ${order.order_status}, ${units} units, $${sales.toFixed(2)}`);
      items.forEach(i => console.log(`  - ${i.asin}: ${i.quantity_ordered} units @ $${(i.item_price || 0).toFixed(2)}`));
    }
  });

  // Count by status
  console.log('\n=== SUMMARY BY STATUS ===');
  console.log(`Shipped: ${totalShipped} orders`);
  console.log(`Pending: ${totalPending} orders`);
  console.log(`Unshipped: ${totalUnshipped} orders`);
})();
