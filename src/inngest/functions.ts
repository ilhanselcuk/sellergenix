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

// Export all functions
export const functions = [syncAmazonFees, syncSingleOrderFees, scheduledFeeSync];
