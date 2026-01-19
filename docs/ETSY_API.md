# Etsy Open API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** v3
**Durum:** 📅 Faz 4+ (Planlanacak)

---

## 📋 Genel Bakış

Etsy Open API, satıcıların:
- Listelerini yönetmesini
- Siparişleri takip etmesini
- Envanter güncellemesini
- Shop istatistiklerini görmesini
sağlayan RESTful API.

---

## ⚠️ Neden Faz 4+?

```
┌─────────────────────────────────────────────────────────────┐
│  Etsy API Özellikleri:                                      │
│                                                             │
│  ✅ OAuth 2.0 (modern, kolay)                              │
│  ✅ İyi documentation                                       │
│  ✅ Handmade/vintage niche                                  │
│  ✅ Loyal customer base                                     │
│                                                             │
│  ⚠️ Ancak:                                                  │
│  ❌ Rate limits çok agresif (10 calls/second)              │
│  ❌ Bazı endpoints kısıtlı                                  │
│  ❌ Finansal veriler sınırlı                                │
│  ❌ Niche pazar (tüm satıcılar için değil)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### OAuth 2.0 Flow

```env
# .env.local (Faz 4+)
ETSY_API_KEY=xxxxx
ETSY_API_SECRET=xxxxx
ETSY_REDIRECT_URI=https://app.sellergenix.io/api/auth/etsy/callback
```

### Auth Implementation

```typescript
// src/lib/etsy/auth.ts

const ETSY_SCOPES = [
  'address_r',
  'address_w',
  'billing_r',
  'cart_r',
  'cart_w',
  'email_r',
  'favorites_r',
  'favorites_w',
  'feedback_r',
  'listings_d',
  'listings_r',
  'listings_w',
  'profile_r',
  'profile_w',
  'recommend_r',
  'recommend_w',
  'shops_r',
  'shops_w',
  'transactions_r',
  'transactions_w',
].join(' ');

export function getEtsyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ETSY_API_KEY!,
    redirect_uri: process.env.ETSY_REDIRECT_URI!,
    scope: ETSY_SCOPES,
    state,
    code_challenge: generateCodeChallenge(),
    code_challenge_method: 'S256',
  });

  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<EtsyToken> {
  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEY!,
      redirect_uri: process.env.ETSY_REDIRECT_URI!,
      code,
      code_verifier: getStoredCodeVerifier(),
    }),
  });

  return response.json();
}

interface EtsyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}
```

---

## 🌍 API Endpoints

### Base URL
```
https://openapi.etsy.com/v3
```

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/application/shops/{shop_id}` | GET | Shop info |
| `/application/shops/{shop_id}/listings` | GET | List listings |
| `/application/listings/{listing_id}` | GET | Get listing |
| `/application/shops/{shop_id}/receipts` | GET | List receipts (orders) |
| `/application/shops/{shop_id}/transactions` | GET | List transactions |
| `/application/listings/{listing_id}/inventory` | GET | Get inventory |

---

## 📊 Data Structures

### Shop

```typescript
interface EtsyShop {
  shop_id: number;
  user_id: number;
  shop_name: string;
  create_date: number;
  title: string;
  announcement: string;
  currency_code: string;
  is_vacation: boolean;
  vacation_message: string;
  sale_message: string;
  digital_sale_message: string;
  url: string;
  num_favorers: number;
  languages: string[];
  icon_url_fullxfull: string;
  is_using_structured_policies: boolean;
  has_onboarded_structured_policies: boolean;
  review_average: number;
  review_count: number;
  transaction_sold_count: number;
}
```

### Listing

```typescript
interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';
  creation_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  state_timestamp: number;
  quantity: number;
  shop_section_id: number;
  featured_rank: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  listing_type: 'physical' | 'download' | 'both';
  tags: string[];
  materials: string[];
  shipping_profile_id: number;
  return_policy_id: number;
  processing_min: number;
  processing_max: number;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  is_supply: boolean;
  item_weight: number;
  item_weight_unit: string;
  item_length: number;
  item_width: number;
  item_height: number;
  item_dimensions_unit: string;
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  taxonomy_id: number;
  views: number;
}
```

