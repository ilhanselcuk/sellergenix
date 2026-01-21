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

    // Split into monthly chunks to avoid overwhelming the API
    // Amazon Orders API has rate limit of ~1 request per minute
    const monthlyChunks: { start: Date; end: Date }[] = [];
    let chunkStart = new Date(startDate);

    while (chunkStart < endDate) {
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setMonth(chunkEnd.getMonth() + 1);
      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }

      monthlyChunks.push({ start: new Date(chunkStart), end: new Date(chunkEnd) });
      chunkStart = new Date(chunkEnd);
    }

    console.log(`📊 Split into ${monthlyChunks.length} monthly chunks`);

    let totalOrders = 0;
    let totalOrderItems = 0;
    let processedChunks = 0;

    // Process each monthly chunk
    for (let i = 0; i < monthlyChunks.length; i++) {
      const chunk = monthlyChunks[i];
      const chunkLabel = `${chunk.start.toISOString().split("T")[0]} to ${chunk.end.toISOString().split("T")[0]}`;

      const chunkResult = await step.run(`sync-chunk-${i}`, async () => {
        console.log(`📦 Processing chunk ${i + 1}/${monthlyChunks.length}: ${chunkLabel}`);

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
        `✅ Chunk ${i + 1}/${monthlyChunks.length} complete: ${chunkResult.orders} orders, ${chunkResult.items} items`
      );

      // Small delay between chunks
      if (i < monthlyChunks.length - 1) {
        await step.sleep(`chunk-delay-${i}`, "2s");
      }
    }

    // =============================================
    // NEW: Sync historical fees from Finances API
    // This fetches REAL fees for all orders we just synced
    // =============================================
    const feeResult = await step.run("sync-historical-fees", async () => {
      try {
        console.log("💰 [Inngest] Syncing historical fees from Finances API...");
        const result = await syncAllHistoricalFees(userId, refreshToken);
        console.log(`✅ [Inngest] Fee sync complete: ${result.totalOrders} orders, $${result.totalFees.toFixed(2)} fees`);
        return result;
      } catch (error) {
        console.error("❌ [Inngest] Fee sync error:", error);
        return { error: String(error), totalOrders: 0, totalItems: 0, totalFees: 0 };
      }
    });

    // Final step: Update product fee averages (will now use REAL fee data)
    await step.run("refresh-product-averages", async () => {
      try {
        const result = await refreshAllProductFeeAverages(userId);
        return result;
      } catch (error) {
        return { error: String(error) };
      }
    });

    results.totalOrders = totalOrders;
    results.totalOrderItems = totalOrderItems;
    results.processedChunks = processedChunks;
    results.feeSync = feeResult;
    results.completedAt = new Date().toISOString();

    console.log(`🎉 [Inngest] Historical sync completed for user ${userId}:`, results);

    return results;
  }
);

// Export all functions
export const functions = [syncAmazonFees, syncSingleOrderFees, scheduledFeeSync, syncHistoricalData];
