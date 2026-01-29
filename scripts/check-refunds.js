const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
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

async function checkRefunds() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User 2
    console.log('Checking Refunds for User:', userId);

    // 1. Check refunds table count
    const { count, error } = await supabase
        .from('refunds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.log('Error checking refunds table (might not exist?):', error.message);
    } else {
        console.log('Total rows in `refunds` table:', count);
    }

    // 2. Check daily_metrics refunds column
    const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('date, refunds')
        .eq('user_id', userId)
        .lt('refunds', 0) // Refunds are usually negative in metrics
        .order('date', { ascending: false })
        .limit(5);

    console.log('\nRecent Daily Metrics with Refunds:', metrics);

    // 3. Check order_items with refund data (if column exists from 012 migration)
    const { data: itemRefunds } = await supabase
        .from('order_items')
        .select('count')
        .eq('user_id', userId)
        .or('refund_amount.gt.0,fee_refund_commission.gt.0'); // Check for refund activity

    console.log('Order Items with refund data:', itemRefunds ? itemRefunds.length : 'N/A');
}

checkRefunds().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
