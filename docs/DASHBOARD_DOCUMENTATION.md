# SellerGenix Dashboard - Kapsamlı Dokümantasyon

**Son Güncelleme:** 21 Aralık 2025
**Versiyon:** 1.0

---

## 📊 DASHBOARD GENEL BAKIŞ

SellerGenix Dashboard, Amazon satıcıları için tasarlanmış profesyonel bir analitik platformdur. Dashboard, tüm önemli metrikleri tek ekranda sunar ve satıcıların işletme sağlığını, envanter durumunu, kar/zarar analizini ve performans metriklerini gerçek zamanlı olarak takip etmelerini sağlar.

---

## 🎛️ HEADER KONTROLLAR

### 1. Heat Map Butonu
**📍 Konum:** Üst header, sol taraf
**🎯 İşlev:** Bölgesel satış haritasını açar (US eyaletleri bazında)

### 2. Marketplace Seçici
**📍 Konum:** Üst header, globe ikonu ile
**🎯 İşlev:** Hangi Amazon pazaryerinin verilerini göreceğinizi seçersiniz

**Desteklenen Bölgeler ve Pazaryerleri:**

| Bölge | Pazaryeri | Bayrak | Marketplace ID |
|-------|-----------|--------|----------------|
| 🌎 **North America** | United States | 🇺🇸 | ATVPDKIKX0DER |
| | Canada | 🇨🇦 | A2EUQ1WTGCTBG2 |
| | Mexico | 🇲🇽 | A1AM78C64UM0Y8 |
| 🌍 **Europe** | United Kingdom | 🇬🇧 | A1F83G8C2ARO7P |
| | Germany | 🇩🇪 | A1PA6795UKMFR9 |
| | France | 🇫🇷 | A13V1IB3VIYZZH |
| | Italy | 🇮🇹 | APJ6JRA9NG5V4 |
| | Spain | 🇪🇸 | A1RKKUPIHCS9HS |
| | Turkey | 🇹🇷 | A33AVAJ2PDY3EV |
| 🌏 **Asia Pacific** | Japan | 🇯🇵 | A1VC38T7YXB528 |
| 🌎 **South America** | Brazil | 🇧🇷 | A2Q3Y263D00KWC |

**⚠️ Not:** Tek seferde sadece 1 pazaryeri seçilebilir.

### 3. Comparison Period (Karşılaştırma Dönemi)
**📍 Konum:** Üst header, takvim ikonu ile
**🎯 İşlev:** Hangi zaman dilimlerini karşılaştıracağınızı seçersiniz

**Seçenekler:**
| Seçenek | Açıklama |
|---------|----------|
| Today / Yesterday | Bugün vs Dün |
| Today / Yesterday / 7 days ago | 3 dönem karşılaştırma |
| This Week / Last Week | Bu hafta vs Geçen hafta |
| This Month / Last Month | Bu ay vs Geçen ay |
| Today / Yesterday / 2 days ago | Son 3 gün |
| Today / Dün / ... / 8 days ago | Son 8 gün |
| This Q / Last Q / 2Q ago / 3Q ago | 4 çeyrek karşılaştırma |
| Custom Range | Özel tarih aralığı |

### 4. Refresh Butonu
**🔄 İşlev:** Dashboard verilerini yeniler

### 5. Export Butonu
**📥 İşlev:** Dashboard verilerini dışa aktarır

### 6. Ask Me (Bana Sor) - Help Search
**📍 Konum:** Üst header, Heat Map butonunun yanında
**🎯 İşlev:** Dashboard'daki herhangi bir metrik, özellik veya kavramı arayın

**Kısayol:** `Cmd+K` (Mac) veya `Ctrl+K` (Windows)

**Nasıl Kullanılır:**
1. "Ask Me..." butonuna tıklayın veya `Cmd+K` tuşlayın
2. En az 2 karakter yazarak arama yapın
3. Sonuçlar arasında ↑↓ ok tuşları ile gezinin
4. Enter veya tıklama ile detayları açın
5. ESC ile kapatın

