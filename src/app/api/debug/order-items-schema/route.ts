/**
 * Debug - Check order_items table schema and sample data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get sample order_items with fee data
    const { data: sampleItems, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('user_id', '98ca1a19-eb67-47b6-8479-509fff13e698')
      .not('total_amazon_fees', 'is', null)
      .gt('total_amazon_fees', 0)
      .limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get all unique column names from sample
    const columnNames = sampleItems && sampleItems.length > 0
      ? Object.keys(sampleItems[0])
      : []

    // Check specifically for fee columns
    const feeColumnCheck = sampleItems?.map(item => ({
      amazon_order_id: item.amazon_order_id,
      fee_source: item.fee_source,
      total_amazon_fees: item.total_amazon_fees,
      // All possible fee column names
      fee_fba_per_unit: item.fee_fba_per_unit,
      fee_referral: item.fee_referral,
      fee_storage: item.fee_storage,
      total_fba_fulfillment_fees: item.total_fba_fulfillment_fees,
      total_referral_fees: item.total_referral_fees,
      fba_fees: item.fba_fees,
      referral_fee: item.referral_fee,
      referral_fees: item.referral_fees,
      // From settlement report columns
      fee_fba_fulfillment: item.fee_fba_fulfillment,
      fee_fba_storage: item.fee_fba_storage,
      fee_commission: item.fee_commission,
      fee_other: item.fee_other,
    }))

    // Count items with each type of fee column populated
    const { data: settlementItems } = await supabase
      .from('order_items')
      .select('fee_fba_per_unit, fee_referral, fee_storage, total_amazon_fees, fee_source')
      .eq('user_id', '98ca1a19-eb67-47b6-8479-509fff13e698')
      .eq('fee_source', 'settlement_report')
      .limit(10)

    return NextResponse.json({
      success: true,
      columnNames,
      sampleCount: sampleItems?.length || 0,
      feeColumnCheck,
      settlementItemsSample: settlementItems
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
