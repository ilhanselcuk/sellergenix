# Amazon SP-API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** 2023-11-15
**Durum:** ✅ Production Ready (4/6 rol onaylı)

---

## 📋 Genel Bakış

Amazon Selling Partner API (SP-API), Amazon satıcılarının programatik olarak:
- Siparişleri yönetmesini
- Envanteri takip etmesini
- Finansal verileri çekmesini
- Ürün listelerini güncellemesini
sağlayan RESTful API'dir.

---

## 🔐 Kimlik Doğrulama

### OAuth 2.0 Flow

```
┌─────────────┐    1. Authorize    ┌─────────────────┐
│   Seller    │ ─────────────────► │  Seller Central │
│  (Browser)  │                    │  Consent Page   │
└─────────────┘                    └────────┬────────┘
                                            │
                                   2. Auth Code
                                            │
                                            ▼
┌─────────────┐    3. Exchange     ┌─────────────────┐
│ SellerGenix │ ◄───────────────── │   Auth Code     │
│   Backend   │                    │                 │
└──────┬──────┘                    └─────────────────┘
       │
       │ 4. Token Request (code + client_secret)
       ▼
┌─────────────────┐
│  Amazon LWA     │ ──► 5. Access Token + Refresh Token
│  Token Service  │
└─────────────────┘
```

### Credentials

```env
# .env.local
AMAZON_SP_API_CLIENT_ID=amzn1.application-oa2-client.xxxxx
AMAZON_SP_API_CLIENT_SECRET=amzn1.oa2-cs.v1.xxxxx
AMAZON_SP_API_REFRESH_TOKEN=Atzr|xxxxx  # Per-seller

# Regions
AMAZON_SP_API_REGION=na  # na, eu, fe
```

### Token Refresh

```typescript
// src/lib/amazon/auth.ts

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;  // 3600 seconds (1 hour)
  refresh_token: string;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_SP_API_CLIENT_ID!,
      client_secret: process.env.AMAZON_SP_API_CLIENT_SECRET!,
    }),
  });

  return response.json();
}
```

---

## 🌍 Regional Endpoints

| Region | Endpoint | Marketplaces |
|--------|----------|--------------|
| **North America** | `sellingpartnerapi-na.amazon.com` | US, CA, MX, BR |
| **Europe** | `sellingpartnerapi-eu.amazon.com` | UK, DE, FR, IT, ES, NL, PL, SE, BE, TR |
| **Far East** | `sellingpartnerapi-fe.amazon.com` | JP, AU, SG, IN |

### Marketplace IDs

```typescript
// src/lib/amazon/marketplaces.ts

export const AMAZON_MARKETPLACES = {
  // North America
  US: { id: 'ATVPDKIKX0DER', name: 'Amazon.com', currency: 'USD', region: 'na' },
  CA: { id: 'A2EUQ1WTGCTBG2', name: 'Amazon.ca', currency: 'CAD', region: 'na' },
  MX: { id: 'A1AM78C64UM0Y8', name: 'Amazon.com.mx', currency: 'MXN', region: 'na' },
  BR: { id: 'A2Q3Y263D00KWC', name: 'Amazon.com.br', currency: 'BRL', region: 'na' },

  // Europe
  UK: { id: 'A1F83G8C2ARO7P', name: 'Amazon.co.uk', currency: 'GBP', region: 'eu' },
  DE: { id: 'A1PA6795UKMFR9', name: 'Amazon.de', currency: 'EUR', region: 'eu' },
  FR: { id: 'A13V1IB3VIYBER', name: 'Amazon.fr', currency: 'EUR', region: 'eu' },
  IT: { id: 'APJ6JRA9NG5V4', name: 'Amazon.it', currency: 'EUR', region: 'eu' },
  ES: { id: 'A1RKKUPIHCS9HS', name: 'Amazon.es', currency: 'EUR', region: 'eu' },
  NL: { id: 'A1805IZSGTT6HS', name: 'Amazon.nl', currency: 'EUR', region: 'eu' },
  PL: { id: 'A1C3SOZRARQ6R3', name: 'Amazon.pl', currency: 'PLN', region: 'eu' },
  SE: { id: 'A2NODRKZP88ZB9', name: 'Amazon.se', currency: 'SEK', region: 'eu' },
  BE: { id: 'AMEN7PMS3EDWL', name: 'Amazon.com.be', currency: 'EUR', region: 'eu' },
  TR: { id: 'A33AVAJ2PDY3EV', name: 'Amazon.com.tr', currency: 'TRY', region: 'eu' },

  // Far East
  JP: { id: 'A1VC38T7YXB528', name: 'Amazon.co.jp', currency: 'JPY', region: 'fe' },
  AU: { id: 'A39IBJ37TRP1C6', name: 'Amazon.com.au', currency: 'AUD', region: 'fe' },
  SG: { id: 'A19VAU5U5O7RUS', name: 'Amazon.sg', currency: 'SGD', region: 'fe' },
  IN: { id: 'A21TJRUUN4KGV', name: 'Amazon.in', currency: 'INR', region: 'fe' },
  AE: { id: 'A2VIGQ35RCS4UG', name: 'Amazon.ae', currency: 'AED', region: 'fe' },
} as const;
```