**Aranabilir İçerikler:**
| Kategori | İkon | Örnek İçerikler |
|----------|------|-----------------|
| **Metrics** | 📊 | ACOS, ROI, Margin, Profit, IPI, BSR |
| **Features** | ✨ | Heat Map, Export, Marketplace Selector |
| **Alerts** | ⚠️ | Low Stock, High ACOS, Negative Margin |
| **Calculations** | 🧮 | Gross Profit Formula, ACOS Formula |
| **Sections** | 📋 | Business Health, Cash Flow, IPI Section |

**Her Sonuç İçin Gösterilen Bilgiler:**
- Başlık ve kategori
- Detaylı açıklama
- Formül (varsa)
- Örnek hesaplama
- İyi/Kötü değer aralıkları
- Veri kaynağı (Amazon API, Kullanıcı Girişi, Hesaplanan)
- Dashboard'da nerede bulunur
- İpuçları ve öneriler
- İlgili konular

---

## 1️⃣ BUSINESS HEALTH (İşletme Sağlığı)

**📍 Konum:** Sol üst köşe
**🎯 Amaç:** İşletmenizin genel sağlık durumunu tek bir skor ile gösterir

### Metrikler:

| Metrik | Açıklama | Formül/Kaynak |
|--------|----------|---------------|
| **Health Score** | İşletme sağlık puanı (0-100) | Çoklu faktörlerden hesaplanır |
| **Previous Score** | Önceki dönem puanı | Geçen haftanın skoru |
| **Change** | Değişim miktarı | Current - Previous (puan olarak) |

### Renk Kodları:
- 🟢 **Yeşil (80+):** Sağlıklı işletme
- 🟡 **Sarı (60-79):** Dikkat gerektiren işletme
- 🔴 **Kırmızı (<60):** Acil müdahale gerektiren işletme

### Health Score Nasıl Hesaplanır?
Health Score aşağıdaki faktörlerin birleşimidir:
- Profit margin performansı
- IPI skoru
- In-stock oranı
- ACOS seviyesi
- Refund oranı

---

## 2️⃣ CRITICAL ALERTS (Kritik Uyarılar)

**📍 Konum:** Business Health'in yanında
**🎯 Amaç:** Acil dikkat gerektiren durumları gösterir

### Uyarı Tipleri:

| Tip | Renk | İkon | Açıklama |
|-----|------|------|----------|
| **Stock Uyarısı** | 🔴 Kırmızı | ⚠️ | Stok tükenmek üzere |
| **ACOS Uyarısı** | 🟡 Sarı | 📊 | ACOS oranı yükseldi |
| **Review Uyarısı** | 🔵 Mavi | 💬 | Yeni müşteri yorumları |

### Örnek Uyarılar:
- `"Yoga Mat stock running out in 3 days"` → Reorder now
- `"ACOS increased to 38% (Earbuds)"` → Optimize campaign
- `"3 new customer reviews"` → 2 positive, 1 negative

---

## 3️⃣ AI INSIGHTS (Yapay Zeka Önerileri)

**📍 Konum:** Critical Alerts'in yanında
**🎯 Amaç:** AI tabanlı akıllı öneriler sunar

### Öneri Tipleri:

| Tip | Renk | İkon | Örnek |
|-----|------|------|-------|
| **Tasarruf Fırsatı** | 🟢 Yeşil | 💰 | "$2.3K/mo savings opportunity: Increase T-Shirt price by $2" |
| **Trend Analizi** | 🔵 Cyan | 📈 | "Trend: Yoga category growing 45%" |
| **PPC Önerisi** | 🟣 Mor | 🎯 | "PPC: Add new keyword for Desk Lamp" |

---

## 4️⃣ CASH FLOW (Nakit Akışı)

**📍 Konum:** AI Insights'ın yanında
**🎯 Amaç:** Finansal durumunuzu ve beklenen ödemeleri gösterir

### Metrikler:

| Metrik | Açıklama | Renk |
|--------|----------|------|
| **Next Payout** | Bir sonraki ödeme miktarı ve tarihi | 🟢 Yeşil |
| **Pending Settlement** | Bekleyen ödeme | ⬜ Beyaz |
| **Reserve Balance** | Amazon'daki rezerv bakiye | 🟡 Sarı |
| **Available Now** | Şu an çekilebilir miktar | 🟢 Yeşil |

### Formüller:
```
Next Payout = Net Profit × 1.1 (yaklaşık)
Pending Settlement = Sonraki 2 haftalık satışlar
Reserve Balance = Amazon'un tuttuğu güvence
Available Now = Çekilebilir bakiye
```

