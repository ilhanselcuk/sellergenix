# Shopify API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** 2024-01 (Admin API)
**Durum:** 📋 Faz 3'te Entegre Edilecek

---

## 📋 Genel Bakış

Shopify Admin API, mağaza sahiplerinin:
- Ürünleri yönetmesini
- Siparişleri takip etmesini
- Envanteri senkronize etmesini
- Müşteri verilerini analiz etmesini
sağlayan GraphQL ve REST API'dir.

---

## ✅ Neden Shopify İkinci Platform?

```
┌─────────────────────────────────────────────────────────────┐
│  Shopify Avantajları:                                       │
│                                                             │
│  ✅ En kolay OAuth flow (30 saniyede bağlanır)             │
│  ✅ Excellent documentation                                 │
│  ✅ Generous rate limits                                    │
│  ✅ Webhooks native support                                 │
│  ✅ GraphQL + REST seçeneği                                 │
│  ✅ Sandbox/test store oluşturabilirsin                     │
│  ✅ Gelişmiş analytics API                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### OAuth 2.0 Flow

```
┌─────────────────┐     1. Install Request      ┌─────────────┐
│  Store Owner    │ ────────────────────────── │  Shopify    │
│  (Browser)      │                             │  App Store  │
└─────────────────┘                             └──────┬──────┘
                                                       │
                                              2. Redirect to App
                                                       │
                                                       ▼
┌─────────────────┐     3. Authorization        ┌─────────────┐
│  SellerGenix    │ ◄────────────────────────── │  Consent    │
│  /auth/shopify  │                             │  Page       │
└────────┬────────┘                             └─────────────┘
         │
         │ 4. Exchange code for token
         ▼
┌─────────────────┐
│  Shopify OAuth  │ ──► 5. Access Token (permanent!)
│  Token Endpoint │
└─────────────────┘
```

### App Configuration

```env
# .env.local
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx
SHOPIFY_SCOPES=read_products,write_products,read_orders,read_inventory,read_customers,read_analytics

# Per-store (after OAuth)
SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
```

### Required Scopes

| Scope | Açıklama |
|-------|----------|
| `read_products` | Ürün listesi okuma |
| `write_products` | Ürün güncelleme |
| `read_orders` | Sipariş okuma |
| `read_inventory` | Stok okuma |
| `write_inventory` | Stok güncelleme |
| `read_customers` | Müşteri verileri |
| `read_analytics` | Analytics API |
| `read_reports` | Raporlar |

---

## 🔗 API Endpoints

### Base URL
```
https://{store}.myshopify.com/admin/api/2024-01
```

### REST Endpoints

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Products | `/products.json` | GET, POST, PUT, DELETE |
| Orders | `/orders.json` | GET, POST, PUT |
| Inventory | `/inventory_levels.json` | GET, POST |
| Customers | `/customers.json` | GET |
| Reports | `/reports.json` | GET |

### GraphQL Endpoint
```
POST https://{store}.myshopify.com/admin/api/2024-01/graphql.json
```

---

## 💻 Implementation

### OAuth Setup

```typescript
// src/lib/shopify/auth.ts

const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_orders',
  'read_inventory',
  'write_inventory',
  'read_customers',
  'read_analytics',
].join(',');

export function getAuthUrl(shop: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string }> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  return response.json();
}
```

### Shopify Client

```typescript
// src/lib/shopify/client.ts

export class ShopifyClient {
  private shop: string;
  private accessToken: string;
  private apiVersion = '2024-01';

