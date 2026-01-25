/**
 * Inngest Background Functions
 *
 * Long-running tasks that would timeout on Vercel's 10s/60s limit
 * Inngest handles retries, rate limiting, and execution tracking
 */

import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";
import {
  syncShippedOrderFees,
  estimatePendingOrderFees,
  refreshAllProductFeeAverages,
  syncAllHistoricalFees,
} from "@/lib/amazon-sp-api";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Main Fee Sync Function
 *
 * Orchestrates the entire fee sync process:
 * 1. Get shipped orders from last N hours
 * 2. Sync fees for each order (with rate limiting)
 * 3. Estimate fees for pending orders
 * 4. Refresh product fee averages
 */
export const syncAmazonFees = inngest.createFunction(
  {
    id: "sync-amazon-fees",
    retries: 2,
    // Concurrency limit - only 1 sync per user at a time
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.fees" },
  async ({ event, step }) => {
    const { userId, refreshToken, hours, type } = event.data;

    console.log(`🚀 [Inngest] Starting fee sync for user ${userId}, type: ${type}, hours: ${hours}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      type,
      hours,
    };

    // Step 1: Get shipped orders that need fee sync
    if (type === "shipped" || type === "all") {
      const shippedResult = await step.run("get-shipped-orders", async () => {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);

        // Get shipped orders without fees
        const { data: orders, error } = await supabase
          .from("orders")
          .select("amazon_order_id")
          .eq("user_id", userId)
          .eq("order_status", "Shipped")
          .gte("purchase_date", cutoffDate.toISOString())
          .order("purchase_date", { ascending: false });

        if (error) {
          console.error("Error fetching shipped orders:", error);
          return { orders: [] as { amazon_order_id: string }[], error: error.message };
        }

        console.log(`📦 Found ${orders?.length || 0} shipped orders to process`);
        return { orders: (orders || []) as { amazon_order_id: string }[], error: null };
      });

      // Step 2: Sync fees for each shipped order
      if (shippedResult.orders.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        let totalFeesApplied = 0;

        // Process orders in batches to avoid overwhelming the API
        const batchSize = 10;
        const batches: { amazon_order_id: string }[][] = [];
        for (let i = 0; i < shippedResult.orders.length; i += batchSize) {
          batches.push(shippedResult.orders.slice(i, i + batchSize));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];

          await step.run(`sync-batch-${batchIndex}`, async () => {
            for (const order of batch) {
              try {
                const result = await syncShippedOrderFees(
                  userId,
                  order.amazon_order_id,
                  refreshToken
                );

                if (result.success) {
                  successCount++;
                  totalFeesApplied += result.totalFeesApplied;
                } else {
                  errorCount++;
                }
              } catch (err) {
                console.error(`Error syncing order ${order.amazon_order_id}:`, err);
                errorCount++;
              }

              // Rate limit: 200ms between orders
              await new Promise((resolve) => setTimeout(resolve, 200));
            }

            return { processed: batch.length };
          });

          // Small delay between batches
          if (batchIndex < batches.length - 1) {
            await step.sleep(`batch-delay-${batchIndex}`, "500ms");
          }
        }

        results.shippedOrders = {
          total: shippedResult.orders.length,
          success: successCount,
          errors: errorCount,
          totalFeesApplied,
        };
      } else {
        results.shippedOrders = { total: 0, message: "No shipped orders found" };
      }
    }

    // Step 3: Estimate fees for pending orders
    if (type === "pending" || type === "all") {
      const pendingResult = await step.run("estimate-pending-fees", async () => {
        // Get pending orders
        const { data: pendingOrders, error } = await supabase
          .from("orders")
          .select("amazon_order_id")
          .eq("user_id", userId)
          .in("order_status", ["Pending", "Unshipped"]);

        if (error || !pendingOrders) {
          return { total: 0, error: error?.message };
        }

        let successCount = 0;
        let errorCount = 0;

        for (const order of pendingOrders) {
          try {
            const result = await estimatePendingOrderFees(userId, order.amazon_order_id);
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }

          // Rate limit
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return { total: pendingOrders.length, success: successCount, errors: errorCount };
      });

      results.pendingOrders = pendingResult;
    }

    // Step 4: Refresh product fee averages
    if (type === "all") {
      const avgResult = await step.run("refresh-product-averages", async () => {
        try {
          const result = await refreshAllProductFeeAverages(userId);
          return result;
        } catch (error) {
          return { error: String(error) };
        }
      });

      results.productAverages = avgResult;
    }

    results.completedAt = new Date().toISOString();

    console.log(`✅ [Inngest] Fee sync completed for user ${userId}:`, results);

    return results;
  }
);

/**
 * Single Order Fee Sync
 *
 * Sync fees for a single order (used when order ships)
 */
export const syncSingleOrderFees = inngest.createFunction(
  {
    id: "sync-single-order-fees",
    retries: 3,
  },
  { event: "amazon/sync.order-fees" },
  async ({ event, step }) => {
    const { userId, refreshToken, amazonOrderId } = event.data;

    console.log(`📦 [Inngest] Syncing fees for order ${amazonOrderId}`);

    const result = await step.run("sync-order", async () => {
      return await syncShippedOrderFees(userId, amazonOrderId, refreshToken);
    });

    // Update product averages after syncing
    if (result.success) {
      await step.run("update-averages", async () => {
        return await refreshAllProductFeeAverages(userId);
      });
    }

    return result;
  }
);

/**
 * Scheduled Fee Sync (Cron Job)
 *
 * Runs every 15 minutes to sync new shipped orders
 * This is triggered by Vercel Cron or Inngest scheduled trigger
 */
export const scheduledFeeSync = inngest.createFunction(
  {
    id: "scheduled-fee-sync",
    retries: 1,
  },
  // Run every 15 minutes
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    console.log("⏰ [Inngest] Starting scheduled fee sync");

    // Get all active Amazon connections
    const connections = await step.run("get-connections", async () => {
      const { data, error } = await supabase
        .from("amazon_connections")
        .select("user_id, refresh_token")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching connections:", error);
        return [];
      }

      return data || [];
    });

    console.log(`📊 Found ${connections.length} active connections to sync`);

    // Trigger fee sync for each user
    const results = [];
    for (const conn of connections) {
      await step.run(`trigger-sync-${conn.user_id}`, async () => {
        // Send event to trigger individual sync
        await inngest.send({
          name: "amazon/sync.fees",
          data: {
            userId: conn.user_id,
            refreshToken: conn.refresh_token,
            hours: 1, // Last 1 hour for scheduled sync
            type: "shipped",
          },
        });

        return { userId: conn.user_id, triggered: true };
      });

      results.push(conn.user_id);

      // Delay between users to spread load
      await step.sleep(`user-delay-${conn.user_id}`, "2s");
    }

    return {
      usersProcessed: results.length,
      completedAt: new Date().toISOString(),
    };
  }
);

/**
 * Historical Data Sync Function
 *
 * Syncs up to 2 years of historical order data from Amazon SP-API
 * This is a long-running task that uses Inngest steps for reliability
 *
 * Process:
 * 1. Fetch orders in monthly chunks (to avoid rate limits)
 * 2. For each batch of orders, fetch order items
 * 3. Save to database
 * 4. Track progress
 */
export const syncHistoricalData = inngest.createFunction(
  {
    id: "sync-historical-data",
    retries: 3,
    // Only 1 historical sync per user at a time
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.historical" },
  async ({ event, step }) => {
    const { userId, refreshToken, marketplaceIds, yearsBack = 2 } = event.data;

    console.log(`🚀 [Inngest] Starting historical sync for user ${userId}, years: ${yearsBack}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      yearsBack,
      marketplaceIds,
    };

    // Calculate date range - 2 years back from now
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    console.log(`📅 Syncing orders from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Split into 2-week chunks to avoid timeout on busy months
    // Monthly chunks were timing out at chunk 16 (busy month with many orders)
    const CHUNK_DAYS = 14; // 2 weeks instead of 1 month
    const orderChunks: { start: Date; end: Date }[] = [];
    let chunkStart = new Date(startDate);

    while (chunkStart < endDate) {
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkEnd.getDate() + CHUNK_DAYS);
      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }

      orderChunks.push({ start: new Date(chunkStart), end: new Date(chunkEnd) });
      chunkStart = new Date(chunkEnd);
    }

    console.log(`📊 Split into ${orderChunks.length} bi-weekly chunks (${CHUNK_DAYS} days each)`);

    let totalOrders = 0;
    let totalOrderItems = 0;
    let processedChunks = 0;

    // Process each bi-weekly chunk
    for (let i = 0; i < orderChunks.length; i++) {
      const chunk = orderChunks[i];
      const chunkLabel = `${chunk.start.toISOString().split("T")[0]} to ${chunk.end.toISOString().split("T")[0]}`;

      const chunkResult = await step.run(`sync-chunk-${i}`, async () => {
        console.log(`📦 Processing chunk ${i + 1}/${orderChunks.length}: ${chunkLabel}`);

        // Dynamic import to avoid circular dependencies
        const { getOrders, getOrderItems } = await import("@/lib/amazon-sp-api/orders");

        let chunkOrders = 0;
        let chunkItems = 0;
        let nextToken: string | undefined;
        let pageCount = 0;

        // Paginate through all orders in this chunk
        do {
          // Build query params
          const queryParams: Record<string, any> = {
            MarketplaceIds: marketplaceIds,
            CreatedAfter: chunk.start.toISOString(),
            CreatedBefore: new Date(chunk.end.getTime() - 3 * 60 * 1000).toISOString(), // 3 min buffer
            MaxResultsPerPage: 100,
          };

          if (nextToken) {
            queryParams.NextToken = nextToken;
          }

          // Fetch orders page
          const ordersResult = await getOrders(
            refreshToken,
            marketplaceIds,
            chunk.start,
            chunk.end
          );

          if (!ordersResult.success || !ordersResult.orders) {
            console.error(`❌ Failed to fetch orders for chunk ${i}:`, ordersResult.error);
            break;
          }

          const orders = ordersResult.orders;
          nextToken = ordersResult.nextToken;
          pageCount++;

          console.log(`  Page ${pageCount}: ${orders.length} orders`);

          // Save orders to database
          for (const order of orders) {
            // Skip canceled orders
            if (order.orderStatus === "Canceled") {
              continue;
            }

            // Upsert order
            const { error: orderError } = await supabase
              .from("orders")
              .upsert(
                {
                  user_id: userId,
                  amazon_order_id: order.amazonOrderId,
                  purchase_date: order.purchaseDate,
                  last_update_date: order.lastUpdateDate,
                  order_status: order.orderStatus,
                  fulfillment_channel: order.fulfillmentChannel,
                  sales_channel: order.salesChannel,
                  order_total: order.orderTotal?.amount
                    ? parseFloat(order.orderTotal.amount)
                    : null,
                  currency_code: order.orderTotal?.currencyCode || "USD",
                  marketplace_id: order.marketplaceId || marketplaceIds[0],
                  number_of_items_shipped: order.numberOfItemsShipped || 0,
                  number_of_items_unshipped: order.numberOfItemsUnshipped || 0,
                  is_prime: order.isPrime || false,
                  is_business: order.isBusinessOrder || false,
                },
                { onConflict: "amazon_order_id" }
              );

            if (orderError) {
              console.error(`  Error saving order ${order.amazonOrderId}:`, orderError.message);
              continue;
            }

            chunkOrders++;

            // Fetch order items
            const itemsResult = await getOrderItems(refreshToken, order.amazonOrderId);

            if (itemsResult.success && itemsResult.orderItems) {
              for (const item of itemsResult.orderItems) {
                // Upsert order item
                const { error: itemError } = await supabase
                  .from("order_items")
                  .upsert(
                    {
                      user_id: userId,
                      amazon_order_id: order.amazonOrderId,
                      order_item_id: item.orderItemId,
                      asin: item.asin,
                      seller_sku: item.sellerSKU,
                      title: item.title,
                      quantity_ordered: item.quantityOrdered,
                      quantity_shipped: item.quantityShipped,
                      item_price: item.itemPrice?.amount
                        ? parseFloat(item.itemPrice.amount)
                        : null,
                      item_tax: item.itemTax?.amount
                        ? parseFloat(item.itemTax.amount)
                        : null,
                      shipping_price: item.shippingPrice?.amount
                        ? parseFloat(item.shippingPrice.amount)
                        : null,
                      promotion_discount: item.promotionDiscount?.amount
                        ? parseFloat(item.promotionDiscount.amount)
                        : null,
                    },
                    { onConflict: "order_item_id" }
                  );

                if (!itemError) {
                  chunkItems++;
                }
              }
            }

            // Rate limit: 200ms between orders to avoid throttling
            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          // Rate limit between pages
          if (nextToken) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } while (nextToken);

        return { orders: chunkOrders, items: chunkItems, pages: pageCount };
      });

      totalOrders += chunkResult.orders;
      totalOrderItems += chunkResult.items;
      processedChunks++;

      console.log(
        `✅ Chunk ${i + 1}/${orderChunks.length} complete: ${chunkResult.orders} orders, ${chunkResult.items} items`
      );

      // Small delay between chunks
      if (i < orderChunks.length - 1) {
        await step.sleep(`chunk-delay-${i}`, "2s");
      }
    }

    // =============================================
    // Sync historical fees from Finances API
    // Split into 2-week chunks to avoid timeout
    // =============================================
    const { bulkSyncFeesForDateRange } = await import("@/lib/amazon-sp-api/fee-service");

    // Create 2-week chunks for fee sync (same as order chunks)
    const feeChunks: { start: Date; end: Date }[] = [];
    let feeChunkStart = new Date(startDate);

    while (feeChunkStart < endDate) {
      const feeChunkEnd = new Date(feeChunkStart);
      feeChunkEnd.setDate(feeChunkEnd.getDate() + CHUNK_DAYS); // 2 weeks
      if (feeChunkEnd > endDate) {
        feeChunkEnd.setTime(endDate.getTime());
      }
      feeChunks.push({ start: new Date(feeChunkStart), end: new Date(feeChunkEnd) });
      feeChunkStart = new Date(feeChunkEnd);
    }

    console.log(`💰 [Inngest] Syncing fees for ${feeChunks.length} bi-weekly chunks`);

    let totalFeesOrders = 0;
    let totalFeesItems = 0;
    let totalFeesAmount = 0;

    // Process fee sync in chunks (each chunk is a separate step)
    for (let f = 0; f < feeChunks.length; f++) {
      const feeChunk = feeChunks[f];
      const feeChunkLabel = `${feeChunk.start.toISOString().split("T")[0]} to ${feeChunk.end.toISOString().split("T")[0]}`;

      const feeChunkResult = await step.run(`fee-chunk-${f}`, async () => {
        console.log(`💰 Processing fee chunk ${f + 1}/${feeChunks.length}: ${feeChunkLabel}`);

        try {
          const result = await bulkSyncFeesForDateRange(
            userId,
            refreshToken,
            feeChunk.start,
            feeChunk.end
          );

          console.log(`✅ Fee chunk ${f + 1}: ${result.ordersUpdated} orders, $${result.totalFeesApplied.toFixed(2)}`);
          return result;
        } catch (error) {
          console.error(`❌ Fee chunk ${f + 1} error:`, error);
          return { success: false, ordersUpdated: 0, itemsUpdated: 0, totalFeesApplied: 0, errors: [String(error)] };
        }
      });

      totalFeesOrders += feeChunkResult.ordersUpdated || 0;
      totalFeesItems += feeChunkResult.itemsUpdated || 0;
      totalFeesAmount += feeChunkResult.totalFeesApplied || 0;

      // Small delay between fee chunks
      if (f < feeChunks.length - 1) {
        await step.sleep(`fee-delay-${f}`, "1s");
      }
    }

    const feeResult = {
      totalOrders: totalFeesOrders,
      totalItems: totalFeesItems,
      totalFees: totalFeesAmount
    };

    console.log(`✅ [Inngest] Fee sync complete: ${feeResult.totalOrders} orders, $${feeResult.totalFees.toFixed(2)} fees`);

    // Final step: Update product fee averages (will now use REAL fee data)
    await step.run("refresh-product-averages", async () => {
      try {
        const result = await refreshAllProductFeeAverages(userId);
        return result;
      } catch (error) {
        return { error: String(error) };
      }
    });

    // ========================================
    // TRIGGER SETTLEMENT FEE SYNC
    // Finances API often returns 0 for fees, Settlement Reports have REAL fees
    // This runs AFTER orders are synced so it can match fees to existing order_items
    // ========================================
    await step.run("trigger-settlement-fee-sync", async () => {
      try {
        console.log('📊 [Inngest] Triggering Settlement Report fee sync...');
        await inngest.send({
          name: 'amazon/sync.settlement-fees',
          data: {
            userId,
            refreshToken,
            marketplaceIds: marketplaceIds || ['ATVPDKIKX0DER'],
            monthsBack: 6 // 6 months of settlement reports
          }
        });
        console.log('✅ [Inngest] Settlement fee sync triggered!');
        return { triggered: true };
      } catch (error) {
        console.error('⚠️ [Inngest] Failed to trigger settlement sync:', error);
        return { triggered: false, error: String(error) };
      }
    });

    results.totalOrders = totalOrders;
    results.totalOrderItems = totalOrderItems;
    results.processedChunks = processedChunks;
    results.feeSync = feeResult;
    results.settlementSyncTriggered = true;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Historical sync completed for user ${userId}:`, results);

    return results;
  }
);

/**
 * Data Kiosk Historical Sync Function
 *
 * Uses Amazon's GraphQL-based Data Kiosk API for scalable bulk data retrieval
 * Much faster and more reliable than Orders API for large datasets
 *
 * Benefits:
 * - Single query for entire date range (no pagination)
 * - JSONL streaming format
 * - Minimal API calls
 * - Built for scale (500K+ orders)
 */
export const syncHistoricalDataKiosk = inngest.createFunction(
  {
    id: "sync-historical-data-kiosk",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.historical-kiosk" },
  async ({ event, step }) => {
    const { userId, refreshToken, yearsBack = 2 } = event.data;

    console.log(`🚀 [Inngest] Starting Data Kiosk sync for user ${userId}, years: ${yearsBack}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      yearsBack,
      method: "data-kiosk",
    };

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Dynamic import to avoid circular dependencies
    const {
      createDataKioskQuery,
      getDataKioskQuery,
      getDataKioskDocument,
      downloadDataKioskDocument,
      buildSalesAndTrafficQuery,
    } = await import("@/lib/amazon-sp-api/data-kiosk");

    // Step 1: Create Sales & Traffic query
    const queryId = await step.run("create-sales-traffic-query", async () => {
      const query = buildSalesAndTrafficQuery(startStr, endStr, undefined, "DAY");
      console.log(`📊 [Data Kiosk] Creating query for ${startStr} to ${endStr}`);

      const result = await createDataKioskQuery(refreshToken, query);
      if (!result.success || !result.queryId) {
        throw new Error(result.error || "Failed to create query");
      }

      console.log(`✅ [Data Kiosk] Query created: ${result.queryId}`);
      return result.queryId;
    });

    // Step 2: Poll for completion (with sleeps between polls)
    let processingComplete = false;
    let dataDocumentId: string | null = null;
    let pollCount = 0;
    const maxPolls = 60; // 60 polls × 30s = 30 minutes max

    while (!processingComplete && pollCount < maxPolls) {
      const pollResult = await step.run(`poll-status-${pollCount}`, async () => {
        const result = await getDataKioskQuery(refreshToken, queryId);
        if (!result.success || !result.query) {
          throw new Error(result.error || "Failed to get query status");
        }

        console.log(`📊 [Data Kiosk] Poll ${pollCount + 1}: Status = ${result.query.processingStatus}`);

        return {
          status: result.query.processingStatus,
          dataDocumentId: result.query.dataDocumentId,
          errorDocumentId: result.query.errorDocumentId,
        };
      });

      if (pollResult.status === "DONE") {
        processingComplete = true;
        dataDocumentId = pollResult.dataDocumentId || null;
        console.log(`✅ [Data Kiosk] Query completed!`);
      } else if (pollResult.status === "CANCELLED" || pollResult.status === "FATAL") {
        throw new Error(`Query ${pollResult.status}: Check errorDocumentId ${pollResult.errorDocumentId}`);
      } else {
        // Still processing, wait 30 seconds
        await step.sleep(`wait-${pollCount}`, "30s");
        pollCount++;
      }
    }

    if (!processingComplete) {
      throw new Error("Query timed out after 30 minutes");
    }

    if (!dataDocumentId) {
      throw new Error("No data document ID returned");
    }

    // Step 3: Get document URL
    const documentUrl = await step.run("get-document-url", async () => {
      const result = await getDataKioskDocument(refreshToken, dataDocumentId!);
      if (!result.success || !result.document) {
        throw new Error(result.error || "Failed to get document");
      }
      return result.document.documentUrl;
    });

    // Step 4: Download and parse data
    const downloadResult = await step.run("download-data", async () => {
      const result = await downloadDataKioskDocument(documentUrl);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to download data");
      }
      return { recordCount: result.data.length, data: result.data };
    });

    console.log(`📊 [Data Kiosk] Downloaded ${downloadResult.recordCount} records`);

    // Step 5: Insert data into database (in chunks)
    const CHUNK_SIZE = 1000;
    const data = downloadResult.data;
    let totalInserted = 0;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE);

      const insertResult = await step.run(`insert-chunk-${chunkIndex}`, async () => {
        let inserted = 0;

        for (const record of chunk) {
          try {
            // Extract from GraphQL response structure
            const salesTrafficData = (record as any)?.analytics_salesAndTraffic_2024_04_24?.salesAndTrafficByDate || [];

            for (const day of salesTrafficData) {
              const { error } = await supabase
                .from("daily_metrics")
                .upsert(
                  {
                    user_id: userId,
                    date: day.startDate,
                    sales: day.sales?.orderedProductSales?.amount || 0,
                    units_sold: day.sales?.unitsOrdered || 0,
                    orders: day.sales?.totalOrderItems || 0,
                    sessions: day.traffic?.sessions || 0,
                    page_views: day.traffic?.pageViews || 0,
                    buy_box_percentage: day.traffic?.buyBoxPercentage || 0,
                    unit_session_percentage: day.traffic?.unitSessionPercentage || 0,
                    data_source: "data_kiosk",
                    synced_at: new Date().toISOString(),
                  },
                  { onConflict: "user_id,date" }
                );

              if (!error) {
                inserted++;
              }
            }
          } catch (err) {
            console.error("[Data Kiosk] Insert error:", err);
          }
        }

        return { inserted };
      });

      totalInserted += insertResult.inserted;

      // Small delay between chunks
      if (i + CHUNK_SIZE < data.length) {
        await step.sleep(`insert-delay-${chunkIndex}`, "500ms");
      }
    }

    results.totalRecords = downloadResult.recordCount;
    results.totalInserted = totalInserted;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Data Kiosk sync completed: ${totalInserted} records inserted`);

    return results;
  }
);

/**
 * Historical Data Sync via Reports API (Sellerboard Approach)
 *
 * Uses Amazon's Reports API for bulk data retrieval - the same approach Sellerboard uses.
 * This is MUCH faster and more reliable than individual Orders API calls.
 *
 * Process:
 * 1. Request All Orders Report (GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL)
 *    - Contains ALL orders + items in a single file (no pagination!)
 * 2. Request Settlement Reports (GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2)
 *    - Contains REAL Amazon fees (FBA, referral, storage, promotions, etc.)
 * 3. Parse both reports and calculate fees per order
 * 4. Save to database
 *
 * Benefits:
 * - Single file download vs thousands of API calls
 * - No rate limiting issues
 * - Settlement reports have REAL fee breakdowns
 * - Handles 10K+ orders/day easily
 * - Same approach used by Sellerboard
 *
 * Limitations:
 * - Settlement reports only for SHIPPED orders (pending uses historical ASIN average)
 * - Reports can take 5-15 minutes to generate
 */
export const syncHistoricalDataReports = inngest.createFunction(
  {
    id: "sync-historical-data-reports",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.historical-reports" },
  async ({ event, step }) => {
    const { userId, refreshToken, marketplaceIds, yearsBack = 2 } = event.data;

    console.log(`🚀 [Inngest] Starting Reports API sync for user ${userId}, years: ${yearsBack}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      yearsBack,
      marketplaceIds,
      method: "reports-api",
    };

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);

    console.log(`📅 Syncing data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Dynamic import
    const { bulkSyncHistoricalData } = await import("@/lib/amazon-sp-api/reports");

    // Step 1: Request and download All Orders Report
    // This gets ALL orders + items in a single file (Sellerboard approach)
    const bulkResult = await step.run("bulk-sync-orders-and-fees", async () => {
      console.log("📊 [Reports API] Requesting bulk data (All Orders + Settlement Reports)...");

      try {
        const result = await bulkSyncHistoricalData(
          refreshToken,
          startDate,
          endDate,
          marketplaceIds
        );

        if (!result.success) {
          throw new Error(result.error || "Bulk sync failed");
        }

        console.log(`✅ [Reports API] Bulk data retrieved:
          - Orders: ${result.stats?.totalOrders || 0}
          - Order Items: ${result.stats?.totalOrderItems || 0}
          - Orders with Fees: ${result.stats?.ordersWithFees || 0}
        `);

        return {
          success: true,
          orders: result.orders || [],
          orderFees: result.orderFees ? Object.fromEntries(result.orderFees) : {},
          stats: result.stats,
        };
      } catch (error) {
        console.error("❌ [Reports API] Bulk sync error:", error);
        throw error;
      }
    });

    if (!bulkResult.success) {
      results.error = "Failed to retrieve bulk data";
      results.completedAt = new Date().toISOString();
      return results;
    }

    // Step 2: Save orders to database (in chunks to avoid timeout)
    const orders = bulkResult.orders;
    const orderFees = new Map(Object.entries(bulkResult.orderFees || {}));
    const CHUNK_SIZE = 500;
    let totalOrdersSaved = 0;
    let totalItemsSaved = 0;

    for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
      const chunk = orders.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE);

      const saveResult = await step.run(`save-orders-chunk-${chunkIndex}`, async () => {
        let ordersSaved = 0;
        let itemsSaved = 0;

        for (const order of chunk) {
          // Skip canceled orders
          if (order.orderStatus === "Canceled" || order.orderStatus === "Cancelled") {
            continue;
          }

          // Upsert order
          const { error: orderError } = await supabase
            .from("orders")
            .upsert(
              {
                user_id: userId,
                amazon_order_id: order.amazonOrderId,
                purchase_date: order.purchaseDate,
                last_update_date: order.lastUpdatedDate,
                order_status: order.orderStatus,
                fulfillment_channel: order.fulfillmentChannel,
                sales_channel: order.salesChannel,
                order_total: order.itemPrice ? parseFloat(String(order.itemPrice)) : null,
                currency_code: order.currency || "USD",
                marketplace_id: marketplaceIds?.[0] || "ATVPDKIKX0DER",
                number_of_items_shipped: order.quantity || 0,
                number_of_items_unshipped: 0, // Reports API doesn't have separate shipped/unshipped counts
              },
              { onConflict: "amazon_order_id" }
            );

          if (!orderError) {
            ordersSaved++;
          }

          // Get fees for this order item (from Settlement Report)
          // Try item-level key first (orderId|sku), then fall back to order-level key
          const sku = order.sku || '';
          const itemFeeKey = sku ? `${order.amazonOrderId}|${sku}` : order.amazonOrderId;
          const fees = orderFees.get(itemFeeKey) || orderFees.get(order.amazonOrderId);

          // Try to find existing order_item by amazon_order_id + seller_sku
          // (Order items may already exist from Finances API sync with real order_item_id)
          let existingItems: { order_item_id: string }[] | null = null;

          // First try matching by SKU if available
          if (order.sku) {
            const { data } = await supabase
              .from("order_items")
              .select("order_item_id")
              .eq("amazon_order_id", order.amazonOrderId)
              .eq("seller_sku", order.sku)
              .limit(1);
            existingItems = data;
          }

          // If no match by SKU, try by ASIN
          if ((!existingItems || existingItems.length === 0) && order.asin) {
            const { data } = await supabase
              .from("order_items")
              .select("order_item_id")
              .eq("amazon_order_id", order.amazonOrderId)
              .eq("asin", order.asin)
              .limit(1);
            existingItems = data;
          }

          // If still no match, try just by order_id (will get first item)
          if (!existingItems || existingItems.length === 0) {
            const { data } = await supabase
              .from("order_items")
              .select("order_item_id")
              .eq("amazon_order_id", order.amazonOrderId)
              .limit(1);
            existingItems = data;
          }

          if (existingItems && existingItems.length > 0) {
            // Update existing item with Settlement Report fees
            if (fees) {
              // Write to BOTH detail AND rollup columns
              // NOTE: promotionDiscount stored separately, NOT in total_amazon_fees
              const { error: updateError } = await supabase
                .from("order_items")
                .update({
                  // Detail columns
                  fee_fba_per_unit: fees.fbaFee || null,
                  fee_referral: fees.referralFee || null,
                  fee_storage: fees.storageFee || null,
                  fee_promotion: fees.promotionDiscount || null,
                  fee_other: fees.otherFees || null,
                  // Rollup columns (what dashboard reads!)
                  total_fba_fulfillment_fees: fees.fbaFee || null,
                  total_referral_fees: fees.referralFee || null,
                  total_storage_fees: fees.storageFee || null,
                  total_promotion_fees: fees.promotionDiscount || null,
                  total_other_fees: fees.otherFees || null,
                  // total_amazon_fees = FBA + Referral + Storage + Other (NOT promo!)
                  total_amazon_fees: fees.totalFees || null,
                  fee_source: "settlement_report",
                })
                .eq("order_item_id", existingItems[0].order_item_id);

              if (!updateError) {
                itemsSaved++;
              }
            }
          } else {
            // Insert new order item (no existing record)
            const generatedOrderItemId = `${order.amazonOrderId}-${order.sku || order.asin || '1'}`;

            const { error: itemError } = await supabase
              .from("order_items")
              .upsert(
                {
                  user_id: userId,
                  amazon_order_id: order.amazonOrderId,
                  order_item_id: generatedOrderItemId,
                  asin: order.asin,
                  seller_sku: order.sku,
                  title: order.productName,
                  quantity_ordered: order.quantity || 1,
                  quantity_shipped: order.quantity || 0,
                  item_price: order.itemPrice ? parseFloat(String(order.itemPrice)) : null,
                  item_tax: order.itemTax ? parseFloat(String(order.itemTax)) : null,
                  shipping_price: order.shippingPrice ? parseFloat(String(order.shippingPrice)) : null,
                  promotion_discount: order.itemPromotionDiscount ? parseFloat(String(order.itemPromotionDiscount)) : null,
                  // Detail columns
                  fee_fba_per_unit: fees?.fbaFee || null,
                  fee_referral: fees?.referralFee || null,
                  fee_storage: fees?.storageFee || null,
                  fee_promotion: fees?.promotionDiscount || null,
                  fee_other: fees?.otherFees || null,
                  // Rollup columns (what dashboard reads!)
                  total_fba_fulfillment_fees: fees?.fbaFee || null,
                  total_referral_fees: fees?.referralFee || null,
                  total_storage_fees: fees?.storageFee || null,
                  total_promotion_fees: fees?.promotionDiscount || null,
                  total_other_fees: fees?.otherFees || null,
                  // total_amazon_fees = FBA + Referral + Storage + Other (NOT promo!)
                  total_amazon_fees: fees?.totalFees || null,
                  fee_source: fees ? "settlement_report" : null,
                },
                { onConflict: "order_item_id" }
              );

            if (!itemError) {
              itemsSaved++;
            }
          }
        }

        return { ordersSaved, itemsSaved };
      });

      totalOrdersSaved += saveResult.ordersSaved;
      totalItemsSaved += saveResult.itemsSaved;

      // Progress log
      console.log(`📦 Chunk ${chunkIndex + 1}: Saved ${saveResult.ordersSaved} orders, ${saveResult.itemsSaved} items`);

      // Small delay between chunks
      if (i + CHUNK_SIZE < orders.length) {
        await step.sleep(`save-delay-${chunkIndex}`, "500ms");
      }
    }

    // Step 3: Update product fee averages (uses REAL fee data from Settlement Reports)
    await step.run("refresh-product-averages", async () => {
      try {
        const result = await refreshAllProductFeeAverages(userId);
        console.log(`✅ Product fee averages updated`);
        return result;
      } catch (error) {
        console.error("Error updating product averages:", error);
        return { error: String(error) };
      }
    });

    // Step 4: Estimate fees for pending orders (using historical ASIN averages)
    // Settlement Reports only have shipped orders, so pending orders need estimation
    await step.run("estimate-pending-order-fees", async () => {
      console.log("💰 Estimating fees for pending orders (using historical ASIN averages)...");

      // Get pending orders
      const { data: pendingOrders, error } = await supabase
        .from("orders")
        .select("amazon_order_id")
        .eq("user_id", userId)
        .in("order_status", ["Pending", "Unshipped"]);

      if (error || !pendingOrders) {
        return { total: 0, error: error?.message };
      }

      let estimated = 0;
      for (const order of pendingOrders) {
        try {
          const result = await estimatePendingOrderFees(userId, order.amazon_order_id);
          if (result.success) {
            estimated++;
          }
        } catch (err) {
          // Continue on error
        }
      }

      console.log(`✅ Estimated fees for ${estimated}/${pendingOrders.length} pending orders`);
      return { total: pendingOrders.length, estimated };
    });

    results.totalOrders = totalOrdersSaved;
    results.totalOrderItems = totalItemsSaved;
    results.ordersWithFees = bulkResult.stats?.ordersWithFees || 0;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Reports API sync completed for user ${userId}:`, results);

    return results;
  }
);

/**
 * Settlement Report Fee Sync
 *
 * Downloads Settlement Reports directly and updates existing order_items with REAL fees.
 * This bypasses All Orders Report (which can return 0) and works on already-synced order_items.
 *
 * This is the Sellerboard approach:
 * - Settlement Reports have REAL fee breakdowns (FBA, referral, promotions, etc.)
 * - Fees are matched to existing order_items by amazon_order_id + seller_sku
 * - Sets fee_source = 'settlement_report'
 */
export const syncSettlementFees = inngest.createFunction(
  {
    id: "sync-settlement-fees",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.settlement-fees" },
  async ({ event, step }) => {
    const { userId, refreshToken, marketplaceIds = ['ATVPDKIKX0DER'], monthsBack = 24 } = event.data;

    console.log(`🚀 [Inngest] Starting Settlement Report fee sync for user ${userId}, months: ${monthsBack}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      monthsBack,
      marketplaceIds,
      method: "settlement-reports",
    };

    // Dynamic imports
    const {
      getAvailableSettlementReports,
      downloadReport,
      parseSettlementReport,
      calculateFeesFromSettlement,
    } = await import("@/lib/amazon-sp-api/reports");

    // Step 1: Get Settlement Reports
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const reportsResult = await step.run("get-settlement-reports", async () => {
      console.log(`📊 [Settlement] Fetching reports from last ${monthsBack} months...`);

      const result = await getAvailableSettlementReports(refreshToken, {
        createdAfter: startDate,
        marketplaceIds,
      });

      if (!result.success || !result.reports?.length) {
        console.log("⚠️ [Settlement] No reports found");
        return { reports: [], count: 0 };
      }

      console.log(`✅ [Settlement] Found ${result.reports.length} settlement reports`);
      return { reports: result.reports, count: result.reports.length };
    });

    if (reportsResult.count === 0) {
      results.error = "No settlement reports found";
      results.completedAt = new Date().toISOString();
      return results;
    }

    // Step 2: Download and parse ALL settlement reports
    const allSettlementRows: any[] = [];

    for (let i = 0; i < reportsResult.reports.length; i++) {
      const report = reportsResult.reports[i];
      if (!report.reportDocumentId) continue;

      const downloadResult = await step.run(`download-report-${i}`, async () => {
        console.log(`📥 [Settlement] Downloading report ${i + 1}/${reportsResult.count}...`);

        const result = await downloadReport(refreshToken, report.reportDocumentId);

        if (result.success && result.content) {
          const rows = parseSettlementReport(result.content);
          return { success: true, rows, count: rows.length };
        }

        return { success: false, rows: [], count: 0 };
      });

      if (downloadResult.success) {
        allSettlementRows.push(...downloadResult.rows);
      }

      // Rate limiting
      if (i < reportsResult.reports.length - 1) {
        await step.sleep(`report-delay-${i}`, "500ms");
      }
    }

    console.log(`✅ [Settlement] Parsed ${allSettlementRows.length} total settlement rows`);

    // Step 3: Calculate fees per order
    const orderFees = await step.run("calculate-fees", async () => {
      const fees = calculateFeesFromSettlement(allSettlementRows);
      console.log(`✅ [Settlement] Calculated fees for ${fees.size} unique order keys`);
      return { size: fees.size, feesMap: Object.fromEntries(fees) };
    });

    // Step 4: Get all order_items from database
    const orderItems = await step.run("get-order-items", async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_item_id, amazon_order_id, seller_sku, asin")
        .eq("user_id", userId);

      if (error || !data) {
        console.error("❌ [Settlement] Failed to fetch order items:", error);
        return { items: [], count: 0 };
      }

      console.log(`✅ [Settlement] Found ${data.length} order_items in database`);
      return { items: data, count: data.length };
    });

    // Step 5: Match and update fees (in batches)
    const feesMap = new Map(Object.entries(orderFees.feesMap));
    const BATCH_SIZE = 100;
    let totalMatched = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < orderItems.items.length; i += BATCH_SIZE) {
      const batch = orderItems.items.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      const batchResult = await step.run(`update-batch-${batchIndex}`, async () => {
        let matched = 0;
        let updated = 0;
        let errors = 0;

        for (const item of batch) {
          // Try multiple key formats to find a match
          const keysToTry = [
            item.seller_sku ? `${item.amazon_order_id}|${item.seller_sku}` : null,
            item.amazon_order_id,
          ].filter(Boolean) as string[];

          let fees = null;
          for (const key of keysToTry) {
            if (feesMap.has(key)) {
              fees = feesMap.get(key);
              break;
            }
          }

          if (fees) {
            matched++;

            // Write to BOTH detail columns AND rollup columns
            // Detail columns: fee_fba_per_unit, fee_referral, etc.
            // Rollup columns: total_fba_fulfillment_fees, total_referral_fees, etc.
            // Dashboard reads from rollup columns for breakdown display
            //
            // NEW (2026-01-25): Added all fee types from expanded OrderFeeBreakdown
            const f = fees as any;
            const { error: updateError } = await supabase
              .from("order_items")
              .update({
                // ========== DETAIL COLUMNS (individual fee types) ==========
                fee_fba_per_unit: f.fbaFee || null,
                fee_referral: f.referralFee || null,
                fee_storage: f.storageFee || null,
                fee_storage_long_term: f.longTermStorageFee || null,
                fee_inbound_convenience: f.inboundFee || null,
                fee_removal: f.disposalFee || null,
                fee_disposal: f.disposalFee || null,
                fee_promotion: f.promotionDiscount || null,
                fee_other: f.otherFees || null,
                reimbursement_damaged: f.warehouseDamage || null,
                reimbursement_other: f.reimbursements || null,
                // ========== ROLLUP COLUMNS (category totals - what dashboard reads!) ==========
                total_fba_fulfillment_fees: (f.fbaFee || 0) + (f.mcfFee || 0),
                total_referral_fees: f.referralFee || null,
                total_storage_fees: (f.storageFee || 0) + (f.longTermStorageFee || 0),
                total_inbound_fees: f.inboundFee || null,
                total_removal_fees: f.disposalFee || null,
                total_return_fees: f.refundCommission || null,
                total_promotion_fees: f.promotionDiscount || null,
                total_other_fees: (f.otherFees || 0) + (f.digitalServicesFee || 0),
                total_reimbursements: (f.warehouseDamage || 0) + (f.reimbursements || 0) + (f.refundedReferralFee || 0),
                total_amazon_fees: f.totalFees || null,
                fee_source: "settlement_report",
                fees_synced_at: new Date().toISOString(),
              })
              .eq("order_item_id", item.order_item_id);

            if (updateError) {
              errors++;
              console.error(`❌ Update error for ${item.order_item_id}:`, updateError.message);
            } else {
              updated++;
            }
          }
        }

        return { matched, updated, errors };
      });

      totalMatched += batchResult.matched;
      totalUpdated += batchResult.updated;
      totalErrors += batchResult.errors;

      // Progress log
      console.log(`📦 [Settlement] Batch ${batchIndex + 1}: matched=${batchResult.matched}, updated=${batchResult.updated}`);

      // Small delay between batches
      if (i + BATCH_SIZE < orderItems.items.length) {
        await step.sleep(`batch-delay-${batchIndex}`, "200ms");
      }
    }

    results.settlementReports = reportsResult.count;
    results.settlementRows = allSettlementRows.length;
    results.uniqueFeeKeys = orderFees.size;
    results.orderItemsInDb = orderItems.count;
    results.matched = totalMatched;
    results.updated = totalUpdated;
    results.errors = totalErrors;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Settlement fee sync completed for user ${userId}:`, results);

    return results;
  }
);

// Export all functions
export const functions = [
  syncAmazonFees,
  syncSingleOrderFees,
  scheduledFeeSync,
  syncHistoricalData,
  syncHistoricalDataKiosk,
  syncHistoricalDataReports,
  syncSettlementFees, // NEW: Direct Settlement Report fee sync
];