---

## 📊 API Endpoints & Roller

### Rol Durumu (17 Ocak 2026)

| Rol | Durum | API'ler |
|-----|-------|---------|
| ✅ Finance and Accounting | **ONAYLI** | Finances API |
| ✅ Selling Partner Insights | **ONAYLI** | Sellers API |
| ✅ Inventory and Order Tracking | **ONAYLI** | Orders API |
| ✅ Brand Analytics | **ONAYLI** | Brand Analytics API |
| ⏳ Product Listing | **ONAY BEKLİYOR** | Listings Items API, Catalog Items API |
| ⏳ Amazon Fulfillment | **ONAY BEKLİYOR** | FBA Inventory API |

---

## 💰 Finances API (✅ ONAYLI)

### Endpoint
```
GET /finances/v0/financialEvents
```

### Request
```typescript
interface FinancialEventsRequest {
  PostedAfter: string;   // ISO 8601 date
  PostedBefore?: string;
  NextToken?: string;    // Pagination
}

// Example
const params = {
  PostedAfter: '2026-01-01T00:00:00Z',
  PostedBefore: '2026-01-17T23:59:59Z',
};
```

### Response Data Structures

```typescript
// Shipment Event (Sale)
interface ShipmentEvent {
  AmazonOrderId: string;
  SellerOrderId: string;
  MarketplaceName: string;
  PostedDate: string;
  ShipmentItemList: ShipmentItem[];
}

interface ShipmentItem {
  SellerSKU: string;
  QuantityShipped: number;
  ItemChargeList: Charge[];      // Revenue
  ItemChargeAdjustmentList: Charge[];
  ItemFeeList: Fee[];            // Amazon fees
  ItemFeeAdjustmentList: Fee[];
  PromotionList: Promotion[];    // Discounts
}

interface Charge {
  ChargeType: 'Principal' | 'Tax' | 'ShippingCharge' | 'GiftWrap';
  ChargeAmount: Money;
}

interface Fee {
  FeeType: string;  // See fee types below
  FeeAmount: Money;
}

interface Money {
  CurrencyCode: string;
  CurrencyAmount: number;
}
```

### Fee Types (12+)

