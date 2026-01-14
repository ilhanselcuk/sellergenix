import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkData() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Check orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('count')
    .limit(1)
  
  console.log('Orders:', orders, ordersError)
  
  // Check daily_metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('daily_metrics')
    .select('count')
    .limit(1)
    
  console.log('Daily Metrics:', metrics, metricsError)
  
  // Check financial_summaries
  const { data: summaries, error: summariesError } = await supabase
    .from('financial_summaries')
    .select('count')
    .limit(1)
    
  console.log('Financial Summaries:', summaries, summariesError)
}

checkData()
