/**
 * Amazon SP-API Reports Integration
 *
 * This file provides functions to fetch and process Amazon SP-API reports
 * for dashboard metrics, sales data, and inventory tracking
 */

import { createAmazonSPAPIClient } from './client'

export type ReportType =
  | 'GET_SALES_AND_TRAFFIC_REPORT' // Sales & traffic by date
  | 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL' // Order details
  | 'GET_FBA_INVENTORY_PLANNING_DATA' // FBA inventory
  | 'GET_MERCHANT_LISTINGS_ALL_DATA' // All active listings
  | 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE' // Settlement/finances

export interface ReportOptions {
  reportType: ReportType
  startDate?: Date
  endDate?: Date
  marketplaceIds?: string[]
}

/**
 * Request a report from Amazon SP-API
 *
 * This creates a report request and returns the report document ID
 */
export async function requestReport(
  refreshToken: string,
  options: ReportOptions
) {
  const client = createAmazonSPAPIClient(refreshToken)

  const { reportType, startDate, endDate, marketplaceIds } = options

  try {
    // Request report creation
    const response = await client.callAPI({
      operation: 'createReport',
      endpoint: 'reports',
      body: {
        reportType,
        dataStartTime: startDate?.toISOString(),
        dataEndTime: endDate?.toISOString(),
        marketplaceIds: marketplaceIds || ['ATVPDKIKX0DER'], // Default to US
      },
    })

    return {
      success: true,
      reportId: response.reportId,
      message: 'Report requested successfully',
    }
  } catch (error: any) {
    console.error('Failed to request report:', error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Get report status and document ID when ready
 *
 * Poll this function until report is DONE
 */
export async function getReportStatus(
  refreshToken: string,
  reportId: string
) {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getReport',
      endpoint: 'reports',
      path: {
        reportId,
      },
    })

    const status = response.processingStatus
    const documentId = response.reportDocumentId

    return {
      success: true,
      status, // QUEUED, IN_PROGRESS, DONE, CANCELLED, FATAL
      documentId,
      data: response,
    }
  } catch (error: any) {
    console.error('Failed to get report status:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Download and parse report document
 *
 * Returns the report data as JSON or CSV string
 */
export async function downloadReport(
  refreshToken: string,
  documentId: string
): Promise<{ success: boolean; content?: string; format?: string; error?: string }> {
  const client = createAmazonSPAPIClient(refreshToken)

  try {
    const response = await client.callAPI({
      operation: 'getReportDocument',
      endpoint: 'reports',
      path: {
        reportDocumentId: documentId,
      },
    })

    // Download the document from the URL provided
    const documentUrl = response.url
    const compressionAlgorithm = response.compressionAlgorithm

    // Fetch document content
    const documentResponse = await fetch(documentUrl)
    const content = await documentResponse.text()

    // Handle compression if needed
    if (compressionAlgorithm === 'GZIP') {
      // TODO: Decompress GZIP if needed
      console.warn('GZIP compression detected, decompression needed')
    }

    return {
      success: true,
      content,
      format: response.reportType,
    }
  } catch (error) {
    console.error('Failed to download report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get Sales and Traffic Report (Last 30 days)
 *
 * This is a convenience function that handles the full report flow
 */
export async function getSalesAndTrafficReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30) // Last 30 days

  // ⚠️ SANDBOX MODE: Return mock data (Reports API not supported in sandbox)
  if (process.env.AMAZON_SP_API_SANDBOX === 'true') {
    console.log('📊 SANDBOX MODE: Returning mock sales data')

    // Generate 30 days of mock data
    const salesAndTrafficByDate = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      salesAndTrafficByDate.push({
        date: date.toISOString().split('T')[0],
        salesByDate: {
          orderedProductSales: { amount: 1000 + Math.random() * 2000, currencyCode: 'USD' },
          unitsOrdered: Math.floor(20 + Math.random() * 30),
          totalOrderItems: Math.floor(18 + Math.random() * 25),
          unitsRefunded: Math.floor(Math.random() * 3),
        },
        trafficByDate: {
          sessions: Math.floor(200 + Math.random() * 300),
          pageViews: Math.floor(500 + Math.random() * 500),
          unitSessionPercentage: 10 + Math.random() * 10,
        }
      })
    }

    return {
      success: true,
      data: {
        reportSpecification: { reportType: 'GET_SALES_AND_TRAFFIC_REPORT' },
        salesAndTrafficByDate
      }
    }
  }

  try {
    // Step 1: Request report
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_SALES_AND_TRAFFIC_REPORT',
      startDate,
      endDate,
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request report')
    }

    // Step 2: Poll for report completion (with timeout)
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Step 3: Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success || !reportData.content) {
      throw new Error('Failed to download report')
    }

    // Step 4: Parse JSON report
    const parsed = JSON.parse(reportData.content)

    return {
      success: true,
      data: parsed,
    }
  } catch (error: any) {
    console.error('Failed to get sales and traffic report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get Orders Report (Last 7 days)
 *
 * Fetches detailed order data
 */
export async function getOrdersReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7) // Last 7 days

  try {
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
      startDate,
      endDate,
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request orders report')
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success) {
      throw new Error('Failed to download report')
    }

    return {
      success: true,
      data: reportData.content, // CSV format
    }
  } catch (error: any) {
    console.error('Failed to get orders report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get FBA Inventory Report
 *
 * Fetches current inventory levels
 */
export async function getFBAInventoryReport(
  refreshToken: string,
  marketplaceIds?: string[]
) {
  try {
    const reportRequest = await requestReport(refreshToken, {
      reportType: 'GET_FBA_INVENTORY_PLANNING_DATA',
      marketplaceIds,
    })

    if (!reportRequest.success || !reportRequest.reportId) {
      throw new Error('Failed to request inventory report')
    }

    // Poll for completion
    let attempts = 0
    const maxAttempts = 20
    let reportStatus

    while (attempts < maxAttempts) {
      reportStatus = await getReportStatus(refreshToken, reportRequest.reportId)

      if (!reportStatus.success) {
        throw new Error('Failed to check report status')
      }

      if (reportStatus.status === 'DONE') {
        break
      }

      if (reportStatus.status === 'FATAL' || reportStatus.status === 'CANCELLED') {
        throw new Error(`Report failed with status: ${reportStatus.status}`)
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }

    if (!reportStatus || reportStatus.status !== 'DONE') {
      throw new Error('Report generation timed out')
    }

    // Download report
    const reportData = await downloadReport(refreshToken, reportStatus.documentId!)

    if (!reportData.success) {
      throw new Error('Failed to download report')
    }

    return {
      success: true,
      data: reportData.content, // CSV format
    }
  } catch (error: any) {
    console.error('Failed to get inventory report:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
