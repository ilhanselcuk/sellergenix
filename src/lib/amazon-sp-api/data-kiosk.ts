/**
 * Amazon SP-API Data Kiosk Service
 *
 * GraphQL-based bulk data API for scalable data retrieval
 * Replaces Reports API for large-scale historical syncs
 *
 * @see https://developer-docs.amazon.com/sp-api/docs/data-kiosk-api
 */

import { getAccessToken } from './auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Data Kiosk API base URL (North America)
const DATA_KIOSK_BASE_URL = 'https://sellingpartnerapi-na.amazon.com/dataKiosk/2023-11-15';

// Processing statuses
export type QueryStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'FATAL';

export interface DataKioskQuery {
  queryId: string;
  query: string;
  createdTime: string;
  processingStatus: QueryStatus;
  processingStartTime?: string;
  processingEndTime?: string;
  dataDocumentId?: string;
  errorDocumentId?: string;
  pagination?: {
    nextToken?: string;
  };
}

export interface DataKioskDocument {
  documentId: string;
  documentUrl: string;
}

/**
 * Create a Data Kiosk GraphQL query
 *
 * @param refreshToken - Amazon refresh token
 * @param graphqlQuery - GraphQL query string (max 8000 chars after whitespace removal)
 * @param paginationToken - Optional token for multi-page results
 */
