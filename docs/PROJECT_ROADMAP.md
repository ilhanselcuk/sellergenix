# SellerGenix - Project Roadmap

**Son Güncelleme:** 17 Ocak 2026
**Versiyon:** 2.0
**Strateji:** "Amazon First, Perfect It, Then Expand"

---

## 📋 FAZ ÖZET

| Faz | Odak | Süre | Durum |
|-----|------|------|-------|
| **Faz 1** | Amazon NA + AI Chat + WhatsApp + Oxylabs | 4-6 hafta | 🟡 Başlıyor |
| **Faz 2** | Amazon Ads API + Amazon EU/Global | 4-6 hafta | ⏳ Bekliyor |
| **Faz 3** | Shopify Full Integration | 3-4 hafta | ⏳ Bekliyor |
| **Faz 4+** | Walmart, Etsy, eBay, TikTok | TBD | 📅 Planlanacak |

---

## 🚀 FAZ 1: Amazon Kuzey Amerika + Core Features

### 📅 Süre: 4-6 Hafta
### 🎯 Hedef: Amazon NA tam entegrasyon + AI Chat + WhatsApp + Oxylabs

---

### ✅ Mevcut Durum (Onaylı Roller)

| Rol | API | Durum | Çekilebilecek Veriler |
|-----|-----|-------|----------------------|
| Finance and Accounting | Finances API | ✅ ONAYLI | Gelir, fee'ler, payout'lar |
| Selling Partner Insights | Seller API | ✅ ONAYLI | Hesap bilgileri |
| Inventory and Order Tracking | Orders API | ✅ ONAYLI | Siparişler, birimler |
| Brand Analytics | Brand Analytics API | ✅ ONAYLI | Arama terimleri |

### ⏳ Onay Bekleyen Roller

| Rol | API | Beklenen Tarih | Eklenecek Özellikler |
|-----|-----|----------------|---------------------|
| Product Listing | Listings/Catalog API | 17-22 Ocak | Ürün görselleri, başlıklar, BSR |
| Amazon Fulfillment | FBA Inventory API | 17-22 Ocak | Stok seviyeleri, uyarılar |

---

### 📦 Faz 1 Deliverables

#### 1.1 Dashboard (Onaylı Rollerle)
```
✅ Yapılacak (Hemen):
├── 💰 Günlük/Haftalık/Aylık Gelir (Finances API)
├── 📦 Sipariş Sayısı + Birim Satış (Orders API)
├── 💵 Net Profit hesaplama (COGS user input)
├── 📊 Amazon Fee Breakdown - 12+ fee tipi (Finances API)
├── 🗺️ Eyalet Bazlı Satış Haritası (Orders API - shipping address)
├── 📈 Trend Grafikleri (7D, 30D, 90D)
├── 💳 Payout Takibi (Finances API)
└── 🔄 Refund Analizi (Finances API)

⏳ Onay Gelince Eklenecek:
├── 🖼️ Ürün Görselleri (Catalog API)
├── 📝 Ürün Başlıkları (Listings API)
├── 📊 BSR Takibi (Catalog API)
├── 📦 FBA Stok Seviyeleri (FBA Inventory API)
├── ⚠️ Low Stock Uyarıları
└── 📅 Days of Inventory / Restock Önerileri
```

#### 1.2 AI Chat (Haiku + Opus)
```
Model Stratejisi:
├── Haiku (%90): Basit sorgular (~$0.002/sorgu)
│   ├── "Dünkü satışım ne kadar?"
│   ├── "Bu hafta kaç sipariş aldım?"
│   ├── "Amazon bana ne kadar fee kesti?"
│   └── "Hangi eyaletten en çok sipariş geldi?"
│
└── Opus (%10): Kompleks analiz (~$0.10/sorgu)
    ├── "Karlılığımı nasıl artırabilirim?"
    ├── "Hangi ürünümü kaldırmalıyım?"
    ├── "Fiyatlandırma stratejim nasıl olmalı?"
    └── "Rakip analizi yap"
```

#### 1.3 WhatsApp Bildirimleri
```
Aktif Template'ler:
├── 🔔 Günlük Satış Özeti (08:00)
├── ⚠️ Low Stock Uyarısı (anlık)
├── 💰 Payout Bildirimi (ödeme geldiğinde)
├── 📈 Haftalık Performans Raporu (Pazartesi 09:00)
└── 🚨 Kritik Alert (negative review, listing suppressed)
```

#### 1.4 Oxylabs Entegrasyonu
```
Amazon Scraping:
├── 🏆 BSR Takibi (Product Listing onayı beklemeden)
├── ⭐ Review Monitoring
├── 💲 Rakip Fiyat Takibi
├── 📊 Listing Quality Score
└── 🔍 Keyword Rank Tracking
```