---

## 5️⃣ INVENTORY PERFORMANCE INDEX (IPI)

**📍 Konum:** Executive Summary'nin altında, geniş kart
**🎯 Amaç:** FBA envanter verimliliğinizi ölçer

### Ana IPI Skoru:

| Metrik | Açıklama | Aralık |
|--------|----------|--------|
| **IPI Score** | Amazon FBA envanter performans skoru | 0-1000 |
| **Minimum** | Storage limit'den kaçınmak için gerekli minimum | 400 |

### Renk Kodları:
- 🟢 **Yeşil (550+):** Mükemmel
- 🟡 **Sarı (400-549):** Kabul edilebilir
- 🔴 **Kırmızı (<400):** Kritik - storage limiti riski

### IPI Alt Metrikleri:

#### 📊 Excess Inventory (Fazla Envanter)
| Alt Metrik | Açıklama |
|------------|----------|
| **% of FBA stock** | Fazla envanterinizin toplam FBA stoğuna oranı |
| **Value** | Fazla envanter değeri ($) |

**Formül:** `Fazla Envanter = 90+ gün satılmayan ürünler`

#### ⚠️ Stranded Inventory (Mahsur Envanter)
| Alt Metrik | Açıklama |
|------------|----------|
| **ASINs** | Satılamayan ASIN sayısı |
| **Value** | Mahsur envanter değeri ($) |

**Açıklama:** Listing sorunu olan, satışa kapalı ürünler

#### ✅ In-Stock Rate (Stokta Olma Oranı)
| Alt Metrik | Açıklama |
|------------|----------|
| **%** | Son 30 günde stokta olma oranı |
| **vs last month** | Geçen aya göre değişim |

**Formül:** `In-Stock Rate = (Stokta olan günler / 30) × 100`

**Renk Kodları:**
- 🟢 90%+ : Mükemmel
- 🟡 80-89%: Kabul edilebilir
- 🔴 <80%: Kritik

#### 🚀 Sell-Through Rate (Satış Hızı)
| Alt Metrik | Açıklama |
|------------|----------|
| **Weeks** | Mevcut envanterin kaç haftada tükeneceği |
| **vs last week** | Geçen haftaya göre değişim |

**Formül:** `Sell-Through = Current Inventory / Weekly Sales`

**Optimal:** 2-8 hafta arası

---

## 6️⃣ MONTHLY GOALS (Aylık Hedefler)

**📍 Konum:** IPI'nin altında, 3 kart
**🎯 Amaç:** Aylık hedeflerinize ne kadar yaklaştığınızı gösterir

### Monthly Revenue (Aylık Gelir)
| Metrik | Açıklama |
|--------|----------|
| **Current** | Bu ay elde edilen gelir |
| **Goal** | Hedef gelir |
| **% of goal** | Hedefe ulaşma yüzdesi |
| **Progress bar** | Görsel ilerleme çubuğu |
| **Remaining** | Hedefe kalan miktar ve gün |

### Monthly Profit (Aylık Kar)
| Metrik | Açıklama |
|--------|----------|
| **Current** | Bu ay elde edilen net kar |
| **Goal** | Hedef kar |
| **% of goal** | Hedefe ulaşma yüzdesi |
| **Suggestion** | Hedefe ulaşmak için öneri |

### Monthly Units (Aylık Birim)
| Metrik | Açıklama |
|--------|----------|
| **Current** | Bu ay satılan birim sayısı |
| **Goal** | Hedef birim |
| **% of goal** | Hedefe ulaşma yüzdesi |
| **Status** | Hedefe ulaşıldı mı? |

---

## 7️⃣ PERIOD COMPARISON (Dönem Karşılaştırması)

**📍 Konum:** Monthly Goals'un altında
**🎯 Amaç:** Seçilen dönemleri yan yana karşılaştırır

### Ana Tablo Metrikleri:

