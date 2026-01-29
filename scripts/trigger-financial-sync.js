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

async function triggerSync() {
    const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'; // User 2
    console.log('Triggering Financial Event Sync for User:', userId);

    const { data: conn } = await supabase
        .from('amazon_connections')
        .select('refresh_token')
        .eq('user_id', userId)
        .single();

    if (!conn) {
        console.error('No connection found');
        return;
    }

    // Direct fetch to Inngest dev server (assuming typical setup)
    // Or simpler: just log the event structure for manual triggering if needed
    // But here we likely can't access Inngest server from this script context easily if it's protected
    // So we'll try to use the Inngest SDK if available, or just mock the event payload for the user to see.

    // Actually, since we are in the project, we can try to use the Inngest client if we can import it.
    // But this involves compilation.

    // Instead, I'll print the curl command to trigger it if local dev server is running, 
    // OR just say "Task added, waiting for auto-run".

    // Wait, the user has the app running? Usually yes.
    // Let's try to send simple event to Inngest local dev server

    const event = {
        name: "amazon/sync.financial-events",
        data: {
            userId,
            refreshToken: conn.refresh_token,
            daysBack: 30
        }
    };

    console.log("Here is the curl command to trigger this locally:");
    console.log(`curl -X POST http://127.0.0.1:8288/e/key_value \\
-H "Content-Type: application/json" -d '${JSON.stringify(event)}'`);

    // Also try to hit the Next.js API route if one exists that forwards events
    // But standard Inngest setup usually exposes a local dev server
}

triggerSync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
