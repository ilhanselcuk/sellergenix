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
 * Product Images Sync
 * Fetches real Amazon product images via Catalog API + scrape fallback
 */
export type SyncProductImagesEvent = {
  name: "amazon/sync.product-images";
  data: {
    userId: string;
    refreshToken: string;
    marketplaceIds?: string[];
  };
};

/**
 * Amazon Ads API Sync
 * Syncs advertising data (spend, ACOS, campaigns) from Amazon Advertising API
 * Initial sync: 24 months for full historical data
 * Scheduled sync: 1 month for recent updates
 */
export type SyncAdsEvent = {
  name: "amazon/sync.ads";
  data: {
    userId: string;
    profileId: string;
    refreshToken: string;
    countryCode: string;
    monthsBack?: number; // Default 24 months for initial sync
  };
};

// Union type for all events (cleaned up unused types on 2026-01-28)
export type InngestEvents =
  | SyncFeesEvent
  | SyncHistoricalDataKioskEvent
  | SyncHistoricalDataReportsEvent
  | SyncSettlementFeesEvent
  | SyncProductImagesEvent
  | SyncAdsEvent;
