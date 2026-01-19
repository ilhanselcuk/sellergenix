# Walmart Marketplace API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** v3
**Durum:** 📅 Faz 4+ (Planlanacak)

---

## 📋 Genel Bakış

Walmart Marketplace API, satıcıların:
- Ürünleri yönetmesini
- Siparişleri işlemesini
- Envanteri takip etmesini
- Fiyatlandırmayı optimize etmesini
sağlayan RESTful API.

---

## ⚠️ Neden Faz 4+?

```
┌─────────────────────────────────────────────────────────────┐
│  Walmart API Zorlukları:                                    │
│                                                             │
│  ❌ Seller onboarding zor (US-based LLC required)          │
│  ❌ API başvurusu 2-4 hafta                                 │
│  ❌ Karmaşık authentication (RSA key pair)                  │
│  ❌ Rate limits agresif                                      │
│  ❌ Documentation Amazon kadar iyi değil                    │
│                                                             │
│  ✅ Ancak: 2. en büyük ABD marketplace                     │
│  ✅ Daha az rekabet, daha yüksek margin potansiyeli        │
│  ✅ Amazon satıcıları için doğal genişleme                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### Key-Based Auth (RSA)

```
Walmart API = RSA Key Pair + Consumer ID + Channel Type
```

### Credentials

```env
# .env.local (Faz 4+)
WALMART_CLIENT_ID=xxxxx
WALMART_CLIENT_SECRET=xxxxx
WALMART_CONSUMER_ID=xxxxx
WALMART_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
```

### Token Generation

```typescript
// src/lib/walmart/auth.ts

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface WalmartAuthHeaders {
  'WM_SEC.ACCESS_TOKEN': string;
  'WM_CONSUMER.CHANNEL.TYPE': string;
  'WM_QOS.CORRELATION_ID': string;
  'WM_SVC.NAME': string;
}

