# eBay API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** v1 (RESTful APIs)
**Durum:** 📅 Faz 4+ (Planlanacak)

---

## 📋 Genel Bakış

eBay APIs, satıcıların:
- Listelemelerini yönetmesini
- Siparişleri takip etmesini
- Envanter senkronize etmesini
- Teklifleri (bids) yönetmesini
sağlayan kapsamlı API koleksiyonu.

---

## ⚠️ Neden Faz 4+?

```
┌─────────────────────────────────────────────────────────────┐
│  eBay API Özellikleri:                                      │
│                                                             │
│  ✅ Global reach (190+ ülke)                               │
│  ✅ Auction + Fixed Price                                   │
│  ✅ Kapsamlı API coverage                                   │
│  ✅ Motors, Real Estate gibi unique kategoriler            │
│                                                             │
│  ⚠️ Zorluklar:                                              │
│  ❌ Karmaşık API yapısı (10+ farklı API)                   │
│  ❌ Legacy + Modern API karışımı                            │
│  ❌ Authentication karmaşık                                 │
│  ❌ Rate limits marketplace-dependent                       │
│  ❌ Farklı ülkeler için farklı kurallar                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### OAuth 2.0 Flow

```env
# .env.local (Faz 4+)
EBAY_APP_ID=xxxxx  # Client ID
EBAY_CERT_ID=xxxxx  # Client Secret
EBAY_DEV_ID=xxxxx
EBAY_REDIRECT_URI=SellerGenix-xxxxx-sellerc
EBAY_ENVIRONMENT=PRODUCTION  # or SANDBOX
```

### OAuth Scopes

```typescript
const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.finances',
  'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
];
```

### Auth Implementation

```typescript
// src/lib/ebay/auth.ts

const EBAY_AUTH_URL = 'https://auth.ebay.com/oauth2/authorize';
const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

