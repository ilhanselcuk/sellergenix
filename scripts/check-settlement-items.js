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

async function checkSettlementItems() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User 2
    console.log('Checking Settlement Items for User:', userId);

    // Get items synced from settlement reports
    const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('user_id', userId)
        .eq('fee_source', 'settlement_report')
        .limit(5);

    if (items && items.length > 0) {
        console.log(`Found ${items.length} sample items from Settlement Reports:`);
        items.forEach(item => {
            console.log('\nItem:', item.order_item_id);
            console.log('  Refund Amount:', item.refund_amount);
            console.log('  Refund Commission:', item.fee_refund_commission);
            console.log('  Total Amazon Fees:', item.total_amazon_fees);
        });
    } else {
        console.log('No items found with fee_source = settlement_report');
    }

    // Check if ANY item has non-zero refund
    const { count: refundCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('refund_amount', 0);

    console.log('\nTotal items with refund_amount > 0:', refundCount);

    const { count: commCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('fee_refund_commission', 0);

    console.log('Total items with fee_refund_commission > 0:', commCount);
}

checkSettlementItems().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
