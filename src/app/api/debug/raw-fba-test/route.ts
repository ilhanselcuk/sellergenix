/**
 * Debug endpoint - Raw HTTP test for FBA Inventory API
 *
 * Tests the API with raw fetch to see exact error response
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to get access token from refresh token
async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.AMAZON_SP_API_CLIENT_ID
  const clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET

  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/raw-fba-test?userId=xxx'
      }, { status: 400 })
    }

    // Get user's connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('refresh_token, seller_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: `No active connection for user: ${userId}`,
        details: connError?.message
      }, { status: 404 })
    }

    const results: any = {
      userId,
      sellerId: connection.seller_id,
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Get access token
    let accessToken: string
    try {
      accessToken = await getAccessToken(connection.refresh_token)
      results.accessToken = {
        success: true,
        tokenLength: accessToken.length,
        tokenPreview: accessToken.substring(0, 30) + '...'
      }
    } catch (error: any) {
      return NextResponse.json({
        error: 'Failed to get access token',
        details: error.message
      }, { status: 500 })
    }

    const marketplaceId = 'ATVPDKIKX0DER' // US
    const baseUrl = 'https://sellingpartnerapi-na.amazon.com'

    // ============================================
    // TEST 1: FBA Inventory API - Raw fetch
    // ============================================
    try {
      const inventoryUrl = new URL(`${baseUrl}/fba/inventory/v1/summaries`)
      inventoryUrl.searchParams.set('granularityType', 'Marketplace')
      inventoryUrl.searchParams.set('granularityId', marketplaceId)
      inventoryUrl.searchParams.set('marketplaceIds', marketplaceId) // Single string, not array
      inventoryUrl.searchParams.set('details', 'true')

      const inventoryResponse = await fetch(inventoryUrl.toString(), {
        method: 'GET',
        headers: {
          'x-amz-access-token': accessToken,
          'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
          'Content-Type': 'application/json',
        },
      })

      const inventoryData = await inventoryResponse.json()

      results.tests.fbaInventory_singleString = {
        url: inventoryUrl.toString(),
        status: inventoryResponse.status,
        statusText: inventoryResponse.statusText,
        headers: Object.fromEntries(inventoryResponse.headers.entries()),
        response: inventoryData
      }
    } catch (error: any) {
      results.tests.fbaInventory_singleString = {
        success: false,
        error: error.message
      }
    }

    // ============================================
    // TEST 2: FBA Inventory API - Array format in URL
    // ============================================
    try {
      // Try array format: marketplaceIds=ATVPDKIKX0DER (some APIs want this)
      const inventoryUrl2 = `${baseUrl}/fba/inventory/v1/summaries?granularityType=Marketplace&granularityId=${marketplaceId}&marketplaceIds=${marketplaceId}&details=true`

      const inventoryResponse2 = await fetch(inventoryUrl2, {
        method: 'GET',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      const inventoryData2 = await inventoryResponse2.json()

      results.tests.fbaInventory_directUrl = {
        url: inventoryUrl2,
        status: inventoryResponse2.status,
        response: inventoryData2
      }
    } catch (error: any) {
      results.tests.fbaInventory_directUrl = {
        success: false,
        error: error.message
      }
    }

    // ============================================
    // TEST 3: Sellers API (should work - for comparison)
    // ============================================
    try {
      const sellersUrl = `${baseUrl}/sellers/v1/marketplaceParticipations`

      const sellersResponse = await fetch(sellersUrl, {
        method: 'GET',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      const sellersData = await sellersResponse.json()

      results.tests.sellers = {
        url: sellersUrl,
        status: sellersResponse.status,
        success: sellersResponse.ok,
        marketplaces: sellersData.payload?.length || 0
      }
    } catch (error: any) {
      results.tests.sellers = {
        success: false,
        error: error.message
      }
    }

    // ============================================
    // TEST 4: Finances API (should work)
    // ============================================
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const safeEnd = new Date(now.getTime() - 5 * 60 * 1000)

      const financesUrl = `${baseUrl}/finances/v0/financialEvents?PostedAfter=${weekAgo.toISOString()}&PostedBefore=${safeEnd.toISOString()}&MaxResultsPerPage=10`

      const financesResponse = await fetch(financesUrl, {
        method: 'GET',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      const financesData = await financesResponse.json()

      results.tests.finances = {
        url: financesUrl,
        status: financesResponse.status,
        success: financesResponse.ok,
        hasEvents: !!financesData.payload?.FinancialEvents
      }
    } catch (error: any) {
      results.tests.finances = {
        success: false,
        error: error.message
      }
    }

    // ============================================
    // Summary
    // ============================================
    results.summary = {
      sellersApi: results.tests.sellers?.status === 200 ? '✅ Working' : '❌ Failed',
      financesApi: results.tests.finances?.status === 200 ? '✅ Working' : '❌ Failed',
      fbaInventoryApi: results.tests.fbaInventory_singleString?.status === 200 ? '✅ Working' : `❌ ${results.tests.fbaInventory_singleString?.status || 'Error'}`,
    }

    // If FBA Inventory fails, extract the exact error
    if (results.tests.fbaInventory_singleString?.status !== 200) {
      results.fbaInventoryError = {
        code: results.tests.fbaInventory_singleString?.response?.errors?.[0]?.code,
        message: results.tests.fbaInventory_singleString?.response?.errors?.[0]?.message,
        details: results.tests.fbaInventory_singleString?.response?.errors?.[0]?.details,
        fullError: results.tests.fbaInventory_singleString?.response
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
