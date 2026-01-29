const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock browser-like fetch for the client if needed (not needed for simple script usually)

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

// Minimal SP-API Client
async function getAccessToken(refreshToken) {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.LWA_CLIENT_ID,
            client_secret: process.env.LWA_CLIENT_SECRET,
        }),
    });
    const data = await response.json();
    return data.access_token;
}

async function listFinancialEvents(accessToken) {
    // PostedAfter: 48 hours ago
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 48);

    const params = new URLSearchParams({
        PostedAfter: startDate.toISOString(),
        MaxResultsPerPage: 100
    });

    console.log(`Fetching financial events after: ${startDate.toISOString()}`);

    const response = await fetch(
        `https://sellingpartnerapi-na.amazon.com/finances/v0/financialEvents?${params.toString()}`,
        {
            method: 'GET',
            headers: {
                'x-amz-access-token': accessToken,
            },
        }
    );

    if (!response.ok) {
        console.error('API Error:', await response.text());
        return null;
    }

    const data = await response.json();
    return data.payload?.FinancialEvents;
}

async function checkRecentEvents() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User 2

    // Get refresh token
    const { data: conn } = await supabase
        .from('amazon_connections')
        .select('refresh_token')
        .eq('user_id', userId)
        .single();

    if (!conn) {
        console.error('No connection found');
        return;
    }

    const accessToken = await getAccessToken(conn.refresh_token);
    const events = await listFinancialEvents(accessToken);

    if (events) {
        const refunds = events.RefundEventList || [];
        console.log(`\nFound ${refunds.length} Refund Events in last 48h`);

        refunds.forEach(r => {
            console.log('Refund:', JSON.stringify(r, null, 2));
        });

        const shipments = events.ShipmentEventList || [];
        console.log(`\nFound ${shipments.length} Shipment Events`);
    } else {
        console.log('No events found.');
    }
}

checkRecentEvents().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
