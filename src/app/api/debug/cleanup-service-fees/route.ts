/**
 * Cleanup Service Fees
 *
 * Removes duplicate/incorrect entries from service_fees table:
 * - Removes entries from finances_api source (Settlement Report is more accurate)
 * - Removes entries with fee_type='other' (reserves, not actual fees)
 *
 * GET /api/debug/cleanup-service-fees - Preview what will be deleted
 * POST /api/debug/cleanup-service-fees - Actually delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all service_fees for this user
    const { data: allFees, error: fetchError } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Categorize fees
    const toDelete: any[] = []
    const toKeep: any[] = []

    for (const fee of allFees || []) {
      // Delete if from finances_api OR if fee_type is 'other'
      if (fee.source === 'finances_api' || fee.fee_type === 'other') {
        toDelete.push({
          id: fee.id,
          fee_type: fee.fee_type,
          amount: fee.amount,
          source: fee.source,
          period_start: fee.period_start,
          description: fee.description,
          reason: fee.source === 'finances_api' ? 'Duplicate source (use settlement_report instead)' : 'Other category (reserves, not fees)'
        })
      } else {
        toKeep.push({
          id: fee.id,
          fee_type: fee.fee_type,
          amount: fee.amount,
          source: fee.source,
          period_start: fee.period_start,
          description: fee.description
        })
      }
    }

    // Calculate totals
    const deleteTotals: Record<string, number> = {}
    const keepTotals: Record<string, number> = {}

    for (const fee of toDelete) {
      deleteTotals[fee.fee_type] = (deleteTotals[fee.fee_type] || 0) + parseFloat(fee.amount || 0)
    }
    for (const fee of toKeep) {
      keepTotals[fee.fee_type] = (keepTotals[fee.fee_type] || 0) + parseFloat(fee.amount || 0)
    }

    return NextResponse.json({
      success: true,
      preview: true,
      message: 'Preview mode - use POST to actually delete',
      summary: {
        totalEntries: allFees?.length || 0,
        toDelete: toDelete.length,
        toKeep: toKeep.length
      },
      deleteTotals,
      keepTotals,
      toDelete,
      toKeep
    })

  } catch (error: any) {
    console.error('Cleanup preview error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete entries from finances_api source
    const { data: deletedFinancesApi, error: deleteError1 } = await supabase
      .from('service_fees')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'finances_api')
      .select()

    if (deleteError1) {
      return NextResponse.json({ error: `Failed to delete finances_api: ${deleteError1.message}` }, { status: 500 })
    }

    // Delete entries with fee_type='other'
    const { data: deletedOther, error: deleteError2 } = await supabase
      .from('service_fees')
      .delete()
      .eq('user_id', user.id)
      .eq('fee_type', 'other')
      .select()

    if (deleteError2) {
      return NextResponse.json({ error: `Failed to delete other: ${deleteError2.message}` }, { status: 500 })
    }

    // Get remaining entries
    const { data: remaining } = await supabase
      .from('service_fees')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })

    // Calculate remaining totals
    const remainingTotals: Record<string, number> = {}
    for (const fee of remaining || []) {
      remainingTotals[fee.fee_type] = (remainingTotals[fee.fee_type] || 0) + parseFloat(fee.amount || 0)
    }

    return NextResponse.json({
      success: true,
      deleted: {
        financesApiCount: deletedFinancesApi?.length || 0,
        otherCount: deletedOther?.length || 0,
        total: (deletedFinancesApi?.length || 0) + (deletedOther?.length || 0),
        financesApiEntries: deletedFinancesApi,
        otherEntries: deletedOther
      },
      remaining: {
        count: remaining?.length || 0,
        totals: remainingTotals,
        entries: remaining
      }
    })

  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