```typescript
export const AMAZON_FEE_TYPES = {
  // Fulfillment Fees
  'FBAPerUnitFulfillmentFee': 'FBA Fulfillment Fee',
  'FBAWeightBasedFee': 'FBA Weight-Based Fee',
  'FBAPerOrderFulfillmentFee': 'FBA Per-Order Fee',

  // Commission
  'Commission': 'Referral Fee',
  'RefundCommission': 'Refund Commission',

  // Storage
  'FBAStorageFee': 'Monthly Storage Fee',
  'FBALongTermStorageFee': 'Long-Term Storage Fee',

  // Inbound
  'FBAInboundTransportationFee': 'Inbound Transportation',
  'FBAInboundConvenienceFee': 'Inbound Placement Fee',

  // Other
  'VariableClosingFee': 'Closing Fee',
  'HighVolumeListingFee': 'High Volume Listing Fee',
  'GiftWrapChargeback': 'Gift Wrap Fee',
  'ShippingChargeback': 'Shipping Chargeback',
};
```

### Implementation

```typescript
// src/lib/amazon/finances.ts

export async function getFinancialEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  region: 'na' | 'eu' | 'fe' = 'na'
): Promise<FinancialEvent[]> {
  const endpoint = getRegionalEndpoint(region);
  const allEvents: FinancialEvent[] = [];
  let nextToken: string | undefined;

  do {
    const url = new URL(`${endpoint}/finances/v0/financialEvents`);
    url.searchParams.set('PostedAfter', startDate.toISOString());
    url.searchParams.set('PostedBefore', endDate.toISOString());
    if (nextToken) {
      url.searchParams.set('NextToken', nextToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Process different event types
    if (data.payload?.FinancialEvents) {
      const events = data.payload.FinancialEvents;

      // Shipments (sales)
      if (events.ShipmentEventList) {
        allEvents.push(...events.ShipmentEventList.map(e => ({
          type: 'shipment',
          ...e
        })));
      }

      // Refunds
      if (events.RefundEventList) {
        allEvents.push(...events.RefundEventList.map(e => ({
          type: 'refund',
          ...e
        })));
      }

      // Service fees (advertising, etc.)
      if (events.ServiceFeeEventList) {
        allEvents.push(...events.ServiceFeeEventList.map(e => ({
          type: 'service_fee',
          ...e
        })));
      }
    }

    nextToken = data.payload?.NextToken;
  } while (nextToken);

  return allEvents;
}
```

### Calculated Metrics

```typescript
// src/lib/amazon/calculations.ts

export function calculateDailyMetrics(events: FinancialEvent[]): DailyMetrics {
  let totalSales = 0;
  let totalFees = 0;
  let totalRefunds = 0;
  const feeBreakdown: Record<string, number> = {};

  for (const event of events) {
    if (event.type === 'shipment') {
      for (const item of event.ShipmentItemList) {
        // Sales (Principal charges)
        for (const charge of item.ItemChargeList) {
          if (charge.ChargeType === 'Principal') {
            totalSales += charge.ChargeAmount.CurrencyAmount;
          }
        }

        // Fees
        for (const fee of item.ItemFeeList) {
          const amount = Math.abs(fee.FeeAmount.CurrencyAmount);
          totalFees += amount;
          feeBreakdown[fee.FeeType] = (feeBreakdown[fee.FeeType] || 0) + amount;
        }
      }
    }

    if (event.type === 'refund') {
      totalRefunds += Math.abs(event.RefundedAmount?.CurrencyAmount || 0);
    }
  }

  return {
    totalSales,
    totalFees,
    totalRefunds,
    feeBreakdown,
    netRevenue: totalSales - totalFees - totalRefunds,
  };
}
```

---

## 📦 Orders API (✅ ONAYLI)

### Endpoints
```
GET /orders/v0/orders                    # List orders
GET /orders/v0/orders/{orderId}          # Get single order
GET /orders/v0/orders/{orderId}/orderItems  # Get order items
```

### Request Parameters

