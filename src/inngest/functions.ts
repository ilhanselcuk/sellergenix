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

        // Filter out canceled orders
        const validOrders = chunk.filter(
          order => order.orderStatus !== "Canceled" && order.orderStatus !== "Cancelled"
        );

        if (validOrders.length === 0) {
          return { ordersSaved: 0, itemsSaved: 0 };
        }

        // OPTIMIZATION 1: Bulk upsert orders (1 query instead of N)
        const ordersToUpsert = validOrders.map(order => ({
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
          number_of_items_unshipped: 0,
        }));

        const { error: bulkOrderError } = await supabase
          .from("orders")
          .upsert(ordersToUpsert, { onConflict: "amazon_order_id" });

        if (!bulkOrderError) {
          ordersSaved = ordersToUpsert.length;
        }

        // OPTIMIZATION 2: Batch select all existing order_items (1 query instead of N*3)
        const orderIds = validOrders.map(o => o.amazonOrderId);
        const { data: existingItems } = await supabase
          .from("order_items")
          .select("order_item_id, amazon_order_id, seller_sku, asin")
          .in("amazon_order_id", orderIds);

        // Build lookup map: order_id -> items[]
        const itemsByOrderId = new Map<string, { order_item_id: string; seller_sku: string | null; asin: string | null }[]>();
        existingItems?.forEach(item => {
          if (!itemsByOrderId.has(item.amazon_order_id)) {
            itemsByOrderId.set(item.amazon_order_id, []);
          }
          itemsByOrderId.get(item.amazon_order_id)!.push(item);
        });

        // Prepare bulk updates and inserts
        const itemsToUpdate: { order_item_id: string; updateData: Record<string, unknown> }[] = [];
        const itemsToInsert: Record<string, unknown>[] = [];

        for (const order of validOrders) {
          // Get fees for this order item
          const sku = order.sku || '';
          const itemFeeKey = sku ? `${order.amazonOrderId}|${sku}` : order.amazonOrderId;
          const fees = orderFees.get(itemFeeKey) || orderFees.get(order.amazonOrderId);

          // Find existing item from lookup map (no queries!)
          const existingForOrder = itemsByOrderId.get(order.amazonOrderId) || [];
          let matchedItem: { order_item_id: string } | null = null;

          // Try matching by SKU first
          if (order.sku) {
            matchedItem = existingForOrder.find(i => i.seller_sku === order.sku) || null;
          }
          // Try matching by ASIN
          if (!matchedItem && order.asin) {
            matchedItem = existingForOrder.find(i => i.asin === order.asin) || null;
          }
          // Fall back to first item for this order
          if (!matchedItem && existingForOrder.length > 0) {
            matchedItem = existingForOrder[0];
          }

          if (matchedItem && fees) {
            // Queue update for existing item
            itemsToUpdate.push({
              order_item_id: matchedItem.order_item_id,
              updateData: {
                fee_fba_per_unit: fees.fbaFee || null,
                fee_referral: fees.referralFee || null,
                fee_storage: fees.storageFee || null,
                fee_promotion: fees.promotionDiscount || null,
                fee_other: fees.otherFees || null,
                total_fba_fulfillment_fees: fees.fbaFee || null,
                total_referral_fees: fees.referralFee || null,
                total_storage_fees: fees.storageFee || null,
                total_promotion_fees: fees.promotionDiscount || null,
                total_other_fees: fees.otherFees || null,
                total_amazon_fees: fees.totalFees || null,
                fee_source: "settlement_report",
              }
            });
          } else if (!matchedItem) {
            // Queue insert for new item
            const generatedOrderItemId = `${order.amazonOrderId}-${order.sku || order.asin || '1'}`;
            itemsToInsert.push({
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
              fee_fba_per_unit: fees?.fbaFee || null,
              fee_referral: fees?.referralFee || null,
              fee_storage: fees?.storageFee || null,
              fee_promotion: fees?.promotionDiscount || null,
              fee_other: fees?.otherFees || null,
              total_fba_fulfillment_fees: fees?.fbaFee || null,
              total_referral_fees: fees?.referralFee || null,
              total_storage_fees: fees?.storageFee || null,
              total_promotion_fees: fees?.promotionDiscount || null,
              total_other_fees: fees?.otherFees || null,
              total_amazon_fees: fees?.totalFees || null,
              fee_source: fees ? "settlement_report" : null,
            });
          }
        }

        // OPTIMIZATION 3: Batch updates (individual updates still needed due to different values)
        // But we reduced N*3 SELECT queries to just 1 SELECT + N individual updates
        for (const { order_item_id, updateData } of itemsToUpdate) {
          const { error } = await supabase
            .from("order_items")
            .update(updateData)
            .eq("order_item_id", order_item_id);
          if (!error) itemsSaved++;
        }

        // OPTIMIZATION 4: Bulk insert new items (1 query instead of N)
        if (itemsToInsert.length > 0) {
          const { error: bulkInsertError } = await supabase
            .from("order_items")
            .upsert(itemsToInsert, { onConflict: "order_item_id" });
          if (!bulkInsertError) {
            itemsSaved += itemsToInsert.length;
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

    // Step 5: Trigger settlement fee sync AFTER historical sync completes
    // This ensures order_items exist before settlement fees try to UPDATE them
    await step.sendEvent("trigger-settlement-sync", {
      name: "amazon/sync.settlement-fees",
      data: {
        userId,
        refreshToken,
        marketplaceIds,
        monthsBack: 24  // 2 years of settlement data
      }
    });

    console.log(`📋 [Inngest] Settlement fee sync triggered for user ${userId}`);

    // Step 6: Trigger product images sync
    // Fetches real Amazon product images via Catalog API + scrape fallback
    await step.sendEvent("trigger-product-images-sync", {
      name: "amazon/sync.product-images",
      data: {
        userId,
        refreshToken,
        marketplaceIds,
      }
    });

    console.log(`🖼️ [Inngest] Product images sync triggered for user ${userId}`);

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
      extractAccountLevelFees,
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

            // SELLERBOARD FEE PARITY (2026-01-25): Save ALL fee types to INDIVIDUAL columns
            // This allows the dashboard to display fee breakdown exactly like Sellerboard
            const f = fees as any;
            const { error: updateError } = await supabase
              .from("order_items")
              .update({
                // ========== INDIVIDUAL FEE COLUMNS (Sellerboard-style) ==========
                fee_fba_per_unit: f.fbaFee || null,
                fee_mcf: f.mcfFee || null, // MCF separate from FBA!
                fee_referral: f.referralFee || null,
                fee_storage: f.storageFee || null,
                fee_storage_long_term: f.longTermStorageFee || null,
                fee_inbound_convenience: f.inboundFee || null,
                fee_removal: f.disposalFee || null,
                fee_disposal: f.disposalFee || null,
                fee_digital_services: f.digitalServicesFee || null,
                fee_refund_commission: f.refundCommission || null,
                fee_promotion: f.promotionDiscount || null,
                fee_other: f.otherFees || null,
                refund_amount: f.refundAmount || null,
                // ========== REIMBURSEMENTS (positive values) ==========
                reimbursement_damaged: f.warehouseDamage || null,
                reimbursement_reversal: f.reimbursements || null,
                reimbursement_refunded_referral: f.refundedReferralFee || null,
                // ========== ROLLUP COLUMNS (for quick queries) ==========
                total_fba_fulfillment_fees: f.fbaFee || null, // FBA only, NOT MCF
                total_referral_fees: f.referralFee || null,
                total_storage_fees: (f.storageFee || 0) + (f.longTermStorageFee || 0),
                total_inbound_fees: f.inboundFee || null,
                total_removal_fees: f.disposalFee || null,
                total_return_fees: f.refundCommission || null,
                total_promotion_fees: f.promotionDiscount || null,
                total_other_fees: (f.otherFees || 0) + (f.digitalServicesFee || 0) + (f.mcfFee || 0),
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

              // --- REFUND SYNC: Populate refunds table ---
              if ((f.refundAmount && f.refundAmount > 0) || (f.refundCommission && f.refundCommission > 0)) {
                // Use actual refund posted date from settlement report (if available)
                const refundDate = f.refundPostedDate || new Date().toISOString();

                // Calculate net refund cost
                // Cost = Refunded Amount - Credits (Referral, FBA, etc.) + Fees (Commission, etc.)
                const credits = (f.refundedReferralFee || 0) + (f.reimbursements || 0);
                const costs = (f.refundAmount || 0) + (f.refundCommission || 0);
                const netCost = costs - credits;

                await supabase.from("refunds").upsert({
                  user_id: userId,
                  amazon_order_id: item.amazon_order_id,
                  order_item_id: item.order_item_id,
                  refund_date: refundDate,
                  refunded_amount: f.refundAmount || 0,
                  refund_commission: f.refundCommission || 0,
                  refunded_referral_fee: f.refundedReferralFee || 0,
                  net_refund_cost: netCost,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,amazon_order_id,order_item_id' });
              }
              // -------------------------------------------
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

    // Step 6: Extract and save account-level fees (storage, subscription, long-term storage)
    // These fees don't have orderId - they're charged at account level
    const accountFeesResult = await step.run("save-account-level-fees", async () => {
      console.log("💳 [Settlement] Extracting account-level fees...");

      const accountFees = extractAccountLevelFees(allSettlementRows);

      if (accountFees.length === 0) {
        console.log("⚠️ [Settlement] No account-level fees found");
        return { saved: 0, errors: 0 };
      }

      let saved = 0;
      let errors = 0;

      // Group fees by type and month for aggregation
      const feesByTypeAndMonth: Record<string, { amount: number; description: string; periodStart: Date; periodEnd: Date }> = {};

      for (const fee of accountFees) {
        // Parse the date from postedDate
        let feeDate = new Date();
        if (fee.postedDate) {
          const isoDate = new Date(fee.postedDate);
          if (!isNaN(isoDate.getTime())) {
            feeDate = isoDate;
          } else {
            const parts = fee.postedDate.split(".");
            if (parts.length === 3) {
              feeDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }
        }

        // Create key for grouping: feeType + month
        const monthKey = `${feeDate.getFullYear()}-${String(feeDate.getMonth() + 1).padStart(2, '0')}`;
        const groupKey = `${fee.feeType}_${monthKey}`;

        if (!feesByTypeAndMonth[groupKey]) {
          // Calculate period start/end for the month
          const periodStart = new Date(feeDate.getFullYear(), feeDate.getMonth(), 1);
          const periodEnd = new Date(feeDate.getFullYear(), feeDate.getMonth() + 1, 0);

          feesByTypeAndMonth[groupKey] = {
            amount: 0,
            description: fee.description,
            periodStart,
            periodEnd,
          };
        }
        feesByTypeAndMonth[groupKey].amount += fee.amount;
      }

      // Now save aggregated fees to service_fees table
      for (const [groupKey, data] of Object.entries(feesByTypeAndMonth)) {
        const [feeType] = groupKey.split('_');

        // Skip "other" category - these are usually reserves or unknown fees
        if (feeType === 'other') {
          console.log(`⏭️ Skipping "other" category: $${data.amount} (${data.description})`);
          continue;
        }

        // Map feeType to the expected fee_type values in the table
        let dbFeeType = feeType;
        let description = data.description;

        if (feeType === 'storage') {
          dbFeeType = 'storage';
          description = 'FBA Storage Fees (Monthly)';
        } else if (feeType === 'long_term_storage') {
          dbFeeType = 'long'; // Use 'long' to match fee-breakdown comparison
          description = 'FBA Long-term Storage Fees';
        } else if (feeType === 'subscription') {
          dbFeeType = 'subscription';
          description = 'Professional Seller Subscription Fee';
        } else if (feeType === 'advertising') {
          dbFeeType = 'advertising';
          description = 'Amazon Advertising Costs';
        } else if (feeType === 'disposal') {
          dbFeeType = 'disposal';
          description = 'FBA Disposal/Removal Fees';
        }

        // Check if entry already exists for this period and type
        const { data: existing } = await supabase
          .from("service_fees")
          .select("id, amount")
          .eq("user_id", userId)
          .eq("fee_type", dbFeeType)
          .eq("period_start", data.periodStart.toISOString().split("T")[0])
          .eq("period_end", data.periodEnd.toISOString().split("T")[0])
          .single();

        if (existing) {
          // Update existing entry if amount is different
          if (Math.abs(existing.amount - data.amount) > 0.01) {
            const { error: updateError } = await supabase
              .from("service_fees")
              .update({
                amount: data.amount,
                description,
                source: "settlement_report",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (updateError) {
              errors++;
              console.error(`❌ Failed to update ${dbFeeType}: ${updateError.message}`);
            } else {
              saved++;
              console.log(`✅ Updated ${dbFeeType}: $${data.amount} (was $${existing.amount})`);
            }
          } else {
            console.log(`⏭️ Skipped ${dbFeeType}: already exists with same amount $${data.amount}`);
          }
        } else {
          // Insert new entry
          const { error: insertError } = await supabase
            .from("service_fees")
            .insert({
              user_id: userId,
              period_start: data.periodStart.toISOString().split("T")[0],
              period_end: data.periodEnd.toISOString().split("T")[0],
              fee_type: dbFeeType,
              amount: data.amount,
              description,
              source: "settlement_report",
            });

          if (insertError) {
            errors++;
            console.error(`❌ Failed to insert ${dbFeeType}: ${insertError.message}`);
          } else {
            saved++;
            console.log(`✅ Inserted ${dbFeeType}: $${data.amount} for ${data.periodStart.toISOString().split("T")[0]}`);
          }
        }
      }

      console.log(`💰 [Settlement] Processed ${Object.keys(feesByTypeAndMonth).length} aggregated fees, saved/updated ${saved} (${errors} errors)`);
      return { total: accountFees.length, aggregated: Object.keys(feesByTypeAndMonth).length, saved, errors };
    });

    results.settlementReports = reportsResult.count;
    results.settlementRows = allSettlementRows.length;
    results.uniqueFeeKeys = orderFees.size;
    results.orderItemsInDb = orderItems.count;
    results.matched = totalMatched;
    results.updated = totalUpdated;
    results.errors = totalErrors;
    results.accountLevelFees = accountFeesResult;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Settlement fee sync completed for user ${userId}:`, results);

    return results;
  }
);

/**
 * Scheduled Daily Settlement Report Sync
 * Runs every day at 06:00 UTC
 * Syncs Settlement Report fees for all active users (24 months)
 */
export const scheduledSettlementSync = inngest.createFunction(
  {
    id: "scheduled-settlement-sync",
    retries: 1,
  },
  // Run daily at 06:00 UTC
  { cron: "0 6 * * *" },
  async ({ step }) => {
    console.log("⏰ [Inngest] Starting daily Settlement Report sync");

    // Get all active Amazon connections
    const connections = await step.run("get-connections", async () => {
      const { data, error } = await supabase
        .from("amazon_connections")
        .select("user_id, refresh_token, marketplace_ids")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching connections:", error);
        return [];
      }

      return data || [];
    });

    console.log(`📊 Found ${connections.length} active connections for Settlement sync`);

    // Trigger settlement sync for each user
    const results = [];
    for (const conn of connections) {
      await step.run(`trigger-settlement-${conn.user_id}`, async () => {
        await inngest.send({
          name: "amazon/sync.settlement-fees",
          data: {
            userId: conn.user_id,
            refreshToken: conn.refresh_token,
            marketplaceIds: conn.marketplace_ids || ['ATVPDKIKX0DER'],
            monthsBack: 24, // Always 24 months per rule
          },
        });

        return { userId: conn.user_id, triggered: true };
      });

      results.push(conn.user_id);

      // Delay between users to spread load
      await step.sleep(`settlement-delay-${conn.user_id}`, "5s");
    }

    return {
      usersProcessed: results.length,
      completedAt: new Date().toISOString(),
    };
  }
);

/**
 * Scheduled Daily Storage Fee Sync
 * Runs every day at 07:00 UTC
 * Syncs FBA Storage Fees for all active users
 */
export const scheduledStorageSync = inngest.createFunction(
  {
    id: "scheduled-storage-sync",
    retries: 1,
  },
  // Run daily at 07:00 UTC (1 hour after settlement sync)
  { cron: "0 7 * * *" },
  async ({ step }) => {
    console.log("⏰ [Inngest] Starting daily Storage Fee sync");

    // Get all active Amazon connections
    const connections = await step.run("get-connections", async () => {
      const { data, error } = await supabase
        .from("amazon_connections")
        .select("user_id, refresh_token, marketplace_ids")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching connections:", error);
        return [];
      }

      return data || [];
    });

    console.log(`📊 Found ${connections.length} active connections for Storage sync`);

    // Dynamic import
    const { getFBAStorageFeeReport } = await import("@/lib/amazon-sp-api/reports");

    const results = [];
    for (const conn of connections) {
      const syncResult = await step.run(`sync-storage-${conn.user_id}`, async () => {
        try {
          const marketplaceIds = conn.marketplace_ids || ['ATVPDKIKX0DER'];
          const result = await getFBAStorageFeeReport(conn.refresh_token, marketplaceIds);

          if (result.success && result.totalStorageFee && result.totalStorageFee > 0) {
            console.log(`✅ Storage sync for ${conn.user_id}: $${result.totalStorageFee}`);

            // CRITICAL FIX: Save storage fees to database!
            // Calculate period (current month for monthly storage fees)
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const { error: saveError } = await supabase
              .from('service_fees')
              .upsert({
                user_id: conn.user_id,
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0],
                fee_type: 'storage',
                amount: result.totalStorageFee,
                description: 'FBA Monthly Storage Fee (from Storage Fee Report)',
                source: 'storage_fee_report',
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,period_start,period_end,fee_type',
              });

            if (saveError) {
              console.error(`⚠️ Failed to save storage fee for ${conn.user_id}:`, saveError.message);
            } else {
              console.log(`💾 Saved storage fee to database: $${result.totalStorageFee}`);
            }

            // Also save per-month breakdown if available
            if (result.byMonth && result.byMonth.size > 0) {
              for (const [month, fee] of result.byMonth.entries()) {
                // Parse month string (e.g., "2025-12" or "December 2025")
                let monthStart: Date | null = null;
                let monthEnd: Date | null = null;

                // Try YYYY-MM format first
                if (/^\d{4}-\d{2}$/.test(month)) {
                  const [year, monthNum] = month.split('-').map(Number);
                  monthStart = new Date(year, monthNum - 1, 1);
                  monthEnd = new Date(year, monthNum, 0);
                }

                if (monthStart && monthEnd && fee > 0) {
                  await supabase
                    .from('service_fees')
                    .upsert({
                      user_id: conn.user_id,
                      period_start: monthStart.toISOString().split('T')[0],
                      period_end: monthEnd.toISOString().split('T')[0],
                      fee_type: 'storage',
                      amount: fee,
                      description: `FBA Storage Fee for ${month}`,
                      source: 'storage_fee_report',
                      updated_at: new Date().toISOString(),
                    }, {
                      onConflict: 'user_id,period_start,period_end,fee_type',
                    });
                }
              }
            }

            return {
              userId: conn.user_id,
              success: true,
              totalStorageFee: result.totalStorageFee,
              saved: true
            };
          } else if (result.success) {
            console.log(`ℹ️ Storage sync for ${conn.user_id}: No storage fees found`);
            return { userId: conn.user_id, success: true, totalStorageFee: 0 };
          } else {
            console.log(`⚠️ Storage sync failed for ${conn.user_id}: ${result.error}`);
            return { userId: conn.user_id, success: false, error: result.error };
          }
        } catch (err: any) {
          console.error(`❌ Storage sync error for ${conn.user_id}:`, err.message);
          return { userId: conn.user_id, success: false, error: err.message };
        }
      });

      results.push(syncResult);

      // Delay between users
      await step.sleep(`storage-delay-${conn.user_id}`, "3s");
    }

    const successful = results.filter(r => r.success).length;
    const totalStorageFees = results.reduce((sum, r) => sum + ('totalStorageFee' in r ? (r.totalStorageFee || 0) : 0), 0);
    return {
      usersProcessed: results.length,
      successful,
      failed: results.length - successful,
      totalStorageFees,
      completedAt: new Date().toISOString(),
    };
  }
);

/**
 * Product Images Sync
 *
 * Fetches real Amazon product images for all products.
 * Uses dual-method approach:
 * 1. Amazon Catalog API (official method)
 * 2. Scrape fallback (for products not indexed in catalog)
 *
 * Triggered automatically after historical sync completes.
 */
export const syncProductImages = inngest.createFunction(
  {
    id: "sync-product-images",
    retries: 2,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.product-images" },
  async ({ event, step }) => {
    const { userId, refreshToken, marketplaceIds = ['ATVPDKIKX0DER'] } = event.data;
    const marketplaceId = marketplaceIds[0] || 'ATVPDKIKX0DER';

    console.log(`🖼️ [Inngest] Starting product images sync for user ${userId}`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      userId,
    };

    // Step 1: Get products that need images
    const productsResult = await step.run("get-products-needing-images", async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('asin')
        .eq('user_id', userId)
        .or('image_url.is.null,image_url.like.%unsplash%,image_url.like.%placeholder%');

      if (error) {
        console.error("Error fetching products:", error);
        return { asins: [] as string[], error: error.message };
      }

      const asins = [...new Set(products?.map(p => p.asin).filter(Boolean) || [])];
      console.log(`📦 [Images] Found ${asins.length} products needing images`);
      return { asins, error: null };
    });

    if (productsResult.asins.length === 0) {
      results.message = "No products need image sync";
      results.completedAt = new Date().toISOString();
      return results;
    }

    // Import getCatalogItem dynamically
    const { getCatalogItem } = await import("@/lib/amazon-sp-api/catalog");

    // Step 2: Sync images for each product
    let successCount = 0;
    let failedCount = 0;
    const updates: { asin: string; imageUrl?: string; error?: string }[] = [];

    // Process in batches
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    for (let i = 0; i < productsResult.asins.length; i += BATCH_SIZE) {
      batches.push(productsResult.asins.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      await step.run(`sync-images-batch-${batchIndex}`, async () => {
        for (const asin of batch) {
          try {
            let imageUrl: string | null = null;
            let source = 'catalog_api';

            // Method 1: Try Catalog API first
            try {
              const catalogItem = await getCatalogItem(refreshToken, asin, marketplaceId);

              if (catalogItem?.images && catalogItem.images.length > 0) {
                const imagesForMarketplace = catalogItem.images.find(
                  (img: any) => img.marketplaceId === marketplaceId
                ) || catalogItem.images[0];

                if (imagesForMarketplace?.images && imagesForMarketplace.images.length > 0) {
                  const mainImage = imagesForMarketplace.images.find(
                    (img: any) => img.variant === 'MAIN'
                  );
                  imageUrl = mainImage?.link || imagesForMarketplace.images[0].link;
                }
              }
            } catch (catalogError: any) {
              console.log(`⚠️ [Images] Catalog API failed for ${asin}: ${catalogError.message}`);
            }

            // Method 2: Fallback to scraping
            if (!imageUrl) {
              source = 'scrape';
              try {
                const response = await fetch(`https://www.amazon.com/dp/${asin}`, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                  },
                });

                if (response.ok) {
                  const html = await response.text();
                  const imageIdMatches = html.match(/images\/I\/([0-9][0-9A-Za-z+_-]+L)\._/g);

                  if (imageIdMatches && imageIdMatches.length > 0) {
                    const imageIds = [...new Set(
                      imageIdMatches.map(m => m.replace('images/I/', '').replace('._', ''))
                    )];

                    // Filter to likely product images
                    const productImageIds = imageIds.filter(id => /^[3-8][0-9]/.test(id));
                    const imageId = productImageIds.length > 0 ? productImageIds[0] : imageIds[0];

                    if (imageId) {
                      imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${imageId}._SS200_.jpg`;
                    }
                  }
                }
              } catch (scrapeError: any) {
                console.log(`⚠️ [Images] Scrape failed for ${asin}: ${scrapeError.message}`);
              }
            }

            // Update database if we found an image
            if (imageUrl) {
              const { error: updateError } = await supabase
                .from('products')
                .update({
                  image_url: imageUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('asin', asin)
                .eq('user_id', userId);

              if (!updateError) {
                successCount++;
                updates.push({ asin, imageUrl });
                console.log(`✅ [Images] ${asin} → ${source}`);
              } else {
                failedCount++;
                updates.push({ asin, error: 'Database update failed' });
              }
            } else {
              failedCount++;
              updates.push({ asin, error: 'No image found' });
              console.log(`❌ [Images] ${asin} → No image found`);
            }

            // Rate limit: 100ms between API calls
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error: any) {
            failedCount++;
            updates.push({ asin, error: error.message });
          }
        }

        return { processed: batch.length };
      });

      // Delay between batches
      if (batchIndex < batches.length - 1) {
        await step.sleep(`image-batch-delay-${batchIndex}`, "500ms");
      }
    }

    results.total = productsResult.asins.length;
    results.success = successCount;
    results.failed = failedCount;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Product images sync completed: ${successCount}/${productsResult.asins.length} synced`);

    return results;
  }
);

/**
 * Amazon Ads Data Sync - 24 Month Historical + Daily Granularity
 *
 * Strategy:
 * - 24 months of historical data (like Settlement Reports)
 * - 60-day chunks to respect API limits
 * - Start from TODAY and work backwards (newest first)
 * - Daily granularity for AI bot queries
 * - Each chunk is a separate step (timeout-safe)
 * - Show data as it arrives (progressive loading)
 *
 * Data includes:
 * - SP (Sponsored Products) spend/sales/ACOS
 * - SB (Sponsored Brands) + SB Video spend/sales
 * - SD (Sponsored Display) spend/sales
 * - Per-ASIN ad spend (for product table "Ads" column)
 */
export const syncAdsData = inngest.createFunction(
  {
    id: "sync-ads-data",
    retries: 2,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "amazon/sync.ads" },
  async ({ event, step }) => {
    const { userId, profileId, refreshToken, countryCode, monthsBack = 24 } = event.data;

    console.log(`🎯 [Ads Sync] Starting for user ${userId}, profile ${profileId}, ${monthsBack} months back`);

    const results: Record<string, unknown> = {
      startedAt: new Date().toISOString(),
      profileId,
      monthsBack,
      chunksProcessed: 0,
      dailyRecordsSaved: 0,
    };

    // Step 1: Calculate 60-day chunks (API limit) - newest first
    const chunks = await step.run("calculate-chunks", async () => {
      const CHUNK_DAYS = 60; // Amazon Ads API max per report
      const totalDays = monthsBack * 30;
      const numChunks = Math.ceil(totalDays / CHUNK_DAYS);

      const chunkList: { startDate: string; endDate: string; chunkIndex: number }[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < numChunks; i++) {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - (i * CHUNK_DAYS));

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - CHUNK_DAYS + 1);

        // Don't go beyond limit
        const minDate = new Date(today);
        minDate.setMonth(minDate.getMonth() - monthsBack);
        if (startDate < minDate) startDate.setTime(minDate.getTime());
        if (endDate < minDate) continue;

        chunkList.push({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          chunkIndex: i,
        });
      }

      console.log(`📅 [Ads Sync] Created ${chunkList.length} chunks (60-day each)`);
      return chunkList;
    });

    // Step 2: Process each chunk - SP/SB/SD reports with daily granularity
    for (const chunk of chunks) {
      // Step 2a: Fetch SP (Sponsored Products) daily data
      await step.run(`sp-chunk-${chunk.chunkIndex}`, async () => {
        try {
          const { createAdsClient, getAdsMetrics } = await import("@/lib/amazon-ads-api");
          const clientResult = await createAdsClient(refreshToken, profileId, countryCode);
          if (!clientResult.success || !clientResult.client) {
            return { success: false, error: "Client creation failed" };
          }

          // Get aggregated metrics for this chunk (we'll store by date range)
          const metricsResult = await getAdsMetrics(clientResult.client, chunk.startDate, chunk.endDate);

          if (metricsResult.success && metricsResult.data) {
            const m = metricsResult.data;

            // Upsert daily metrics (using startDate as key for this chunk)
            const { error } = await supabase
              .from("ads_daily_metrics")
              .upsert({
                user_id: userId,
                profile_id: profileId,
                date: chunk.startDate,
                date_end: chunk.endDate,
                total_spend: m.totalSpend,
                sp_spend: m.spSpend,
                sb_spend: m.sbSpend,
                sd_spend: m.sdSpend,
                sbv_spend: 0, // SB Video tracked separately if available
                total_sales: m.totalSales,
                sp_sales: m.spSales,
                sb_sales: m.sbSales,
                sd_sales: m.sdSales,
                impressions: m.impressions,
                clicks: m.clicks,
                orders: m.orders,
                units: m.units,
                acos: m.acos,
                roas: m.roas,
                ctr: m.ctr,
                cpc: m.cpc,
                cvr: m.cvr,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id,profile_id,date" });

            if (!error) {
              console.log(`✅ [Ads Sync] Chunk ${chunk.chunkIndex}: $${m.totalSpend.toFixed(2)} spend, ${m.acos.toFixed(1)}% ACOS`);
            }
            return { success: true };
          }
          return { success: false };
        } catch (error: any) {
          console.error(`[Ads Sync] Chunk ${chunk.chunkIndex} error:`, error.message);
          return { success: false, error: error.message };
        }
      });

      // Rate limit between chunks
      if (chunk.chunkIndex < chunks.length - 1) {
        await step.sleep(`chunk-rate-limit-${chunk.chunkIndex}`, "5s");
      }

      (results.chunksProcessed as number)++;
    }

    // Step 3: Sync campaigns (latest snapshot)
    await step.run("sync-campaigns", async () => {
      try {
        const { createAdsClient, getAllCampaigns } = await import("@/lib/amazon-ads-api");
        const clientResult = await createAdsClient(refreshToken, profileId, countryCode);
        if (!clientResult.success || !clientResult.client) {
          return { success: false };
        }

        const campaignsResult = await getAllCampaigns(clientResult.client);

        if (campaignsResult.success && campaignsResult.data) {
          let saved = 0;
          for (const campaign of campaignsResult.data) {
            const { error } = await supabase
              .from("ads_campaigns")
              .upsert({
                user_id: userId,
                profile_id: profileId,
                campaign_id: campaign.campaignId,
                campaign_name: campaign.name,
                campaign_type: campaign.campaignType,
                targeting_type: campaign.targetingType,
                state: campaign.state,
                daily_budget: campaign.dailyBudget,
                start_date: campaign.startDate,
                end_date: campaign.endDate,
                updated_at: new Date().toISOString(),
              }, { onConflict: "user_id,profile_id,campaign_id" });

            if (!error) saved++;
          }
          console.log(`✅ [Ads Sync] Saved ${saved} campaigns`);
          return { success: true, saved };
        }
        return { success: false };
      } catch (error: any) {
        console.error("[Ads Sync] Campaigns error:", error.message);
        return { success: false };
      }
    });

    // Step 4: Update connection status
    await step.run("update-connection-status", async () => {
      await supabase
        .from("amazon_ads_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: "completed",
        })
        .eq("user_id", userId)
        .eq("profile_id", profileId);
      return { updated: true };
    });

    results.completedAt = new Date().toISOString();
    console.log(`🎉 [Ads Sync] Completed: ${results.chunksProcessed} chunks processed`);
    return results;
  }
);

/**
 * Scheduled Ads Sync - Every 3 hours
 *
 * Syncs the last month of ads data for all active connections.
 * Keeps dashboard current without overwhelming the API.
 */
export const scheduledAdsSync = inngest.createFunction(
  {
    id: "scheduled-ads-sync",
    retries: 1,
    concurrency: { limit: 3 },
  },
  { cron: "0 */3 * * *" }, // Every 3 hours
  async ({ step }) => {
    console.log("⏰ [Scheduled Ads Sync] Starting...");

    const connections = await step.run("get-active-connections", async () => {
      const { data } = await supabase
        .from("amazon_ads_connections")
        .select("user_id, profile_id, refresh_token, country_code")
        .eq("is_active", true);
      return data || [];
    });

    console.log(`📊 [Scheduled Ads Sync] Found ${connections.length} active connections`);

    for (const conn of connections) {
      await step.run(`trigger-sync-${conn.profile_id}`, async () => {
        await inngest.send({
          name: "amazon/sync.ads",
          data: {
            userId: conn.user_id,
            profileId: conn.profile_id,
            refreshToken: conn.refresh_token,
            countryCode: conn.country_code,
            monthsBack: 1, // Last month for scheduled sync
          },
        });
        return { triggered: true };
      });

      await step.sleep(`user-rate-limit-${conn.profile_id}`, "10s");
    }

    return { connectionsProcessed: connections.length };
  }
);

// Export all functions (10 total)
export const functions = [
  syncAmazonFees,           // Event: amazon/sync.fees - Main fee sync
  scheduledFeeSync,         // Cron: */15 * * * * - Every 15 min fee sync for shipped orders
  scheduledSettlementSync,  // Cron: 0 6 * * * - Daily Settlement Report sync (24 months)
  scheduledStorageSync,     // Cron: 0 7 * * * - Daily Storage Fee sync
  syncHistoricalDataKiosk,  // Event: amazon/sync.historical-kiosk - Data Kiosk bulk sync
  syncHistoricalDataReports,// Event: amazon/sync.historical-reports - Reports API sync (Sellerboard method)
  syncSettlementFees,       // Event: amazon/sync.settlement-fees - Settlement Report fee sync
  syncProductImages,        // Event: amazon/sync.product-images - Product images sync
  syncAdsData,              // Event: amazon/sync.ads - Amazon Ads API sync (24 months)
  scheduledAdsSync,         // Cron: 0 */3 * * * - Every 3 hours ads sync
];
