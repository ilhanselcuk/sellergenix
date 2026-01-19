/**
 * Debug endpoint - Test Amazon Sales API
 *
 * Tests the new Sales API integration with getOrderMetrics
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllPeriodSalesMetrics } from '@/lib/amazon-sp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get active connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No active connection' }, { status: 404 })
    }

    const marketplaceIds = connection.marketplace_ids || ['ATVPDKIKX0DER']

    console.log('🧪 Testing Sales API with getAllPeriodSalesMetrics...')

    const result = await getAllPeriodSalesMetrics(connection.refresh_token, marketplaceIds)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Sales API call failed'
      }, { status: 500 })
    }

    // Format results
    const formatMetrics = (metrics: any) => {
      if (!metrics) return null
      return {
        sales: `$${parseFloat(metrics.totalSales?.amount || '0').toFixed(2)}`,
        orders: metrics.orderCount || 0,
        units: metrics.unitCount || 0,
        avgOrderValue: `$${parseFloat(metrics.averageUnitPrice?.amount || '0').toFixed(2)}`,
        raw: metrics
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sales API working!',
      data: {
        today: formatMetrics(result.today),
        yesterday: formatMetrics(result.yesterday),
        thisMonth: formatMetrics(result.thisMonth),
        lastMonth: formatMetrics(result.lastMonth)
      },
      comparison: {
        note: 'Compare these with Sellerboard values!',
        sellerboardExpected: {
          today: { sales: '$9.99', orders: 1, units: 1 },
          yesterday: { sales: '$64.94', orders: 5, units: 6 },
          thisMonth: { sales: '$1,278.45', orders: 101, units: 105 },
          lastMonth: { sales: '$1,383.62', orders: 109, units: 138 }
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Sales API test error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