---

### 🔧 Faz 1 Teknik Gereksinimler

#### Database Schema
```sql
-- Zaten mevcut tablolar:
- profiles
- products
- amazon_connections
- daily_metrics
- sync_history

-- Eklenecek:
- whatsapp_templates
- whatsapp_notifications
- ai_chat_history
- oxylabs_jobs
- oxylabs_results
```

#### API Endpoints
```
/api/amazon/
├── sync-orders          # Orders API
├── sync-finances        # Finances API
├── sync-products        # ⏳ Listings API (onay bekliyor)
├── sync-inventory       # ⏳ FBA Inventory API (onay bekliyor)
└── test-connection      # Seller API

/api/ai/
├── chat                 # Haiku/Opus routing
└── history              # Chat history

/api/whatsapp/
├── send                 # Send notification
├── templates            # Template management
└── webhook              # Incoming messages

/api/oxylabs/
├── amazon/bsr           # BSR tracking
├── amazon/reviews       # Review monitoring
└── amazon/competitors   # Price tracking
```

---

## 🚀 FAZ 2: Amazon Ads API + Global Expansion

### 📅 Süre: 4-6 Hafta
### 🎯 Hedef: Amazon Ads entegrasyonu + Tüm Amazon pazaryerleri

---

### 📋 Faz 2 Başlama Koşulları
```
✅ Faz 1 tamamlanmış olmalı:
├── Amazon NA SP-API sorunsuz çalışıyor
├── AI Chat production'da
├── WhatsApp bildirimleri aktif
└── Oxylabs Amazon scraping çalışıyor

✅ Rol onayları gelmiş olmalı:
├── Product Listing → Ürün verileri çekiliyor
└── Amazon Fulfillment → FBA stok çekiliyor
```

---

### 📦 Faz 2 Deliverables

#### 2.1 Amazon Ads API
```
Başvuru & Entegrasyon:
├── 📝 Amazon Ads API başvurusu
├── 🔐 OAuth 2.0 setup
├── 📊 Campaign data sync
├── 💰 Ad spend tracking
├── 📈 ACOS/ROAS hesaplama
└── 🤖 AI-powered bid optimization (Opus)

Çekilecek Veriler:
├── Sponsored Products campaigns
├── Sponsored Brands campaigns
├── Sponsored Display campaigns
├── Keyword performance
├── Search term reports
├── Placement reports
└── Budget & bid data
```

#### 2.2 Amazon Global Pazaryerleri
```
Aşamalı Rollout:

Adım 1: North America (Mevcut)
├── 🇺🇸 Amazon.com (ATVPDKIKX0DER) ✅
├── 🇨🇦 Amazon.ca (A2EUQ1WTGCTBG2)
├── 🇲🇽 Amazon.com.mx (A1AM78C64UM0Y8)
└── 🇧🇷 Amazon.com.br (A2Q3Y263D00KWC)

Adım 2: Europe
├── 🇬🇧 Amazon.co.uk (A1F83G8C2ARO7P)
├── 🇩🇪 Amazon.de (A1PA6795UKMFR9)
├── 🇫🇷 Amazon.fr (A13V1IB3VIYBER)
├── 🇮🇹 Amazon.it (APJ6JRA9NG5V4)
├── 🇪🇸 Amazon.es (A1RKKUPIHCS9HS)
├── 🇳🇱 Amazon.nl (A1805IZSGTT6HS)
├── 🇵🇱 Amazon.pl (A1C3SOZRARQ6R3)
├── 🇸🇪 Amazon.se (A2NODRKZP88ZB9)
├── 🇧🇪 Amazon.com.be (AMEN7PMS3EDWL)
└── 🇹🇷 Amazon.com.tr (A33AVAJ2PDY3EV)

Adım 3: Far East
├── 🇯🇵 Amazon.co.jp (A1VC38T7YXB528)
├── 🇦🇺 Amazon.com.au (A39IBJ37TRP1C6)
├── 🇸🇬 Amazon.sg (A19VAU5U5O7RUS)
├── 🇮🇳 Amazon.in (A21TJRUUN4KGV)
└── 🇦🇪 Amazon.ae (A2VIGQ35RCS4UG)
```

#### 2.3 Unified Dashboard
```
Multi-Marketplace View:
├── 🌍 Global Revenue Summary
├── 📊 Marketplace Comparison
├── 💱 Currency Conversion (real-time)
├── 📈 Cross-marketplace trends
└── 🗺️ Global Sales Heatmap
```

---

### 🔧 Faz 2 Teknik Gereksinimler

