# 🚀 SELLERGENİX - MASTER PROJE DOKÜMANI

**Son Güncelleme:** 17 Ocak 2026
**Versiyon:** 2.0 (Sıfırdan İnşa Planı)
**Durum:** Planlama Aşaması

---

## 📋 İÇİNDEKİLER

1. [Proje Özeti](#-proje-özeti)
2. [Rakip Analizi ve Fiyatlandırma](#-rakip-analizi-ve-fiyatlandırma)
3. [Maliyet Analizi](#-maliyet-analizi)
4. [Site Haritası ve Sayfalar](#️-site-haritası-ve-sayfalar)
5. [Pazaryeri Dashboard'ları](#-pazaryeri-dashboardları)
6. [AI Chat Sistemi](#-ai-chat-sistemi)
7. [Admin Paneli](#-admin-paneli)
8. [Auth Sistemi](#-auth-sistemi-girişkayıt)
9. [Fiyatlandırma Stratejisi](#-fiyatlandırma-stratejisi)
10. [Teknik Mimari](#-teknik-mimari)
11. [Geliştirme Yol Haritası](#-geliştirme-yol-haritası)

---

## 🎯 PROJE ÖZETİ

### Ne Yapıyoruz?

**SellerGenix** = E-ticaret satıcıları için AI destekli iş yönetim platformu

### 6 Desteklenen Pazaryeri

| # | Platform | Pazar Büyüklüğü | Öncelik |
|---|----------|-----------------|---------|
| 1 | **Amazon** | $700B+ GMV | 🔴 Kritik |
| 2 | **Walmart** | $75B+ GMV | 🟡 Yüksek |
| 3 | **eBay** | $73B GMV | 🟡 Yüksek |
| 4 | **Etsy** | $13B GMV | 🟢 Orta |
| 5 | **Shopify** | $235B+ GMV | 🟡 Yüksek |
| 6 | **TikTok Shop** | $20B+ GMV (hızlı büyüyor!) | 🟡 Yüksek |

### 3 Ana Özellik

1. **📊 Pazaryeri Dashboard'ları** - Her platform için ayrı, detaylı dashboard
2. **🤖 AI Chat Asistan** - Her metrik, her veri hakkında soru sor, strateji al
3. **📱 WhatsApp Bildirimleri** - Günlük özet, stok uyarıları, PPC alarmları

### Rakiplerden Farkımız

| Özellik | Sellerboard | Helium 10 | SellerGenix |
|---------|-------------|-----------|-------------|
| AI Chat (Sınırsız Sorgulama) | ❌ | ⚠️ Sınırlı | ✅ |
| WhatsApp Bildirimleri | ❌ | ❌ | ✅ |
| 6 Pazaryeri Tek Yerde | ❌ | ⚠️ 3 platform | ✅ |
| TikTok Shop Desteği | ❌ | ❌ | ✅ |
| Uygun Fiyat ($19'dan başlayan) | ✅ | ❌ ($99+) | ✅ |

---

## 📊 RAKİP ANALİZİ VE FİYATLANDIRMA

### Sellerboard (En Yakın Rakip)

| Plan | Aylık | Yıllık (aylık) | Order Limiti |
|------|-------|----------------|--------------|
| Standard | $19 | $15 | 3,000/ay |
| Professional | $29 | $23 | 6,000/ay |
| Business | $39 | $31 | 15,000/ay |
| Enterprise | $79 | $63 | 50,000/ay |

**Güçlü Yönleri:** Uygun fiyat, kar takibi, FBA envanter
**Zayıf Yönleri:** AI yok, WhatsApp yok, sadece Amazon

---

### Helium 10

| Plan | Aylık | Yıllık (aylık) | Özellikler |
|------|-------|----------------|------------|
| Free | $0 | $0 | Çok sınırlı |
| Starter | $39 | $29 | Temel araçlar |
| Platinum | $99 | $79 | Çoğu özellik |
| Diamond | $279 | $229 | Full erişim |
| Diamond + Adtomic | $349 | - | PPC otomasyonu |

**Güçlü Yönleri:** 30+ araç, keyword research, çoklu platform
**Zayıf Yönleri:** Çok pahalı, karmaşık, AI chat yok

---

### Quartile (PPC Otomasyonu)

| Özellik | Değer |
|---------|-------|
| Minimum Fiyat | $895/ay |
| Maksimum Fiyat | $9,995/ay |
| Minimum Ad Spend | $3,000/ay |
| Ekstra Marketplace | +$500/ay her biri |
| Amazon DSP | +$500/ay |

**Not:** Sadece büyük satıcılar için, çok pahalı

---

### Jungle Scout

| Plan | Aylık | Yıllık (aylık) |
|------|-------|----------------|
| Basic | $49 | $29 |
| Suite | $69 | $49 |
| Professional | $129 | $84 |

**Güçlü Yönleri:** %84 veri doğruluğu, kolay kullanım
**Zayıf Yönleri:** Kar analizi zayıf, AI sınırlı

---

### Sonuç: Fiyat Pozisyonumuz

```
Sellerboard ($15-79) ←← SellerGenix ($19-99) ←← Helium 10 ($39-279)
         ↑                      ↑                      ↑
    En Ucuz              İdeal Pozisyon           En Pahalı
```

**Strateji:** Sellerboard fiyatları + Helium 10 özellikleri + AI (benzersiz!)

---

## 🌍 AMAZON MARKETPLACE BÖLGELERİ (TAM LİSTE)

### Amazon SP-API Bölgesel Endpoint'ler

Amazon, dünya genelinde **3 ana bölge** ve **20+ marketplace** sunmaktadır.

#### 🇺🇸 NORTH AMERICA (Kuzey Amerika)

**Endpoint:** `sellingpartnerapi-na.amazon.com`

| Marketplace | Ülke | Marketplace ID | Para Birimi | Dil |
|-------------|------|----------------|-------------|-----|
| **amazon.com** | 🇺🇸 USA | ATVPDKIKX0DER | USD | English |
| **amazon.ca** | 🇨🇦 Canada | A2EUQ1WTGCTBG2 | CAD | English/French |
| **amazon.com.mx** | 🇲🇽 Mexico | A1AM78C64UM0Y8 | MXN | Spanish |
| **amazon.com.br** | 🇧🇷 Brazil | A2Q3Y263D00KWC | BRL | Portuguese |

**Unified Account:** Kuzey Amerika'da tek hesapla 4 ülkeye satış!

---

#### 🇪🇺 EUROPE (Avrupa + Ortadoğu + Hindistan)

**Endpoint:** `sellingpartnerapi-eu.amazon.com`

| Marketplace | Ülke | Marketplace ID | Para Birimi | Dil |
|-------------|------|----------------|-------------|-----|
| **amazon.co.uk** | 🇬🇧 UK | A1F83G8C2ARO7P | GBP | English |
| **amazon.de** | 🇩🇪 Germany | A1PA6795UKMFR9 | EUR | German |
| **amazon.fr** | 🇫🇷 France | A13V1IB3VIYZZH | EUR | French |
| **amazon.it** | 🇮🇹 Italy | APJ6JRA9NG5V4 | EUR | Italian |
| **amazon.es** | 🇪🇸 Spain | A1RKKUPIHCS9HS | EUR | Spanish |
| **amazon.nl** | 🇳🇱 Netherlands | A1805IZSGTT6HS | EUR | Dutch |
| **amazon.se** | 🇸🇪 Sweden | A2NODRKZP88ZB9 | SEK | Swedish |
| **amazon.pl** | 🇵🇱 Poland | A1C3SOZRARQ6R3 | PLN | Polish |
| **amazon.be** | 🇧🇪 Belgium | AMEN7PMS3EDWL | EUR | Dutch/French |
| **amazon.ae** | 🇦🇪 UAE | A2VIGQ35RCS4UG | AED | English/Arabic |
| **amazon.sa** | 🇸🇦 Saudi Arabia | A17E79C6D8DWNP | SAR | Arabic |
| **amazon.eg** | 🇪🇬 Egypt | ARBP9OOSHTCHU | EGP | Arabic |
| **amazon.com.tr** | 🇹🇷 Turkey | A33AVAJ2PDY3EV | TRY | Turkish |
| **amazon.in** | 🇮🇳 India | A21TJRUUN4KGV | INR | English/Hindi |

**Pan-European FBA:** Tek stok ile tüm Avrupa'ya satış!

---

#### 🌏 FAR EAST (Uzak Doğu + Avustralya)

**Endpoint:** `sellingpartnerapi-fe.amazon.com`

| Marketplace | Ülke | Marketplace ID | Para Birimi | Dil |
|-------------|------|----------------|-------------|-----|
| **amazon.co.jp** | 🇯🇵 Japan | A1VC38T7YXB528 | JPY | Japanese |
| **amazon.com.au** | 🇦🇺 Australia | A39IBJ37TRP1C6 | AUD | English |
| **amazon.sg** | 🇸🇬 Singapore | A19VAU5U5O7RUS | SGD | English |

---

### Amazon SP-API Maliyetleri (2026 Güncellemesi!)

> **⚠️ ÖNEMLİ:** Amazon, 31 Ocak 2026'dan itibaren SP-API kullanımı için ücret almaya başlıyor!

#### Yıllık Erişim Ücreti

| Paket | Yıllık Ücret | API Call Limiti | Ekstra Call |
|-------|--------------|-----------------|-------------|
| **Basic** | $1,400/yıl | 100,000/ay | $0.015/call |
| **Standard** | $3,500/yıl | 500,000/ay | $0.010/call |
| **Premium** | $7,000/yıl | 2,000,000/ay | $0.005/call |

#### SellerGenix İçin Etki

| Kullanıcı Sayısı | Tahmini API Call/Ay | Maliyet/Ay | Maliyet/Yıl |
|------------------|---------------------|------------|-------------|
| 100 | 500,000 | ~$290 | ~$3,500 |
| 1,000 | 5,000,000 | ~$2,500 | ~$30,000 |
| 5,000 | 25,000,000 | ~$12,500 | ~$150,000 |

**Strateji:** Premium paket + kullanıcı başına API call optimizasyonu

---

### Amazon Marketplace Öncelik Sıralaması

#### Faz 1: North America (İlk 4 Hafta)
✅ USA → ✅ Canada → ✅ Mexico → ✅ Brazil

#### Faz 2: Europe Core (Hafta 5-8)
🇬🇧 UK → 🇩🇪 Germany → 🇫🇷 France → 🇮🇹 Italy → 🇪🇸 Spain

#### Faz 3: Europe Expansion + Far East (Hafta 9-12)
🇳🇱🇸🇪🇵🇱🇧🇪 Benelux & Nordic → 🇦🇪🇸🇦 Middle East → 🇯🇵🇦🇺 Japan & Australia

#### Faz 4: Emerging Markets (Sonrası)
🇮🇳 India → 🇹🇷 Turkey → 🇸🇬 Singapore → 🇪🇬 Egypt

---

## 💰 MALİYET ANALİZİ

### 1. Altyapı Maliyetleri

#### Vercel (Hosting)

| Plan | Aylık | Özellikler |
|------|-------|------------|
| Hobby | $0 | 1 kişi, 100GB bandwidth |
| Pro | $20/üye | Team, analytics, 1TB bandwidth |
| Enterprise | $2,000+/ay | SLA, özel destek |

**Önerimiz:**
- MVP: Hobby ($0)
- Launch: Pro ($20-100/ay)
- Scale: Pro + optimization ($200-500/ay)

#### Supabase (Database)

| Plan | Aylık | Özellikler |
|------|-------|------------|
| Free | $0 | 500MB DB, 2GB storage |
| Pro | $25 | 8GB DB, 100GB storage |
| Team | $599 | 100GB DB, SOC2 |

**Önerimiz:** Pro ($25/ay) → Team (10K+ kullanıcıda)

---

### 2. AI Maliyetleri (Claude API)

#### Model Fiyatları

| Model | Input/MTok | Output/MTok | Kullanım |
|-------|------------|-------------|----------|
| **Haiku 4.5** | $1.00 | $5.00 | Basit sorgular |
| **Sonnet 4.5** | $3.00 | $15.00 | Çoğu iş (önerimiz) |
| **Opus 4.5** | $5.00 | $25.00 | Kompleks analizler |

#### Ortalama Sorgu Maliyeti

| İşlem | Token (Yaklaşık) | Maliyet (Sonnet) |
|-------|------------------|------------------|
| Basit soru ("Dünkü satış?") | 500 input + 200 output | ~$0.005 |
| Orta soru ("Kar analizi yap") | 2K input + 1K output | ~$0.02 |
| Kompleks ("Strateji öner") | 5K input + 2K output | ~$0.05 |
| Excel işleme (100 ürün) | 10K input + 3K output | ~$0.08 |

#### Kullanıcı Başına Aylık AI Maliyeti (Tahmini)

| Kullanım Seviyesi | Sorgu/Ay | Maliyet/Kullanıcı |
|-------------------|----------|-------------------|
| Düşük (Starter) | ~100 | ~$0.50 |
| Orta (Pro) | ~500 | ~$2.50 |
| Yüksek (Business) | ~2,000 | ~$10.00 |

---

### 3. WhatsApp Maliyetleri (Twilio)

#### Mesaj Başına Maliyet (ABD)

| Mesaj Tipi | Meta Ücreti | Twilio Markup | Toplam |
|------------|-------------|---------------|--------|
| Utility (Bildirim) | $0.0014 | $0.005 | ~$0.007 |
| Marketing | $0.0107 | $0.005 | ~$0.016 |
| Service (Müşteri başlattı) | $0.00 | $0.005 | $0.005 |

#### Kullanıcı Başına Aylık WhatsApp Maliyeti

| Senaryo | Mesaj/Ay | Maliyet |
|---------|----------|---------|
| Sadece günlük özet | 30 | ~$0.21 |
| + Stok uyarıları | 45 | ~$0.32 |
| + PPC alarmları | 60 | ~$0.42 |
| Full (tüm bildirimler) | 100 | ~$0.70 |

---

### 4. Scraping Maliyetleri (Oxylabs)

| Plan | Aylık | Sonuç Limiti | Maliyet/1K |
|------|-------|--------------|------------|
| Micro | $49 | 98,000 | ~$0.50 |
| Starter | $99 | 220,000 | ~$0.45 |
| Advanced | $249 | 622,500 | ~$0.40 |

**Kullanım:** Rakip takibi, BSR izleme (API'de olmayan veriler)

---

### 5. TOPLAM MALİYET TABLOSU

#### Ölçeğe Göre Aylık Maliyetler

| Kalem | 100 User | 1K User | 5K User | 10K User |
|-------|----------|---------|---------|----------|
| **Vercel** | $20 | $100 | $300 | $500 |
| **Supabase** | $25 | $25 | $100 | $599 |
| **Claude API** | $150 | $1,500 | $7,500 | $15,000 |
| **Twilio WhatsApp** | $50 | $500 | $2,500 | $5,000 |
| **Oxylabs** | $49 | $99 | $249 | $499 |
| **Domain/SSL** | $20 | $20 | $20 | $20 |
| **Monitoring** | $0 | $50 | $100 | $200 |
| **TOPLAM** | **$314** | **$2,294** | **$10,769** | **$21,818** |
| **Kullanıcı Başı** | **$3.14** | **$2.29** | **$2.15** | **$2.18** |

---

### 6. Token Limit Stratejisi (AI Maliyet Kontrolü) ⚠️ GÜNCEL

> **⚠️ ÖNEMLİ:** Önceki limitler çok düşüktü (100 sorgu/ay = günde 3 sorgu = AYIP!)
> Aşağıda **5x artırılmış** yeni limitler ve maliyet karşılaştırması var.

#### ESKİ vs YENİ Token Limitleri (5x Artış)

| Plan | ESKİ Limit | YENİ Limit (5x) | ESKİ Sorgu | YENİ Sorgu |
|------|------------|-----------------|------------|------------|
| **Starter** | 500K | **2.5M token** | ~100 | **~500** |
| **Pro** | 2.5M | **12.5M token** | ~500 | **~2,500** |
| **Business** | 10M | **50M token** | ~2,000 | **~10,000** |
| **Enterprise** | 50M | **250M token** | ~10,000 | **~50,000** |

#### Günlük Sorgu Karşılığı (30 günlük ay)

| Plan | Günlük Sorgu | Kullanım Senaryosu |
|------|--------------|---------------------|
| **Starter** | ~17 sorgu/gün | Temel sorgular, günlük özet |
| **Pro** | ~83 sorgu/gün | Yoğun analiz, strateji |
| **Business** | ~333 sorgu/gün | Tüm ekip kullanımı |
| **Enterprise** | ~1,666 sorgu/gün | Sınırsız hissi, büyük operasyonlar |

#### 5x Artış Maliyet Analizi (Claude Sonnet 4.5)

**Varsayım:** Ortalama sorgu = 2K input + 800 output token = ~$0.02/sorgu

| Plan | YENİ Limit | Kullanıcı/Ay AI Maliyeti | ESKİ Maliyet |
|------|------------|--------------------------|--------------|
| **Starter** | 2.5M token | ~$2.50 | $0.50 |
| **Pro** | 12.5M token | ~$12.50 | $2.50 |
| **Business** | 50M token | ~$50.00 | $10.00 |
| **Enterprise** | 250M token | ~$250.00 | $50.00 |

#### Toplam AI Maliyeti (5x Artışla) - Ölçeğe Göre

| Kullanıcı | Starter (50%) | Pro (35%) | Business (12%) | Enterprise (3%) | TOPLAM |
|-----------|---------------|-----------|----------------|-----------------|--------|
| **100** | $125 | $437 | $600 | $750 | **$1,912/ay** |
| **1,000** | $1,250 | $4,375 | $6,000 | $7,500 | **$19,125/ay** |
| **5,000** | $6,250 | $21,875 | $30,000 | $37,500 | **$95,625/ay** |
| **10,000** | $12,500 | $43,750 | $60,000 | $75,000 | **$191,250/ay** |

#### Karlılık Etkisi (5x Artışla)

| Plan | Fiyat | ESKİ Maliyet | YENİ Maliyet | YENİ Brüt Kar | Margin |
|------|-------|--------------|--------------|---------------|--------|
| Starter | $19 | $3.50 | **$5.50** | $13.50 | 71% ✅ |
| Pro | $39 | $5.00 | **$15.50** | $23.50 | 60% ✅ |
| Business | $79 | $12.00 | **$55.00** | $24.00 | 30% ⚠️ |
| Enterprise | $199 | $25.00 | **$255.00** | -$56.00 | ❌ Zarar! |

#### ⚠️ Enterprise Plan Düzeltmesi

Enterprise'da zarar var! Çözüm:

| Seçenek | Açıklama | Öneri |
|---------|----------|-------|
| **A) Fiyat Artışı** | $199 → $499/ay | ✅ Önerilir |
| **B) Token Azaltma** | 250M → 100M | İkinci seçenek |
| **C) Kullanım Bazlı** | Base $199 + $0.008/sorgu | Hibrit model |

**Önerilen Yeni Enterprise Fiyatı:** $499/ay (250M token dahil)
- Maliyet: ~$255 → Brüt Kar: $244 → Margin: 49% ✅

---

### 7. 📊 KAPSAMLI KARLILIK ANALİZİ (TÜM MALİYETLER DAHİL)

> **Son Güncelleme:** 17 Ocak 2026
> Bu analiz TÜM maliyetleri içerir: AI, hosting, database, WhatsApp, scraping, Amazon API fees

#### Varsayımlar

| Parametre | Değer | Açıklama |
|-----------|-------|----------|
| **Plan Dağılımı** | Starter 50%, Pro 35%, Business 12%, Enterprise 3% | Tipik SaaS dağılımı |
| **AI Kullanım Oranı** | %60 | Kullanıcılar limitin %60'ını kullanır |
| **WhatsApp Kullanım** | Pro+ %70 | Pro ve üstü kullanıcıların %70'i kullanır |
| **Churn Rate** | %5/ay | Aylık kayıp oranı |

#### A) GELİR TABLOSU (Aylık)

| Kullanıcı | Starter (50%) | Pro (35%) | Business (12%) | Enterprise (3%) | **TOPLAM GELİR** |
|-----------|---------------|-----------|----------------|-----------------|------------------|
| **100** | 50 × $19 = $950 | 35 × $39 = $1,365 | 12 × $79 = $948 | 3 × $499 = $1,497 | **$4,760** |
| **500** | $4,750 | $6,825 | $4,740 | $7,485 | **$23,800** |
| **1,000** | $9,500 | $13,650 | $9,480 | $14,970 | **$47,600** |
| **5,000** | $47,500 | $68,250 | $47,400 | $74,850 | **$238,000** |
| **10,000** | $95,000 | $136,500 | $94,800 | $149,700 | **$476,000** |

---

#### B) MALİYET TABLOSU (Aylık - Detaylı)

##### 100 Kullanıcı Senaryosu

| Maliyet Kalemi | Hesaplama | Tutar |
|----------------|-----------|-------|
| **Vercel (Pro)** | Base plan | $20 |
| **Supabase (Pro)** | 8GB DB | $25 |
| **Claude API (5x limitler)** | 50×$1.50 + 35×$7.50 + 12×$30 + 3×$150 | **$1,072** |
| **Twilio WhatsApp** | (35+12+3)×70%×30 msg×$0.01 | $105 |
| **Oxylabs** | Micro plan | $49 |
| **Amazon SP-API** | Basic ($1,400/yıl ÷ 12) | $117 |
| **Domain/SSL/Misc** | Annual fees | $20 |
| **Stripe Fees** | 2.9% of revenue | $138 |
| **TOPLAM MALİYET** | | **$1,546** |

##### 1,000 Kullanıcı Senaryosu

| Maliyet Kalemi | Hesaplama | Tutar |
|----------------|-----------|-------|
| **Vercel (Pro)** | Increased usage | $150 |
| **Supabase (Pro)** | 8GB DB | $25 |
| **Claude API (5x)** | Scaled by users | **$10,720** |
| **Twilio WhatsApp** | 500 users × 30 msg | $1,050 |
| **Oxylabs** | Starter plan | $99 |
| **Amazon SP-API** | Standard ($3,500/yıl ÷ 12) | $292 |
| **Domain/SSL/Misc** | | $30 |
| **Stripe Fees** | 2.9% × $47,600 | $1,380 |
| **Monitoring/Logging** | Datadog/Sentry | $100 |
| **TOPLAM MALİYET** | | **$13,846** |

##### 5,000 Kullanıcı Senaryosu

| Maliyet Kalemi | Hesaplama | Tutar |
|----------------|-----------|-------|
| **Vercel (Pro+)** | High traffic | $400 |
| **Supabase (Team)** | 100GB DB | $599 |
| **Claude API (5x)** | Scaled + volume discount 15% | **$45,560** |
| **Twilio WhatsApp** | 2,500 users × 30 msg | $5,250 |
| **Oxylabs** | Advanced plan | $249 |
| **Amazon SP-API** | Premium ($7,000/yıl ÷ 12) + overages | $1,500 |
| **Domain/SSL/Misc** | | $50 |
| **Stripe Fees** | 2.9% × $238,000 | $6,902 |
| **Monitoring/Support** | Full stack | $300 |
| **Team Salary (2 devs)** | Part-time/contract | $8,000 |
| **TOPLAM MALİYET** | | **$68,810** |

##### 10,000 Kullanıcı Senaryosu

| Maliyet Kalemi | Hesaplama | Tutar |
|----------------|-----------|-------|
| **Vercel (Enterprise)** | Dedicated | $800 |
| **Supabase (Team+)** | Scaled | $1,200 |
| **Claude API (5x)** | Volume discount 20% | **$85,760** |
| **Twilio WhatsApp** | 5,000 users × 30 msg | $10,500 |
| **Oxylabs** | Custom plan | $500 |
| **Amazon SP-API** | Premium + heavy overages | $3,500 |
| **Domain/SSL/Misc** | | $100 |
| **Stripe Fees** | 2.9% × $476,000 | $13,804 |
| **Monitoring/Support** | Enterprise tools | $500 |
| **Team Salary** | 3 devs + 1 support | $20,000 |
| **Office/Legal/Insurance** | | $2,000 |
| **TOPLAM MALİYET** | | **$138,664** |

---

#### C) KARLILIK ÖZETİ

| Kullanıcı | Gelir | Maliyet | **BRÜT KAR** | **Margin** | Kullanıcı Başı Kar |
|-----------|-------|---------|--------------|------------|-------------------|
| **100** | $4,760 | $1,546 | **$3,214** | **67.5%** | $32.14 |
| **500** | $23,800 | $6,923 | **$16,877** | **70.9%** | $33.75 |
| **1,000** | $47,600 | $13,846 | **$33,754** | **70.9%** | $33.75 |
| **5,000** | $238,000 | $68,810 | **$169,190** | **71.1%** | $33.84 |
| **10,000** | $476,000 | $138,664 | **$337,336** | **70.9%** | $33.73 |

---

#### D) YILLIK PROJEKSİYON

| Metrik | 100 User | 1K User | 5K User | 10K User |
|--------|----------|---------|---------|----------|
| **Yıllık Gelir (ARR)** | $57,120 | $571,200 | $2,856,000 | $5,712,000 |
| **Yıllık Maliyet** | $18,552 | $166,152 | $825,720 | $1,663,968 |
| **Yıllık Net Kar** | **$38,568** | **$405,048** | **$2,030,280** | **$4,048,032** |
| **Net Margin** | 67.5% | 70.9% | 71.1% | 70.9% |

---

#### E) BREAK-EVEN ANALİZİ

**Minimum Karlılık için Gereken Kullanıcı Sayısı:**

| Senaryo | Break-Even | Açıklama |
|---------|------------|----------|
| **Solo founder (no salary)** | ~20 kullanıcı | Sadece altyapı maliyetleri |
| **1 kişilik ekip ($5K/ay)** | ~130 kullanıcı | Maaş dahil |
| **3 kişilik ekip ($15K/ay)** | ~350 kullanıcı | Küçük startup |
| **5 kişilik ekip ($30K/ay)** | ~700 kullanıcı | Büyüyen startup |

---

#### F) EN KÖTÜ SENARYO (Worst Case)

Eğer kullanıcılar AI limitlerini **%100 kullanırsa** (gerçekçi değil ama hesaplayalım):

| Kullanıcı | Gelir | Maliyet (100% AI) | Kar | Margin |
|-----------|-------|-------------------|-----|--------|
| **1,000** | $47,600 | $21,410 | $26,190 | **55.0%** |
| **5,000** | $238,000 | $93,550 | $144,450 | **60.7%** |
| **10,000** | $476,000 | $181,100 | $294,900 | **62.0%** |

> ⚠️ En kötü senaryoda bile **%55+ margin** korunuyor!

---

#### G) KARLILIK ARTIRMA STRATEJİLERİ

| Strateji | Potansiyel Tasarruf | Uygulanabilirlik |
|----------|---------------------|------------------|
| **Haiku model kullanımı** | AI maliyetinde %60-70 düşüş | Basit sorgular için |
| **Redis caching** | AI maliyetinde %20-30 düşüş | Tekrar eden sorgular |
| **Yıllık ödeme indirimi** | Churn %50 azalır, LTV artar | %20 indirim sun |
| **Upselling** | ARPU artışı | Starter → Pro push |
| **Add-on özellikler** | Ek gelir | Competitor tracking, extra seats |

---

#### H) SONUÇ

| Metrik | Değer | Yorum |
|--------|-------|-------|
| **Hedef Margin** | %65-75% | ✅ SaaS standartlarında |
| **Kullanıcı Başı Kar** | ~$33/ay | ✅ Sağlıklı unit economics |
| **Ölçeklenebilirlik** | Lineer | ✅ Margin sabit kalıyor |
| **Risk** | Düşük | ✅ En kötü senaryoda bile karlı |
| **Break-even** | ~20-130 kullanıcı | ✅ Çok erişilebilir |

**🎯 Özet:** 5x AI limitleri ve tüm maliyetler dahil edildiğinde bile **%67-71% gross margin** korunuyor. Bu SaaS sektöründe **mükemmel** bir oran.

---

#### Token Tasarruf Stratejisi: HAIKU + OPUS KOMBİNASYONU

> **Strateji:** Basit sorgular için ucuz Haiku, kompleks analizler için güçlü Opus

##### Model Fiyatları

| Model | Input/MTok | Output/MTok | Kullanım |
|-------|------------|-------------|----------|
| **Haiku 3.5** | $0.25 | $1.25 | Basit sorgular (%75) |
| **Opus 4** | $15.00 | $75.00 | Kompleks analizler (%25) |

##### Sorgu Routing Kuralları

| Sorgu Tipi | Model | Örnek | Maliyet/Sorgu |
|------------|-------|-------|---------------|
| **Veri çekme** | Haiku | "Dünkü satış?", "Stok durumu?" | ~$0.002 |
| **Listeleme** | Haiku | "En çok satan 10 ürün" | ~$0.003 |
| **Basit hesap** | Haiku | "Margin hesapla", "ACOS kaç?" | ~$0.002 |
| **Analiz** | Opus | "Neden kar düştü?", "Trend analizi" | ~$0.08 |
| **Strateji** | Opus | "Karlılığı nasıl artırırım?" | ~$0.10 |
| **Excel işleme** | Opus | "COGS toplu güncelle" | ~$0.15 |

##### Maliyet Hesaplaması (Haiku %75 + Opus %25)

**Ortalama sorgu maliyeti:**
- Haiku: $0.0025 × 75% = $0.001875
- Opus: $0.10 × 25% = $0.025
- **Ortalama: ~$0.027/sorgu**

##### Plan Bazlı AI Maliyetleri (Haiku+Opus Mix)

| Plan | Sorgu/Ay | Haiku (%75) | Opus (%25) | **Toplam AI** |
|------|----------|-------------|------------|---------------|
| **Starter** | 500 | $0.94 | $12.50 | **$13.44** |
| **Pro** | 2,500 | $4.69 | $62.50 | **$67.19** |
| **Business** | 10,000 | $18.75 | $250.00 | **$268.75** |
| **Enterprise** | 50,000 | $93.75 | $1,250.00 | **$1,343.75** |

##### Kullanıcı Başına Aylık AI Maliyeti

| Plan | Kullanıcı AI Maliyeti | ESKİ (Sadece Sonnet) | Tasarruf |
|------|----------------------|----------------------|----------|
| **Starter** | **$13.44** | $10.00 | ❌ +34% |
| **Pro** | **$67.19** | $50.00 | ❌ +34% |
| **Business** | **$268.75** | $200.00 | ❌ +34% |
| **Enterprise** | **$1,343.75** | $1,000.00 | ❌ +34% |

> ⚠️ **DİKKAT:** Opus kullanımı maliyeti artırıyor! Sadece gerçekten gerekli sorgularda kullan.

##### Optimizasyon: Opus Oranını %10'a Düşür

| Plan | Haiku %90 | Opus %10 | **Yeni Toplam** | Tasarruf |
|------|-----------|----------|-----------------|----------|
| **Starter** | $1.13 | $5.00 | **$6.13** | %39 ↓ |
| **Pro** | $5.63 | $25.00 | **$30.63** | %39 ↓ |
| **Business** | $22.50 | $100.00 | **$122.50** | %39 ↓ |
| **Enterprise** | $112.50 | $500.00 | **$612.50** | %39 ↓ |

**Önerilen Strateji:** Haiku %90 + Opus %10 (sadece gerçekten kompleks sorgular)

##### Faz 2 İçin (Sonraki Aşama)

1. **Redis Caching** - Tekrar eden sorgular için %30-40 ek tasarruf
2. **Prompt Optimizasyonu** - Kısa system prompt'lar ile %10-15 tasarruf
3. **Batch İşleme** - Çoklu sorgular tek request'te

#### UI'da Token Gösterimi

```
┌─────────────────────────────────────────┐
│  🤖 AI Asistan                          │
│  ─────────────────────────────────────  │
│  Token: 5.2M / 12.5M (42%)             │
│  ████████████████░░░░░░░░░░░░░░░░░░░░  │
│  📊 ~1,860 sorgu kaldı                  │
│  📅 Yenileme: 12 gün sonra              │
│  ⚡ Günde ~150 sorgu kullanabilirsin    │
│  💡 [Limit Artır]                       │
└─────────────────────────────────────────┘
```

---

## 🗺️ SİTE HARİTASI VE SAYFALAR

### Tam Sayfa Listesi

```
sellergenix.io/
│
├── 📄 LANDING (Public)
│   ├── / (Ana sayfa)
│   ├── /features (Özellikler)
│   ├── /pricing (Fiyatlandırma)
│   ├── /about (Hakkımızda)
│   ├── /contact (İletişim)
│   ├── /blog (Blog)
│   ├── /privacy (Gizlilik Politikası)
│   └── /terms (Kullanım Koşulları)
│
├── 🔐 AUTH (Giriş/Kayıt)
│   ├── /login (Giriş)
│   ├── /register (Kayıt)
│   ├── /forgot-password (Şifre sıfırlama)
│   ├── /reset-password (Yeni şifre)
│   ├── /verify-email (Email doğrulama)
│   └── /onboarding (İlk kurulum sihirbazı)
│
├── 📊 DASHBOARD (Ana Panel - Auth Gerekli)
│   ├── /dashboard (Genel Bakış - Tüm platformlar özet)
│   │
│   ├── 🛒 AMAZON
│   │   ├── /dashboard/amazon (Amazon Dashboard)
│   │   ├── /dashboard/amazon/products (Ürünler)
│   │   ├── /dashboard/amazon/orders (Siparişler)
│   │   ├── /dashboard/amazon/inventory (Envanter)
│   │   ├── /dashboard/amazon/ppc (PPC Kampanyaları)
│   │   ├── /dashboard/amazon/finances (Finansal)
│   │   └── /dashboard/amazon/settings (Amazon Ayarları)
│   │
│   ├── 🏪 WALMART
│   │   ├── /dashboard/walmart (Walmart Dashboard)
│   │   ├── /dashboard/walmart/products
│   │   ├── /dashboard/walmart/orders
│   │   ├── /dashboard/walmart/inventory
│   │   ├── /dashboard/walmart/advertising
│   │   └── /dashboard/walmart/settings
│   │
│   ├── 📦 EBAY
│   │   ├── /dashboard/ebay (eBay Dashboard)
│   │   ├── /dashboard/ebay/listings
│   │   ├── /dashboard/ebay/orders
│   │   ├── /dashboard/ebay/inventory
│   │   ├── /dashboard/ebay/analytics
│   │   └── /dashboard/ebay/settings
│   │
│   ├── 🧶 ETSY
│   │   ├── /dashboard/etsy (Etsy Dashboard)
│   │   ├── /dashboard/etsy/listings
│   │   ├── /dashboard/etsy/orders
│   │   ├── /dashboard/etsy/inventory
│   │   ├── /dashboard/etsy/analytics
│   │   └── /dashboard/etsy/settings
│   │
│   ├── 🛍️ SHOPIFY
│   │   ├── /dashboard/shopify (Shopify Dashboard)
│   │   ├── /dashboard/shopify/products
│   │   ├── /dashboard/shopify/orders
│   │   ├── /dashboard/shopify/inventory
│   │   ├── /dashboard/shopify/analytics
│   │   └── /dashboard/shopify/settings
│   │
│   ├── 🎵 TIKTOK SHOP
│   │   ├── /dashboard/tiktok (TikTok Dashboard)
│   │   ├── /dashboard/tiktok/products
│   │   ├── /dashboard/tiktok/orders
│   │   ├── /dashboard/tiktok/inventory
│   │   ├── /dashboard/tiktok/analytics
│   │   └── /dashboard/tiktok/settings
│   │
│   ├── 🤖 AI ASISTAN
│   │   ├── /dashboard/ai (AI Chat Ana Sayfa)
│   │   ├── /dashboard/ai/history (Geçmiş Konuşmalar)
│   │   └── /dashboard/ai/templates (Hazır Sorgular)
│   │
│   ├── 📊 ANALİTİK (Cross-Platform)
│   │   ├── /dashboard/analytics (Genel Analitik)
│   │   ├── /dashboard/analytics/compare (Platform Karşılaştırma)
│   │   ├── /dashboard/analytics/trends (Trendler)
│   │   └── /dashboard/analytics/reports (Raporlar)
│   │
│   ├── 💰 FİNANS
│   │   ├── /dashboard/finances (Genel Finansal)
│   │   ├── /dashboard/finances/profit-loss (Kar/Zarar)
│   │   ├── /dashboard/finances/expenses (Giderler)
│   │   └── /dashboard/finances/cogs (Maliyet Girişi)
│   │
│   ├── 📱 BİLDİRİMLER
│   │   ├── /dashboard/notifications (Bildirim Merkezi)
│   │   ├── /dashboard/notifications/whatsapp (WhatsApp Ayarları)
│   │   └── /dashboard/notifications/alerts (Alarm Kuralları)
│   │
│   └── ⚙️ AYARLAR
│       ├── /dashboard/settings (Genel Ayarlar)
│       ├── /dashboard/settings/profile (Profil)
│       ├── /dashboard/settings/billing (Fatura/Abonelik)
│       ├── /dashboard/settings/integrations (Entegrasyonlar)
│       ├── /dashboard/settings/team (Takım Üyeleri)
│       └── /dashboard/settings/api (API Erişimi)
│
└── 👑 ADMIN (Sadece Admin)
    ├── /admin (Admin Dashboard)
    ├── /admin/users (Kullanıcı Yönetimi)
    ├── /admin/subscriptions (Abonelikler)
    ├── /admin/analytics (Platform Analitiği)
    ├── /admin/support (Destek Talepleri)
    ├── /admin/logs (Sistem Logları)
    └── /admin/settings (Admin Ayarları)
```

---

## 🛒 PAZARYERI DASHBOARD'LARI

### Her Pazaryeri İçin Standart Bileşenler

Her pazaryeri dashboard'u şu bölümlerden oluşur:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Platform Logo] Amazon Dashboard              [AI Chat] [⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 ÖZET KARTLARI (5 Zaman Dilimi)                      │   │
│  │  [Bugün] [Dün] [7 Gün] [30 Gün] [Bu Ay]                │   │
│  │   Net Kar, Satış, Sipariş, Margin, ACOS                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  📈 SATIŞ GRAFİĞİ    │  │  💰 KAR GRAFİĞİ      │           │
│  │  (Son 30 gün)        │  │  (Son 30 gün)        │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  🏆 TOP ÜRÜNLER      │  │  ⚠️ UYARILAR        │           │
│  │  (En karlı 10)       │  │  Stok, ACOS, vs.    │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📦 SON SİPARİŞLER (Bugün)                              │   │
│  │  [Tablo: Sipariş #, Ürün, Miktar, Tutar, Durum]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Platform-Spesifik Özellikler

#### Amazon Dashboard Ek Özellikler:
- FBA vs FBM envanter
- Buy Box durumu
- PPC kampanya performansı
- IPI Score
- Account Health

#### Walmart Dashboard Ek Özellikler:
- WFS (Walmart Fulfillment) metrikleri
- Listing Quality Score
- Pro Seller Badge durumu
- Walmart+ ürünler

#### eBay Dashboard Ek Özellikler:
- Seller Level (Top Rated, etc.)
- Açık artırma vs Sabit fiyat
- Best Offer istatistikleri
- International satışlar

#### Etsy Dashboard Ek Özellikler:
- Star Seller durumu
- Favoriler ve görüntülenme
- Özel sipariş talepleri
- Dijital vs Fiziksel ürün ayrımı

#### Shopify Dashboard Ek Özellikler:
- Kanal bazlı satış (Online, POS, vs.)
- Müşteri LTV (Lifetime Value)
- Cart abandonment oranı
- Traffic kaynakları

#### TikTok Shop Dashboard Ek Özellikler:
- Video bazlı satış performansı
- Influencer/Affiliate satışları
- Live shopping metrikleri
- Trend ürünler

---

## 🤖 AI CHAT SİSTEMİ

### Temel Özellikler

#### 1. Sınırsız Sorgulama (Plan Limitinde)
Her metrik, her veri hakkında soru sorulabilir:

```
👤: Dünkü Amazon satışlarım ne kadar?
🤖: Dün Amazon'da toplam satışınız $2,456.78 (24 sipariş).
    - En çok satan: Yoga Mat ($890)
    - Ortalama sipariş değeri: $102.37
    - Önceki güne göre: +12.3% ↑

👤: Bu ürünün son 30 günlük trendi nasıl?
🤖: [Grafik gösterir]
    Yoga Mat - Son 30 Gün:
    - Satış: $12,450 (+23% vs önceki ay)
    - Birim: 415 adet
    - Margin: 34.5%
    - BSR: #1,234 → #987 (iyileşme!)
```

#### 2. Aksiyon Alabilen AI

```
👤: Ürünlerime maliyet girişi yapmak istiyorum
🤖: Maliyet girişi için 2 seçenek:

    📊 Excel ile Toplu Giriş
       Template indir, doldur, yükle
       [Template İndir]

    ✏️ Tek Tek Giriş
       ASIN bazında manuel gir

    Hangisini tercih edersin?

👤: B08XYZ123 parent ASIN altındaki tüm varyasyonlara $12.50 COGS gir
🤖: B08XYZ123 altında 6 varyasyon buldum:
    - B08XYZ123-BLK (Black)
    - B08XYZ123-WHT (White)
    - B08XYZ123-RED (Red)
    ... (3 daha)

    Hepsine $12.50 COGS atayayım mı?
    [✅ Evet] [❌ İptal]
```

#### 3. Strateji Üretimi

```
👤: Karlılığımı nasıl artırabilirim?
🤖: İşletmenizi analiz ettim. İşte 3 öneri:

    🔴 ACİL (Hemen Yap)
    ─────────────────
    3 ürünün ACOS'u margin'den yüksek:
    • Headphones - ACOS: 42%, Margin: 28% → $234/ay kayıp
    • USB Cable - ACOS: 38%, Margin: 25% → $189/ay kayıp
    Öneri: Bu kampanyaları durdur veya bid düşür
    [Kampanyaları Durdur]

    🟡 ÖNEMLİ (Bu Hafta)
    ─────────────────
    5 ürünün fiyatı rakiplerden düşük:
    • Yoga Mat - Sen: $29.99, Rakip: $34.99
    Öneri: %10 fiyat artışı = +$890/ay kar
    [Fiyatları Güncelle]

    🟢 FIRSAT (Bu Ay)
    ─────────────────
    En karlı 3 ürünün stoku 15 güne bitiyor.
    Öneri: Şimdi sipariş ver, fırsatı kaçırma!
```

#### 4. Sabit Gider Dağıtımı

```
👤: Bu ay $2,500 reklam ajans ücreti ödedim, ürünlere dağıt
🤖: $2,500 sabit gideri nasıl dağıtayım?

    📊 Satış Bazlı (Önerilen)
       Çok satan daha fazla pay alır

    📦 Birim Bazlı
       Her birime eşit

    💰 Gelir Bazlı
       Yüksek gelirli daha fazla pay

👤: Satış bazlı
🤖: Bu ay 1,245 birim sattınız.
    $2,500 / 1,245 = $2.01/birim

    Dağılım:
    ┌─────────────────┬────────┬─────────┐
    │ Ürün            │ Satış  │ Pay     │
    ├─────────────────┼────────┼─────────┤
    │ Yoga Mat        │ 234    │ $470.34 │
    │ Headphones      │ 189    │ $379.89 │
    │ USB Cable       │ 156    │ $313.56 │
    │ ...             │ ...    │ ...     │
    └─────────────────┴────────┴─────────┘

    [✅ Kaydet] [🔄 Farklı Dağıt]
```

#### 5. Cross-Platform Sorgular

```
👤: Hangi platformda margin'im en yüksek?
🤖: Platform Karşılaştırması (Son 30 Gün):

    ┌────────────┬──────────┬────────┬─────────┐
    │ Platform   │ Satış    │ Kar    │ Margin  │
    ├────────────┼──────────┼────────┼─────────┤
    │ 🏆 Etsy    │ $8,450   │ $3,125 │ 37.0%   │
    │ Shopify    │ $15,230  │ $4,873 │ 32.0%   │
    │ Amazon     │ $45,678  │ $12,456│ 27.3%   │
    │ eBay       │ $12,340  │ $2,961 │ 24.0%   │
    │ Walmart    │ $23,450  │ $4,924 │ 21.0%   │
    │ TikTok     │ $5,670   │ $1,077 │ 19.0%   │
    └────────────┴──────────┴────────┴─────────┘

    💡 Etsy'de margin yüksek ama hacim düşük.
       Amazon'da hacim yüksek ama margin düşük.
       Öneri: Amazon'da fiyat optimizasyonu yap.
```

### AI Chat UI Tasarımı

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Asistan                                    [Geçmiş] [?] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Token: 1.2M / 2.5M ████████░░░░░░░░░░░░░ 48%             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💡 Hazır Sorgular:                                        │ │
│  │ [Dünkü satışlar] [Stok durumu] [En karlı ürünler]        │ │
│  │ [ACOS analizi] [Maliyet girişi] [Kar artırma önerileri]  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ╭─────────────────────────────────────────────────────────╮   │
│  │ 👤 Geçen ay en karlı 5 ürünüm hangisi?                  │   │
│  ╰─────────────────────────────────────────────────────────╯   │
│                                                                 │
│  ╭─────────────────────────────────────────────────────────╮   │
│  │ 🤖 İşte geçen ayın en karlı 5 ürünü:                    │   │
│  │                                                          │   │
│  │ 1. Yoga Mat Pro - $2,345 kar (34% margin)               │   │
│  │ 2. Wireless Headphones - $1,890 kar (28% margin)        │   │
│  │ 3. USB-C Cable 6ft - $1,234 kar (45% margin)            │   │
│  │ 4. Phone Stand - $987 kar (52% margin)                  │   │
│  │ 5. Laptop Sleeve - $876 kar (31% margin)                │   │
│  │                                                          │   │
│  │ 💡 USB-C Cable en yüksek margin'e sahip.                │   │
│  │    Bu kategoride daha fazla ürün eklemeyi düşün.        │   │
│  ╰─────────────────────────────────────────────────────────╯   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💬 Mesajınızı yazın...                          [Gönder] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👑 ADMIN PANELİ

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  👑 SellerGenix Admin                              [Çıkış]     │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│ 📊 Dashboard│  KPI KARTLARI                                    │
│ 👥 Users   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ 💳 Subs    │  │ Toplam   │ │ Aktif    │ │ MRR      │ │ Churn│ │
│ 📈 Analytics│ │ 1,234    │ │ 987      │ │ $38,450  │ │ 2.1% │ │
│ 🎫 Support │  │ kullanıcı│ │ (30 gün) │ │ /ay      │ │      │ │
│ 📝 Logs    │  └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│ ⚙️ Settings│                                                    │
│            │  ┌─────────────────────────────────────────────┐  │
│            │  │ 📈 MRR TRENDİ (Son 12 Ay)                   │  │
│            │  │ [Grafik]                                     │  │
│            │  └─────────────────────────────────────────────┘  │
│            │                                                    │
│            │  ┌─────────────────────┐ ┌─────────────────────┐  │
│            │  │ 🆕 YENİ KAYITLAR    │ │ ⚠️ DESTEK TALEPLERİ │  │
│            │  │ Bugün: 15           │ │ Açık: 8             │  │
│            │  │ Bu hafta: 89        │ │ Bekleyen: 3         │  │
│            │  └─────────────────────┘ └─────────────────────┘  │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

### Admin Sayfaları Detayı

#### 1. Kullanıcı Yönetimi (/admin/users)

```
Özellikler:
- Kullanıcı listesi (arama, filtreleme)
- Kullanıcı detay sayfası
- Plan değiştirme
- Token limiti ayarlama
- Hesap askıya alma/aktifleştirme
- Kullanıcı olarak giriş yapma (impersonate)
- Export (CSV)
```

#### 2. Abonelik Yönetimi (/admin/subscriptions)

```
Özellikler:
- Aktif abonelikler listesi
- Gelir raporları (MRR, ARR, Churn)
- Failed payment takibi
- Manuel abonelik oluşturma
- Kupon/indirim yönetimi
- Stripe dashboard bağlantısı
```

#### 3. Platform Analitiği (/admin/analytics)

```
Özellikler:
- Kullanıcı büyümesi grafikleri
- AI kullanım istatistikleri
- Platform bazlı kullanım
- API kullanım metrikleri
- Maliyetler ve marjlar
- Kohort analizi
```

#### 4. Destek Talepleri (/admin/support)

```
Özellikler:
- Ticket listesi
- Öncelik sıralaması
- Atama ve etiketleme
- Canned responses
- Kullanıcı geçmişi görüntüleme
- Intercom/Zendesk entegrasyonu
```

#### 5. Sistem Logları (/admin/logs)

```
Özellikler:
- API request logları
- Error logları
- Auth logları
- AI query logları
- Platform sync logları
- Real-time log streaming
```

---

## 🔐 AUTH SİSTEMİ (Giriş/Kayıt)

### Giriş Sayfası (/login)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     [SellerGenix Logo]                          │
│                                                                 │
│              Welcome Back to SellerGenix                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📧 Email                                                │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ john@example.com                                    ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  🔒 Password                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ ••••••••••••                           [👁️]        ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  [✓] Remember me              [Forgot password?]        │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │              🚀 Sign In                             ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  │                                                          │   │
│  │  ──────────────── or continue with ────────────────     │   │
│  │                                                          │   │
│  │  [G Google]  [🍎 Apple]  [📘 Facebook]                  │   │
│  │                                                          │   │
│  │  Don't have an account? [Sign up]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Kayıt Sayfası (/register)

```
Adımlar:
1. Email + Şifre
2. İşletme Bilgileri (opsiyonel)
3. Plan Seçimi
4. Ödeme Bilgileri (Trial için CC istenmez)
5. Email Doğrulama
```

### Onboarding Sihirbazı (/onboarding)

```
┌─────────────────────────────────────────────────────────────────┐
│  🎉 Welcome to SellerGenix!                    Step 2 of 4     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Connect Your First Marketplace                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │ │
│  │  │ Amazon  │  │ Walmart │  │  eBay   │  │  Etsy   │      │ │
│  │  │ [✓]     │  │ [ ]     │  │ [ ]     │  │ [ ]     │      │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │ │
│  │                                                            │ │
│  │  ┌─────────┐  ┌─────────┐                                 │ │
│  │  │ Shopify │  │ TikTok  │                                 │ │
│  │  │ [ ]     │  │ [ ]     │                                 │ │
│  │  └─────────┘  └─────────┘                                 │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💡 Tip: Start with your primary marketplace.                   │
│     You can add more anytime from Settings.                     │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ ← Back          │  │            Continue →                │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💎 FİYATLANDIRMA STRATEJİSİ

### Plan Yapısı

| Özellik | Starter | Pro | Business | Enterprise |
|---------|---------|-----|----------|------------|
| **Fiyat (Aylık)** | $19 | $39 | $79 | $199 |
| **Fiyat (Yıllık)** | $15/ay | $31/ay | $63/ay | $159/ay |
| **Platformlar** | 1 | 3 | 6 | Sınırsız |
| **Sipariş/Ay** | 3,000 | 10,000 | 30,000 | Sınırsız |
| **Kullanıcılar** | 1 | 3 | 10 | Sınırsız |
| **AI Token/Ay** | 500K | 2.5M | 10M | 50M |
| **AI Sorgu (yaklaşık)** | ~100 | ~500 | ~2,000 | ~10,000 |
| **WhatsApp** | ❌ | ✅ | ✅ | ✅ |
| **Rakip Takibi** | ❌ | 10 ürün | 100 ürün | Sınırsız |
| **API Erişimi** | ❌ | ❌ | ✅ | ✅ |
| **Öncelikli Destek** | ❌ | ❌ | ✅ | ✅ (7/24) |
| **Custom Reports** | ❌ | ❌ | ❌ | ✅ |

### Karlılık Analizi (Kullanıcı Başına)

| Plan | Fiyat | Maliyet | Brüt Kar | Margin |
|------|-------|---------|----------|--------|
| Starter | $19 | ~$3.50 | $15.50 | 82% |
| Pro | $39 | ~$5.00 | $34.00 | 87% |
| Business | $79 | ~$12.00 | $67.00 | 85% |
| Enterprise | $199 | ~$25.00 | $174.00 | 87% |

### Free Trial Stratejisi

- **Süre:** 14 gün
- **Kredi Kartı:** Gerekli değil
- **Limitler:** Pro plan özellikleri
- **Sonrası:** Otomatik Starter'a düşer (ödeme yapılmazsa)

---

## 🔧 TEKNİK MİMARİ

### Tech Stack

```
Frontend:
├── Next.js 15 (App Router)
├── TypeScript
├── Tailwind CSS
├── Shadcn/ui
├── Framer Motion
└── Recharts

Backend:
├── Next.js API Routes
├── Supabase (PostgreSQL)
├── Supabase Auth
├── Redis (Cache - Upstash)
└── Supabase Edge Functions

AI:
├── Claude API (Anthropic)
├── LangChain (Orchestration)
└── Pinecone (Vector DB - opsiyonel)

Integrations:
├── Amazon SP-API
├── Walmart Marketplace API
├── eBay Sell API
├── Etsy Open API
├── Shopify Admin API
├── TikTok Shop API
├── Twilio (WhatsApp)
├── Oxylabs (Scraping)
└── Stripe (Payments)

Deployment:
├── Vercel (Hosting)
├── Supabase (Database)
├── Upstash (Redis)
└── Cloudflare (CDN/WAF)
```

### Veritabanı Şeması (Ana Tablolar)

```sql
-- Kullanıcılar
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  company_name TEXT,
  plan TEXT DEFAULT 'starter',
  ai_tokens_used INTEGER DEFAULT 0,
  ai_tokens_limit INTEGER DEFAULT 500000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform bağlantıları
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT, -- 'amazon', 'walmart', 'ebay', 'etsy', 'shopify', 'tiktok'
  credentials JSONB, -- encrypted
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ
);

-- Ürünler (unified)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT,
  platform_product_id TEXT,
  title TEXT,
  price DECIMAL,
  cogs DECIMAL,
  quantity INTEGER,
  created_at TIMESTAMPTZ
);

-- Siparişler (unified)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT,
  platform_order_id TEXT,
  order_date TIMESTAMPTZ,
  total DECIMAL,
  items JSONB
);

-- AI konuşmaları
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  messages JSONB[],
  tokens_used INTEGER,
  created_at TIMESTAMPTZ
);

-- Sabit giderler
CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  amount DECIMAL,
  period_start DATE,
  period_end DATE,
  distribution_method TEXT
);
```

---

## 🎨 TASARIM SİSTEMİ (DESIGN SYSTEM)

### Marka Kimliği

**Logo:** "SG" monogram + yükselen grafik (growth) + DNA sarmalı (genix)
**Slogan:** "Where Smart Sellers Grow"
**Ton:** Professional, AI-forward, Premium ama accessible

### Renk Paleti

```css
/* Primary Colors */
--primary-blue: #0085c3;      /* CTA buttons, links, highlights */
--primary-dark: #006094;      /* Hover states */
--primary-light: #e6f4fa;     /* Backgrounds */

/* Success/Profit */
--success-green: #22c55e;     /* Positive metrics, profit */
--success-dark: #16a34a;      /* Hover */
--success-light: #dcfce7;     /* Success backgrounds */

/* Warning/Attention */
--warning-amber: #f59e0b;     /* Warnings, attention needed */
--warning-dark: #d97706;      /* Hover */
--warning-light: #fef3c7;     /* Warning backgrounds */

/* Danger/Loss */
--danger-red: #ef4444;        /* Errors, negative metrics, loss */
--danger-dark: #dc2626;       /* Hover */
--danger-light: #fee2e2;      /* Error backgrounds */

/* Neutral */
--gray-900: #111827;          /* Primary text */
--gray-700: #374151;          /* Secondary text */
--gray-500: #6b7280;          /* Muted text */
--gray-300: #d1d5db;          /* Borders */
--gray-100: #f3f4f6;          /* Light backgrounds */
--white: #ffffff;             /* Cards, backgrounds */

/* Dark Mode */
--dark-bg: #0a0f1c;           /* Main background */
--dark-surface: #1a1f2e;      /* Cards */
--dark-border: #2d3748;       /* Borders */
```

### Typography

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Headings */
h1: 36px/44px, font-weight: 700 (bold)
h2: 30px/38px, font-weight: 700
h3: 24px/32px, font-weight: 600 (semibold)
h4: 20px/28px, font-weight: 600
h5: 16px/24px, font-weight: 600

/* Body */
body-lg: 18px/28px, font-weight: 400
body: 16px/24px, font-weight: 400
body-sm: 14px/20px, font-weight: 400

/* Metrics */
metric-xl: 48px/56px, font-weight: 700 (for main dashboard numbers)
metric-lg: 36px/44px, font-weight: 700
metric-md: 24px/32px, font-weight: 600
metric-sm: 18px/24px, font-weight: 600
```

### Spacing System

```css
/* Base: 4px */
space-1: 4px    /* Micro */
space-2: 8px    /* Extra small */
space-3: 12px   /* Small */
space-4: 16px   /* Default */
space-5: 20px   /* Medium */
space-6: 24px   /* Large */
space-8: 32px   /* Extra large */
space-10: 40px  /* Huge */
space-12: 48px  /* Section gaps */
space-16: 64px  /* Major sections */
```

### Component Styles

#### Buttons

```jsx
/* Primary Button */
<button className="bg-primary-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl">
  Start Free Trial
</button>

/* Secondary Button */
<button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:border-primary-blue hover:text-primary-blue transition-all">
  Learn More
</button>

/* Ghost Button */
<button className="text-primary-blue px-4 py-2 rounded-lg font-medium hover:bg-primary-light transition-all">
  View Details
</button>
```

#### Cards

```jsx
/* Standard Card */
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
  {/* Content */}
</div>

/* Metric Card */
<div className="bg-gradient-to-br from-primary-blue to-primary-dark rounded-2xl p-6 text-white">
  <p className="text-sm opacity-80">Net Profit</p>
  <p className="text-3xl font-bold mt-2">$12,456</p>
  <p className="text-sm mt-2 flex items-center">
    <TrendingUp className="w-4 h-4 mr-1" />
    +15.3% vs last week
  </p>
</div>
```

### Animation Guidelines

```css
/* Transitions */
transition-fast: 150ms ease-out    /* Micro interactions */
transition-normal: 200ms ease-out  /* Button hovers */
transition-slow: 300ms ease-out    /* Card hovers, modals */

/* Hover Effects */
hover:scale-[1.02]                 /* Subtle lift */
hover:shadow-lg                    /* Depth increase */
hover:-translate-y-0.5             /* Float effect */
```

---

## 🏠 LANDING PAGE TASARIMI

### Sayfa Yapısı

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NAVIGATION BAR                                   │
│  [Logo]     Features   Pricing   Blog   Login    [Start Free Trial]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              HERO SECTION                                     │
│                                                                               │
│    ┌─────────────────────────────────┐  ┌──────────────────────────────┐    │
│    │                                 │  │                              │    │
│    │  Transform Your E-commerce     │  │    [Dashboard Preview]       │    │
│    │  Business with AI-Powered      │  │    [Animated mockup]         │    │
│    │  Analytics                      │  │                              │    │
│    │                                 │  │                              │    │
│    │  Unified dashboard for Amazon, │  │                              │    │
│    │  Walmart, Shopify, eBay, Etsy, │  │                              │    │
│    │  and TikTok Shop. AI assistant │  │                              │    │
│    │  included.                      │  │                              │    │
│    │                                 │  │                              │    │
│    │  [Start 14-Day Free Trial]     │  │                              │    │
│    │  No credit card required        │  │                              │    │
│    │                                 │  └──────────────────────────────┘    │
│    └─────────────────────────────────┘                                       │
│                                                                               │
│    Trusted by 10,000+ sellers worldwide                                      │
│    [Amazon] [Walmart] [Shopify] [eBay] [Etsy] [TikTok]                      │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              FEATURES GRID                                    │
│                                                                               │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │
│    │ 📊 Multi-Platform│ │ 🤖 AI Assistant │ │ 📱 WhatsApp     │             │
│    │    Dashboard     │ │                  │ │    Alerts       │             │
│    │                  │ │ Ask anything     │ │                  │             │
│    │ All 6 platforms │ │ about your data. │ │ Daily summaries, │             │
│    │ in one place.   │ │ Get strategies.  │ │ stock alerts.    │             │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘             │
│                                                                               │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐             │
│    │ 💰 Profit       │ │ 📈 PPC          │ │ 🎯 Competitor    │             │
│    │    Tracking     │ │    Analytics     │ │    Tracking      │             │
│    │                  │ │                  │ │                  │             │
│    │ Real profit,    │ │ Optimize ads,    │ │ Track prices,   │             │
│    │ not just sales. │ │ reduce ACOS.     │ │ BSR, reviews.   │             │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘             │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              AI CHAT SHOWCASE                                 │
│                                                                               │
│    "Your AI Business Analyst - Available 24/7"                               │
│                                                                               │
│    ┌───────────────────────────────────────────────────────────────────┐    │
│    │                                                                     │    │
│    │  👤: What was my most profitable product last month?               │    │
│    │                                                                     │    │
│    │  🤖: Your most profitable product in December was the              │    │
│    │      "Premium Yoga Mat" with:                                       │    │
│    │      • Net Profit: $4,567                                          │    │
│    │      • Units Sold: 234                                              │    │
│    │      • Profit Margin: 38%                                          │    │
│    │                                                                     │    │
│    │      Would you like me to analyze why this product                 │    │
│    │      performed so well?                                             │    │
│    │                                                                     │    │
│    │  ┌─────────────────────────────────────────────────────────┐      │    │
│    │  │ Ask me anything...                              [Send] │      │    │
│    │  └─────────────────────────────────────────────────────────┘      │    │
│    │                                                                     │    │
│    └───────────────────────────────────────────────────────────────────┘    │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              PRICING SECTION                                  │
│                                                                               │
│    Choose Your Plan                                                          │
│    [Monthly]  [Yearly - Save 20%]                                           │
│                                                                               │
│    ┌───────────┐ ┌─────────────────┐ ┌───────────┐ ┌───────────┐           │
│    │  STARTER  │ │   PROFESSIONAL  │ │ BUSINESS  │ │ENTERPRISE │           │
│    │           │ │   ★ POPULAR ★   │ │           │ │           │           │
│    │   $19/mo  │ │     $39/mo      │ │   $79/mo  │ │  $499/mo  │           │
│    │           │ │                 │ │           │ │           │           │
│    │ 1 Platform│ │ 3 Platforms     │ │6 Platforms│ │ Unlimited │           │
│    │ 500 AI/mo │ │ 2,500 AI/mo     │ │10K AI/mo  │ │ 50K AI/mo │           │
│    │ 1 User    │ │ 3 Users         │ │ 10 Users  │ │ Unlimited │           │
│    │           │ │ WhatsApp ✓      │ │ API ✓     │ │ Dedicated │           │
│    │           │ │ Competitor ✓    │ │ Priority  │ │ Support   │           │
│    │ [Start]   │ │ [Start Trial]   │ │ [Start]   │ │ [Contact] │           │
│    └───────────┘ └─────────────────┘ └───────────┘ └───────────┘           │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              TESTIMONIALS                                     │
│                                                                               │
│    "SellerGenix paid for itself in the first week. The AI found            │
│     $3,000 in wasted ad spend I never would have noticed."                  │
│                                                                               │
│    — John D., 7-Figure Amazon Seller                                         │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                              CTA SECTION                                      │
│                                                                               │
│    Ready to Grow Your E-commerce Business?                                   │
│                                                                               │
│    [Start Your 14-Day Free Trial]                                           │
│    No credit card required • Cancel anytime                                  │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                              FOOTER                                          │
│  [Logo]  About  Features  Pricing  Blog  Support  Contact                   │
│  Privacy Policy  Terms of Service  Status                                    │
│  © 2026 SellerGenix. All rights reserved.                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hero Section Animasyonları

1. **Dashboard Preview:** Interactive mockup showing real-time data updates
2. **Platform Logos:** Animated entrance, grayscale → color on scroll
3. **Number Counters:** "10,000+ sellers" animated counter
4. **Floating Elements:** Subtle profit numbers floating up

---

## 🔐 GİRİŞ EKRANLARI (AUTH PAGES)

### Login Page (/login)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │                             │  │                                     │   │
│  │    [Animated Illustration]   │  │         [SellerGenix Logo]          │   │
│  │                             │  │                                     │   │
│  │    Dashboard visualization   │  │     Welcome Back!                   │   │
│  │    with floating metrics    │  │     Sign in to continue             │   │
│  │                             │  │                                     │   │
│  │    "AI-Powered Analytics"   │  │  ┌─────────────────────────────┐   │   │
│  │    "For Smart Sellers"      │  │  │ 📧 Email                    │   │   │
│  │                             │  │  │ john@example.com            │   │   │
│  │                             │  │  └─────────────────────────────┘   │   │
│  │                             │  │                                     │   │
│  │    ┌───────────────────┐    │  │  ┌─────────────────────────────┐   │   │
│  │    │ ★★★★★ 4.9/5       │    │  │  │ 🔒 Password        [👁️]    │   │   │
│  │    │ 2,500+ Reviews    │    │  │  │ ••••••••••••                │   │   │
│  │    └───────────────────┘    │  │  └─────────────────────────────┘   │   │
│  │                             │  │                                     │   │
│  └─────────────────────────────┘  │  ┌─────────────────────────────────┐ │   │
│                                   │  │ ☑ Remember me                   │ │   │
│                                   │  │                Forgot password? │ │   │
│                                   │  └─────────────────────────────────┘ │   │
│                                   │                                     │   │
│                                   │  ┌─────────────────────────────────┐ │   │
│                                   │  │        🚀 Sign In               │ │   │
│                                   │  └─────────────────────────────────┘ │   │
│                                   │                                     │   │
│                                   │  ──────── or continue with ────────  │   │
│                                   │                                     │   │
│                                   │  [G Google]  [  Apple]             │   │
│                                   │                                     │   │
│                                   │  Don't have an account?             │   │
│                                   │  [Create free account]              │   │
│                                   │                                     │   │
│                                   └─────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Register Page (/register) - Multi-Step

```
Step 1/4: Account Details
┌─────────────────────────────────────────┐
│  [Progress Bar: ●○○○]                   │
│                                         │
│  Create Your Account                    │
│                                         │
│  📧 Work Email                          │
│  ┌─────────────────────────────────┐   │
│  │ john@company.com                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🔒 Password                            │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••••                     │   │
│  └─────────────────────────────────┘   │
│  ✓ 8+ characters  ✓ 1 uppercase        │
│  ✓ 1 number       ✓ 1 special          │
│                                         │
│  [Continue →]                           │
│                                         │
│  By continuing, you agree to our        │
│  Terms of Service and Privacy Policy    │
│                                         │
│  Already have an account? [Sign in]     │
└─────────────────────────────────────────┘

Step 2/4: Connect Marketplace
┌─────────────────────────────────────────┐
│  [Progress Bar: ●●○○]                   │
│                                         │
│  Connect Your First Marketplace         │
│  You can add more later                 │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Amazon  │ │ Walmart │ │ Shopify │  │
│  │   ✓     │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  eBay   │ │  Etsy   │ │ TikTok  │  │
│  │         │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  [← Back]              [Continue →]     │
│                                         │
│  [Skip for now - I'll connect later]    │
└─────────────────────────────────────────┘

Step 3/4: Business Info (Optional)
┌─────────────────────────────────────────┐
│  [Progress Bar: ●●●○]                   │
│                                         │
│  Tell Us About Your Business            │
│  This helps us personalize your         │
│  experience                             │
│                                         │
│  🏢 Company Name (optional)             │
│  ┌─────────────────────────────────┐   │
│  │ Acme Corp                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💰 Monthly Revenue                     │
│  ┌─────────────────────────────────┐   │
│  │ $10K - $50K          ▼          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📦 Number of Products                  │
│  ┌─────────────────────────────────┐   │
│  │ 50 - 200              ▼          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [← Back]              [Continue →]     │
└─────────────────────────────────────────┘

Step 4/4: Ready!
┌─────────────────────────────────────────┐
│  [Progress Bar: ●●●●]                   │
│                                         │
│         🎉 You're All Set!              │
│                                         │
│  Your 14-day free trial has started     │
│                                         │
│  Here's what you can do:                │
│                                         │
│  ✓ View your real-time dashboard        │
│  ✓ Ask AI about your business           │
│  ✓ Set up WhatsApp alerts               │
│  ✓ Track competitor prices              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     🚀 Go to Dashboard           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [📚 Take a quick tour first]          │
└─────────────────────────────────────────┘
```

---

## 👥 TAKIM YETKİLENDİRME SİSTEMİ

### Team Management (/dashboard/settings/team)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Team Members                                     Plan: Business (10 users)  │
│                                                   [Upgrade for more]         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [+ Invite Team Member]                          Using: 4/10 seats    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Member              │ Role         │ Platforms    │ Status  │ Actions  ││
│  ├─────────────────────┼──────────────┼──────────────┼─────────┼──────────┤│
│  │ 👤 John Smith (You) │ 👑 Owner     │ All          │ Active  │ -        ││
│  │ john@company.com    │              │              │         │          ││
│  ├─────────────────────┼──────────────┼──────────────┼─────────┼──────────┤│
│  │ 👤 Sarah Johnson    │ Admin        │ All          │ Active  │ [⚙️] [🗑️]││
│  │ sarah@company.com   │              │              │         │          ││
│  ├─────────────────────┼──────────────┼──────────────┼─────────┼──────────┤│
│  │ 👤 Mike Chen        │ Analyst      │ Amazon, eBay │ Active  │ [⚙️] [🗑️]││
│  │ mike@company.com    │              │              │         │          ││
│  ├─────────────────────┼──────────────┼──────────────┼─────────┼──────────┤│
│  │ 👤 Lisa Wong        │ PPC Manager  │ Amazon       │ Pending │ [⚙️] [🗑️]││
│  │ lisa@company.com    │              │              │         │          ││
│  └─────────────────────┴──────────────┴──────────────┴─────────┴──────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rol Tanımları

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| **👑 Owner** | Hesap sahibi | Tüm yetkiler, silme dahil |
| **Admin** | Yönetici | Üye ekleme/çıkarma, ayarlar |
| **Analyst** | Analist | Tüm verileri görme, export |
| **PPC Manager** | PPC Yöneticisi | Sadece reklam verileri |
| **Viewer** | İzleyici | Sadece görüntüleme |
| **Custom** | Özel | Manuel yetki atama |

### Yetki Matrisi

| Yetki | Owner | Admin | Analyst | PPC | Viewer |
|-------|-------|-------|---------|-----|--------|
| Dashboard görüntüleme | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Chat kullanma | ✅ | ✅ | ✅ | ✅ | ❌ |
| Maliyet girişi (COGS) | ✅ | ✅ | ✅ | ❌ | ❌ |
| PPC verilerini görme | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export (CSV/Excel) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Bildirim ayarları | ✅ | ✅ | ❌ | ❌ | ❌ |
| Üye ekleme/çıkarma | ✅ | ✅ | ❌ | ❌ | ❌ |
| Fatura/Abonelik | ✅ | ❌ | ❌ | ❌ | ❌ |
| Platform bağlama | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hesabı silme | ✅ | ❌ | ❌ | ❌ | ❌ |

### Platform Bazlı Erişim

Her takım üyesi için ayrı ayrı platform erişimi verilebilir:

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Member: Mike Chen                                          │
│                                                                   │
│  Role: [Analyst          ▼]                                      │
│                                                                   │
│  Platform Access:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ☑ Amazon       ☑ eBay        ☐ Shopify                     │ │
│  │ ☐ Walmart      ☐ Etsy        ☐ TikTok Shop                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  AI Chat Access: [Enabled ▼]    Token Limit: [Shared ▼]         │
│                                                                   │
│  [Cancel]                                   [Save Changes]       │
└─────────────────────────────────────────────────────────────────┘
```

### Veritabanı Şeması (Team)

```sql
-- Takım üyeleri
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'viewer', -- owner, admin, analyst, ppc_manager, viewer, custom
  platforms TEXT[], -- ['amazon', 'ebay']
  permissions JSONB, -- {"ai_chat": true, "export": true, ...}
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Davet linkleri
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💼 ENTERPRISE API ÜCRETLENDİRME

### Enterprise Plan API Erişimi

Enterprise planında **dahil** API erişimi:
- 50,000 AI sorgu/ay
- Webhook entegrasyonları
- Gerçek zamanlı veri akışı
- Custom report API

### Ek API Kullanımı (Aşım Durumunda)

| Kaynak | Dahil (Enterprise) | Ek Kullanım Ücreti |
|--------|-------------------|-------------------|
| **AI Sorgu** | 50,000/ay | $0.008/sorgu |
| **API Call** | 100,000/ay | $0.002/call |
| **Export Request** | 1,000/ay | $0.05/export |
| **Webhook Event** | Sınırsız | Ücretsiz |
| **Real-time Stream** | 10 concurrent | $50/ay/ek stream |

### API Fiyatlandırma Örnekleri

| Senaryo | Dahil | Ek Kullanım | Toplam Ek Maliyet |
|---------|-------|-------------|-------------------|
| Normal kullanım | 50K sorgu | 0 | $0 |
| Yoğun kullanım | 50K sorgu | +25K sorgu | +$200/ay |
| Çok yoğun | 50K sorgu | +100K sorgu | +$800/ay |

### Enterprise Custom Pricing

Ayda 100K+ sorgu için özel fiyatlandırma:

| Seviye | Sorgu/Ay | Fiyat/Sorgu | Aylık Fiyat |
|--------|----------|-------------|-------------|
| Tier 1 | 100K | $0.006 | $600 base |
| Tier 2 | 250K | $0.005 | $1,250 base |
| Tier 3 | 500K | $0.004 | $2,000 base |
| Tier 4 | 1M+ | $0.003 | Contact sales |

---

## 🤖 AI BOT KONUMLANDIRMA VE UX

### AI Chat Pozisyonu: **Sayfanın Alt Kısmında, Her Zaman Hazır**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                           [MAIN DASHBOARD CONTENT]                           │
│                                                                               │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│   │  Today's Sales  │  │  Net Profit     │  │  Orders         │             │
│   │    $12,456      │  │    $4,567       │  │    234          │             │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                               │
│   [More dashboard content...]                                                 │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ╔══════════════════════════════════════════════════════════════════════╗   │
│  ║  🤖 AI ASSISTANT                                    [Token: 48%] [↑] ║   │
│  ╠══════════════════════════════════════════════════════════════════════╣   │
│  ║                                                                       ║   │
│  ║  💡 Quick Actions:                                                   ║   │
│  ║  [📊 Sales Report] [💰 Profit Analysis] [📦 Stock Check] [📈 ACOS]  ║   │
│  ║                                                                       ║   │
│  ║  ┌───────────────────────────────────────────────────────────────┐  ║   │
│  ║  │ 💬 Ask me anything about your business...            [🎤][📎] │  ║   │
│  ║  └───────────────────────────────────────────────────────────────┘  ║   │
│  ║                                                                       ║   │
│  ╚══════════════════════════════════════════════════════════════════════╝   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### AI Chat Durumları

#### 1. Collapsed State (Varsayılan)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI Assistant  │  💬 Ask anything...                    │  [Token: 48%]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2. Expanded State (Tıklanınca veya yazmaya başlayınca)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI Assistant                                           [Token: 48%] [✕] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  👤 What was my most profitable product last week?                      ││
│  │                                                                          ││
│  │  🤖 Based on your Amazon data, your most profitable product             ││
│  │     last week was:                                                       ││
│  │                                                                          ││
│  │     🏆 Premium Yoga Mat - Cork Edition                                  ││
│  │     • Revenue: $8,456                                                   ││
│  │     • Net Profit: $2,890                                                ││
│  │     • Units: 145                                                         ││
│  │     • Margin: 34.2%                                                     ││
│  │                                                                          ││
│  │     💡 Tip: Stock is running low (23 units). Consider restocking.      ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  💡 Quick Actions:                                                           │
│  [📦 Restock Alert] [📊 Detailed Report] [🔍 Compare Products]              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 💬 Ask a follow-up question...                              [🎤] [📎]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3. Full-Screen Mode (Modal)
Kompleks analizler veya büyük tablolar için tam ekran modal.

### AI Chat Özellikleri

1. **Sticky Position:** Her zaman görünür, scroll etse de sabit
2. **Keyboard Shortcut:** `Cmd/Ctrl + K` ile hızlı açılır
3. **Voice Input:** Mikrofon butonu ile sesli soru
4. **File Upload:** Dosya ekleme (Excel COGS import)
5. **Quick Actions:** Sık kullanılan sorgular için butonlar
6. **Token Indicator:** Kalan token göstergesi
7. **History:** Önceki konuşmalara erişim
8. **Context Aware:** Hangi sayfadaysa ona göre öneriler

### Mobile Deneyim

```
Mobile (< 768px):
┌────────────────────────┐
│                        │
│   [Dashboard Content]   │
│                        │
├────────────────────────┤
│  🤖 AI                 │
│  ┌────────────────┐   │
│  │ Ask anything... │   │
│  └────────────────┘   │
│  [📊][💰][📦][📈]     │
└────────────────────────┘
```

- Mobilde bottom sheet olarak açılır
- Swipe up ile genişler
- Swipe down ile kapanır

---

## 📅 GELİŞTİRME YOL HARİTASI

### Faz 1: Temel Altyapı (Hafta 1-2)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| Mevcut kodu temizle, fresh start | 1 | 🔴 |
| Auth sistemi (Supabase) | 2 | 🔴 |
| Database schema | 1 | 🔴 |
| Base layout ve navigation | 2 | 🔴 |
| Landing page | 2 | 🟡 |
| Login/Register sayfaları | 2 | 🔴 |

### Faz 2: Dashboard Core (Hafta 3-4)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| Genel dashboard (özet) | 2 | 🔴 |
| Amazon dashboard | 3 | 🔴 |
| Amazon OAuth entegrasyonu | 2 | 🔴 |
| Ürün listesi sayfası | 2 | 🔴 |
| Sipariş listesi sayfası | 2 | 🔴 |

### Faz 3: AI Chat (Hafta 5-6)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| Claude API entegrasyonu | 2 | 🔴 |
| Chat UI | 2 | 🔴 |
| Tool-using AI (aksiyon alma) | 3 | 🔴 |
| Token tracking sistemi | 1 | 🔴 |
| Excel maliyet işleme | 2 | 🟡 |

### Faz 4: Diğer Platformlar (Hafta 7-8)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| Shopify entegrasyonu | 2 | 🟡 |
| Walmart entegrasyonu | 2 | 🟡 |
| eBay entegrasyonu | 2 | 🟡 |
| Etsy entegrasyonu | 2 | 🟢 |
| TikTok Shop entegrasyonu | 2 | 🟢 |

### Faz 5: Bildirimler & Finans (Hafta 9-10)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| WhatsApp entegrasyonu | 3 | 🟡 |
| Bildirim kuralları UI | 2 | 🟡 |
| Kar/Zarar sayfası | 2 | 🟡 |
| Maliyet girişi (COGS) | 2 | 🟡 |
| Sabit gider dağıtımı | 2 | 🟡 |

### Faz 6: Admin & Polish (Hafta 11-12)

| Görev | Gün | Öncelik |
|-------|-----|---------|
| Admin paneli | 3 | 🟡 |
| Stripe entegrasyonu | 2 | 🔴 |
| Fiyatlandırma sayfası | 2 | 🔴 |
| Onboarding sihirbazı | 2 | 🟡 |
| Final test ve bug fix | 3 | 🔴 |

---

## ✅ SONUÇ

### Toplam Geliştirme Süresi: ~12 Hafta (3 Ay)

### Lansman Öncesi Checklist:

- [ ] Auth sistemi çalışıyor
- [ ] En az 1 platform entegre (Amazon)
- [ ] AI Chat çalışıyor (token limitli)
- [ ] WhatsApp bildirimleri çalışıyor
- [ ] Stripe ödeme sistemi çalışıyor
- [ ] Admin paneli hazır
- [ ] Landing page live
- [ ] 10 beta kullanıcı testi tamamlandı

### Başarı Metrikleri (İlk 6 Ay):

| Metrik | Hedef |
|--------|-------|
| Kayıtlı Kullanıcı | 1,000 |
| Ödeme Yapan | 200 |
| MRR | $8,000 |
| Churn Rate | < 5% |
| NPS | > 50 |

---

**Bu döküman SellerGenix projesinin ana referans kaynağıdır. Tüm geliştirmeler bu plana göre yapılmalıdır.**

**Sorular için:** Claude'a danışın veya CLAUDE.md'yi güncelleyin.
