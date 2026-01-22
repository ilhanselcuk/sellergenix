/**
 * Check Data Kiosk Sync Results
 *
 * GET /api/amazon/check-data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get daily_metrics count and sample
    const { data: metricsCount, error: countError } = await supabase
      .from('daily_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: recentMetrics, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10)

    const { data: oldestMetrics } = await supabase
      .from('daily_metrics')
      .select('date, sales, units_sold, orders')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(5)

    // Get date range
    const { data: dateRange } = await supabase
      .from('daily_metrics')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(1)

    const { data: latestDate } = await supabase
      .from('daily_metrics')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)

    // Calculate totals
    const { data: totals } = await supabase
      .from('daily_metrics')
      .select('sales, units_sold, orders, sessions')
      .eq('user_id', user.id)

    let totalSales = 0
    let totalUnits = 0
    let totalOrders = 0
    let totalSessions = 0

    if (totals) {
      for (const row of totals) {
        totalSales += parseFloat(row.sales) || 0
        totalUnits += row.units_sold || 0
        totalOrders += row.orders || 0
        totalSessions += row.sessions || 0
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      summary: {
        totalRecords: totals?.length || 0,
        dateRange: {
          from: dateRange?.[0]?.date || null,
          to: latestDate?.[0]?.date || null
        },
        totals: {
          sales: `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          units: totalUnits.toLocaleString(),
          orders: totalOrders.toLocaleString(),
          sessions: totalSessions.toLocaleString()
        }
      },
      recentDays: recentMetrics?.map(m => ({
        date: m.date,
        sales: `$${parseFloat(m.sales || 0).toFixed(2)}`,
        units: m.units_sold,
        orders: m.orders,
        sessions: m.sessions,
        buyBox: `${m.buy_box_percentage || 0}%`,
        conversionRate: `${m.unit_session_percentage || 0}%`
      })),
      oldestDays: oldestMetrics
    })

  } catch (error: any) {
    console.error('Check data error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