### Receipt (Order)

```typescript
interface EtsyReceipt {
  receipt_id: number;
  receipt_type: number;
  seller_user_id: number;
  buyer_user_id: number;
  name: string;
  first_line: string;
  second_line: string;
  city: string;
  state: string;
  zip: string;
  country_iso: string;
  payment_method: string;
  payment_email: string;
  message_from_seller: string;
  message_from_buyer: string;
  message_from_payment: string;
  is_paid: boolean;
  is_shipped: boolean;
  create_timestamp: number;
  update_timestamp: number;
  gift_message: string;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_vat_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  gift_wrap_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  transactions: EtsyTransaction[];
}
```

### Transaction

```typescript
interface EtsyTransaction {
  transaction_id: number;
  title: string;
  description: string;
  seller_user_id: number;
  buyer_user_id: number;
  create_timestamp: number;
  paid_timestamp: number;
  shipped_timestamp: number;
  quantity: number;
  listing_image_id: number;
  receipt_id: number;
  is_digital: boolean;
  file_data: string;
  listing_id: number;
  sku: string;
  product_id: number;
  transaction_type: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  variations: {
    property_id: number;
    value_id: number;
    formatted_name: string;
    formatted_value: string;
  }[];
}
```

---

## 💻 Implementation (Faz 4+)

### Etsy Client

