/**
 * Test script for fee extraction
 *
 * Run with: npx tsx scripts/test-fees.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('🧪 Testing Amazon Fee Extraction\n')

  // 1. Get user connection
  const userId = '98ca1a19-eb67-47b6-8479-509fff13e698'

  const { data: connection, error: connError } = await supabase
    .from('amazon_connections')
    .select('refresh_token, seller_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (connError || !connection) {
    console.error('❌ No Amazon connection found:', connError)
    return
  }

  console.log(`✅ Found connection for seller: ${connection.seller_id}`)
  console.log(`   Refresh token: ${connection.refresh_token.substring(0, 20)}...`)

  // 2. Import finances functions
  const { listFinancialEvents } = await import('../src/lib/amazon-sp-api/finances')

  // 3. Test listFinancialEvents
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7) // Last 7 days

  console.log(`\n📊 Fetching financial events from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`)

  const result = await listFinancialEvents(connection.refresh_token, startDate, endDate)

  if (!result.success) {
    console.error('❌ Failed to fetch financial events:', result.error)
    return
  }

  console.log('\n✅ Financial Events Retrieved:')
  console.log(`   Shipment events: ${result.data?.shipmentEvents?.length || 0}`)
  console.log(`   Refund events: ${result.data?.refundEvents?.length || 0}`)
  console.log(`   Service fee events: ${result.data?.serviceFeeEvents?.length || 0}`)

  // 4. Show sample shipment event
  const shipmentEvents = result.data?.shipmentEvents || []
  if (shipmentEvents.length > 0) {
    console.log('\n📦 Sample Shipment Event:')
    console.log(JSON.stringify(shipmentEvents[0], null, 2).substring(0, 1000) + '...')
  }

  // 4.5 Build SKU->ASIN map from database
  console.log('\n🗺️ Building SKU->ASIN map from database...')

  // Fetch from products table
  const { data: products } = await supabase
    .from('products')
    .select('asin, seller_sku, sku')
    .eq('user_id', userId)

  // Fetch from order_items table
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('asin, seller_sku')
    .eq('user_id', userId)
    .not('asin', 'is', null)
    .not('seller_sku', 'is', null)

  const skuToAsinMap = new Map<string, string>()

  // Add from products
  if (products) {
    for (const p of products) {
      const sku = p.seller_sku || p.sku
      if (sku && p.asin) {
        skuToAsinMap.set(sku, p.asin)
      }
    }
  }

  // Add from order_items (if not already present)
  if (orderItems) {
    for (const item of orderItems) {
      if (item.seller_sku && item.asin && !skuToAsinMap.has(item.seller_sku)) {
        skuToAsinMap.set(item.seller_sku, item.asin)
      }
    }
  }

  console.log(`✅ SKU->ASIN map built with ${skuToAsinMap.size} mappings`)

  // 5. Test extractOrderFees (with SKU->ASIN map)
  if (shipmentEvents.length > 0) {
    const { extractOrderFees } = await import('../src/lib/amazon-sp-api/finances')

    const firstShipment = shipmentEvents[0]
    const orderId = firstShipment.AmazonOrderId || firstShipment.amazonOrderId

    console.log(`\n💰 Parsing fees for order: ${orderId}`)
    const orderFees = extractOrderFees(orderId, firstShipment, skuToAsinMap)

    console.log('\n📋 Order Fees Breakdown:')
    console.log(`   Total Items: ${orderFees.items.length}`)
    console.log(`   Total Amazon Fees: $${orderFees.totalFees.toFixed(2)}`)
    console.log(`   - FBA Fulfillment: $${orderFees.totalFbaFulfillmentFees.toFixed(2)}`)
    console.log(`   - Referral Fees: $${orderFees.totalReferralFees.toFixed(2)}`)
    console.log(`   - Storage Fees: $${orderFees.totalStorageFees.toFixed(2)}`)
    console.log(`   - Inbound Fees: $${orderFees.totalInboundFees.toFixed(2)}`)
    console.log(`   - Return Fees: $${orderFees.totalReturnFees.toFixed(2)}`)
    console.log(`   - Other Fees: $${orderFees.totalOtherFees.toFixed(2)}`)

    if (orderFees.items.length > 0) {
      console.log('\n   First Item Details:')
      const item = orderFees.items[0]
      console.log(`   - ASIN: ${item.asin}`)
      console.log(`   - Quantity: ${item.quantity}`)
      console.log(`   - Total Fee: $${item.totalFee.toFixed(2)}`)
      console.log(`   - FBA Per Unit: $${item.fbaPerUnitFulfillmentFee.toFixed(2)}`)
      console.log(`   - Referral Fee: $${item.referralFee.toFixed(2)}`)
    }
  }

  // 6. Test refund events (with SKU->ASIN map)
  const refundEvents = result.data?.refundEvents || []
  if (refundEvents.length > 0) {
    const { extractRefundFees } = await import('../src/lib/amazon-sp-api/finances')

    const firstRefund = refundEvents[0]
    const refundOrderId = firstRefund.AmazonOrderId || firstRefund.amazonOrderId

    console.log(`\n🔄 Parsing refund for order: ${refundOrderId}`)
    const refundFees = extractRefundFees(refundOrderId, firstRefund, skuToAsinMap)

    console.log('\n📋 Refund Fees Breakdown:')
    console.log(`   Total Refunded: $${refundFees.totalRefundedAmount.toFixed(2)}`)
    console.log(`   Refund Commission: $${refundFees.totalRefundCommission.toFixed(2)}`)
    console.log(`   Refunded Referral Fee: $${refundFees.totalRefundedReferralFee.toFixed(2)}`)
    console.log(`   Net Refund Cost: $${refundFees.netRefundCost.toFixed(2)}`)
  }

  console.log('\n✅ Test completed!')
}

main().catch(console.error)
