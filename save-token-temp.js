const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function saveToken() {
  const refreshToken = 'Atzr|IwEBIFpP_oylPNgR_v_laByQ8bTqpy25u0YEVUMoNyRRoBH1cDbwLVeaJm73b_ZP4BsKFcJVKDPVImly-fdR6fmguBIpPsesXEZIlA9xB-OElfJbO_eKgjfWWxKqOKhbFzpQ6pokD376vkoJGXz3ZXJzlD0ic6RkhHAF540gyktZ-r8pmbKtV4TfFRStmreNeOAQjh820rXrG4zj6IOkqD2xt6bU-JSSrpUtUB1WPeLHbOLStokP9T-6NI4QzJKpn6GdpNFA0QCtJdBcwGFcRiF2szlakgf07j5WBWMd_c8WTFE1pcq7_wso6nQFOfvfzB_riY0'
  
  const marketplaceIds = ['A1AM78C64UM0Y8', 'A2EUQ1WTGCTBG2', 'A2Q3Y263D00KWC', 'ATVPDKIKX0DER']

  // Get first user
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const userId = authUsers?.users?.[0]?.id
  
  if (!userId) {
    console.log('No user found!')
    return
  }

  console.log('User:', authUsers.users[0].email)

  // Upsert
  const { data, error } = await supabase
    .from('amazon_connections')
    .upsert({
      user_id: userId,
      seller_id: 'Dolcientis',
      refresh_token: refreshToken,
      marketplace_ids: marketplaceIds,
      status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()

  if (error) console.error('Error:', error)
  else console.log('✅ Saved:', data)
}

saveToken()