```typescript
// src/lib/etsy/client.ts

export class EtsyClient {
  private accessToken: string;
  private shopId: number;

  constructor(accessToken: string, shopId: number) {
    this.accessToken = accessToken;
    this.shopId = shopId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`https://openapi.etsy.com/v3${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'x-api-key': process.env.ETSY_API_KEY!,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status}`);
    }

    return response.json();
  }

  // Shop
  async getShop(): Promise<EtsyShop> {
    return this.request<EtsyShop>(`/application/shops/${this.shopId}`);
  }

  // Listings
  async getListings(params?: {
    state?: 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; results: EtsyListing[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/application/shops/${this.shopId}/listings?${query}`);
  }

  async getListing(listingId: number): Promise<EtsyListing> {
    return this.request<EtsyListing>(`/application/listings/${listingId}`);
  }

  // Receipts (Orders)
  async getReceipts(params?: {
    min_created?: number;
    max_created?: number;
    was_paid?: boolean;
    was_shipped?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; results: EtsyReceipt[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/application/shops/${this.shopId}/receipts?${query}`);
  }

  // Inventory
  async getListingInventory(listingId: number): Promise<any> {
    return this.request(`/application/listings/${listingId}/inventory`);
  }

  async updateListingInventory(
    listingId: number,
    products: { sku: string; offerings: { price: number; quantity: number }[] }[]
  ): Promise<void> {
    await this.request(`/application/listings/${listingId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ products }),
    });
  }
}
```

### Sync Service

```typescript
// src/lib/etsy/sync.ts

export async function syncEtsyData(userId: string, etsyClient: EtsyClient) {
  // Sync shop info
  const shop = await etsyClient.getShop();

  await supabase.from('etsy_shops').upsert({
    user_id: userId,
    shop_id: shop.shop_id,
    shop_name: shop.shop_name,
    currency_code: shop.currency_code,
    review_average: shop.review_average,
    review_count: shop.review_count,
    transaction_sold_count: shop.transaction_sold_count,
    updated_at: new Date().toISOString(),
  });

  // Sync listings
  const { results: listings } = await etsyClient.getListings({
    state: 'active',
    limit: 100,
  });

  for (const listing of listings) {
    await supabase.from('etsy_listings').upsert({
      user_id: userId,
      listing_id: listing.listing_id,
      title: listing.title,
      state: listing.state,
      quantity: listing.quantity,
      price: listing.price.amount / listing.price.divisor,
      currency: listing.price.currency_code,
      views: listing.views,
      num_favorers: listing.num_favorers,
      url: listing.url,
      updated_at: new Date().toISOString(),
    });
  }

  // Sync receipts (orders) - last 30 days
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const { results: receipts } = await etsyClient.getReceipts({
    min_created: thirtyDaysAgo,
    limit: 100,
  });

  for (const receipt of receipts) {
    const totalPrice = receipt.grandtotal.amount / receipt.grandtotal.divisor;

    await supabase.from('etsy_receipts').upsert({
      user_id: userId,
      receipt_id: receipt.receipt_id,
      created_at: new Date(receipt.create_timestamp * 1000).toISOString(),
      is_paid: receipt.is_paid,
      is_shipped: receipt.is_shipped,
      total_price: totalPrice,
      currency: receipt.grandtotal.currency_code,
      buyer_country: receipt.country_iso,
      items_count: receipt.transactions.length,
    });
  }

  return {
    shop: 1,
    listings: listings.length,
    receipts: receipts.length,
  };
}
```

---

## ⚡ Rate Limits

| Tier | Rate Limit |
|------|------------|
| **Open API** | 10 calls/second |
| **Burst** | 20 calls in 1 second (then throttled) |

### Rate Limiter

```typescript
// src/lib/etsy/rate-limiter.ts

export class EtsyRateLimiter {
  private calls: number[] = [];
  private readonly maxCalls = 10;
  private readonly window = 1000; // 1 second

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old calls
    this.calls = this.calls.filter(t => now - t < this.window);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.window - (now - oldestCall);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.calls.push(Date.now());
  }
}
```

---

## 🗄️ Database Schema (Faz 4+)

```sql
-- Etsy connection
CREATE TABLE etsy_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Etsy shops
CREATE TABLE etsy_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL,
  shop_name TEXT,
  currency_code TEXT,
  review_average DECIMAL(3,2),
  review_count INTEGER,
  transaction_sold_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

-- Etsy listings
CREATE TABLE etsy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL,
  title TEXT,
  state TEXT,
  quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  currency TEXT,
  views INTEGER DEFAULT 0,
  num_favorers INTEGER DEFAULT 0,
  url TEXT,
  cogs DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Etsy receipts (orders)
CREATE TABLE etsy_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT false,
  is_shipped BOOLEAN DEFAULT false,
  total_price DECIMAL(10,2),
  currency TEXT,
  buyer_country TEXT,
  items_count INTEGER DEFAULT 0,
  UNIQUE(user_id, receipt_id)
);

-- Daily metrics
CREATE TABLE etsy_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  net_profit DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

---

## 📊 Etsy Fee Structure

| Fee Type | Amount |
|----------|--------|
| **Listing Fee** | $0.20 per listing (4 months) |
| **Transaction Fee** | 6.5% of sale price |
| **Payment Processing** | 3% + $0.25 (Etsy Payments) |
| **Offsite Ads** | 12-15% if sale from ad |
| **Shipping Label** | Varies |

### Fee Calculation

```typescript
export function calculateEtsyFees(salePrice: number, usedOffsiteAd: boolean): EtsyFees {
  const transactionFee = salePrice * 0.065;
  const paymentProcessing = salePrice * 0.03 + 0.25;
  const offsiteAdFee = usedOffsiteAd ? salePrice * 0.12 : 0;

  const totalFees = transactionFee + paymentProcessing + offsiteAdFee;

  return {
    listingFee: 0.20,
    transactionFee,
    paymentProcessing,
    offsiteAdFee,
    totalFees,
    netRevenue: salePrice - totalFees,
  };
}
```

---

## 🔗 İlgili Kaynaklar

- [Etsy Open API](https://www.etsy.com/developers/documentation)
- [API Reference](https://developers.etsy.com/documentation/reference)
- [OAuth Guide](https://developers.etsy.com/documentation/essentials/authentication)
- [Seller Handbook](https://www.etsy.com/seller-handbook)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 4+ (Amazon + Shopify tamamlandıktan sonra)