export async function createDataKioskQuery(
  refreshToken: string,
  graphqlQuery: string,
  paginationToken?: string
): Promise<{ success: boolean; queryId?: string; error?: string }> {
  try {
    const accessToken = await getAccessToken(refreshToken);

    // Minify query (remove extra whitespace)
    const minifiedQuery = graphqlQuery.replace(/\s+/g, ' ').trim();

    if (minifiedQuery.length > 8000) {
      return { success: false, error: 'Query exceeds 8000 character limit' };
    }

    const body: { query: string; paginationToken?: string } = {
      query: minifiedQuery,
    };

    if (paginationToken) {
      body.paginationToken = paginationToken;
    }

    const response = await fetch(`${DATA_KIOSK_BASE_URL}/queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Data Kiosk] createQuery failed:', response.status, errorText);
      return { success: false, error: `API error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[Data Kiosk] Query created:', data.queryId);

    return { success: true, queryId: data.queryId };
  } catch (error) {
    console.error('[Data Kiosk] createQuery error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get query status and results
 *
 * @param refreshToken - Amazon refresh token
 * @param queryId - Query ID from createQuery
 */
export async function getDataKioskQuery(
  refreshToken: string,
  queryId: string
): Promise<{ success: boolean; query?: DataKioskQuery; error?: string }> {
  try {
    const accessToken = await getAccessToken(refreshToken);

    const response = await fetch(`${DATA_KIOSK_BASE_URL}/queries/${queryId}`, {
      method: 'GET',
      headers: {
        'x-amz-access-token': accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Data Kiosk] getQuery failed:', response.status, errorText);
      return { success: false, error: `API error ${response.status}: ${errorText}` };
    }

    const data: DataKioskQuery = await response.json();
    console.log('[Data Kiosk] Query status:', data.processingStatus);

    return { success: true, query: data };
  } catch (error) {
    console.error('[Data Kiosk] getQuery error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get document download URL
 *
 * @param refreshToken - Amazon refresh token
 * @param documentId - Document ID from query result
 */
export async function getDataKioskDocument(
  refreshToken: string,
  documentId: string
): Promise<{ success: boolean; document?: DataKioskDocument; error?: string }> {
  try {
    const accessToken = await getAccessToken(refreshToken);

    const response = await fetch(`${DATA_KIOSK_BASE_URL}/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'x-amz-access-token': accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Data Kiosk] getDocument failed:', response.status, errorText);
      return { success: false, error: `API error ${response.status}: ${errorText}` };
    }

    const data: DataKioskDocument = await response.json();
    console.log('[Data Kiosk] Document URL obtained (expires in 5 min)');

    return { success: true, document: data };
  } catch (error) {
    console.error('[Data Kiosk] getDocument error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Download and parse document content (JSONL format)
 *
 * @param documentUrl - Presigned URL from getDocument
 */
export async function downloadDataKioskDocument<T = any>(
  documentUrl: string
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  try {
    const response = await fetch(documentUrl);

    if (!response.ok) {
      return { success: false, error: `Download failed: ${response.status}` };
    }

    // Check if compressed
    const contentEncoding = response.headers.get('Content-Encoding');
    let text: string;

    if (contentEncoding === 'gzip') {
      // Handle gzip decompression
      const buffer = await response.arrayBuffer();
      const decompressed = await decompressGzip(buffer);
      text = decompressed;
    } else {
      text = await response.text();
    }

    // Parse JSONL (one JSON object per line)
    const lines = text.trim().split('\n').filter(line => line.trim());
    const data = lines.map(line => JSON.parse(line) as T);

    console.log(`[Data Kiosk] Downloaded ${data.length} records`);

    return { success: true, data };
  } catch (error) {
    console.error('[Data Kiosk] download error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Decompress gzip data
 */
async function decompressGzip(buffer: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream('gzip');
  const decompressedStream = new Response(buffer).body!.pipeThrough(ds);
  const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
  return new TextDecoder().decode(decompressedBuffer);
}

/**
 * Cancel a running query
 *
 * @param refreshToken - Amazon refresh token
 * @param queryId - Query ID to cancel
 */
export async function cancelDataKioskQuery(
  refreshToken: string,
  queryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken(refreshToken);

    const response = await fetch(`${DATA_KIOSK_BASE_URL}/queries/${queryId}`, {
      method: 'DELETE',
      headers: {
        'x-amz-access-token': accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Cancel failed: ${response.status}` };
    }

    console.log('[Data Kiosk] Query cancelled:', queryId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// GraphQL Query Builders
// ============================================

/**
 * Build Sales and Traffic query for a date range
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param marketplaceIds - Optional marketplace filter
 * @param granularity - DAY, WEEK, or MONTH
 */
export function buildSalesAndTrafficQuery(
  startDate: string,
  endDate: string,
  marketplaceIds?: string[],
  granularity: 'DAY' | 'WEEK' | 'MONTH' = 'DAY'
): string {
  const marketplaceFilter = marketplaceIds?.length
    ? `marketplaceIds: [${marketplaceIds.map(id => `"${id}"`).join(', ')}]`
    : '';

  return `
    query SalesAndTraffic {
      analytics_salesAndTraffic_2024_04_24 {
        salesAndTrafficByDate(
          startDate: "${startDate}"
          endDate: "${endDate}"
          aggregateBy: ${granularity}
          ${marketplaceFilter}
        ) {
          startDate
          endDate
          sales {
            orderedProductSales {
              amount
              currencyCode
            }
            orderedProductSalesB2B {
              amount
              currencyCode
            }
            unitsOrdered
            unitsOrderedB2B
            totalOrderItems
            totalOrderItemsB2B
          }
          traffic {
            browserPageViews
            browserPageViewsB2B
            mobileAppPageViews
            mobileAppPageViewsB2B
            pageViews
            pageViewsB2B
            browserSessions
            browserSessionsB2B
            mobileAppSessions
            mobileAppSessionsB2B
            sessions
            sessionsB2B
            buyBoxPercentage
            buyBoxPercentageB2B
            unitSessionPercentage
            unitSessionPercentageB2B
          }
        }
      }
    }
  `;
}

/**
 * Build Sales and Traffic by ASIN query
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param asins - Optional ASIN filter
 */
export function buildSalesAndTrafficByAsinQuery(
  startDate: string,
  endDate: string,
  asins?: string[]
): string {
  const asinFilter = asins?.length
    ? `asins: [${asins.map(a => `"${a}"`).join(', ')}]`
    : '';

  return `
    query SalesAndTrafficByAsin {
      analytics_salesAndTraffic_2024_04_24 {
        salesAndTrafficByAsin(
          startDate: "${startDate}"
          endDate: "${endDate}"
          ${asinFilter}
        ) {
          parentAsin
          childAsin
          sku
          sales {
            orderedProductSales {
              amount
              currencyCode
            }
            unitsOrdered
            totalOrderItems
          }
          traffic {
            browserPageViews
            mobileAppPageViews
            sessions
            buyBoxPercentage
            unitSessionPercentage
          }
        }
      }
    }
  `;
}

// ============================================
// High-Level Workflow Functions
// ============================================

/**
 * Execute a Data Kiosk query and wait for results
 *
 * @param refreshToken - Amazon refresh token
 * @param graphqlQuery - GraphQL query string
 * @param maxWaitMs - Maximum wait time in milliseconds (default 30 minutes)
 * @param pollIntervalMs - Poll interval in milliseconds (default 30 seconds)
 */
export async function executeDataKioskQuery<T = any>(
  refreshToken: string,
  graphqlQuery: string,
  maxWaitMs: number = 30 * 60 * 1000,
  pollIntervalMs: number = 30 * 1000
): Promise<{
  success: boolean;
  data?: T[];
  queryId?: string;
  status?: QueryStatus;
  error?: string;
}> {
  // Step 1: Create query
  const createResult = await createDataKioskQuery(refreshToken, graphqlQuery);
  if (!createResult.success || !createResult.queryId) {
    return { success: false, error: createResult.error || 'Failed to create query' };
  }

  const queryId = createResult.queryId;
  const startTime = Date.now();

  // Step 2: Poll for completion
  while (Date.now() - startTime < maxWaitMs) {
    const queryResult = await getDataKioskQuery(refreshToken, queryId);
    if (!queryResult.success || !queryResult.query) {
      return { success: false, queryId, error: queryResult.error || 'Failed to get query status' };
    }

    const status = queryResult.query.processingStatus;

    if (status === 'DONE') {
      // Step 3: Get document
      if (!queryResult.query.dataDocumentId) {
        return { success: false, queryId, status, error: 'No data document ID' };
      }

      const docResult = await getDataKioskDocument(refreshToken, queryResult.query.dataDocumentId);
      if (!docResult.success || !docResult.document) {
        return { success: false, queryId, status, error: docResult.error || 'Failed to get document' };
      }

      // Step 4: Download and parse
      const downloadResult = await downloadDataKioskDocument<T>(docResult.document.documentUrl);
      if (!downloadResult.success) {
        return { success: false, queryId, status, error: downloadResult.error };
      }

      return { success: true, data: downloadResult.data, queryId, status };
    }

    if (status === 'CANCELLED' || status === 'FATAL') {
      // Get error details if available
      let errorDetail = `Query ${status}`;
      if (queryResult.query.errorDocumentId) {
        const errorDoc = await getDataKioskDocument(refreshToken, queryResult.query.errorDocumentId);
        if (errorDoc.success && errorDoc.document) {
          const errorData = await downloadDataKioskDocument(errorDoc.document.documentUrl);
          if (errorData.success && errorData.data) {
            errorDetail = JSON.stringify(errorData.data);
          }
        }
      }
      return { success: false, queryId, status, error: errorDetail };
    }

    // Still processing, wait and retry
    console.log(`[Data Kiosk] Query ${queryId} status: ${status}, waiting ${pollIntervalMs/1000}s...`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Timeout
  return { success: false, queryId, error: `Query timed out after ${maxWaitMs/1000}s` };
}

/**
 * Sync historical sales and traffic data using Data Kiosk
 *
 * @param userId - User ID in database
 * @param refreshToken - Amazon refresh token
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function syncSalesAndTrafficData(
  userId: string,
  refreshToken: string,
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  recordsInserted: number;
  error?: string;
}> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  console.log(`[Data Kiosk] Syncing sales & traffic: ${startStr} to ${endStr}`);

  // Build and execute query
  const query = buildSalesAndTrafficQuery(startStr, endStr, undefined, 'DAY');
  const result = await executeDataKioskQuery(refreshToken, query);

  if (!result.success || !result.data) {
    return { success: false, recordsInserted: 0, error: result.error };
  }

  // Process and insert data
  let recordsInserted = 0;

  for (const record of result.data) {
    try {
      // Extract data from GraphQL response structure
      const salesTrafficData = (record as any)?.analytics_salesAndTraffic_2024_04_24?.salesAndTrafficByDate || [];

      for (const day of salesTrafficData) {
        const { error } = await supabase
          .from('daily_metrics')
          .upsert({
            user_id: userId,
            date: day.startDate,
            // Sales metrics
            sales: day.sales?.orderedProductSales?.amount || 0,
            units_sold: day.sales?.unitsOrdered || 0,
            orders: day.sales?.totalOrderItems || 0,
            // Traffic metrics
            sessions: day.traffic?.sessions || 0,
            page_views: day.traffic?.pageViews || 0,
            buy_box_percentage: day.traffic?.buyBoxPercentage || 0,
            unit_session_percentage: day.traffic?.unitSessionPercentage || 0,
            // Source
            data_source: 'data_kiosk',
            synced_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,date',
          });

        if (!error) {
          recordsInserted++;
        }
      }
    } catch (err) {
      console.error('[Data Kiosk] Insert error:', err);
    }
  }

  console.log(`[Data Kiosk] Inserted ${recordsInserted} daily records`);

  return { success: true, recordsInserted };
}
