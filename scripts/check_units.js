require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698';
  
  // January 2026 date range (PST)
  const startPST = new Date('2026-01-01T08:00:00Z');
  const endPST = new Date('2026-02-01T07:59:59.999Z');
  
  // Get orders with status
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_status, purchase_date')
    .eq('user_id', userId)
    .gte('purchase_date', startPST.toISOString())
    .lte('purchase_date', endPST.toISOString());
  
  // Status breakdown
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
  });
  console.log('Order status breakdown:', statusCounts);
  console.log('Total orders:', orders.length);
  
  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, quantity_ordered, quantity_shipped, asin')
    .eq('user_id', userId);
  
  // Filter items for January orders
  const janOrderIds = new Set(orders.map(o => o.amazon_order_id));
  const cancelledOrderIds = new Set(orders.filter(o => o.order_status === 'Canceled').map(o => o.amazon_order_id));
  
  const janItems = items.filter(i => janOrderIds.has(i.amazon_order_id));
  
  // Calculate units
  let totalUnitsOrdered = 0;
  let totalUnitsShipped = 0;
  let unitsExcludingCancelled = 0;
  let unitsShippedExcludingCancelled = 0;
  
  janItems.forEach(item => {
    totalUnitsOrdered += (item.quantity_ordered || 0);
    totalUnitsShipped += (item.quantity_shipped || 0);
    
    const isCancelled = cancelledOrderIds.has(item.amazon_order_id);
    if (isCancelled === false) {
      unitsExcludingCancelled += (item.quantity_ordered || 0);
      unitsShippedExcludingCancelled += (item.quantity_shipped || 0);
    }
  });
  
  console.log('\n--- UNIT COMPARISON ---');
  console.log('Total items:', janItems.length);
  console.log('All units (quantity_ordered):', totalUnitsOrdered);
  console.log('All units (quantity_shipped):', totalUnitsShipped);
  console.log('Excluding cancelled (quantity_ordered):', unitsExcludingCancelled);
  console.log('Excluding cancelled (quantity_shipped):', unitsShippedExcludingCancelled);
  console.log('\n--- EXPECTED VALUES ---');
  console.log('Card shows: 152 units, 146 orders');
  console.log('Products shows: 158 units');
  
  // Check cancelled orders items
  console.log('\n--- CANCELLED ORDER ITEMS ---');
  const cancelledItems = janItems.filter(i => cancelledOrderIds.has(i.amazon_order_id));
  cancelledItems.forEach(i => {
    console.log('  Order:', i.amazon_order_id, 'ASIN:', i.asin, 'qty_ordered:', i.quantity_ordered, 'qty_shipped:', i.quantity_shipped);
  });
  
  // Sales comparison
  const { data: itemsWithPrice } = await supabase
    .from('order_items')
    .select('amazon_order_id, item_price, quantity_ordered, asin')
    .eq('user_id', userId);
  
  const janItemsWithPrice = itemsWithPrice.filter(i => janOrderIds.has(i.amazon_order_id));
  
  let totalSales = 0;
  let salesExcludingCancelled = 0;
  
  janItemsWithPrice.forEach(item => {
    totalSales += (item.item_price || 0);
    const isCancelled = cancelledOrderIds.has(item.amazon_order_id);
    if (isCancelled === false) {
      salesExcludingCancelled += (item.item_price || 0);
    }
  });
  
  console.log('\n--- SALES COMPARISON ---');
  console.log('All sales (including cancelled):', totalSales.toFixed(2));
  console.log('Excluding cancelled:', salesExcludingCancelled.toFixed(2));
  console.log('Card shows: ~$1,838');
})();
