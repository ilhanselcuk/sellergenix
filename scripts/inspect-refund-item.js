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

async function inspectRefundItem() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User 2
    console.log('Inspecting Refund Item for User:', userId);

    const { data: items } = await supabase
        .from('order_items')
        .select(`
        amazon_order_id, 
        order_item_id, 
        refund_amount, 
        fee_refund_commission,
        created_at, 
        updated_at,
        fees_synced_at
    `)
        .eq('user_id', userId)
        .or('refund_amount.gt.0,fee_refund_commission.gt.0');

    if (items && items.length > 0) {
        console.log('Found items with refunds:', items.length);
        items.forEach(item => {
            console.log('\nItem:', item.order_item_id);
            console.log('  Refund Amount:', item.refund_amount);
            console.log('  Commission:', item.fee_refund_commission);
            console.log('  Created:', item.created_at);
            console.log('  Updated:', item.updated_at);
            console.log('  Fees Synced:', item.fees_synced_at);
        });
    } else {
        console.log('No items found with refunds.');
    }
}

inspectRefundItem().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