| Metrik | İkon | Açıklama | Change Hesabı |
|--------|------|----------|---------------|
| **Revenue** | 💵 | Toplam gelir | (Current - Previous) / Previous × 100 |
| **Net Profit** | 📈 | Net kar | (Current - Previous) / Previous × 100 |
| **Units Sold** | 📦 | Satılan birim | (Current - Previous) / Previous × 100 |
| **Orders** | 🛒 | Sipariş sayısı | (Current - Previous) / Previous × 100 |
| **Ad Spend** | 📊 | Reklam harcaması | Ters (↓ iyi) |
| **Profit Margin** | 📈 | Kar marjı (%) | Mutlak değişim |
| **ACOS** | 📊 | Advertising Cost of Sales | Ters (↓ iyi) |

### Show Full Breakdown (Detaylı Görünüm):

Butona tıklandığında genişletilir ve şu bölümleri gösterir:

#### 📊 Sales Breakdown (Satış Dağılımı)
| Metrik | Açıklama | Kaynak |
|--------|----------|--------|
| **Total Sales** | Toplam satış | Amazon API |
| **Organic** | Organik satışlar (~70%) | Amazon API |
| **Sponsored Products** | SP reklam satışları (~20%) | Amazon API |
| **Sponsored Display** | SD reklam satışları (~10%) | Amazon API |

#### 📦 Units Breakdown (Birim Dağılımı)
| Metrik | Açıklama |
|--------|----------|
| **Total Units** | Toplam satılan birim |
| **Organic** | Organik birimler |
| **SP Units** | Sponsored Products birim |
| **SD Units** | Sponsored Display birim |

#### 💰 Ad Spend Breakdown (Reklam Harcaması Dağılımı)
| Metrik | Açıklama | Oran |
|--------|----------|------|
| **Sponsored Products** | SP kampanya harcaması | ~55% |
| **SB Video** | Sponsored Brands Video | ~15% |
| **Sponsored Display** | SD kampanya harcaması | ~20% |
| **Sponsored Brands** | SB kampanya harcaması | ~10% |

#### 🏷️ Amazon Fees Breakdown (Amazon Ücretleri)
| Metrik | Açıklama | Formül |
|--------|----------|--------|
| **FBA Fulfillment** | Karşılama ücreti | ~45% of total fees |
| **Referral Fee** | Komisyon ücreti | ~40% of total fees |
| **Storage Fee** | Depolama ücreti | ~10% of total fees |
| **Inbound Fee** | Gelen kargo ücreti | ~5% of total fees |

#### ↩️ Refunds & Costs
| Metrik | Açıklama |
|--------|----------|
| **Refunds** | İade maliyeti |
| **COGS** | Mal maliyeti |

#### Profit Summary (Kar Özeti)
| Metrik | Açıklama | Formül |
|--------|----------|--------|
| **Gross Profit** | Brüt kar | Sales - COGS - Amazon Fees - Refunds |
| **Indirect Expenses** | Dolaylı giderler | Sales × 2% |
| **Net Profit** | Net kar | Gross - Ad Spend - Indirect |
| **Est. Payout** | Tahmini ödeme | Net Profit × 1.15 |

#### Performance Metrics (Performans Metrikleri)
| Metrik | Açıklama | Formül | İyi Değer |
|--------|----------|--------|-----------|
| **Real ACOS** | Gerçek ACOS | Ad Spend / Sales × 100 | <15% |
| **Refund Rate** | İade oranı | Refunded Units / Total Units × 100 | <3% |
| **Margin** | Kar marjı | Net Profit / Sales × 100 | >25% |
| **ROI** | Yatırım getirisi | Net Profit / COGS × 100 | >100% |

#### 👥 Sessions (Oturum Verileri)
| Metrik | Açıklama |
|--------|----------|
| **Sessions** | Toplam ziyaretçi |
| **Browser / Desktop** | Masaüstü ziyaretler |
| **Mobile App** | Mobil uygulama ziyaretleri |
| **Conversion** | Dönüşüm oranı (%) |

---

## 8️⃣ TODAY / YESTERDAY PERFORMANCE

**📍 Konum:** Sol taraf, metrik kartları
**🎯 Amaç:** Günlük performansı gösterir

### TODAY (Sol Kart)

| Metrik | Açıklama | Renk |
|--------|----------|------|
| **Total Revenue** | Bugünkü toplam gelir | ⬜ Beyaz |
| **vs Yesterday** | Düne göre değişim (%) | 🟢/🔴 |
| **Total Orders** | Bugünkü sipariş sayısı | ⬜ Beyaz |
| **vs Yesterday** | Düne göre değişim (%) | 🟢/🔴 |
| **Net Profit** | Bugünkü net kar | 🟢 Yeşil |
| **vs Yesterday** | Düne göre değişim (%) | 🟢/🔴 |