```typescript
interface GetOrdersRequest {
  MarketplaceIds: string[];      // Required
  CreatedAfter?: string;         // ISO 8601
  CreatedBefore?: string;
  LastUpdatedAfter?: string;
  LastUpdatedBefore?: string;
  OrderStatuses?: OrderStatus[];
  FulfillmentChannels?: ('AFN' | 'MFN')[];  // AFN=FBA, MFN=FBM
  MaxResultsPerPage?: number;    // 1-100
  NextToken?: string;
}

type OrderStatus =
  | 'Pending'
  | 'Unshipped'
  | 'PartiallyShipped'
  | 'Shipped'
  | 'Canceled'
  | 'Unfulfillable'
  | 'InvoiceUnconfirmed'
  | 'PendingAvailability';
```

### Response

```typescript
interface Order {
  AmazonOrderId: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: OrderStatus;
  FulfillmentChannel: 'AFN' | 'MFN';
  SalesChannel: string;
  ShipServiceLevel: string;
  OrderTotal?: Money;
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  PaymentMethod: string;
  MarketplaceId: string;
  ShippingAddress?: Address;
  BuyerInfo?: BuyerInfo;
}

interface Address {
  Name: string;
  AddressLine1?: string;
  City?: string;
  StateOrRegion?: string;
  PostalCode?: string;
  CountryCode: string;
}

interface OrderItem {
  ASIN: string;
  SellerSKU?: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  QuantityShipped: number;
  ItemPrice?: Money;
  ItemTax?: Money;
  ShippingPrice?: Money;
  PromotionDiscount?: Money;
  IsGift: boolean;
}
```

### Implementation

```typescript
// src/lib/amazon/orders.ts

export async function getOrders(
  accessToken: string,
  marketplaceId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const endpoint = getRegionalEndpoint(marketplaceId);
  const allOrders: Order[] = [];
  let nextToken: string | undefined;

  do {
    const url = new URL(`${endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', marketplaceId);
    url.searchParams.set('CreatedAfter', startDate.toISOString());
    url.searchParams.set('CreatedBefore', endDate.toISOString());
    url.searchParams.set('MaxResultsPerPage', '100');
    if (nextToken) {
      url.searchParams.set('NextToken', nextToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
      },
    });

    const data = await response.json();

    if (data.payload?.Orders) {
      allOrders.push(...data.payload.Orders);
    }

    nextToken = data.payload?.NextToken;
  } while (nextToken);

  return allOrders;
}

// Get order items (for detailed breakdown)
export async function getOrderItems(
  accessToken: string,
  orderId: string,
  region: string
): Promise<OrderItem[]> {
  const endpoint = getRegionalEndpoint(region);

  const response = await fetch(
    `${endpoint}/orders/v0/orders/${orderId}/orderItems`,
    {
      headers: {
        'x-amz-access-token': accessToken,
      },
    }
  );

  const data = await response.json();
  return data.payload?.OrderItems || [];
}
```

### State-based Sales Map

```typescript
// src/lib/amazon/analytics.ts

export function calculateStateSales(orders: Order[]): Map<string, StateSales> {
  const stateMap = new Map<string, StateSales>();

  for (const order of orders) {
    const state = order.ShippingAddress?.StateOrRegion;
    if (!state) continue;

    const existing = stateMap.get(state) || {
      state,
      orders: 0,
      revenue: 0,
      units: 0,
    };

    existing.orders += 1;
    existing.revenue += order.OrderTotal?.CurrencyAmount || 0;
    existing.units += order.NumberOfItemsShipped;

    stateMap.set(state, existing);
  }

  return stateMap;
}
```

---

## 📝 Listings Items API (⏳ ONAY BEKLİYOR)

### Endpoint
```
GET /listings/2021-08-01/items/{sellerId}/{sku}
```

### Response (Onay Gelince)

```typescript
interface ListingsItem {
  sku: string;
  summaries: ListingSummary[];
  attributes: Record<string, any>;
  issues: ListingIssue[];
  offers: Offer[];
  fulfillmentAvailability: FulfillmentAvailability[];
}

