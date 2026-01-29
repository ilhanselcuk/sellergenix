/**
 * Debug - Find users with order data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get distinct user_ids from orders table with count
    const { data: users, error } = await supabase
      .from('orders')
      .select('user_id')
      .limit(1000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count orders per user
    const userCounts: Record<string, number> = {}
    for (const order of users || []) {
      userCounts[order.user_id] = (userCounts[order.user_id] || 0) + 1
    }

    // Sort by count descending
    const sortedUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, orderCount: count }))

    // Also check order_items with fees
    const { data: itemsWithFees } = await supabase
      .from('order_items')
      .select('user_id, fee_source, total_amazon_fees')
      .not('total_amazon_fees', 'is', null)
      .gt('total_amazon_fees', 0)
      .limit(100)

    const feeUserCounts: Record<string, { settlement: number; api: number; total: number }> = {}
    for (const item of itemsWithFees || []) {
      if (!feeUserCounts[item.user_id]) {
        feeUserCounts[item.user_id] = { settlement: 0, api: 0, total: 0 }
      }
      feeUserCounts[item.user_id].total++
      if (item.fee_source === 'settlement_report') {
        feeUserCounts[item.user_id].settlement++
      } else if (item.fee_source === 'api') {
        feeUserCounts[item.user_id].api++
      }
    }

    return NextResponse.json({
      success: true,
      usersWithOrders: sortedUsers,
      usersWithFeeData: feeUserCounts
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
