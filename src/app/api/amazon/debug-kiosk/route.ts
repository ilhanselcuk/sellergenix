/**
 * Debug Data Kiosk Response Structure
 *
 * Downloads a small sample and shows the actual JSON structure
 * GET /api/amazon/debug-kiosk
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createDataKioskQuery,
  getDataKioskQuery,
  getDataKioskDocument,
  downloadDataKioskDocument,
  buildSalesAndTrafficQuery,
} from '@/lib/amazon-sp-api/data-kiosk'

export const maxDuration = 60

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'No Amazon connection' }, { status: 404 })
    }

    const refreshToken = connection.refresh_token

    // Create a small query (last 3 days only)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 3)

    const query = buildSalesAndTrafficQuery(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      ['ATVPDKIKX0DER'],
      'DAY'
    )

    console.log('[Debug] Query:', query)

    // Create query
    const createResult = await createDataKioskQuery(refreshToken, query)
    if (!createResult.success || !createResult.queryId) {
      return NextResponse.json({ error: 'Failed to create query', details: createResult }, { status: 500 })
    }

    // Poll for completion (max 2 minutes)
    let queryResult
    for (let i = 0; i < 24; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 sec

      queryResult = await getDataKioskQuery(refreshToken, createResult.queryId)
      console.log(`[Debug] Poll ${i}: status=${queryResult.query?.processingStatus}`)

      if (queryResult.query?.processingStatus === 'DONE') break
      if (queryResult.query?.processingStatus === 'CANCELLED' || queryResult.query?.processingStatus === 'FATAL') {
        return NextResponse.json({ error: 'Query failed', status: queryResult.query?.processingStatus }, { status: 500 })
      }
    }

    if (queryResult?.query?.processingStatus !== 'DONE') {
      return NextResponse.json({ error: 'Query timeout', lastStatus: queryResult?.query?.processingStatus }, { status: 504 })
    }

    // Get document
    const documentId = queryResult.query?.documentId
    if (!documentId) {
      return NextResponse.json({ error: 'No documentId in response' }, { status: 500 })
    }

    const docResult = await getDataKioskDocument(refreshToken, documentId)
    if (!docResult.success || !docResult.document?.documentUrl) {
      return NextResponse.json({ error: 'Failed to get document URL' }, { status: 500 })
    }

    // Download and show RAW structure
    const downloadResult = await downloadDataKioskDocument(docResult.document.documentUrl)
    if (!downloadResult.success || !downloadResult.data) {
      return NextResponse.json({ error: 'Failed to download', details: downloadResult }, { status: 500 })
    }

    // Return full structure of first record
    const firstRecord = downloadResult.data[0]

    return NextResponse.json({
      success: true,
      totalRecords: downloadResult.data.length,
      rawStructure: firstRecord,
      // Also show the nested sales/traffic if it exists
      extractedSalesTraffic: (firstRecord as any)?.analytics_salesAndTraffic_2024_04_24?.salesAndTrafficByDate?.[0] || null,
      // Show all keys at each level
      topLevelKeys: Object.keys(firstRecord || {}),
      nestedKeys: firstRecord ? Object.keys((firstRecord as any)?.analytics_salesAndTraffic_2024_04_24 || {}) : []
    })

  } catch (error: any) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