export function getEbayAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.EBAY_APP_ID!,
    response_type: 'code',
    redirect_uri: process.env.EBAY_REDIRECT_URI!,
    scope: EBAY_SCOPES.join(' '),
    state,
  });

  return `${EBAY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<EbayToken> {
  const credentials = Buffer.from(
    `${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`
  ).toString('base64');

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI!,
    }),
  });

  return response.json();
}

export async function refreshToken(refreshToken: string): Promise<EbayToken> {
  const credentials = Buffer.from(
    `${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`
  ).toString('base64');

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: EBAY_SCOPES.join(' '),
    }),
  });

  return response.json();
}

interface EbayToken {
  access_token: string;
  expires_in: number;  // seconds
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
}
```

---

## 🌍 API Endpoints

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.ebay.com` |
| Sandbox | `https://api.sandbox.ebay.com` |

### Main APIs

| API | Base Path | Description |
|-----|-----------|-------------|
| **Sell Fulfillment** | `/sell/fulfillment/v1` | Orders, shipments |
| **Sell Inventory** | `/sell/inventory/v1` | Inventory, offers |
| **Sell Account** | `/sell/account/v1` | Policies, programs |
| **Sell Finances** | `/sell/finances/v1` | Payouts, transactions |
| **Sell Analytics** | `/sell/analytics/v1` | Traffic, sales reports |
| **Sell Marketing** | `/sell/marketing/v1` | Promotions, ads |
| **Browse** | `/buy/browse/v1` | Search, item details |

---

## 📊 Data Structures

### Order

```typescript
interface EbayOrder {
  orderId: string;
  legacyOrderId: string;
  creationDate: string;
  lastModifiedDate: string;
  orderFulfillmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'FULFILLED';
  orderPaymentStatus: 'PENDING' | 'FAILED' | 'PAID' | 'PARTIALLY_REFUNDED' | 'FULLY_REFUNDED';
  sellerId: string;
  buyer: {
    username: string;
    taxAddress?: {
      city: string;
      stateOrProvince: string;
      postalCode: string;
      countryCode: string;
    };
  };
  pricingSummary: {
    priceSubtotal: Money;
    deliveryCost: Money;
    tax: Money;
    total: Money;
  };
  fulfillmentStartInstructions: {
    fulfillmentInstructionsType: string;
    shippingStep: {
      shipTo: Address;
      shippingCarrierCode: string;
      shippingServiceCode: string;
    };
  }[];
  lineItems: EbayLineItem[];
  salesRecordReference: string;
  totalFeeBasisAmount: Money;
  totalMarketplaceFee: Money;
}

interface EbayLineItem {
  lineItemId: string;
  legacyItemId: string;
  legacyVariationId: string;
  sku: string;
  title: string;
  lineItemCost: Money;
  quantity: number;
  soldFormat: 'FIXED_PRICE' | 'AUCTION';
  listingMarketplaceId: string;
  purchaseMarketplaceId: string;
  lineItemFulfillmentStatus: string;
  total: Money;
  deliveryCost: DeliveryCost;
  appliedPromotions: Promotion[];
  taxes: Tax[];
}

interface Money {
  value: string;
  currency: string;
}

interface Address {
  fullName: string;
  contactAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    countryCode: string;
  };
  primaryPhone?: { phoneNumber: string };
  email?: string;
}
```

### Inventory Item

```typescript
interface EbayInventoryItem {
  sku: string;
  locale: string;
  product: {
    title: string;
    description: string;
    aspects: Record<string, string[]>;
    brand: string;
    mpn: string;
    imageUrls: string[];
  };
  condition: string;
  conditionDescription?: string;
  availability: {
    shipToLocationAvailability: {
      quantity: number;
      allocationByFormat?: {
        fixedPrice: number;
        auction: number;
      };
    };
  };
  packageWeightAndSize?: {
    weight: { value: number; unit: string };
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
  };
}
```

### Payout

```typescript
interface EbayPayout {
  payoutId: string;
  payoutStatus: 'INITIATED' | 'SUCCEEDED' | 'RETRYABLE_FAILED' | 'TERMINAL_FAILED';
  payoutStatusDescription: string;
  amount: Money;
  payoutDate: string;
  payoutInstrument: {
    instrumentType: string;
    nickname: string;
    accountLastFourDigits: string;
  };
  transactionCount: number;
}
```

### Transaction

```typescript
interface EbayTransaction {
  transactionId: string;
  transactionType: 'SALE' | 'REFUND' | 'CREDIT' | 'DISPUTE' | 'SHIPPING_LABEL' | 'TRANSFER' | 'NON_SALE_CHARGE';
  transactionStatus: 'PAYOUT' | 'FUNDS_PROCESSING' | 'FUNDS_AVAILABLE_FOR_PAYOUT' | 'FUNDS_ON_HOLD';
  amount: Money;
  feeType?: string;
  bookingEntry: 'DEBIT' | 'CREDIT';
  totalFeeBasisAmount?: Money;
  totalFeeAmount?: Money;
  orderId?: string;
  transactionDate: string;
  buyer?: { username: string };
  orderLineItems?: {
    lineItemId: string;
    feeBasisAmount: Money;
    marketplaceFees: MarketplaceFee[];
  }[];
}

interface MarketplaceFee {
  feeType: string;
  amount: Money;
  feeJurisdiction?: {
    regionName: string;
    regionType: string;
  };
}
```

---

## 💻 Implementation (Faz 4+)

### eBay Client

```typescript
// src/lib/ebay/client.ts

export class EbayClient {
  private accessToken: string;
  private baseUrl = 'https://api.ebay.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'eBay API error');
    }

    return response.json();
  }

  // Orders (Sell Fulfillment API)
  async getOrders(params?: {
    filter?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: EbayOrder[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sell/fulfillment/v1/order?${query}`);
  }

  async getOrder(orderId: string): Promise<EbayOrder> {
    return this.request(`/sell/fulfillment/v1/order/${orderId}`);
  }

  // Inventory (Sell Inventory API)
  async getInventoryItems(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ inventoryItems: EbayInventoryItem[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sell/inventory/v1/inventory_item?${query}`);
  }

  async getInventoryItem(sku: string): Promise<EbayInventoryItem> {
    return this.request(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
  }

  async updateInventoryItem(sku: string, item: Partial<EbayInventoryItem>): Promise<void> {
    await this.request(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  // Finances (Sell Finances API)
  async getPayouts(params?: {
    filter?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payouts: EbayPayout[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sell/finances/v1/payout?${query}`);
  }

  async getTransactions(params?: {
    filter?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: EbayTransaction[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sell/finances/v1/transaction?${query}`);
  }

  // Analytics (Sell Analytics API)
  async getTrafficReport(params: {
    dimension: 'DAY' | 'LISTING';
    filter: string;
    metric: string;
  }): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/sell/analytics/v1/traffic_report?${query}`);
  }
}
```

### Sync Service

```typescript
// src/lib/ebay/sync.ts

