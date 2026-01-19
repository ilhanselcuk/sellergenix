# OXYLABS - Kapsamlı Entegrasyon Rehberi

**Son Güncelleme:** 17 Ocak 2026
**Üyelik Durumu:** ✅ Aktif
**Kullanım Amacı:** E-commerce veri scraping (Amazon, Walmart, eBay, Etsy ve diğerleri)

---

## 📋 İÇİNDEKİLER

1. [Oxylabs Nedir?](#-oxylabs-nedir)
2. [Desteklenen Platformlar](#-desteklenen-platformlar)
3. [API Türleri](#-api-türleri)
4. [Fiyatlandırma](#-fiyatlandırma)
5. [Çekilebilecek Veri Türleri](#-çekilebilecek-veri-türleri)
6. [Teknik Entegrasyon](#-teknik-entegrasyon)
7. [SellerGenix İçin Kullanım Senaryoları](#-sellergenix-için-kullanım-senaryoları)
8. [Rate Limits ve Best Practices](#-rate-limits-ve-best-practices)
9. [Maliyet Optimizasyonu](#-maliyet-optimizasyonu)

---

## 🎯 OXYLABS NEDİR?

Oxylabs, dünya çapında en büyük web scraping ve proxy hizmet sağlayıcılarından biridir. E-commerce platformlarından veri çekmek için AI/ML destekli araçlar sunar.

### Temel Özellikler:
- **195 ülkede premium proxy havuzu**
- **ML-driven proxy seçimi ve rotasyonu**
- **Otomatik CAPTCHA bypass**
- **Headless browser (JavaScript rendering)**
- **%99.9 uptime garantisi**
- **OxyCopilot** - AI destekli kod oluşturucu

### Neden Oxylabs?

| Özellik | Açıklama |
|---------|----------|
| **Güvenilirlik** | %100 başarı oranı (başarısız istekler ücretlendirilmez) |
| **Hız** | Ortalama 5.38 saniye response time |
| **Ölçeklenebilirlik** | Saniyede 50+ request |
| **Yasal Uyumluluk** | GDPR uyumlu, sadece public data |

---

## 🌍 DESTEKLENEN PLATFORMLAR

### E-Commerce Platformları (50+)

#### 🛒 Öncelikli Hedefler (SellerGenix için)

| Platform | Scraping Kolaylığı | JS Gerekli mi? | Maliyet/1K |
|----------|-------------------|----------------|------------|
| **Amazon** | ⭐⭐⭐⭐⭐ | Hayır | $0.40-0.50 |
| **Walmart** | ⭐⭐⭐⭐ | Evet | $1.25-1.35 |
| **eBay** | ⭐⭐⭐⭐ | Hayır | $1.10-1.15 |
| **Etsy** | ⭐⭐⭐⭐ | Hayır | $1.10-1.15 |

#### 🛍️ Diğer Desteklenen Platformlar

- **ABD:** Target, Best Buy, Home Depot, Lowe's, Costco, Wayfair, Newegg, Chewy
- **Global:** Alibaba, AliExpress, Flipkart, Lazada, Mercadolibre
- **Özel:** Google Shopping, Google Trends

---

## 🔧 API TÜRLERİ

### 1. Web Scraper API (Genel Amaçlı)

```
Herhangi bir web sitesinden veri çekme
```

**Özellikler:**
- Universal scraper (her site)
- Custom parsing (XPath, CSS selectors)
- JavaScript rendering
- Screenshot alma (PNG)
- Markdown output (LLM için)

### 2. E-Commerce Scraper API (Özel)

```
Amazon, Walmart, eBay için optimize edilmiş
```

**Amazon Kaynakları:**
| Source | Açıklama |
|--------|----------|
| `amazon_product` | Ürün detayları |
| `amazon_search` | Arama sonuçları |
| `amazon_pricing` | Fiyat bilgileri |
| `amazon_bestsellers` | En çok satanlar |
| `amazon_sellers` | Satıcı bilgileri |
| `amazon_questions` | Soru-Cevap |
| `amazon_reviews` | Ürün yorumları |

**Walmart Kaynakları:**
| Source | Açıklama |
|--------|----------|
| `walmart_product` | Ürün detayları |
| `walmart_search` | Arama sonuçları |
| `walmart_pricing` | Fiyat bilgileri |

### 3. SERP API (Arama Motoru)

```
Google, Bing, Yahoo arama sonuçları
```

---

## 💰 FİYATLANDIRMA

### Planlar

| Plan | Aylık Ücret | Sonuç Limiti | Rate Limit |
|------|-------------|--------------|------------|
| **Free Trial** | $0 | 2,000 | 10 req/s |
| **Micro** | $49 | 98,000 | 50 req/s |
| **Starter** | $99 | 220,000 | 50 req/s |
| **Advanced** | $249 | 622,500 | 50 req/s |
| **Venture** | $499 | 1,250,000 | 50 req/s |
| **Business** | $999 | 2,500,000 | 100 req/s |
| **Corporate** | $2,000+ | Custom | Custom |

### Sonuç Başına Maliyet

| Platform | JS Yok | JS Rendering |
|----------|--------|--------------|
| **Amazon** | $0.40-0.50/1K | $1.25-1.35/1K |
| **Google** | $0.80-1.00/1K | N/A |
| **Diğerleri** | $0.95-1.15/1K | $1.25-1.35/1K |

### SellerGenix İçin Tahmini Maliyet

| Senaryo | Kullanıcı Sayısı | Aylık Request | Tahmini Maliyet |
|---------|------------------|---------------|-----------------|
| **MVP** | 100 | ~50,000 | $49 (Micro) |
| **Growth** | 1,000 | ~500,000 | $249 (Advanced) |
| **Scale** | 10,000 | ~2,500,000 | $999 (Business) |

---

## 📊 ÇEKİLEBİLECEK VERİ TÜRLERİ

### Amazon Veri Yapısı

```json
{
  "asin": "B08XYZ123",
  "title": "Premium Yoga Mat",
  "price": 29.99,
  "currency": "USD",
  "rating": 4.7,
  "reviews_count": 1234,
  "seller": {
    "name": "YogaBrand",
    "seller_id": "A1234567890"
  },
  "buy_box_winner": true,
  "prime_eligible": true,
  "stock_status": "In Stock",
  "category": "Sports & Outdoors",
  "bsr": {
    "rank": 1234,
    "category": "Yoga Mats"
  },
  "images": ["url1", "url2"],
  "features": ["Feature 1", "Feature 2"],
  "description": "...",
  "variants": [
    {"color": "Black", "price": 29.99},
    {"color": "Blue", "price": 31.99}
  ]
}
```

### Walmart Veri Yapısı

```json
{
  "item_id": "123456789",
  "title": "Wireless Headphones",
  "price": 49.99,
  "was_price": 69.99,
  "seller": "Walmart.com",
  "fulfillment": "Shipped & Sold by Walmart",
  "rating": 4.5,
  "reviews_count": 567,
  "stock_status": "In Stock",
  "pickup_available": true,
  "delivery_date": "Jan 20, 2026"
}
```

### eBay Veri Yapısı

```json
{
  "item_id": "123456789012",
  "title": "Vintage Watch",
  "price": 199.99,
  "bid_count": 5,
  "time_left": "2d 5h",
  "seller": {
    "name": "vintage_seller",
    "feedback_score": 99.8,
    "feedback_count": 1234
  },
  "condition": "Pre-Owned",
  "shipping": "Free",
  "location": "New York, USA",
  "watchers": 45
}
```

---

## 🔌 TEKNİK ENTEGRASYON

### 1. Temel API İsteği (cURL)

```bash
curl -X POST 'https://realtime.oxylabs.io/v1/queries' \
  -u 'USERNAME:PASSWORD' \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "amazon_product",
    "domain": "com",
    "query": "B08XYZ123",
    "parse": true
  }'
```

### 2. TypeScript/Node.js Entegrasyonu

```typescript
// src/lib/oxylabs.ts

interface OxylabsConfig {
  username: string;
  password: string;
  baseUrl: string;
}

interface AmazonProductRequest {
  source: 'amazon_product';
  domain: string;
  query: string; // ASIN
  parse: boolean;
}

interface WalmartProductRequest {
  source: 'walmart_product';
  query: string; // Item ID or URL
  parse: boolean;
}

class OxylabsClient {
  private config: OxylabsConfig;

  constructor() {
    this.config = {
      username: process.env.OXYLABS_USERNAME!,
      password: process.env.OXYLABS_PASSWORD!,
      baseUrl: 'https://realtime.oxylabs.io/v1/queries'
    };
  }

  private async makeRequest<T>(payload: object): Promise<T> {
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString('base64');

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Oxylabs error: ${response.status}`);
    }

    return response.json();
  }

  // Amazon ürün bilgisi çek
  async getAmazonProduct(asin: string, domain: string = 'com') {
    return this.makeRequest({
      source: 'amazon_product',
      domain,
      query: asin,
      parse: true
    });
  }

  // Amazon arama sonuçları
  async searchAmazon(keyword: string, domain: string = 'com', pages: number = 1) {
    return this.makeRequest({
      source: 'amazon_search',
      domain,
      query: keyword,
      parse: true,
      start_page: 1,
      pages
    });
  }

  // Amazon fiyat bilgisi
  async getAmazonPricing(asin: string, domain: string = 'com') {
    return this.makeRequest({
      source: 'amazon_pricing',
      domain,
      query: asin,
      parse: true
    });
  }

  // Walmart ürün bilgisi
  async getWalmartProduct(itemId: string) {
    return this.makeRequest({
      source: 'walmart_product',
      query: itemId,
      parse: true
    });
  }

  // eBay ürün bilgisi
  async getEbayProduct(itemUrl: string) {
    return this.makeRequest({
      source: 'universal_ecommerce',
      url: itemUrl,
      parse: true
    });
  }

  // Toplu istek (Batch)
  async batchRequest(requests: object[]) {
    return this.makeRequest({
      queries: requests
    });
  }
}

export const oxylabs = new OxylabsClient();
```

### 3. Batch İşleme (Toplu İstek)

```typescript
// Birden fazla ASIN için toplu istek
async function batchGetProducts(asins: string[]) {
  const requests = asins.map(asin => ({
    source: 'amazon_product',
    domain: 'com',
    query: asin,
    parse: true
  }));

  const response = await oxylabs.batchRequest(requests);
  return response.results;
}

// Kullanım
const asins = ['B08XYZ123', 'B09ABC456', 'B07DEF789'];
const products = await batchGetProducts(asins);
```

### 4. Zamanlanmış Scraping (Scheduler)

```typescript
// Oxylabs Scheduler API kullanımı
async function scheduleRecurringScrape(asins: string[]) {
  const payload = {
    source: 'amazon_product',
    domain: 'com',
    queries: asins,
    parse: true,
    // Scheduler ayarları
    schedule: {
      frequency: 'daily', // daily, weekly, hourly
      time: '06:00', // UTC
      timezone: 'America/New_York'
    },
    // Sonuçları nereye gönder
    callback_url: 'https://sellergenix.io/api/webhooks/oxylabs',
    // Veya cloud storage
    storage: {
      type: 's3',
      bucket: 'sellergenix-scrape-results',
      region: 'us-east-1'
    }
  };

  return await oxylabs.scheduleJob(payload);
}
```

### 5. Webhook Handler

```typescript
// src/app/api/webhooks/oxylabs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const data = await request.json();

  // Oxylabs'tan gelen veriyi işle
  const { job_id, results, status } = data;

  if (status === 'done') {
    // Sonuçları veritabanına kaydet
    for (const result of results) {
      const product = result.content;

      await supabase
        .from('competitor_data')
        .upsert({
          asin: product.asin,
          title: product.title,
          price: product.price,
          rating: product.rating,
          reviews_count: product.reviews_count,
          bsr: product.bsr?.rank,
          scraped_at: new Date().toISOString()
        }, {
          onConflict: 'asin'
        });
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 🎯 SELLERGENIX İÇİN KULLANIM SENARYOLARI

### 1. Rakip Fiyat Takibi

```typescript
// Her gün rakip fiyatlarını kontrol et
async function trackCompetitorPrices(userId: string) {
  // Kullanıcının takip ettiği rakipleri al
  const { data: competitors } = await supabase
    .from('competitor_tracking')
    .select('competitor_asin')
    .eq('user_id', userId);

  const asins = competitors.map(c => c.competitor_asin);

  // Oxylabs'tan fiyatları çek
  const prices = await oxylabs.batchGetPricing(asins);

  // Fiyat değişikliği varsa bildir
  for (const price of prices) {
    const previous = await getPreviousPrice(price.asin);

    if (price.current !== previous) {
      await sendPriceAlert(userId, {
        asin: price.asin,
        oldPrice: previous,
        newPrice: price.current,
        change: ((price.current - previous) / previous * 100).toFixed(1)
      });
    }
  }
}
```

### 2. BSR (Best Seller Rank) Takibi

```typescript
// BSR değişikliklerini izle
async function trackBSRChanges(asins: string[]) {
  const products = await oxylabs.batchGetProducts(asins);

  for (const product of products) {
    await supabase
      .from('bsr_history')
      .insert({
        asin: product.asin,
        bsr: product.bsr.rank,
        category: product.bsr.category,
        recorded_at: new Date().toISOString()
      });
  }
}
```

### 3. Yorum/Review Analizi

```typescript
// Yeni yorumları çek ve AI ile analiz et
async function analyzeNewReviews(asin: string) {
  const reviews = await oxylabs.getAmazonReviews(asin);

  // AI ile sentiment analizi
  const analyzed = await analyzeWithAI(reviews, {
    task: 'sentiment_analysis',
    categories: ['product_quality', 'shipping', 'customer_service']
  });

  return {
    positiveCount: analyzed.filter(r => r.sentiment > 0.5).length,
    negativeCount: analyzed.filter(r => r.sentiment < -0.5).length,
    commonComplaints: analyzed.topNegativeThemes,
    commonPraises: analyzed.topPositiveThemes
  };
}
```

### 4. Stok Durumu Takibi

```typescript
// Rakip stok durumunu kontrol et
async function checkCompetitorStock(asins: string[]) {
  const products = await oxylabs.batchGetProducts(asins);

  const outOfStock = products.filter(p =>
    p.stock_status === 'Out of Stock' ||
    !p.buy_box_winner
  );

  if (outOfStock.length > 0) {
    // Fırsat! Rakip stoğu bitti
    await sendOpportunityAlert({
      type: 'competitor_out_of_stock',
      products: outOfStock.map(p => ({
        asin: p.asin,
        title: p.title
      }))
    });
  }
}
```

### 5. Keyword Araştırma

```typescript
// Anahtar kelime performansını analiz et
async function keywordResearch(keyword: string) {
  const searchResults = await oxylabs.searchAmazon(keyword, 'com', 3);

  // İlk 3 sayfadaki ürünleri analiz et
  const analysis = {
    totalResults: searchResults.total_results,
    avgPrice: calculateAverage(searchResults.products, 'price'),
    avgRating: calculateAverage(searchResults.products, 'rating'),
    avgReviews: calculateAverage(searchResults.products, 'reviews_count'),
    topBrands: getTopBrands(searchResults.products),
    priceRange: {
      min: Math.min(...searchResults.products.map(p => p.price)),
      max: Math.max(...searchResults.products.map(p => p.price))
    }
  };

  return analysis;
}
```

---

## ⚡ RATE LIMITS VE BEST PRACTICES

### Rate Limits

| Plan | Request/Saniye | Concurrent Jobs |
|------|----------------|-----------------|
| Micro | 50 | 100 |
| Starter | 50 | 200 |
| Advanced | 50 | 500 |
| Business | 100 | 1000 |

### Best Practices

#### 1. Request Optimizasyonu

```typescript
// ❌ YANLIŞ: Her ASIN için ayrı istek
for (const asin of asins) {
  await oxylabs.getProduct(asin); // 100 ASIN = 100 istek
}

// ✅ DOĞRU: Batch request kullan
await oxylabs.batchRequest(asins); // 100 ASIN = 1 istek
```

#### 2. Caching Stratejisi

```typescript
// Redis ile cache
async function getProductWithCache(asin: string) {
  const cacheKey = `oxylabs:product:${asin}`;

  // Önce cache'e bak
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache'te yoksa Oxylabs'tan çek
  const product = await oxylabs.getAmazonProduct(asin);

  // 1 saat cache'le
  await redis.setex(cacheKey, 3600, JSON.stringify(product));

  return product;
}
```

#### 3. Error Handling

```typescript
async function scrapeWithRetry(asin: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await oxylabs.getAmazonProduct(asin);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

#### 4. Paralel İşleme

```typescript
// Büyük veri setleri için chunk'lara böl
async function scrapeInChunks(asins: string[], chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < asins.length; i += chunkSize) {
    chunks.push(asins.slice(i, i + chunkSize));
  }

  const results = [];
  for (const chunk of chunks) {
    const chunkResults = await oxylabs.batchRequest(chunk);
    results.push(...chunkResults);

    // Rate limit'e takılmamak için bekle
    await sleep(1000);
  }

  return results;
}
```

---

## 💡 MALİYET OPTİMİZASYONU

### 1. JS Rendering'den Kaçın (Mümkünse)

| Platform | JS Gerekli mi? | Maliyet Farkı |
|----------|----------------|---------------|
| Amazon | ❌ Hayır | $0.50 vs $1.35 (%63 tasarruf) |
| eBay | ❌ Hayır | $1.15 vs $1.35 (%15 tasarruf) |
| Walmart | ✅ Evet | JS zorunlu |

### 2. Akıllı Scraping Zamanlaması

```typescript
// Sadece değişen verileri çek
async function smartScrape(asin: string) {
  const lastScrape = await getLastScrapeTime(asin);
  const hoursSinceLastScrape = getHoursDiff(lastScrape, new Date());

  // 24 saatten yeniyse skip
  if (hoursSinceLastScrape < 24) {
    return getCachedData(asin);
  }

  // Aksi halde taze veri çek
  return await oxylabs.getAmazonProduct(asin);
}
```

### 3. Kullanıcı Bazlı Kotalar

```typescript
// Her kullanıcıya aylık kota
const MONTHLY_QUOTAS = {
  starter: 10000,    // 10K scrape/ay
  professional: 50000,  // 50K scrape/ay
  business: 200000   // 200K scrape/ay
};

async function checkUserQuota(userId: string, planType: string) {
  const usage = await getMonthlyUsage(userId);
  const quota = MONTHLY_QUOTAS[planType];

  if (usage >= quota) {
    throw new Error('Monthly scraping quota exceeded');
  }

  return quota - usage;
}
```

---

## 📁 ENV VARIABLES

```env
# Oxylabs Credentials
OXYLABS_USERNAME=your_username
OXYLABS_PASSWORD=your_password

# Optional: Webhook URL
OXYLABS_WEBHOOK_URL=https://sellergenix.io/api/webhooks/oxylabs

# Optional: S3 for scheduled jobs
OXYLABS_S3_BUCKET=sellergenix-scrape-results
OXYLABS_S3_REGION=us-east-1
```

---

## 🔗 FAYDALI LİNKLER

- [Oxylabs Documentation](https://developers.oxylabs.io/)
- [E-Commerce Scraper API](https://oxylabs.io/products/scraper-api/ecommerce)
- [Amazon Scraping Guide](https://developers.oxylabs.io/scraping-solutions/web-scraper-api/targets/amazon)
- [Pricing Calculator](https://oxylabs.io/products/scraper-api/web/pricing)
- [OxyCopilot (AI Assistant)](https://oxylabs.io/features/oxycopilot)

---

## ✅ SONRAKI ADIMLAR

1. [ ] Oxylabs hesabından API credentials al
2. [ ] `.env.local`'e credentials ekle
3. [ ] `src/lib/oxylabs.ts` client oluştur
4. [ ] Webhook endpoint'i kur
5. [ ] İlk test scrape yap
6. [ ] Scheduler kur (günlük rakip takibi)

---

**Not:** Bu rehber SellerGenix projesi için özel olarak hazırlanmıştır. Sorularınız için Claude'a danışın.
