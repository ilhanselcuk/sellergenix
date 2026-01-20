/**
 * Inngest Client
 *
 * Central client for all background jobs in SellerGenix
 * Used for fee syncing, order processing, and scheduled tasks
 */

import { Inngest } from "inngest";

// Create Inngest client with app ID
export const inngest = new Inngest({
  id: "sellergenix",
  // Enable event logging in development
  ...(process.env.NODE_ENV === "development" && {
    isDev: true,
  }),
});

// Event types for type safety
export type SyncFeesEvent = {
  name: "amazon/sync.fees";
  data: {
    userId: string;
    refreshToken: string;
    hours: number;
    type: "shipped" | "pending" | "all";
  };
};

export type SyncOrderFeesEvent = {
  name: "amazon/sync.order-fees";
  data: {
    userId: string;
    refreshToken: string;
    amazonOrderId: string;
  };
};

export type RefreshProductAveragesEvent = {
  name: "amazon/refresh.product-averages";
  data: {
    userId: string;
  };
};

// Union type for all events
export type InngestEvents = SyncFeesEvent | SyncOrderFeesEvent | RefreshProductAveragesEvent;