export async function syncEbayData(userId: string, ebayClient: EbayClient) {
  // Sync orders (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { orders } = await ebayClient.getOrders({
    filter: `creationdate:[${thirtyDaysAgo.toISOString()}]`,
    limit: 200,
  });

  let syncedOrders = 0;
  for (const order of orders) {
    const total = parseFloat(order.pricingSummary.total.value);
    const fees = parseFloat(order.totalMarketplaceFee?.value || '0');

    await supabase.from('ebay_orders').upsert({
      user_id: userId,
      order_id: order.orderId,
      legacy_order_id: order.legacyOrderId,
      created_at: order.creationDate,
      payment_status: order.orderPaymentStatus,
      fulfillment_status: order.orderFulfillmentStatus,
      total_price: total,
      marketplace_fees: fees,
      currency: order.pricingSummary.total.currency,
      buyer_username: order.buyer.username,
      shipping_country: order.fulfillmentStartInstructions[0]?.shippingStep?.shipTo?.contactAddress?.countryCode,
      items_count: order.lineItems.length,
    }, {
      onConflict: 'user_id,order_id',
    });

    syncedOrders++;
  }

  // Sync inventory
  const { inventoryItems } = await ebayClient.getInventoryItems({ limit: 200 });

  let syncedItems = 0;
  for (const item of inventoryItems) {
    await supabase.from('ebay_inventory').upsert({
      user_id: userId,
      sku: item.sku,
      title: item.product.title,
      quantity: item.availability.shipToLocationAvailability.quantity,
      condition: item.condition,
      image_url: item.product.imageUrls?.[0],
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,sku',
    });

    syncedItems++;
  }

  // Sync payouts
  const { payouts } = await ebayClient.getPayouts({
    filter: `payoutDate:[${thirtyDaysAgo.toISOString()}]`,
  });

  for (const payout of payouts) {
    await supabase.from('ebay_payouts').upsert({
      user_id: userId,
      payout_id: payout.payoutId,
      status: payout.payoutStatus,
      amount: parseFloat(payout.amount.value),
      currency: payout.amount.currency,
      payout_date: payout.payoutDate,
      transaction_count: payout.transactionCount,
    }, {
      onConflict: 'user_id,payout_id',
    });
  }

  return {
    orders: syncedOrders,
    inventory: syncedItems,
    payouts: payouts.length,
  };
}
```

---

## ⚡ Rate Limits

| API | Rate Limit |
|-----|------------|
| **Browse** | 5,000 calls/day |
| **Sell Fulfillment** | 5,000 calls/day |
| **Sell Inventory** | 150,000 calls/day |
| **Sell Finances** | 10,000 calls/day |
| **Sell Analytics** | 5,000 calls/day |

### Rate Limiter

```typescript
// src/lib/ebay/rate-limiter.ts

interface RateLimitBucket {
  calls: number;
  resetTime: number;
}

