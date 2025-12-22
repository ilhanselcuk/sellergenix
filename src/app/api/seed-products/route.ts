/**
 * API Route: Seed Sample Products
 * Creates sample products for testing COGS functionality
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // First, check if marketplace exists, if not create a default one
    const { data: marketplaceData } = await supabase
      .from('marketplaces')
      .select('id')
      .eq('country_code', 'US')
      .single()

    let marketplaceId = marketplaceData?.id

    // If no marketplace exists, create one
    if (!marketplaceId) {
      const { data: newMarketplace } = await supabase
        .from('marketplaces')
        .insert({
          name: 'United States',
          country_code: 'US',
          currency: 'USD',
          sp_api_endpoint: 'https://sellingpartnerapi-na.amazon.com'
        })
        .select('id')
        .single()

      marketplaceId = newMarketplace?.id
    }

    // Sample products data
    const sampleProducts = [
      {
        user_id: user.id,
        marketplace_id: marketplaceId,
        asin: 'B0XXYYZZ11',
        sku: 'YM-001',
        title: 'Premium Yoga Mat - Non-Slip Extra Thick Exercise Mat',
        image_url: null,
        price: 49.99,
        currency: 'USD',
        marketplace: 'US',
        fba_stock: 487,
        fbm_stock: 0,
        cogs: null, // COGS not set
        cogs_type: 'constant',
        weight_lbs: 3.5,
        product_category: 'Sports & Outdoors',
        is_active: true,
      },
      {
        user_id: user.id,
        marketplace_id: marketplaceId,
        asin: 'B0AABBCC22',
        sku: 'RB-002',
        title: 'Resistance Bands Set - 5 Pack Exercise Bands',
        image_url: null,
        price: 34.99,
        currency: 'USD',
        marketplace: 'US',
        fba_stock: 623,
        fbm_stock: 0,
        cogs: 12.50, // COGS set
        cogs_type: 'constant',
        weight_lbs: 1.2,
        product_category: 'Sports & Outdoors',
        is_active: true,
      },
      {
        user_id: user.id,
        marketplace_id: marketplaceId,
        asin: 'B0DDEEFF33',
        sku: 'FR-003',
        title: 'Foam Roller for Muscle Recovery',
        image_url: null,
        price: 29.99,
        currency: 'USD',
        marketplace: 'US',
        fba_stock: 312,
        fbm_stock: 0,
        cogs: 9.75,
        cogs_type: 'constant',
        weight_lbs: 2.1,
        product_category: 'Sports & Outdoors',
        is_active: true,
      },
      {
        user_id: user.id,
        marketplace_id: marketplaceId,
        asin: 'B0GGHHII44',
        sku: 'EB-004',
        title: 'Exercise Ball with Pump - 65cm',
        image_url: null,
        price: 24.99,
        currency: 'USD',
        marketplace: 'US',
        fba_stock: 198,
        fbm_stock: 0,
        cogs: 8.25,
        cogs_type: 'constant',
        weight_lbs: 2.8,
        product_category: 'Sports & Outdoors',
        is_active: true,
      },
      {
        user_id: user.id,
        marketplace_id: marketplaceId,
        asin: 'B0JJKKLL55',
        sku: 'YB-005',
        title: 'Yoga Blocks 2 Pack - High Density Foam',
        image_url: null,
        price: 19.99,
        currency: 'USD',
        marketplace: 'US',
        fba_stock: 542,
        fbm_stock: 0,
        cogs: null, // COGS not set
        cogs_type: 'constant',
        weight_lbs: 1.5,
        product_category: 'Sports & Outdoors',
        is_active: true,
      },
    ]

    // Insert products
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select()

    if (error) {
      console.error('Error inserting products:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} sample products created successfully`,
      products: data,
    })
  } catch (error) {
    console.error('Seed products error:', error)
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    )
  }
}
