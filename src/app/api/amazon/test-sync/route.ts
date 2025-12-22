/**
 * Test Sandbox Product Sync
 * Tests which APIs work in sandbox mode
 */

import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/amazon-sp-api/oauth'
import { getAmazonSPAPIConfig, AMAZON_SP_API_ENDPOINTS } from '@/lib/amazon-sp-api/config'

export async function GET() {
  try {
    const refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'No refresh token configured'
      }, { status: 500 })
    }

    console.log('🧪 Testing Sandbox APIs...')

    // Get access token
    const tokenResult = await refreshAccessToken(refreshToken)
    if (!tokenResult.success || !tokenResult.data?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get access token',
        details: tokenResult.error
      }, { status: 500 })
    }

    const accessToken = tokenResult.data.access_token
    const config = getAmazonSPAPIConfig()
    const endpoint = AMAZON_SP_API_ENDPOINTS[config.region]

    console.log('✅ Access token obtained')
    console.log('📍 Endpoint:', endpoint)
    console.log('🏪 Sandbox mode:', config.sandbox)

    const results: any = {}

    // Test 1: Seller Profile (usually works)
    try {
      console.log('\n1️⃣ Testing Seller Profile API...')
      const profileResponse = await fetch(`${endpoint}/sellers/v1/marketplaceParticipations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-amz-access-token': accessToken,
        }
      })
      results.sellerProfile = {
        status: profileResponse.status,
        ok: profileResponse.ok,
        data: profileResponse.ok ? await profileResponse.json() : await profileResponse.text()
      }
      console.log('✅ Seller Profile:', profileResponse.status)
    } catch (error: any) {
      results.sellerProfile = { error: error.message }
      console.error('❌ Seller Profile failed:', error.message)
    }

    // Test 2: Catalog Items API
    try {
      console.log('\n2️⃣ Testing Catalog Items API...')
      const catalogResponse = await fetch(
        `${endpoint}/catalog/2022-04-01/items?marketplaceIds=ATVPDKIKX0DER&pageSize=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-amz-access-token': accessToken,
          }
        }
      )
      results.catalogItems = {
        status: catalogResponse.status,
        ok: catalogResponse.ok,
        data: catalogResponse.ok ? await catalogResponse.json() : await catalogResponse.text()
      }
      console.log('✅ Catalog Items:', catalogResponse.status)
    } catch (error: any) {
      results.catalogItems = { error: error.message }
      console.error('❌ Catalog Items failed:', error.message)
    }

    // Test 3: Listings API
    try {
      console.log('\n3️⃣ Testing Listings API...')
      const listingsResponse = await fetch(
        `${endpoint}/listings/2021-08-01/items?marketplaceIds=ATVPDKIKX0DER&pageSize=5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-amz-access-token': accessToken,
          }
        }
      )
      results.listings = {
        status: listingsResponse.status,
        ok: listingsResponse.ok,
        data: listingsResponse.ok ? await listingsResponse.json() : await listingsResponse.text()
      }
      console.log('✅ Listings:', listingsResponse.status)
    } catch (error: any) {
      results.listings = { error: error.message }
      console.error('❌ Listings failed:', error.message)
    }

    // Test 4: FBA Inventory
    try {
      console.log('\n4️⃣ Testing FBA Inventory API...')
      const inventoryResponse = await fetch(
        `${endpoint}/fba/inventory/v1/summaries?marketplaceIds=ATVPDKIKX0DER`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-amz-access-token': accessToken,
          }
        }
      )
      results.fbaInventory = {
        status: inventoryResponse.status,
        ok: inventoryResponse.ok,
        data: inventoryResponse.ok ? await inventoryResponse.json() : await inventoryResponse.text()
      }
      console.log('✅ FBA Inventory:', inventoryResponse.status)
    } catch (error: any) {
      results.fbaInventory = { error: error.message }
      console.error('❌ FBA Inventory failed:', error.message)
    }

    // Test 5: Orders API
    try {
      console.log('\n5️⃣ Testing Orders API...')
      const ordersResponse = await fetch(
        `${endpoint}/orders/v0/orders?MarketplaceIds=ATVPDKIKX0DER&CreatedAfter=2025-10-01T00:00:00Z`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-amz-access-token': accessToken,
          }
        }
      )
      results.orders = {
        status: ordersResponse.status,
        ok: ordersResponse.ok,
        data: ordersResponse.ok ? await ordersResponse.json() : await ordersResponse.text()
      }
      console.log('✅ Orders:', ordersResponse.status)
    } catch (error: any) {
      results.orders = { error: error.message }
      console.error('❌ Orders failed:', error.message)
    }

    console.log('\n📊 Test Summary:')
    Object.entries(results).forEach(([api, result]: [string, any]) => {
      const status = result.status || 'ERROR'
      const icon = result.ok ? '✅' : '❌'
      console.log(`${icon} ${api}: ${status}`)
    })

    return NextResponse.json({
      success: true,
      endpoint,
      sandbox: config.sandbox,
      results
    })
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
