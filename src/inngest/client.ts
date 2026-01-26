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

export type SyncHistoricalDataEvent = {
  name: "amazon/sync.historical";
  data: {
    userId: string;
    refreshToken: string;
    marketplaceIds: string[];
    yearsBack?: number; // Default 2 years
  };
};

export type SyncHistoricalDataKioskEvent = {
  name: "amazon/sync.historical-kiosk";
  data: {
    userId: string;
    refreshToken: string;
    yearsBack?: number; // Default 2 years
  };
};

/**
 * Sellerboard-style historical sync using Reports API
 * Much faster and more scalable than individual API calls
 */
export type SyncHistoricalDataReportsEvent = {
  name: "amazon/sync.historical-reports";
  data: {
    userId: string;
    refreshToken: string;
    marketplaceIds: string[];
    yearsBack?: number; // Default 2 years
  };
};

/**
 * Settlement Report Fee Sync
 * Directly downloads Settlement Reports and updates existing order_items with REAL fees
 * This bypasses All Orders Report and works on already-synced order_items
 */
export type SyncSettlementFeesEvent = {
  name: "amazon/sync.settlement-fees";
  data: {
    userId: string;
    refreshToken: string;
    marketplaceIds?: string[];
    monthsBack?: number; // Default 24 months
  };
};

/**
 * MCF (Multi-Channel Fulfillment) Fee Sync
 * Fetches MCF fees from Finances API and saves to service_fees table
 * MCF fees are NOT in Settlement Reports - they're only in Finances API!
 */
export type SyncMCFFeesEvent = {
  name: "amazon/sync.mcf-fees";
  data: {
    userId: string;
    refreshToken: string;
    monthsBack?: number; // Default 24 months
  };
};

// Union type for all events
export type InngestEvents =
  | SyncFeesEvent
  | SyncOrderFeesEvent
  | RefreshProductAveragesEvent
  | SyncHistoricalDataEvent
  | SyncHistoricalDataKioskEvent
  | SyncHistoricalDataReportsEvent
  | SyncSettlementFeesEvent
  | SyncMCFFeesEvent;