### TODAY PERFORMANCE (Orta Alan - Gauge'lar)

| Gauge | Açıklama | İyi Değer | Kötü Değer |
|-------|----------|-----------|------------|
| **Profit Margin** | Kar marjı yüzdesi | >40% (yeşil) | <20% (kırmızı) |
| **Avg. Order Value** | Ortalama sipariş değeri | >$40 | <$20 |
| **ACOS** | Reklam maliyet oranı | <15% (yeşil) | >30% (kırmızı) |

### Alt Metrikler (Çubuklar ile):

| Metrik | Açıklama | İkon |
|--------|----------|------|
| **Units Sold** | Satılan birim sayısı | 📦 |
| **Ad Spend** | Reklam harcaması ve satışa oranı | 🎯 |
| **ROI** | Yatırım getirisi | 📈 |
| **Conversion** | Dönüşüm oranı | 💱 |

### ROI Nasıl Hesaplanır?
```
ROI = (Net Profit / Total Investment) × 100
Total Investment = COGS + Ad Spend
```

**ROI Değerlendirmesi:**
- 🟢 **>100%:** Excellent (Mükemmel)
- 🟡 **50-100%:** Good (İyi)
- 🔴 **<50%:** Needs Improvement

### Conversion Rate Nasıl Hesaplanır?
```
Conversion = (Orders / Sessions) × 100
```

**Conversion Değerlendirmesi:**
- 🟢 **>15%:** Above avg
- ⬜ **10-15%:** Average
- 🔴 **<10%:** Below avg

---

## 9️⃣ TOP PRODUCTS (En İyi Ürünler)

**📍 Konum:** Sağ üst köşe
**🎯 Amaç:** En çok kar getiren ürünleri sıralar

### Gösterilen Bilgiler:

| Sütun | Açıklama |
|-------|----------|
| **Rank** | Sıralama |
| **Product Icon** | Ürün emoji/görseli |
| **Product Name** | Ürün adı (kısaltılmış) |
| **Net Profit** | Net kar ($) |

**Sıralama Kriteri:** Net Profit (yüksekten düşüğe)
**Gösterilen Ürün Sayısı:** 7

---

## 🔟 ACTION REQUIRED (Aksiyon Gerektiren)

**📍 Konum:** Top Products'ın altında
**🎯 Amaç:** Dikkat edilmesi gereken ürün/durumları gösterir

### Uyarı Tipleri:

| Tip | İkon | Eşik Değer | Aksiyon |
|-----|------|------------|---------|
| **Low Stock** | 📦 | Stock < 10 | Yeniden sipariş ver |
| **Need Attention** | 👀 | Sales < $100 | Listing iyileştir |
| **Negative Margin** | 📉 | Margin < 0 | Fiyatı gözden geçir |
| **High ACOS** | 🎯 | ACOS > 30% | PPC optimize et |

---

## 1️⃣1️⃣ PRODUCT BREAKDOWN (Ürün Detay Tablosu)

**📍 Konum:** Ana içerik alanı, büyük tablo
**🎯 Amaç:** Tüm ürünlerin detaylı performansını gösterir

### Özet Kartları (Üst Kısım):

| Kart | Açıklama | Renk |
|------|----------|------|
| **Revenue** | Toplam gelir | ⬜ Beyaz |
| **Net Profit** | Toplam net kar | 🟢 Yeşil |
| **Units** | Satılan birim toplamı | ⬜ Beyaz |
| **Ad Spend** | Toplam reklam harcaması | 🔴 Kırmızı |
| **Gross** | Brüt kar | 🟢 Yeşil |
| **Margin** | Ortalama kar marjı | 🔵 Cyan |

### Tablo Sütunları:

| Sütun | Açıklama | Hesaplama |
|-------|----------|-----------|
| **Product** | Ürün adı, ASIN, SKU, fiyat | - |
| **Units** | Satılan birim | Amazon API |
| **Refunds** | İade sayısı | Amazon API |
| **Sales** | Satış geliri | Units × Price |
| **Ads** | Reklam harcaması | Amazon Advertising API |
| **Gross** | Brüt kar | Sales - COGS - Amazon Fees |
| **Net** | Net kar | Gross - Ads |
| **Margin** | Kar marjı % | (Net / Sales) × 100 |
| **ROI** | Yatırım getirisi % | (Net / COGS) × 100 |
| **BSR** | Best Seller Rank | Amazon API |
| **More** | Detay butonu | - |

### Renk Kodları (Margin için):
- 🟢 **>30%:** Mükemmel
- 🔵 **15-30%:** İyi
- 🟡 **<15%:** Dikkat

### Uyarı İkonları:
- 🔴 **Kırmızı nokta:** Low stock (Stock ≤ 7)
- 🟡 **Sarı nokta:** Low margin (Margin < 10%)

### Child Variations (Alt Varyasyonlar):
Parent ürünlere tıklandığında genişler ve varyasyonları gösterir.

---

## 1️⃣2️⃣ PRODUCT DETAIL MODAL (More Butonu)

**📍 Konum:** Popup modal
**🎯 Amaç:** Tek bir ürünün detaylı analizini gösterir

### Key Metrics (Ana Metrikler):

| Metrik | Açıklama |
|--------|----------|
| **Sales** | Toplam satış |
| **Net Profit** | Net kar |
| **Margin** | Kar marjı |
| **ROI** | Yatırım getirisi |

### Financial Breakdown (Finansal Detay):

| Satır | Açıklama | İşlem |
|-------|----------|-------|
| Revenue | Satış geliri | + |
| COGS | Mal maliyeti | - |
| Amazon Fees | Amazon ücretleri | - |
| Gross Profit | Brüt kar | = |
| Ad Spend | Reklam harcaması | - |
| **Net Profit** | **Net kar** | **=** |

### Performance Metrics:

| Metrik | Açıklama |
|--------|----------|
| Units Sold | Satılan birim |
| ACOS | Reklam maliyet oranı |
| Stock Status | Stok durumu |
| BSR | Best Seller Rank |

---

## 1️⃣3️⃣ DAILY BREAKDOWN MODAL

**📍 Konum:** Grafikte bir güne tıklandığında açılır
**🎯 Amaç:** O günün detaylı analizini gösterir

### Header Bilgileri:
- **Tarih:** Sunday, December 21, 2025
- **Açıklama:** Daily breakdown by product

### Özet Satırı:

| Metrik | Renk |
|--------|------|
| **Revenue** | ⬜ Beyaz |
| **Net Profit** | 🟢 Yeşil |
| **Units** | ⬜ Beyaz |
| **Orders** | ⬜ Beyaz |
| **Ad Spend** | 🔴 Kırmızı |
| **Amazon Fees** | 🔴 Kırmızı |
| **Margin** | 🟢 Yeşil |

### Product Breakdown Tablosu:

Aynı sütunlar ana Product Breakdown ile aynıdır, ancak sadece o gün için.

---

## 1️⃣4️⃣ HEAT MAP (Bölgesel Satış Haritası)

**📍 Konum:** Header'daki Heat Map butonuna tıklanınca açılır
**🎯 Amaç:** ABD eyaletleri bazında satış yoğunluğunu gösterir

### Özellikler:

| Özellik | Açıklama |
|---------|----------|
| **Tarih Seçimi** | Today, Yesterday, Last 7/30/90 Days, Custom |
| **Arama** | Eyalet, ASIN, SKU, ürün adı ile arama |
| **Ürün Filtresi** | Belirli ürün için filtreleme |
| **Renk Kodlaması** | Satış yoğunluğuna göre |

### Renk Skalası:
- 🟢 **Koyu Yeşil:** En yüksek satış
- 🟢 **Açık Yeşil:** Yüksek satış
- 🟡 **Sarı:** Orta satış
- 🔴 **Kırmızı:** Düşük satış
- ⬛ **Gri:** Satış yok

### Eyalet Detay Kartı (Hover/Click):

| Metrik | Açıklama |
|--------|----------|
| **State** | Eyalet adı |
| **Sales** | Toplam satış |
| **Orders** | Sipariş sayısı |
| **Units** | Satılan birim |
| **Stock** | Stok miktarı |
| **Net Profit** | Net kar |
| **Margin** | Kar marjı |
| **ROI** | Yatırım getirisi |