interface ListingSummary {
  marketplaceId: string;
  asin: string;
  productType: string;
  conditionType: string;
  status: ('ACTIVE' | 'INACTIVE' | 'INCOMPLETE')[];
  itemName: string;
  createdDate: string;
  lastUpdatedDate: string;
  mainImage: {
    link: string;
    height: number;
    width: number;
  };
}
```

### Implementation (Hazır, Onay Bekleniyor)

```typescript
// src/lib/amazon/listings.ts

export async function getListingItem(
  accessToken: string,
  sellerId: string,
  sku: string,
  marketplaceId: string
): Promise<ListingsItem> {
  const endpoint = getRegionalEndpoint(marketplaceId);

  const url = new URL(`${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}`);
  url.searchParams.set('marketplaceIds', marketplaceId);
  url.searchParams.set('includedData', 'summaries,attributes,issues,offers,fulfillmentAvailability');

  const response = await fetch(url.toString(), {
    headers: {
      'x-amz-access-token': accessToken,
    },
  });

  if (response.status === 403) {
    throw new Error('Product Listing role not approved yet');
  }

  return response.json();
}
```

---

## 📦 FBA Inventory API (⏳ ONAY BEKLİYOR)

### Endpoint
```
GET /fba/inventory/v1/summaries
```

### Response (Onay Gelince)

```typescript
interface InventorySummary {
  asin: string;
  fnSku: string;
  sellerSku: string;
  condition: string;
  inventoryDetails: {
    fulfillableQuantity: number;
    inboundWorkingQuantity: number;
    inboundShippedQuantity: number;
    inboundReceivingQuantity: number;
    reservedQuantity: {
      totalReservedQuantity: number;
      pendingCustomerOrderQuantity: number;
      pendingTransshipmentQuantity: number;
      fcProcessingQuantity: number;
    };
    researchingQuantity: {
      totalResearchingQuantity: number;
    };
    unfulfillableQuantity: {
      totalUnfulfillableQuantity: number;
      customerDamagedQuantity: number;
      warehouseDamagedQuantity: number;
      distributorDamagedQuantity: number;
      carrierDamagedQuantity: number;
      defectiveQuantity: number;
      expiredQuantity: number;
    };
  };
  lastUpdatedTime: string;
  productName: string;
  totalQuantity: number;
}
```

### Implementation (Hazır, Onay Bekleniyor)

```typescript
// src/lib/amazon/inventory.ts

export async function getFbaInventory(
  accessToken: string,
  marketplaceId: string
): Promise<InventorySummary[]> {
  const endpoint = getRegionalEndpoint(marketplaceId);
  const allInventory: InventorySummary[] = [];
  let nextToken: string | undefined;

  do {
    const url = new URL(`${endpoint}/fba/inventory/v1/summaries`);
    url.searchParams.set('marketplaceIds', marketplaceId);
    url.searchParams.set('granularityType', 'Marketplace');
    url.searchParams.set('granularityId', marketplaceId);
    url.searchParams.set('details', 'true');
    if (nextToken) {
      url.searchParams.set('nextToken', nextToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
      },
    });

    if (response.status === 403) {
      throw new Error('Amazon Fulfillment role not approved yet');
    }

    const data = await response.json();

    if (data.payload?.inventorySummaries) {
      allInventory.push(...data.payload.inventorySummaries);
    }

    nextToken = data.payload?.nextToken;
  } while (nextToken);

  return allInventory;
}

// Low stock alerts
export function checkLowStock(
  inventory: InventorySummary[],
  thresholdDays: number = 14,
  avgDailySales: Map<string, number>
): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  for (const item of inventory) {
    const dailySales = avgDailySales.get(item.asin) || 0;
    if (dailySales === 0) continue;

    const daysOfStock = item.inventoryDetails.fulfillableQuantity / dailySales;

    if (daysOfStock < thresholdDays) {
      alerts.push({
        asin: item.asin,
        sku: item.sellerSku,
        productName: item.productName,
        currentStock: item.inventoryDetails.fulfillableQuantity,
        daysOfStock: Math.floor(daysOfStock),
        recommendedReorder: Math.ceil(dailySales * 30), // 30 days worth
        urgency: daysOfStock < 7 ? 'critical' : daysOfStock < 14 ? 'warning' : 'info',
      });
    }
  }

  return alerts.sort((a, b) => a.daysOfStock - b.daysOfStock);
}
```

---

## ⚡ Rate Limits

### Limits by API

| API | Rate Limit | Burst |
|-----|------------|-------|
| Orders | 1 request/second | 30 |
| Finances | 0.5 request/second | 30 |
| Listings | 5 requests/second | 10 |
| Inventory | 2 requests/second | 30 |
| Catalog | 5 requests/second | 40 |

### Rate Limit Handler

```typescript
// src/lib/amazon/rate-limiter.ts

interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
}

const API_LIMITS: Record<string, RateLimitConfig> = {
  orders: { requestsPerSecond: 1, burstLimit: 30 },
  finances: { requestsPerSecond: 0.5, burstLimit: 30 },
  listings: { requestsPerSecond: 5, burstLimit: 10 },
  inventory: { requestsPerSecond: 2, burstLimit: 30 },
  catalog: { requestsPerSecond: 5, burstLimit: 40 },
};

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimitConfig;

  constructor(apiType: keyof typeof API_LIMITS) {
    this.config = API_LIMITS[apiType];
    this.tokens = this.config.burstLimit;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 / this.config.requestsPerSecond) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.config.requestsPerSecond;

    this.tokens = Math.min(this.config.burstLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

---

## 🗄️ Database Schema

```sql
-- Amazon connection per user
CREATE TABLE amazon_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  marketplace_ids TEXT[] NOT NULL,
  region TEXT NOT NULL,  -- 'na', 'eu', 'fe'
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

-- Daily metrics from Amazon
CREATE TABLE amazon_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Revenue
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,

  -- Fees
  total_fees DECIMAL(12,2) DEFAULT 0,
  referral_fee DECIMAL(12,2) DEFAULT 0,
  fba_fulfillment_fee DECIMAL(12,2) DEFAULT 0,
  fba_storage_fee DECIMAL(12,2) DEFAULT 0,
  other_fees DECIMAL(12,2) DEFAULT 0,

  -- Refunds
  total_refunds DECIMAL(12,2) DEFAULT 0,
  refund_count INTEGER DEFAULT 0,

  -- Advertising (from Ads API later)
  ad_spend DECIMAL(12,2) DEFAULT 0,
  ad_sales DECIMAL(12,2) DEFAULT 0,

  -- Calculated
  gross_profit DECIMAL(12,2),
  net_profit DECIMAL(12,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marketplace_id, date)
);

-- Product-level data (after Product Listing approval)
CREATE TABLE amazon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_id TEXT NOT NULL,
  asin TEXT NOT NULL,
  sku TEXT,
  title TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  bsr INTEGER,
  category TEXT,
  status TEXT DEFAULT 'active',

  -- Inventory (after Fulfillment approval)
  fba_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  inbound_quantity INTEGER DEFAULT 0,

  -- User-provided
  cogs DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marketplace_id, asin)
);

-- Sync history
CREATE TABLE amazon_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,  -- 'orders', 'finances', 'inventory', 'products'
  marketplace_id TEXT,
  status TEXT DEFAULT 'running',  -- 'running', 'completed', 'failed'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE amazon_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections" ON amazon_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON amazon_daily_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own products" ON amazon_products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync history" ON amazon_sync_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🔗 İlgili Kaynaklar

- [Amazon SP-API Documentation](https://developer-docs.amazon.com/sp-api/)
- [SP-API GitHub Models](https://github.com/amzn/selling-partner-api-models)
- [Rate Limiting Guide](https://developer-docs.amazon.com/sp-api/docs/usage-plans-and-rate-limits)
- [Error Codes Reference](https://developer-docs.amazon.com/sp-api/docs/error-handling)

---

**Son Güncelleme:** 17 Ocak 2026
