# MULTI-PLATFORM ENTEGRASYON STRATEJİSİ

**Son Güncelleme:** 17 Ocak 2026
**Hedef:** Amazon + Walmart + Shopify + Etsy + eBay Entegrasyonu
**Yaklaşım:** API-First + Oxylabs Fallback

---

## 📋 İÇİNDEKİLER

1. [Platform Karşılaştırması](#-platform-karşılaştırması)
2. [Amazon Entegrasyonu](#-amazon-entegrasyonu)
3. [Walmart Entegrasyonu](#-walmart-entegrasyonu)
4. [Shopify Entegrasyonu](#-shopify-entegrasyonu)
5. [Etsy Entegrasyonu](#-etsy-entegrasyonu)
6. [eBay Entegrasyonu](#-ebay-entegrasyonu)
7. [Unified Data Model](#-unified-data-model)
8. [Geliştirme Yol Haritası](#-geliştirme-yol-haritası)
9. [Maliyet Analizi](#-maliyet-analizi)

---

## 📊 PLATFORM KARŞILAŞTIRMASI

### Pazar Büyüklüğü (2025-2026)

| Platform | Aktif Satıcı | Aylık Ziyaretçi | GMV (Yıllık) |
|----------|--------------|-----------------|--------------|
| **Amazon** | 9.7M | 2.7B | $700B+ |
| **Walmart** | 150K+ | 500M+ | $75B+ |
| **eBay** | 18M | 1.3B | $73B |
| **Etsy** | 5.5M | 450M | $13B |
| **Shopify** | 4.8M mağaza | Değişken | $235B+ |

### Entegrasyon Karmaşıklığı

| Platform | API Kalitesi | Onay Süreci | Zorluk | Öncelik |
|----------|--------------|-------------|--------|---------|
| **Amazon SP-API** | ⭐⭐⭐⭐ | 2-5 hafta | Orta | ✅ Faz 1 |
| **Shopify Admin API** | ⭐⭐⭐⭐⭐ | Anında | Kolay | ✅ Faz 1 |
| **Walmart MP API** | ⭐⭐⭐ | 2-4 hafta | Orta | ✅ Faz 2 |
| **Etsy Open API** | ⭐⭐⭐ | 1-2 hafta | Kolay | ✅ Faz 2 |
| **eBay Sell API** | ⭐⭐⭐ | 1-2 hafta | Orta | ✅ Faz 2 |

---

## 🛒 AMAZON ENTEGRASYONU

### Mevcut Durum: ⏳ Kısmi (Rol onayı bekleniyor)

### API Erişimi

| API | Durum | Kullanım |
|-----|-------|----------|
| **Orders API** | ✅ Aktif | Sipariş verileri |
| **Finances API** | ✅ Aktif | Fee'ler, payout'lar |
| **Seller API** | ✅ Aktif | Hesap bilgisi |
| **Listings Items API** | ⏳ Bekleniyor | Ürün detayları |
| **FBA Inventory API** | ⏳ Bekleniyor | Stok seviyeleri |
| **Reports API** | ⏳ Bekleniyor | Detaylı raporlar |

### Çekilecek Veriler

```typescript
interface AmazonData {
  // Ürün Bilgileri
  products: {
    asin: string;
    sku: string;
    title: string;
    price: number;
    fbaStock: number;
    fbmStock: number;
    imageUrl: string;
  }[];

  // Sipariş Verileri
  orders: {
    orderId: string;
    date: Date;
    items: OrderItem[];
    total: number;
    status: string;
    marketplace: string;
  }[];

  // Finansal Veriler
  finances: {
    sales: number;
    refunds: number;
    fees: {
      referral: number;
      fba: number;
      storage: number;
      other: number;
    };
    payout: number;
  };

  // PPC Verileri (Advertising API - Ayrı onay gerekli)
  advertising?: {
    campaigns: Campaign[];
    spend: number;
    sales: number;
    acos: number;
  };
}
```

### Oxylabs Yedek Kullanımı

API onayı beklerken veya ek veri için:

```typescript
// Rakip ürün fiyatları (API'de yok)
const competitorPrice = await oxylabs.getAmazonPricing(competitorAsin);

// BSR takibi (Reports API'de günlük gecikme var)
const realTimeBSR = await oxylabs.getAmazonProduct(asin);

// Yorum analizi (API'de sınırlı)
const reviews = await oxylabs.getAmazonReviews(asin);
```

---

## 🏪 WALMART ENTEGRASYONU

### API Erişimi: Walmart Marketplace API

**Başvuru:** [developer.walmart.com](https://developer.walmart.com/)
**Onay Süresi:** 2-4 hafta
**Gereksinimler:** ABD'de kayıtlı işletme, Tax ID

### API Endpoints

| API | Amaç | Rate Limit |
|-----|------|------------|
| **Items API** | Ürün yönetimi | 100/dakika |
| **Orders API** | Sipariş yönetimi | 100/dakika |
| **Inventory API** | Stok yönetimi | 100/dakika |
| **Prices API** | Fiyat güncelleme | 100/dakika |
| **Reports API** | Performans raporları | 10/dakika |
| **Analytics API** | Satış analitiği | 50/dakika |

### Walmart Analytics API (Yeni 2025)

```typescript
// Satış ve performans verileri
interface WalmartAnalytics {
  // On-Request Reports
  salesReport: {
    date: Date;
    itemId: string;
    revenue: number;
    units: number;
  }[];

  // Seller Performance
  sellerMetrics: {
    orderDefectRate: number;
    cancellationRate: number;
    onTimeDelivery: number;
  };

  // Item Insights
  itemInsights: {
    views: number;
    addToCart: number;
    buyBoxWinRate: number;
  };
}
```

### TypeScript Client

```typescript
// src/lib/walmart.ts

import crypto from 'crypto';

class WalmartClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://marketplace.walmartapis.com/v3';

  constructor() {
    this.clientId = process.env.WALMART_CLIENT_ID!;
    this.clientSecret = process.env.WALMART_CLIENT_SECRET!;
  }

  // Walmart özel imzalama
  private generateSignature(
    consumerId: string,
    timestamp: string,
    keyVersion: string
  ): string {
    const data = `${consumerId}\n${timestamp}\n${keyVersion}\n`;
    return crypto
      .createSign('RSA-SHA256')
      .update(data)
      .sign(this.clientSecret, 'base64');
  }

  async getOrders(createdStartDate: string): Promise<WalmartOrder[]> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(
      this.clientId,
      timestamp,
      '1'
    );

    const response = await fetch(
      `${this.baseUrl}/orders?createdStartDate=${createdStartDate}`,
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': await this.getAccessToken(),
          'WM_QOS.CORRELATION_ID': crypto.randomUUID(),
          'WM_SVC.NAME': 'SellerGenix',
          'Accept': 'application/json'
        }
      }
    );

    return response.json();
  }

  async getInventory(): Promise<WalmartInventory[]> {
    // Inventory API implementation
  }

  async getAnalytics(reportType: string): Promise<any> {
    // Analytics API implementation
  }
}

export const walmart = new WalmartClient();
```

### Oxylabs Yedek (Walmart)

```typescript
// Walmart JS rendering gerektiriyor - Oxylabs ile
const product = await oxylabs.getWalmartProduct(itemId);
// Maliyet: ~$1.30/1K request (JS rendering dahil)
```

---

## 🛍️ SHOPIFY ENTEGRASYONU

### API Erişimi: Shopify Admin API (GraphQL)

**Başvuru:** [partners.shopify.com](https://partners.shopify.com/)
**Onay Süresi:** Anında (OAuth)
**Not:** En kolay entegrasyon!

### Neden Shopify Öncelikli?

1. **Anında erişim** - OAuth ile hemen bağlanabilir
2. **En iyi API dokümantasyonu**
3. **GraphQL desteği** - Esnek sorgular
4. **ShopifyQL** - Gelişmiş analitik sorguları
5. **4.8M+ potansiyel kullanıcı**

### API Capabilities

| Özellik | API | Açıklama |
|---------|-----|----------|
| **Siparişler** | Orders API | Tüm sipariş verileri |
| **Ürünler** | Products API | Ürün yönetimi |
| **Müşteriler** | Customers API | Müşteri verileri |
| **Stok** | Inventory API | Stok seviyeleri |
| **Analitik** | ShopifyQL | SQL-benzeri sorgular |
| **Finansal** | Transactions API | Ödemeler, iadeler |

### GraphQL Sorgusu Örneği

```graphql
# Satış verilerini çek
query GetSalesData($startDate: DateTime!, $endDate: DateTime!) {
  orders(first: 100, query: "created_at:>=$startDate AND created_at:<=$endDate") {
    edges {
      node {
        id
        name
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
        }
        refunds {
          totalRefundedSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }
  }
}
```

### ShopifyQL Analitik Sorgusu

```typescript
// Yeni ShopifyQL API (2025)
const analyticsQuery = `
  FROM sales
  SHOW total_sales, total_orders, average_order_value
  GROUP BY day
  SINCE -30d
  UNTIL today
  ORDER BY day ASC
`;

const result = await shopify.graphql(`
  query {
    shopifyqlQuery(query: "${analyticsQuery}") {
      tableData {
        columns {
          name
          dataType
        }
        rows
      }
    }
  }
`);
```

### TypeScript Client

```typescript
// src/lib/shopify.ts

import { createAdminApiClient } from '@shopify/admin-api-client';

class ShopifyClient {
  private client: ReturnType<typeof createAdminApiClient>;

  constructor(shop: string, accessToken: string) {
    this.client = createAdminApiClient({
      storeDomain: shop,
      apiVersion: '2026-01',
      accessToken
    });
  }

  async getOrders(startDate: Date, endDate: Date) {
    const response = await this.client.request(GET_ORDERS_QUERY, {
      variables: { startDate, endDate }
    });
    return response.data.orders;
  }

  async getSalesAnalytics(days: number = 30) {
    const query = `
      FROM sales
      SHOW total_sales, total_orders, average_order_value
      GROUP BY day
      SINCE -${days}d
      ORDER BY day ASC
    `;

    return await this.client.request(SHOPIFYQL_QUERY, {
      variables: { query }
    });
  }

  async getProductPerformance() {
    const query = `
      FROM products
      SHOW product_title, total_sales, units_sold
      SINCE -30d
      ORDER BY total_sales DESC
      LIMIT 50
    `;

    return await this.client.request(SHOPIFYQL_QUERY, {
      variables: { query }
    });
  }
}

export const createShopifyClient = (shop: string, token: string) =>
  new ShopifyClient(shop, token);
```

### OAuth Flow

```typescript
// src/app/api/auth/shopify/route.ts

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_CLIENT_ID}&` +
    `scope=read_orders,read_products,read_inventory,read_analytics&` +
    `redirect_uri=${process.env.SHOPIFY_REDIRECT_URI}`;

  return NextResponse.redirect(authUrl);
}
```

---

## 🧶 ETSY ENTEGRASYONU

### API Erişimi: Etsy Open API v3

**Başvuru:** [etsy.com/developers](https://www.etsy.com/developers)
**Onay Süresi:** 1-2 hafta (Commercial Access için)
**OAuth:** OAuth 2.0

### API Capabilities

| API | Amaç | Erişim |
|-----|------|--------|
| **Shop API** | Mağaza bilgileri | ✅ Herkes |
| **Listings API** | Ürün listeleri | ✅ Herkes |
| **Receipts API** | Siparişler | ✅ Commercial |
| **Transactions API** | İşlemler | ✅ Commercial |
| **Payments API** | Ödemeler | ✅ Commercial |
| **Reviews API** | Yorumlar | ✅ Herkes |

### Sınırlamalar

⚠️ **Etsy Search Analytics API YOK!**

GitHub'da talep var ama henüz eklenmedi:
- Arama terimleri görünmüyor
- İmpresyon verileri yok
- Dönüşüm oranları sınırlı

**Çözüm:** Oxylabs ile rakip analizi

### TypeScript Client

```typescript
// src/lib/etsy.ts

class EtsyClient {
  private apiKey: string;
  private accessToken: string;
  private baseUrl = 'https://api.etsy.com/v3';

  constructor(apiKey: string, accessToken: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status}`);
    }

    return response.json();
  }

  // Mağaza bilgileri
  async getShop(shopId: string) {
    return this.request(`/application/shops/${shopId}`);
  }

  // Aktif listeler
  async getListings(shopId: string, limit: number = 100) {
    return this.request(
      `/application/shops/${shopId}/listings/active?limit=${limit}`
    );
  }

  // Siparişler (Receipts)
  async getReceipts(shopId: string, minCreated?: number) {
    const params = minCreated ? `?min_created=${minCreated}` : '';
    return this.request(
      `/application/shops/${shopId}/receipts${params}`
    );
  }

  // İşlemler (Transactions)
  async getTransactions(shopId: string, receiptId: string) {
    return this.request(
      `/application/shops/${shopId}/receipts/${receiptId}/transactions`
    );
  }

  // Ödeme hesabı
  async getPaymentAccount(shopId: string) {
    return this.request(
      `/application/shops/${shopId}/payment-account/ledger-entries`
    );
  }
}

export const createEtsyClient = (apiKey: string, token: string) =>
  new EtsyClient(apiKey, token);
```

### Veri Yapısı

```typescript
interface EtsyData {
  shop: {
    shop_id: number;
    shop_name: string;
    title: string;
    currency_code: string;
    num_active_listings: number;
    num_favorers: number;
    review_average: number;
    review_count: number;
  };

  listings: {
    listing_id: number;
    title: string;
    price: { amount: number; currency_code: string };
    quantity: number;
    views: number;
    num_favorers: number;
    state: 'active' | 'inactive' | 'sold_out';
  }[];

  receipts: {
    receipt_id: number;
    buyer_email: string;
    grandtotal: { amount: number };
    create_timestamp: number;
    transactions: {
      title: string;
      quantity: number;
      price: { amount: number };
    }[];
  }[];
}
```

---

## 📦 EBAY ENTEGRASYONU

### API Erişimi: eBay RESTful APIs

**Başvuru:** [developer.ebay.com](https://developer.ebay.com/)
**Onay Süresi:** 1-2 hafta
**OAuth:** OAuth 2.0

### Önemli Değişiklik (2025)

⚠️ **Finding API ve Shopping API kapatıldı!**
- Kapatma tarihi: 5 Şubat 2025
- Yeni API: Browse API (RESTful)

### API Endpoints

| API | Amaç | Erişim |
|-----|------|--------|
| **Sell Inventory API** | Envanter yönetimi | Seller |
| **Sell Fulfillment API** | Sipariş yönetimi | Seller |
| **Sell Finances API** | Finansal veriler | Seller |
| **Sell Analytics API** | Performans metrikleri | Seller |
| **Browse API** | Ürün arama | Herkes |

### Analytics API Detayları

```typescript
// Traffic Report - Kullanıcı trafiği
interface TrafficReport {
  listingId: string;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  uniqueViewers: number;
}

// Customer Service Metrics
interface CustomerServiceMetrics {
  itemNotAsDescribed: {
    rate: number;
    benchmark: number;
  };
  itemNotReceived: {
    rate: number;
    benchmark: number;
  };
}

// Seller Standards Profile
interface SellerStandards {
  sellerLevel: 'TOP_RATED' | 'ABOVE_STANDARD' | 'STANDARD' | 'BELOW_STANDARD';
  defectRate: number;
  lateShipmentRate: number;
  casesWithoutResolution: number;
}
```

### TypeScript Client

```typescript
// src/lib/ebay.ts

class eBayClient {
  private accessToken: string;
  private baseUrl = 'https://api.ebay.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }

  // Aktif listeler
  async getInventoryItems(limit: number = 100) {
    return this.request(
      `/sell/inventory/v1/inventory_item?limit=${limit}`
    );
  }

  // Siparişler
  async getOrders(creationDateFrom: string) {
    return this.request(
      `/sell/fulfillment/v1/order?filter=creationdate:[${creationDateFrom}]`
    );
  }

  // Trafik raporu
  async getTrafficReport(startDate: string, endDate: string) {
    return this.request(
      `/sell/analytics/v1/traffic_report?` +
      `filter=dimension:{listing}&` +
      `metric={CLICK_THROUGH_RATE,IMPRESSION,LISTING_VIEWS_TOTAL}&` +
      `filter=dateRange:{start:${startDate},end:${endDate}}`
    );
  }

  // Müşteri hizmetleri metrikleri
  async getCustomerServiceMetrics() {
    return this.request(
      `/sell/analytics/v1/customer_service_metric?` +
      `customer_service_metric_type=ITEM_NOT_AS_DESCRIBED,ITEM_NOT_RECEIVED`
    );
  }

  // Satıcı standartları
  async getSellerStandards() {
    return this.request('/sell/analytics/v1/seller_standards_profile');
  }

  // Finansal işlemler
  async getTransactions(startDate: string) {
    return this.request(
      `/sell/finances/v1/transaction?` +
      `filter=transactionDate:[${startDate}]`
    );
  }
}

export const createEbayClient = (token: string) => new eBayClient(token);
```

---

## 🗃️ UNIFIED DATA MODEL

### Tüm Platformları Birleştiren Veri Modeli

```typescript
// src/types/unified.ts

// Platform türleri
type Platform = 'amazon' | 'walmart' | 'shopify' | 'etsy' | 'ebay';

// Birleşik Ürün Modeli
interface UnifiedProduct {
  id: string;
  platform: Platform;
  platformId: string; // ASIN, Item ID, etc.

  // Temel bilgiler
  title: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;

  // Stok
  quantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';

  // Performans
  views?: number;
  sales?: number;
  revenue?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Birleşik Sipariş Modeli
interface UnifiedOrder {
  id: string;
  platform: Platform;
  platformOrderId: string;

  // Sipariş bilgileri
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

  // Finansal
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;

  // Ürünler
  items: {
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }[];

  // Müşteri
  customer?: {
    name: string;
    email?: string;
    address?: string;
  };
}

// Birleşik Finansal Model
interface UnifiedFinancials {
  platform: Platform;
  period: { start: Date; end: Date };

  // Gelir
  revenue: {
    gross: number;
    net: number;
    refunds: number;
  };

  // Giderler
  expenses: {
    platformFees: number;
    shipping: number;
    advertising: number;
    other: number;
  };

  // Kar
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
}

// Birleşik Dashboard Metrikleri
interface UnifiedDashboardMetrics {
  // Genel bakış
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;

  // Platform bazlı
  byPlatform: {
    [key in Platform]?: {
      revenue: number;
      orders: number;
      profit: number;
      percentage: number; // Toplam içindeki pay
    };
  };

  // Zaman bazlı
  trend: {
    date: Date;
    revenue: number;
    orders: number;
    profit: number;
  }[];
}
```

### Database Schema

```sql
-- Platformlar
CREATE TABLE platforms (
  id TEXT PRIMARY KEY, -- 'amazon', 'walmart', etc.
  name TEXT NOT NULL,
  api_type TEXT, -- 'official', 'scraping', 'hybrid'
  is_active BOOLEAN DEFAULT true
);

-- Platform bağlantıları (her kullanıcı için)
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  platform_id TEXT REFERENCES platforms(id),

  -- Credentials (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific IDs
  seller_id TEXT, -- Amazon Seller ID, Walmart Seller ID, etc.
  shop_id TEXT, -- Shopify shop, Etsy shop ID, etc.

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'error'
  last_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform_id)
);

-- Birleşik ürünler
CREATE TABLE unified_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  platform_id TEXT REFERENCES platforms(id),
  platform_product_id TEXT, -- ASIN, Item ID, etc.

  title TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  quantity INTEGER DEFAULT 0,

  -- Kullanıcı girişi
  cogs DECIMAL(10,2), -- Cost of Goods Sold

  -- Computed
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform_id, platform_product_id)
);

-- Birleşik siparişler
CREATE TABLE unified_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  platform_id TEXT REFERENCES platforms(id),
  platform_order_id TEXT,

  order_date TIMESTAMPTZ,
  status TEXT,

  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  items JSONB, -- Order items array
  customer JSONB, -- Customer info

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform_id, platform_order_id)
);

-- Günlük metrikler (her platform için)
CREATE TABLE unified_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  platform_id TEXT REFERENCES platforms(id),
  date DATE,

  revenue DECIMAL(10,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  units INTEGER DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  fees DECIMAL(10,2) DEFAULT 0,
  ad_spend DECIMAL(10,2) DEFAULT 0,

  gross_profit DECIMAL(10,2),
  net_profit DECIMAL(10,2),

  UNIQUE(user_id, platform_id, date)
);
```

---

## 🗺️ GELİŞTİRME YOL HARİTASI

### Faz 1: Temel Altyapı (Hafta 1-2)

| Görev | Süre | Öncelik |
|-------|------|---------|
| Unified data model oluştur | 2 gün | 🔴 Kritik |
| Database migration | 1 gün | 🔴 Kritik |
| Platform client base class | 1 gün | 🔴 Kritik |
| Amazon OAuth tamamla | 2 gün | 🔴 Kritik |
| Shopify OAuth entegrasyonu | 2 gün | 🟡 Yüksek |

### Faz 2: Amazon + Shopify (Hafta 3-4)

| Görev | Süre | Öncelik |
|-------|------|---------|
| Amazon data sync servisi | 3 gün | 🔴 Kritik |
| Shopify data sync servisi | 2 gün | 🟡 Yüksek |
| Unified dashboard görünümü | 3 gün | 🟡 Yüksek |
| Platform switcher UI | 1 gün | 🟡 Yüksek |

### Faz 3: Walmart + eBay (Hafta 5-6)

| Görev | Süre | Öncelik |
|-------|------|---------|
| Walmart API başvurusu | - | 🟡 Yüksek |
| eBay API başvurusu | - | 🟡 Yüksek |
| Walmart client | 2 gün | 🟡 Yüksek |
| eBay client | 2 gün | 🟡 Yüksek |
| Oxylabs fallback | 2 gün | 🟢 Orta |

### Faz 4: Etsy + Oxylabs (Hafta 7-8)

| Görev | Süre | Öncelik |
|-------|------|---------|
| Etsy API başvurusu | - | 🟢 Orta |
| Etsy client | 2 gün | 🟢 Orta |
| Oxylabs competitor tracking | 3 gün | 🟢 Orta |
| Cross-platform analytics | 3 gün | 🟢 Orta |

### Faz 5: AI + WhatsApp (Hafta 9-10)

| Görev | Süre | Öncelik |
|-------|------|---------|
| AI Chat entegrasyonu | 5 gün | 🔴 Kritik |
| WhatsApp bildirimler | 3 gün | 🟡 Yüksek |
| Multi-platform AI queries | 2 gün | 🟡 Yüksek |

---

## 💰 MALİYET ANALİZİ

### API Maliyetleri

| Platform | Aylık Maliyet | Notlar |
|----------|---------------|--------|
| **Amazon SP-API** | $0 | Ücretsiz |
| **Shopify Admin API** | $0 | Ücretsiz |
| **Walmart MP API** | $0 | Ücretsiz |
| **Etsy Open API** | $0 | Ücretsiz |
| **eBay Sell API** | $0 | Ücretsiz |
| **Oxylabs** | $49-249 | Scraping için |

### Toplam Aylık Maliyet (Tahmini)

| Kalem | MVP (100 user) | Growth (1K user) | Scale (10K user) |
|-------|----------------|------------------|------------------|
| **Oxylabs** | $49 | $249 | $999 |
| **Twilio (WhatsApp)** | $100 | $1,000 | $10,000 |
| **Claude API** | $500 | $2,000 | $10,000 |
| **Supabase** | $25 | $100 | $500 |
| **Vercel** | $20 | $100 | $500 |
| **TOPLAM** | ~$700/ay | ~$3,500/ay | ~$22,000/ay |

### Kullanıcı Başına Maliyet

| Ölçek | Maliyet/Kullanıcı/Ay |
|-------|----------------------|
| MVP | $7.00 |
| Growth | $3.50 |
| Scale | $2.20 |

### Karlılık Analizi

| Plan | Fiyat | Maliyet | Brüt Kar | Margin |
|------|-------|---------|----------|--------|
| Starter ($19) | $19 | $7 | $12 | 63% |
| Pro ($39) | $39 | $3.50 | $35.50 | 91% |
| Business ($79) | $79 | $2.20 | $76.80 | 97% |

---

## ✅ SONRAKI ADIMLAR

### Hemen Yapılacaklar

1. [ ] Unified data model TypeScript types oluştur
2. [ ] Database migration dosyası hazırla
3. [ ] Amazon OAuth'u tamamla (rol onayı bekle)
4. [ ] Shopify Partner hesabı oluştur
5. [ ] Shopify OAuth entegrasyonuna başla

### Bu Hafta

1. [ ] Walmart Marketplace başvurusu
2. [ ] eBay Developer başvurusu
3. [ ] Etsy Developer başvurusu
4. [ ] Oxylabs credentials'ı env'e ekle
5. [ ] İlk Oxylabs test scrape

### Bu Ay

1. [ ] Tüm platform OAuth'ları tamamla
2. [ ] Unified dashboard MVP
3. [ ] AI Chat prototipi
4. [ ] WhatsApp bildirim sistemi

---

## 🔗 FAYDALI LİNKLER

### API Dokümantasyonları

- [Amazon SP-API](https://developer-docs.amazon.com/sp-api/)
- [Walmart Marketplace API](https://developer.walmart.com/)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Etsy Open API](https://developers.etsy.com/documentation/)
- [eBay Sell APIs](https://developer.ebay.com/api-docs/sell/static/selling-ig-landing.html)

### Oxylabs

- [E-Commerce Scraper](https://oxylabs.io/products/scraper-api/ecommerce)
- [Documentation](https://developers.oxylabs.io/)

---

**Not:** Bu strateji belgesi SellerGenix projesi için hazırlanmıştır. Güncellemeler için Claude'a danışın.
