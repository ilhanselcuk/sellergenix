/**
 * API Route: Sync Sales Data from Amazon SP-API
 *
 * Fetches sales & traffic report and saves to database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSalesAndTrafficReport } from '@/lib/amazon-sp-api/reports'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Amazon connection
    const { data: connection, error: connectionError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { success: false, error: 'No Amazon connection found' },
        { status: 404 }
      )
    }

    console.log('🔄 Starting sales data sync for user:', user.id)

    // Fetch sales report from Amazon
    const reportResult = await getSalesAndTrafficReport(
      connection.refresh_token,
      connection.marketplace_ids
    )

    if (!reportResult.success || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: reportResult.error || 'Failed to fetch sales report' },
        { status: 500 }
      )
    }

    console.log('✅ Sales report fetched successfully')

    // Parse and save sales data to database
    const salesData = reportResult.data

    // Sales report structure:
    // {
    //   reportSpecification: {...},
    //   salesAndTrafficByDate: [
    //     {
    //       date: "2025-11-26",
    //       salesByDate: {
    //         orderedProductSales: { amount: 1234.56, currencyCode: "USD" },
    //         orderedProductSalesB2B: {...},
    //         unitsOrdered: 45,
    //         unitsOrderedB2B: 0,
    //         totalOrderItems: 42,
    //         totalOrderItemsB2B: 0,
    //         averageSalesPerOrderItem: {...},
    //         averageUnitsPerOrderItem: 1.07,
    //         averageSellingPrice: {...},
    //         unitsRefunded: 2,
    //         refundRate: 4.4,
    //         claimsGranted: 0,
    //         claimsAmount: {...},
    //         shippedProductSales: {...},
    //         unitsShipped: 43,
    //         ordersShipped: 40
    //       },
    //       trafficByDate: {
    //         browserPageViews: 523,
    //         browserPageViewsB2B: 12,
    //         mobileAppPageViews: 234,
    //         mobileAppPageViewsB2B: 5,
    //         pageViews: 757,
    //         pageViewsB2B: 17,
    //         browserSessions: 198,
    //         browserSessionsB2B: 8,
    //         mobileAppSessions: 89,
    //         mobileAppSessionsB2B: 3,
    //         sessions: 287,
    //         sessionsB2B: 11,
    //         buyBoxPercentage: 92.5,
    //         buyBoxPercentageB2B: 88.3,
    //         orderItemSessionPercentage: 15.2,
    //         orderItemSessionPercentageB2B: 12.1,
    //         unitSessionPercentage: 15.7,
    //         unitSessionPercentageB2B: 12.8,
    //         averageOfferCount: 3,
    //         averageParentItems: 2,
    //         feedbackReceived: 5,
    //         negativeFeedbackReceived: 1,
    //         receivedNegativeFeedbackRate: 20
    //       }
    //     }
    //   ]
    // }

    const salesByDate = salesData.salesAndTrafficByDate || []

    let insertedCount = 0
    let errors = 0

    // Insert each day's data into daily_metrics table
    for (const dayData of salesByDate) {
      const { date, salesByDate: sales, trafficByDate: traffic } = dayData

      // Prepare metrics
      const metrics = {
        user_id: user.id,
        product_id: null, // This is account-level data, not product-specific
        date: date,

        // Sales metrics
        sales: sales?.orderedProductSales?.amount || 0,
        units_sold: sales?.unitsOrdered || 0,
        orders: sales?.totalOrderItems || 0,
        refunds: sales?.unitsRefunded || 0,

        // Traffic metrics
        sessions: traffic?.sessions || 0,
        page_views: traffic?.pageViews || 0,
        conversion_rate: traffic?.unitSessionPercentage || 0,

        // Amazon fees (will be populated from Finances API later)
        amazon_fees: 0,

        // Ad spend (will be populated from Advertising API later)
        ad_spend: 0,

        // Calculated fields (basic for now)
        gross_profit: sales?.orderedProductSales?.amount || 0, // Will refine with actual costs
        net_profit: sales?.orderedProductSales?.amount || 0, // Will refine with actual costs
        margin: 0, // Will calculate when we have costs
        roi: 0, // Will calculate when we have costs

        updated_at: new Date().toISOString()
      }

      // Upsert (insert or update if exists)
      const { error: insertError } = await supabase
        .from('daily_metrics')
        .upsert(metrics, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        })

      if (insertError) {
        console.error(`❌ Failed to insert data for ${date}:`, insertError)
        errors++
      } else {
        insertedCount++
      }
    }

    console.log(`✅ Sync complete: ${insertedCount} days synced, ${errors} errors`)

    // Update last sync time
    await supabase
      .from('amazon_connections')
      .update({
        last_sync: new Date().toISOString(),
        status: 'active'
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${insertedCount} days of sales data`,
      stats: {
        days_synced: insertedCount,
        errors: errors,
        date_range: {
          start: salesByDate[0]?.date,
          end: salesByDate[salesByDate.length - 1]?.date
        }
      }
    })

  } catch (error) {
    console.error('❌ Sync sales error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