export async function getWalmartAuthHeaders(): Promise<WalmartAuthHeaders> {
  const timestamp = Date.now().toString();
  const correlationId = uuidv4();

  // Generate signature
  const stringToSign = `${process.env.WALMART_CONSUMER_ID}\n${timestamp}\n${correlationId}\n`;

  const signature = crypto.sign(
    'RSA-SHA256',
    Buffer.from(stringToSign),
    process.env.WALMART_PRIVATE_KEY!
  ).toString('base64');

  // Get access token
  const tokenResponse = await fetch(
    'https://marketplace.walmartapis.com/v3/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'WM_SVC.NAME': 'SellerGenix',
        'WM_QOS.CORRELATION_ID': correlationId,
        'WM_CONSUMER.ID': process.env.WALMART_CONSUMER_ID!,
        'WM_SEC.AUTH_SIGNATURE': signature,
        'WM_CONSUMER.INTIMESTAMP': timestamp,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  return {
    'WM_SEC.ACCESS_TOKEN': tokenData.access_token,
    'WM_CONSUMER.CHANNEL.TYPE': 'SWAGGER_CHANNEL_TYPE',
    'WM_QOS.CORRELATION_ID': correlationId,
    'WM_SVC.NAME': 'SellerGenix',
  };
}
```

---

## 🌍 API Endpoints

### Base URL
```
https://marketplace.walmartapis.com
```

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/orders` | GET | List orders |
| `/v3/orders/{purchaseOrderId}` | GET | Get single order |
| `/v3/orders/{purchaseOrderId}/shipping` | POST | Ship order |
| `/v3/items` | GET | List items |
| `/v3/items/{sku}` | GET | Get item |
| `/v3/inventory` | GET | Get inventory |
| `/v3/prices` | PUT | Update prices |
| `/v3/feeds` | POST | Bulk operations |

---

## 📊 Data Structures

### Order

```typescript
interface WalmartOrder {
  purchaseOrderId: string;
  customerOrderId: string;
  orderDate: string;
  shippingInfo: {
    phone: string;
    estimatedDeliveryDate: string;
    estimatedShipDate: string;
    methodCode: string;
    postalAddress: {
      name: string;
      address1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  orderLines: {
    lineNumber: string;
    item: {
      productName: string;
      sku: string;
    };
    charges: {
      chargeType: string;
      chargeAmount: {
        currency: string;
        amount: number;
      };
    }[];
    orderLineQuantity: {
      unitOfMeasurement: string;
      amount: string;
    };
    statusDate: string;
    orderLineStatuses: {
      status: string;
      statusQuantity: {
        unitOfMeasurement: string;
        amount: string;
      };
    }[];
  }[];
}
```

### Item

```typescript
interface WalmartItem {
  mart: string;
  sku: string;
  wpid: string;
  upc: string;
  productName: string;
  shelf: string;
  productType: string;
  price: {
    currency: string;
    amount: number;
  };
  publishedStatus: string;
  lifecycleStatus: string;
}
```

### Inventory

```typescript
interface WalmartInventory {
  sku: string;
  quantity: {
    unit: string;
    amount: number;
  };
  fulfillmentLagTime: number;
}
```

---

## 💻 Implementation (Faz 4+)

### Walmart Client

```typescript
// src/lib/walmart/client.ts

export class WalmartClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await getWalmartAuthHeaders();

    const response = await fetch(
      `https://marketplace.walmartapis.com${endpoint}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers,
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.description || 'Walmart API error');
    }

    return response.json();
  }

  // Orders
  async getOrders(params?: {
    createdStartDate?: string;
    createdEndDate?: string;
    limit?: number;
  }): Promise<WalmartOrder[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ list: { elements: { order: WalmartOrder[] } } }>(
      `/v3/orders?${query}`
    );
    return data.list.elements.order;
  }

  // Items
  async getItems(params?: {
    limit?: number;
    offset?: number;
  }): Promise<WalmartItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ ItemResponse: WalmartItem[] }>(
      `/v3/items?${query}`
    );
    return data.ItemResponse;
  }

  // Inventory
  async getInventory(sku: string): Promise<WalmartInventory> {
    return this.request<WalmartInventory>(`/v3/inventory?sku=${sku}`);
  }

  async updateInventory(sku: string, quantity: number): Promise<void> {
    await this.request('/v3/inventory', {
      method: 'PUT',
      body: JSON.stringify({
        sku,
        quantity: {
          unit: 'EACH',
          amount: quantity,
        },
      }),
    });
  }

  // Prices
  async updatePrice(sku: string, price: number, currency = 'USD'): Promise<void> {
    await this.request('/v3/prices', {
      method: 'PUT',
      body: JSON.stringify({
        sku,
        pricing: [{
          currentPriceType: 'BASE',
          currentPrice: {
            currency,
            amount: price,
          },
        }],
      }),
    });
  }
}
```

---

## ⚡ Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| Orders | 20 calls/minute |
| Items | 20 calls/minute |
| Inventory | 20 calls/minute |
| Prices | 20 calls/minute |
| Feeds | 5 calls/minute |

---

## 🗄️ Database Schema (Faz 4+)

```sql
-- Walmart connection
CREATE TABLE walmart_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consumer_id TEXT NOT NULL,
  private_key TEXT NOT NULL,  -- Encrypted
  seller_id TEXT,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Walmart items
CREATE TABLE walmart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  wpid TEXT,
  upc TEXT,
  product_name TEXT,
  price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  status TEXT,
  cogs DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sku)
);

-- Walmart orders
CREATE TABLE walmart_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_order_id TEXT NOT NULL,
  customer_order_id TEXT,
  order_date TIMESTAMPTZ,
  status TEXT,
  total_amount DECIMAL(10,2),
  shipping_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, purchase_order_id)
);

-- Daily metrics
CREATE TABLE walmart_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

---

## 📊 Walmart vs Amazon Karşılaştırma

| Özellik | Amazon | Walmart |
|---------|--------|---------|
| **Seller Count** | 2M+ | 150K+ |
| **Competition** | Yüksek | Düşük |
| **Fees** | 8-15% referral | 6-15% referral |
| **Fulfillment** | FBA | WFS (Walmart Fulfillment Services) |
| **API Complexity** | Orta | Yüksek |
| **Documentation** | Excellent | Good |
| **Customer Trust** | #1 | #2 |

---

## 🔗 İlgili Kaynaklar

- [Walmart Developer Portal](https://developer.walmart.com/)
- [Marketplace API Docs](https://developer.walmart.com/api/us/mp/)
- [Authentication Guide](https://developer.walmart.com/api/us/mp/auth)
- [Seller Center](https://seller.walmart.com/)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 4+ (Amazon + Shopify tamamlandıktan sonra)