#### Yeni Database Tabloları
```sql
-- Amazon Ads
CREATE TABLE amazon_ad_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  marketplace_id TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  campaign_type TEXT, -- SP, SB, SD
  status TEXT,
  daily_budget DECIMAL(10,2),
  -- ... metrics
);

CREATE TABLE amazon_ad_daily_metrics (
  -- Daily ad performance
);

-- Multi-marketplace
CREATE TABLE marketplace_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  marketplace_id TEXT,
  region TEXT, -- na, eu, fe
  status TEXT,
  -- ... tokens
);
```

---

## 🚀 FAZ 3: Shopify Full Integration

### 📅 Süre: 3-4 Hafta
### 🎯 Hedef: Shopify tam entegrasyon + cross-platform analytics

---

### 📋 Faz 3 Başlama Koşulları
```
✅ Faz 2 tamamlanmış olmalı:
├── Amazon Ads API çalışıyor
├── Tüm Amazon pazaryerleri aktif
└── Multi-marketplace dashboard hazır

✅ Test:
├── En az 5 farklı Amazon hesabı test edilmiş
├── AI Chat 1000+ sorgu işlemiş
└── WhatsApp 500+ bildirim göndermiş
```

---

### 📦 Faz 3 Deliverables

#### 3.1 Shopify API Entegrasyonu
```
Shopify Admin API:
├── 🔐 OAuth 2.0 (en kolay platform)
├── 📦 Products sync
├── 📋 Orders sync
├── 💰 Transactions sync
├── 📊 Analytics API
├── 📦 Inventory sync
└── 👥 Customers data

Shopify Webhooks:
├── orders/create
├── orders/updated
├── products/update
├── inventory_levels/update
└── refunds/create
```

#### 3.2 Oxylabs Shopify Scraping
```
Competitor Tracking:
├── 🏪 Competitor store monitoring
├── 💲 Price tracking
├── 📦 Product catalog changes
└── ⭐ Review aggregation
```

#### 3.3 Cross-Platform Analytics
```
Unified Dashboard:
├── 📊 Amazon + Shopify combined revenue
├── 📈 Channel comparison
├── 💰 Profitability by channel
├── 📦 Inventory across platforms
└── 🤖 AI insights (multi-platform)
```

---

## 📅 FAZ 4+: Future Platforms (Planlanacak)

### Potansiyel Sıralama:
```
1. Walmart Marketplace
   - Büyük pazar, Amazon'a benzer
   - API olgun

2. Etsy
   - Handmade/vintage niche
   - Farklı müşteri profili

3. eBay
   - Global reach
   - Auction + fixed price

4. TikTok Shop
   - Yeni, hızlı büyüyen
   - Social commerce

5. Trendyol / Hepsiburada
   - Türkiye pazarı
   - Lokal expansion
```

---

## 📊 Başarı Kriterleri

### Faz 1 Başarı Kriterleri
```
✅ Technical:
├── Amazon SP-API 99.9% uptime
├── AI Chat < 2s response time
├── WhatsApp delivery rate > 98%
└── Oxylabs success rate > 95%

✅ Business:
├── 10+ beta user aktif
├── NPS > 50
├── Churn < 5%
└── Average session > 5 min
```

### Faz 2 Başarı Kriterleri
```
✅ Technical:
├── Amazon Ads API tam entegre
├── 5+ marketplace aktif
└── Multi-currency support çalışıyor

✅ Business:
├── 50+ paying users
├── MRR > $2,000
└── Multi-marketplace users > 30%
```

### Faz 3 Başarı Kriterleri
```
✅ Technical:
├── Shopify OAuth < 30s
├── Cross-platform sync < 5 min
└── Unified analytics real-time

✅ Business:
├── 100+ paying users
├── MRR > $5,000
├── Shopify users > 20%
└── Multi-platform users > 40%
```

---

## 🔗 İlgili Dökümanlar

| Döküman | Açıklama |
|---------|----------|
| [AMAZON_SP_API.md](./AMAZON_SP_API.md) | Amazon SP-API entegrasyon rehberi |
| [AMAZON_ADS_API.md](./AMAZON_ADS_API.md) | Amazon Advertising API rehberi |
| [SHOPIFY_API.md](./SHOPIFY_API.md) | Shopify API entegrasyon rehberi |
| [WHATSAPP_TEMPLATES.md](./WHATSAPP_TEMPLATES.md) | WhatsApp template'leri |
| [AI_CHAT.md](./AI_CHAT.md) | AI Chat mimari ve prompt'lar |
| [WALMART_API.md](./WALMART_API.md) | Walmart API rehberi |
| [ETSY_API.md](./ETSY_API.md) | Etsy API rehberi |
| [EBAY_API.md](./EBAY_API.md) | eBay API rehberi |
| [OXYLABS.md](./OXYLABS.md) | Oxylabs scraping rehberi |

---

**Son Güncelleme:** 17 Ocak 2026
**Yazar:** SellerGenix Development Team
