const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
    }
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser2() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User from check-users.js
    console.log('Checking User:', userId);

    // 1. Order Status Summary
    const { data: statusCounts } = await supabase
        .from('orders')
        .select('order_status')
        .eq('user_id', userId);

    const statusMap = {};
    statusCounts.forEach(o => statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1);
    console.log('\nOrder Status Summary:', statusMap);

    // 2. Fee Source Summary
    const { data: feeItems } = await supabase
        .from('order_items')
        .select('fee_source, total_amazon_fees, quantity_shipped, amazon_order_id')
        .eq('user_id', userId);

    const sourceMap = { 'null': 0, 'api': 0, 'settlement_report': 0, 'estimated': 0 };
    const totalFees = { 'null': 0, 'api': 0, 'settlement_report': 0, 'estimated': 0 };

    // Also check for Shipped items without real fees
    let shippedNoRealFees = 0;
    let pendingWithFees = 0;

    // Fetch orders to checking status
    const { data: orders } = await supabase
        .from('orders')
        .select('amazon_order_id, order_status')
        .eq('user_id', userId);

    const orderStatusMap = {};
    orders.forEach(o => orderStatusMap[o.amazon_order_id] = o.order_status);

    for (const item of feeItems) {
        const source = item.fee_source || 'null';
        sourceMap[source] = (sourceMap[source] || 0) + 1;
        totalFees[source] = (totalFees[source] || 0) + (item.total_amazon_fees || 0);

        const status = orderStatusMap[item.amazon_order_id];

        // Check Shipped items without real fees (api or settlement)
        if (status === 'Shipped' && source !== 'api' && source !== 'settlement_report') {
            shippedNoRealFees++;
        }

        // Check Pending items with fees (should be estimated)
        if (status === 'Pending' && item.total_amazon_fees > 0) {
            pendingWithFees++;
        }
    }

    console.log('\nFee Source Summary:', sourceMap);
    console.log('Total Fees by Source:', totalFees);
    console.log('Shipped Items without Real Fees:', shippedNoRealFees);
    console.log('Pending Items with Fees:', pendingWithFees);

    // 3. MCF Fee Check
    const { data: mcfFees } = await supabase
        .from('order_items')
        .select('count')
        .eq('user_id', userId)
        .gt('fee_mcf', 0); // Assuming fee_mcf column exists from 012 migration

    // If query fails (column missing), ignore
    console.log('\nItems with fee_mcf > 0:', mcfFees ? mcfFees.length : 'Query failed or N/A');

    // 4. Promo Fee Check
    const { data: promoFees } = await supabase
        .from('order_items')
        .select('fee_promotion, total_promotion_fees')
        .eq('user_id', userId)
        .or('fee_promotion.gt.0,total_promotion_fees.gt.0');

    console.log('Items with promo fees:', promoFees ? promoFees.length : 0);

    // 5. Recent Shipped Order (Example)
    const { data: recentShipped } = await supabase
        .from('orders')
        .select(`
            amazon_order_id, 
            purchase_date,
            order_items (
                order_item_id,
                seller_sku,
                fee_source,
                total_amazon_fees,
                fee_fba_per_unit,
                fee_referral
            )
        `)
        .eq('user_id', userId)
        .eq('order_status', 'Shipped')
        .order('purchase_date', { ascending: false })
        .limit(1);

    if (recentShipped && recentShipped.length > 0) {
        console.log('\nRecent Shipped Order:', JSON.stringify(recentShipped[0], null, 2));
    }
}

checkUser2().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
