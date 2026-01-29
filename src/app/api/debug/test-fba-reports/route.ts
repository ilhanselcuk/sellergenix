/**
 * Debug endpoint - Test FBA Inventory via Reports API
 *
 * Reports API alternatif yol - FBA Inventory API 403 verdiğinde
 * GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA raporu kullan
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAmazonSPAPIClient } from '@/lib/amazon-sp-api/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') || 'request' // 'request', 'status', 'download'
    const reportId = searchParams.get('reportId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId is REQUIRED. Usage: /api/debug/test-fba-reports?userId=xxx'
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

    const client = createAmazonSPAPIClient(connection.refresh_token)
    const marketplaceId = 'ATVPDKIKX0DER' // US marketplace

    const results: any = {
      userId,
      sellerId: connection.seller_id,
      action,
      timestamp: new Date().toISOString()
    }

    // ============================================
    // ACTION 1: Request FBA Inventory Report
    // ============================================
    if (action === 'request') {
      try {
        // Request FBA Inventory Report
        const reportResponse = await client.callAPI({
          operation: 'createReport',
          endpoint: 'reports',
          body: {
            reportType: 'GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA',
            marketplaceIds: [marketplaceId],
          },
        })

        results.reportRequest = {
          success: true,
          status: 'Report requested! 🎉',
          reportId: reportResponse.reportId,
          nextStep: `Check status: /api/debug/test-fba-reports?userId=${userId}&action=status&reportId=${reportResponse.reportId}`,
          note: 'Report generation takes 1-5 minutes. Use the status link to check progress.'
        }
      } catch (error: any) {
        results.reportRequest = {
          success: false,
          error: error.message,
          statusCode: error.response?.status,
          details: error.response?.data || null
        }
      }

      // Also try alternative report types
      const alternativeReports = [
        'GET_FBA_INVENTORY_PLANNING_DATA',
        'GET_MERCHANT_LISTINGS_ALL_DATA',
        'GET_AFN_INVENTORY_DATA'
      ]

      results.alternativeReports = {}

      for (const reportType of alternativeReports) {
        try {
          const altResponse = await client.callAPI({
            operation: 'createReport',
            endpoint: 'reports',
            body: {
              reportType,
              marketplaceIds: [marketplaceId],
            },
          })

          results.alternativeReports[reportType] = {
            success: true,
            reportId: altResponse.reportId
          }
        } catch (error: any) {
          results.alternativeReports[reportType] = {
            success: false,
            error: error.message,
            statusCode: error.response?.status
          }
        }
      }
    }

    // ============================================
    // ACTION 2: Check Report Status
    // ============================================
    if (action === 'status') {
      if (!reportId) {
        return NextResponse.json({
          error: 'reportId is REQUIRED for status check'
        }, { status: 400 })
      }

      try {
        const statusResponse = await client.callAPI({
          operation: 'getReport',
          endpoint: 'reports',
          path: {
            reportId: reportId
          }
        })

        results.reportStatus = {
          success: true,
          reportId: statusResponse.reportId,
          reportType: statusResponse.reportType,
          processingStatus: statusResponse.processingStatus,
          reportDocumentId: statusResponse.reportDocumentId || null,
          createdTime: statusResponse.createdTime,
          processingStartTime: statusResponse.processingStartTime,
          processingEndTime: statusResponse.processingEndTime
        }

        if (statusResponse.processingStatus === 'DONE' && statusResponse.reportDocumentId) {
          results.reportStatus.nextStep = `Download report: /api/debug/test-fba-reports?userId=${userId}&action=download&reportId=${statusResponse.reportDocumentId}`
        } else if (statusResponse.processingStatus === 'IN_PROGRESS' || statusResponse.processingStatus === 'IN_QUEUE') {
          results.reportStatus.message = 'Report is still processing. Try again in 1-2 minutes.'
        } else if (statusResponse.processingStatus === 'FATAL' || statusResponse.processingStatus === 'CANCELLED') {
          results.reportStatus.message = 'Report failed or was cancelled.'
        }
      } catch (error: any) {
        results.reportStatus = {
          success: false,
          error: error.message,
          statusCode: error.response?.status,
          details: error.response?.data || null
        }
      }
    }

    // ============================================
    // ACTION 3: Download Report Document
    // ============================================
    if (action === 'download') {
      if (!reportId) {
        return NextResponse.json({
          error: 'reportId (reportDocumentId) is REQUIRED for download'
        }, { status: 400 })
      }

      try {
        // Get report document URL
        const docResponse = await client.callAPI({
          operation: 'getReportDocument',
          endpoint: 'reports',
          path: {
            reportDocumentId: reportId
          }
        })

        results.reportDocument = {
          success: true,
          reportDocumentId: docResponse.reportDocumentId,
          url: docResponse.url,
          compressionAlgorithm: docResponse.compressionAlgorithm || 'none'
        }

        // Try to fetch and parse the report content
        if (docResponse.url) {
          try {
            const reportContent = await fetch(docResponse.url)
            const text = await reportContent.text()

            // Parse TSV/CSV content
            const lines = text.split('\n').filter(line => line.trim())
            const headers = lines[0]?.split('\t') || []

            const items = lines.slice(1, 11).map(line => { // First 10 items
              const values = line.split('\t')
              const item: any = {}
              headers.forEach((header, index) => {
                item[header] = values[index] || ''
              })
              return item
            })

            results.reportContent = {
              success: true,
              totalLines: lines.length - 1, // Exclude header
              headers: headers,
              sampleData: items,
              note: 'Showing first 10 items only'
            }
          } catch (fetchError: any) {
            results.reportContent = {
              success: false,
              error: 'Failed to fetch report content',
              details: fetchError.message
            }
          }
        }
      } catch (error: any) {
        results.reportDocument = {
          success: false,
          error: error.message,
          statusCode: error.response?.status,
          details: error.response?.data || null
        }
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
