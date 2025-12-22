/**
 * Amazon Finances API
 *
 * This endpoint fetches financial data (sales, fees, profit) from Amazon SP-API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  listFinancialEvents,
  getLast30DaysFinancials,
  getTodayFinancials,
  calculateProfitMetrics,
} from '@/lib/amazon-sp-api/finances'

/**
 * GET: Fetch financial metrics
 *
 * Query params:
 * - period: 'today' | 'last7days' | 'last30days' | 'custom'
 * - startDate: ISO date string (required for custom period)
 * - endDate: ISO date string (optional for custom period)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active Amazon connection found. Please connect your Amazon account first.' },
        { status: 404 }
      )
    }

    const refreshToken = connection.refresh_token

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'last30days'

    let result

    switch (period) {
      case 'today':
        result = await getTodayFinancials(refreshToken)
        break

      case 'last30days':
        result = await getLast30DaysFinancials(refreshToken)
        break

      case 'last7days': {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)

        const eventsResult = await listFinancialEvents(refreshToken, startDate, endDate)
        if (!eventsResult.success || !eventsResult.data) {
          throw new Error(eventsResult.error || 'Failed to fetch financial events')
        }

        const metrics = calculateProfitMetrics(eventsResult.data as Record<string, unknown[]>)
        result = {
          success: true,
          data: {
            ...metrics,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
        break
      }

      case 'custom': {
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        if (!startDateParam) {
          return NextResponse.json(
            { error: 'startDate is required for custom period' },
            { status: 400 }
          )
        }

        const startDate = new Date(startDateParam)
        const endDate = endDateParam ? new Date(endDateParam) : new Date()

        const eventsResult = await listFinancialEvents(refreshToken, startDate, endDate)
        if (!eventsResult.success || !eventsResult.data) {
          throw new Error(eventsResult.error || 'Failed to fetch financial events')
        }

        const metrics = calculateProfitMetrics(eventsResult.data as Record<string, unknown[]>)
        result = {
          success: true,
          data: {
            ...metrics,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid period. Use: today, last7days, last30days, or custom' },
          { status: 400 }
        )
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch financial data')
    }

    return NextResponse.json({
      success: true,
      period,
      metrics: result.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Amazon finances API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data', details: error.message },
      { status: 500 }
    )
  }
}