export class EbayRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();

  private readonly limits: Record<string, number> = {
    browse: 5000,
    fulfillment: 5000,
    inventory: 150000,
    finances: 10000,
    analytics: 5000,
  };

  async acquire(api: keyof typeof this.limits): Promise<void> {
    const now = Date.now();
    const limit = this.limits[api];

    let bucket = this.buckets.get(api);

    // Reset bucket at midnight UTC
    const midnightUtc = new Date();
    midnightUtc.setUTCHours(24, 0, 0, 0);

    if (!bucket || bucket.resetTime < now) {
      bucket = {
        calls: 0,
        resetTime: midnightUtc.getTime(),
      };
    }

    if (bucket.calls >= limit) {
      const waitTime = bucket.resetTime - now;
      throw new Error(`eBay ${api} API rate limit exceeded. Resets in ${Math.ceil(waitTime / 1000 / 60)} minutes`);
    }

    bucket.calls++;
    this.buckets.set(api, bucket);
  }
}
```

---

## 🗄️ Database Schema (Faz 4+)

```sql
-- eBay connection
CREATE TABLE ebay_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_ebay TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- eBay orders
CREATE TABLE ebay_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  legacy_order_id TEXT,
  created_at TIMESTAMPTZ,
  payment_status TEXT,
  fulfillment_status TEXT,
  total_price DECIMAL(10,2),
  marketplace_fees DECIMAL(10,2),
  currency TEXT,
  buyer_username TEXT,
  shipping_country TEXT,
  items_count INTEGER DEFAULT 0,
  UNIQUE(user_id, order_id)
);

-- eBay inventory
CREATE TABLE ebay_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  title TEXT,
  quantity INTEGER DEFAULT 0,
  condition TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  cogs DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

-- eBay payouts
CREATE TABLE ebay_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_id TEXT NOT NULL,
  status TEXT,
  amount DECIMAL(12,2),
  currency TEXT,
  payout_date TIMESTAMPTZ,
  transaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, payout_id)
);

-- Daily metrics
CREATE TABLE ebay_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  auction_sales DECIMAL(12,2) DEFAULT 0,
  fixed_price_sales DECIMAL(12,2) DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

---

## 📊 eBay Fee Structure

| Fee Type | Amount |
|----------|--------|
| **Insertion Fee** | Free for first 250 listings/month |
| **Final Value Fee** | 12.9% + $0.30 per order (most categories) |
| **PayPal/Managed Payments** | Included in Final Value Fee |
| **Promoted Listings** | 2-20% of sale (optional) |
| **Store Subscription** | $4.95-$2,999.95/month |

### Fee Calculation

```typescript
export function calculateEbayFees(
  salePrice: number,
  category: string,
  usedPromotedListing: boolean,
  promotedListingRate: number = 0
): EbayFees {
  // Final Value Fee (varies by category, using default)
  const finalValueFee = salePrice * 0.129 + 0.30;

  // Promoted Listing (if used)
  const promotedListingFee = usedPromotedListing
    ? salePrice * (promotedListingRate / 100)
    : 0;

  const totalFees = finalValueFee + promotedListingFee;

  return {
    insertionFee: 0, // Free for first 250
    finalValueFee,
    promotedListingFee,
    totalFees,
    netRevenue: salePrice - totalFees,
  };
}
```

---

## 🌍 eBay Sites (Marketplaces)

| Site | ID | Currency |
|------|-----|----------|
| eBay US | `EBAY_US` | USD |
| eBay UK | `EBAY_GB` | GBP |
| eBay Germany | `EBAY_DE` | EUR |
| eBay Australia | `EBAY_AU` | AUD |
| eBay France | `EBAY_FR` | EUR |
| eBay Italy | `EBAY_IT` | EUR |
| eBay Spain | `EBAY_ES` | EUR |
| eBay Canada | `EBAY_CA` | CAD |

---

## 🔗 İlgili Kaynaklar

- [eBay Developer Program](https://developer.ebay.com/)
- [API Explorer](https://developer.ebay.com/my/api_test_tool)
- [Sell APIs Documentation](https://developer.ebay.com/docs)
- [OAuth Guide](https://developer.ebay.com/api-docs/static/oauth-tokens.html)
- [Seller Hub](https://www.ebay.com/sh/landing)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 4+ (Amazon + Shopify tamamlandıktan sonra)