  constructor(shop: string, accessToken: string) {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  private get baseUrl(): string {
    return `https://${this.shop}/admin/api/${this.apiVersion}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    return response.json();
  }

  // Products
  async getProducts(params?: ProductParams): Promise<Product[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ products: Product[] }>(
      `/products.json?${query}`
    );
    return data.products;
  }

  // Orders
  async getOrders(params?: OrderParams): Promise<Order[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ orders: Order[] }>(
      `/orders.json?${query}`
    );
    return data.orders;
  }

  // Inventory
  async getInventoryLevels(locationId: string): Promise<InventoryLevel[]> {
    const data = await this.request<{ inventory_levels: InventoryLevel[] }>(
      `/inventory_levels.json?location_ids=${locationId}`
    );
    return data.inventory_levels;
  }

  // GraphQL
  async graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    return data.data;
  }
}
```

### Data Types

```typescript
// src/lib/shopify/types.ts

export interface Product {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'draft';
  tags: string;
  variants: Variant[];
  images: Image[];
  options: Option[];
}

export interface Variant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: 'deny' | 'continue';
  compare_at_price: string | null;
  inventory_quantity: number;
  inventory_management: 'shopify' | null;
  barcode: string | null;
  weight: number;
  weight_unit: string;
}

export interface Order {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  confirmed: boolean;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  currency: string;
  financial_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'fulfilled' | 'partial' | null;
  line_items: LineItem[];
  shipping_address: Address;
  billing_address: Address;
  customer: Customer;
  refunds: Refund[];
}

export interface LineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  sku: string;
  variant_title: string;
  vendor: string;
  fulfillment_service: string;
  product_id: number;
  price: string;
  total_discount: string;
  fulfillment_status: string | null;
}

export interface InventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  created_at: string;
  tags: string;
}
```

### Sync Services

```typescript
// src/lib/shopify/sync.ts

export async function syncShopifyProducts(
  userId: string,
  shopifyClient: ShopifyClient
): Promise<SyncResult> {
  const products = await shopifyClient.getProducts({ limit: 250 });
  let synced = 0;

  for (const product of products) {
    for (const variant of product.variants) {
      await supabase.from('shopify_products').upsert({
        user_id: userId,
        product_id: product.id.toString(),
        variant_id: variant.id.toString(),
        title: product.title,
        variant_title: variant.title,
        sku: variant.sku,
        price: parseFloat(variant.price),
        inventory_quantity: variant.inventory_quantity,
        image_url: product.images[0]?.src,
        status: product.status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,variant_id',
      });
      synced++;
    }
  }

  return { synced, total: products.length };
}

export async function syncShopifyOrders(
  userId: string,
  shopifyClient: ShopifyClient,
  startDate: Date
): Promise<SyncResult> {
  const orders = await shopifyClient.getOrders({
    created_at_min: startDate.toISOString(),
    status: 'any',
    limit: 250,
  });

  let synced = 0;

  for (const order of orders) {
    // Calculate order metrics
    const revenue = parseFloat(order.total_price);
    const tax = parseFloat(order.total_tax);
    const discounts = parseFloat(order.total_discounts);
    const units = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

    await supabase.from('shopify_orders').upsert({
      user_id: userId,
      order_id: order.id.toString(),
      order_number: order.order_number,
      created_at: order.created_at,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: revenue,
      subtotal_price: parseFloat(order.subtotal_price),
      total_tax: tax,
      total_discounts: discounts,
      currency: order.currency,
      units_sold: units,
      customer_email: order.email,
      shipping_country: order.shipping_address?.country_code,
      shipping_state: order.shipping_address?.province,
    }, {
      onConflict: 'user_id,order_id',
    });

    synced++;
  }

  return { synced, total: orders.length };
}
```

### Analytics Calculations

```typescript
// src/lib/shopify/analytics.ts

export async function calculateShopifyMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ShopifyMetrics> {
  // Get orders for period
  const { data: orders } = await supabase
    .from('shopify_orders')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!orders || orders.length === 0) {
    return getEmptyMetrics();
  }

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalOrders = orders.length;
  const totalUnits = orders.reduce((sum, o) => sum + o.units_sold, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.total_tax, 0);
  const totalDiscounts = orders.reduce((sum, o) => sum + o.total_discounts, 0);

  // Paid orders
  const paidOrders = orders.filter(o => o.financial_status === 'paid');
  const refundedOrders = orders.filter(o =>
    o.financial_status === 'refunded' || o.financial_status === 'partially_refunded'
  );

  // Calculate refunds
  const totalRefunds = refundedOrders.reduce((sum, o) => sum + o.total_price, 0);

  // Fulfillment
  const fulfilledOrders = orders.filter(o => o.fulfillment_status === 'fulfilled');

  return {
    totalRevenue,
    totalOrders,
    totalUnits,
    averageOrderValue: totalRevenue / totalOrders,
    totalTax,
    totalDiscounts,
    totalRefunds,
    refundRate: (refundedOrders.length / totalOrders) * 100,
    fulfillmentRate: (fulfilledOrders.length / totalOrders) * 100,
    // Profit calculation (COGS from user)
    // grossProfit: totalRevenue - cogs,
  };
}
```

---

## 🔔 Webhooks

### Supported Webhooks

| Topic | Açıklama |
|-------|----------|
| `orders/create` | Yeni sipariş |
| `orders/updated` | Sipariş güncellendi |
| `orders/paid` | Sipariş ödendi |
| `orders/fulfilled` | Sipariş kargolandı |
| `orders/cancelled` | Sipariş iptal |
| `products/create` | Yeni ürün |
| `products/update` | Ürün güncellendi |
| `products/delete` | Ürün silindi |
| `inventory_levels/update` | Stok değişti |
| `refunds/create` | İade oluşturuldu |

### Webhook Handler

```typescript
// src/app/api/webhooks/shopify/route.ts

import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
  const topic = request.headers.get('X-Shopify-Topic');
  const shop = request.headers.get('X-Shopify-Shop-Domain');

  // Verify webhook signature
  const hmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(body)
    .digest('base64');

  if (hmac !== hmacHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = JSON.parse(body);

  // Handle different topics
  switch (topic) {
    case 'orders/create':
      await handleOrderCreated(shop!, data);
      break;
    case 'orders/updated':
      await handleOrderUpdated(shop!, data);
      break;
    case 'inventory_levels/update':
      await handleInventoryUpdate(shop!, data);
      break;
    case 'refunds/create':
      await handleRefundCreated(shop!, data);
      break;
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }

  return new Response('OK', { status: 200 });
}

async function handleOrderCreated(shop: string, order: Order) {
  // Find user by shop
  const { data: connection } = await supabase
    .from('shopify_connections')
    .select('user_id')
    .eq('shop_domain', shop)
    .single();

  if (!connection) return;

  // Insert order
  await supabase.from('shopify_orders').insert({
    user_id: connection.user_id,
    order_id: order.id.toString(),
    // ... order data
  });

  // Send WhatsApp notification
  await sendWhatsAppNotification(connection.user_id, 'shopify_new_order', {
    orderNumber: order.order_number,
    total: order.total_price,
    items: order.line_items.length,
  });
}

async function handleInventoryUpdate(shop: string, data: InventoryLevel) {
  // Check for low stock
  const { data: product } = await supabase
    .from('shopify_products')
    .select('*')
    .eq('inventory_item_id', data.inventory_item_id)
    .single();

  if (product && data.available < 10) {
    // Low stock alert
    await sendWhatsAppNotification(product.user_id, 'shopify_low_stock', {
      productName: product.title,
      currentStock: data.available,
    });
  }
}
```

---

## ⚡ Rate Limits

| Plan | REST API | GraphQL |
|------|----------|---------|
| Basic | 2/second | 50 points/second |
| Shopify | 2/second | 100 points/second |
| Advanced | 4/second | 200 points/second |
| Plus | 20/second | 1000 points/second |

### Rate Limit Handler

```typescript
// src/lib/shopify/rate-limiter.ts

export class ShopifyRateLimiter {
  private callCount = 0;
  private lastReset = Date.now();
  private limitPerSecond: number;

  constructor(plan: 'basic' | 'shopify' | 'advanced' | 'plus' = 'basic') {
    const limits = {
      basic: 2,
      shopify: 2,
      advanced: 4,
      plus: 20,
    };
    this.limitPerSecond = limits[plan];
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Reset counter every second
    if (now - this.lastReset >= 1000) {
      this.callCount = 0;
      this.lastReset = now;
    }

    // Wait if limit reached
    if (this.callCount >= this.limitPerSecond) {
      const waitTime = 1000 - (now - this.lastReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.callCount = 0;
      this.lastReset = Date.now();
    }

    this.callCount++;
  }
}
```

---

## 🗄️ Database Schema

```sql
-- Shopify store connection
CREATE TABLE shopify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  shop_name TEXT,
  shop_email TEXT,
  currency TEXT,
  timezone TEXT,
  plan_name TEXT,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_domain)
);

-- Products
CREATE TABLE shopify_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  title TEXT,
  variant_title TEXT,
  sku TEXT,
  barcode TEXT,
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  inventory_quantity INTEGER DEFAULT 0,
  inventory_item_id TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  vendor TEXT,
  product_type TEXT,
  tags TEXT,

  -- User-provided
  cogs DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

-- Orders
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  order_number INTEGER,
  created_at TIMESTAMPTZ,
  financial_status TEXT,
  fulfillment_status TEXT,
  total_price DECIMAL(10,2),
  subtotal_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  total_discounts DECIMAL(10,2),
  currency TEXT,
  units_sold INTEGER DEFAULT 0,
  customer_email TEXT,
  shipping_country TEXT,
  shipping_state TEXT,
  UNIQUE(user_id, order_id)
);

-- Daily metrics
CREATE TABLE shopify_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  total_tax DECIMAL(10,2) DEFAULT 0,
  total_discounts DECIMAL(10,2) DEFAULT 0,
  total_refunds DECIMAL(10,2) DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own Shopify data" ON shopify_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own Shopify data" ON shopify_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own Shopify data" ON shopify_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own Shopify data" ON shopify_daily_metrics FOR ALL USING (auth.uid() = user_id);
```

---

## 📊 Dashboard Widgets

### Shopify Overview Card
```
┌─────────────────────────────────────┐
│  🛍️ Shopify Performance (30D)      │
├─────────────────────────────────────┤
│  Revenue     │  $12,345  │  ↑ 15%  │
│  Orders      │  234      │  ↑ 12%  │
│  AOV         │  $52.76   │  ↑ 3%   │
│  Refund Rate │  2.1%     │  ↓ 0.5% │
└─────────────────────────────────────┘
```

### Cross-Platform Comparison
```
┌───────────────────────────────────────────────────┐
│  📊 Platform Comparison (30D)                     │
├─────────────┬───────────┬───────────┬─────────────┤
│  Platform   │  Revenue  │  Orders   │  AOV        │
├─────────────┼───────────┼───────────┼─────────────┤
│  Amazon     │  $45,678  │  1,234    │  $37.01     │
│  Shopify    │  $12,345  │  234      │  $52.76     │
├─────────────┼───────────┼───────────┼─────────────┤
│  Total      │  $58,023  │  1,468    │  $39.52     │
└─────────────┴───────────┴───────────┴─────────────┘
```

---

## 🔗 İlgili Kaynaklar

- [Shopify Admin API](https://shopify.dev/docs/api/admin-rest)
- [Shopify GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [Webhooks Guide](https://shopify.dev/docs/apps/webhooks)
- [OAuth Guide](https://shopify.dev/docs/apps/auth/oauth)
- [Rate Limits](https://shopify.dev/docs/api/usage/rate-limits)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 3 (Amazon tamamlandıktan sonra)