### Regional Products (Bölgesel Ürünler):
Her eyalet için ürün bazlı breakdown:
- Parent ASIN'ler genişletilebilir
- Child varyasyonlar görüntülenebilir

---

## 📐 FORMÜL REHBERİ

### Kar Hesaplamaları:

```
Gross Profit = Sales - COGS - Amazon Fees - Refunds

Net Profit = Gross Profit - Ad Spend - Indirect Expenses

Margin (%) = (Net Profit / Sales) × 100

ROI (%) = (Net Profit / COGS) × 100
```

### Amazon Fee Hesaplamaları:

```
Total Amazon Fees = FBA Fulfillment + Referral Fee + Storage Fee + Inbound Fee

FBA Fulfillment = Units × ~$3.50 (boyuta göre değişir)
Referral Fee = Sales × 15% (kategoriye göre 8-45%)
Storage Fee = Cubic Feet × Monthly Rate
```

### ACOS Hesaplamaları:

```
ACOS = (Ad Spend / Ad Sales) × 100
Real ACOS = (Ad Spend / Total Sales) × 100
ROAS = Ad Sales / Ad Spend
```

### Conversion Hesaplamaları:

```
Unit Session Percentage = (Units Sold / Sessions) × 100
Orders per Session = Orders / Sessions
```

---

## 🎨 RENK KODLARI REHBERİ

| Renk | Hex Kodu | Kullanım |
|------|----------|----------|
| 🟢 Yeşil | #22c55e | Pozitif değerler, kar, artış |
| 🔴 Kırmızı | #ef4444 | Negatif değerler, maliyet, düşüş |
| 🔵 Mavi | #3b82f6 | Bilgi, linkler, seçili durumlar |
| 🟡 Sarı | #f59e0b | Uyarılar, dikkat gerektiren |
| 🟣 Mor | #a855f7 | AI, premium özellikler |
| 🔵 Cyan | #06b6d4 | ROI, performans metrikleri |
| ⬜ Beyaz | #f8fafc | Normal metin, nötr değerler |
| ⬛ Gri | #64748b | Devre dışı, ikincil metin |

---

## 📱 MOBİL UYUMLULUK

Dashboard tam responsive tasarıma sahiptir:

| Breakpoint | Görünüm |
|------------|---------|
| **Mobile (<768px)** | Tek sütun, dikey stack |
| **Tablet (768-1024px)** | 2 sütun grid |
| **Desktop (>1024px)** | Tam 4 sütun layout |

---

## 🔒 VERİ KAYNAKLARI

| Veri | Kaynak | Güncelleme |
|------|--------|------------|
| Satış & Siparişler | Amazon SP-API | Gerçek zamanlı |
| Finansal Veriler | Amazon Finances API | 24 saatte bir |
| Reklam Verileri | Amazon Advertising API | 3 saatte bir |
| Envanter | Amazon FBA API | Saatlik |
| COGS | Kullanıcı Girişi | Manuel |
| Indirect Expenses | Kullanıcı Girişi | Manuel |

---

## ❓ SSS (Sıkça Sorulan Sorular)

### Net Profit nasıl hesaplanır?
```
Net Profit = Sales - COGS - Amazon Fees - Refunds - Ad Spend - Indirect Expenses
```

### ACOS nedir ve ne olmalı?
ACOS (Advertising Cost of Sales) reklam harcamanızın reklam satışlarına oranıdır.
- **İdeal:** <15%
- **Kabul edilebilir:** 15-25%
- **Yüksek:** >25%

### IPI skorum düşükse ne yapmalıyım?
1. Fazla envanteri azaltın (liquidation, removal)
2. Stranded envanteri düzeltin (listing sorunlarını giderin)
3. In-stock oranını artırın (restock planlaması)
4. Sell-through hızını artırın (fiyatlandırma, reklam)

### ROI ne anlama gelir?
ROI (Return on Investment) yatırımınızın getirisini gösterir.
- **>100%:** Her $1 yatırım için $1+ kar
- **50-100%:** İyi getiri
- **<50%:** Düşük getiri

---

**Son Güncelleme:** 21 Aralık 2025
**Hazırlayan:** SellerGenix Team
