# 🚀 FAZ 1 - DASHBOARD SIFIRDAN TASARIM YOL HARİTASI

**Tarih:** 18 Ocak 2026
**Durum:** ONAYLANDI ✅
**Hedef:** Clear, basit, entegre e-commerce analytics dashboard

---

## 📋 TEMEL PRENSİPLER

### ✅ YAPILACAKLAR
- 🌞 **Light Mode Only** - Temiz, profesyonel görünüm
- 🎨 **World-Class UI/UX** - Stripe, Linear kalitesinde
- 🧠 **Clear & Simple** - Kompleks yapı YOK
- 🔗 **Her şey bağlı** - Entegre sistem, kopukluk yok
- 💬 **AI Chat Altta** - Her zaman görünür
- 🖼️ **Mevcut Logolar** - Değiştirilmeyecek

### ❌ YAPILMAYACAKLAR
- ❌ Dark mode
- ❌ Landing page değişikliği
- ❌ Logo değişikliği
- ❌ Ayrı sayfalar (popup/modal tercih)

---

## 🏗️ DASHBOARD YAPISI (FİNAL)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Logo]  Dashboard  Analytics  Settings    🔔  👤                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🌎 MARKETPLACE SELECTOR                      ⚙️ [Product Settings]    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [🇺🇸 North America ✓] [🇪🇺 Europe 🔒] [🇯🇵 Far East 🔒]            │   │
│  │                        Coming Soon    Coming Soon                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📅 PERIOD SELECTOR                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Default ▼] [Daily] [Weekly] [Monthly] [Quarterly] [YoY] [Custom]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📊 4 PERIOD CARDS (Custom'da 1 kart)                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│  │  TODAY    │ │ YESTERDAY │ │ THIS MONTH│ │ LAST MONTH│               │
│  │  $2,456   │ │  $1,890   │ │  $45,234  │ │  $38,456  │               │
│  │  📈 +12%  │ │  📈 +8%   │ │  📈 +15%  │ │  📈 +5%   │               │
│  │  [More]   │ │  [More]   │ │  [More]   │ │  [More]   │               │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘               │
│                     ↓ (Karta tıkla)                                     │
│                                                                         │
│  📦 PRODUCT BREAKDOWN TABLE                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Product          Stock  Units  Refunds  Sales  Ads  Net  [More] │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ ▶ Parent Product   45    12      0      $456   $45  $89  [More] │   │
│  │   └─ Child 1       20     5      0      $200   $20  $40         │   │
│  │   └─ Child 2       25     7      0      $256   $25  $49         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  🤖 AI CHAT BAR (Fixed bottom)                                         │
│  └─ "Ask anything about your business..."                              │
│  └─ Bulk COGS upload, ASIN lookup, Parent→Child assignment            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🌎 MARKETPLACE SELECTOR

### Aktif Pazaryerleri (Faz 1)
```
┌──────────────────────────────────────────────────────────────────┐
│  🌎 Select Marketplace                                           │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │ 🇺🇸              │  │ 🇪🇺              │  │ 🇯🇵              │     │
│  │ North America  │  │ Europe         │  │ Far East       │     │
│  │ ✅ Active      │  │ 🔒 Coming Soon │  │ 🔒 Coming Soon │     │
│  │                │  │                │  │                │     │
│  │ • USA          │  │ • UK           │  │ • Japan        │     │
│  │ • Canada       │  │ • Germany      │  │ • Australia    │     │
│  │ • Mexico       │  │ • France       │  │ • Singapore    │     │
│  │                │  │ • Italy        │  │ • India        │     │
│  │                │  │ • Spain        │  │ • UAE          │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

### Region → Country Mapping
```typescript
const MARKETPLACE_REGIONS = {
  'north-america': {
    name: 'North America',
    status: 'active',
    flag: '🇺🇸',
    countries: [
      { id: 'ATVPDKIKX0DER', name: 'USA', flag: '🇺🇸' },
      { id: 'A2EUQ1WTGCTBG2', name: 'Canada', flag: '🇨🇦' },
      { id: 'A1AM78C64UM0Y8', name: 'Mexico', flag: '🇲🇽' },
    ]
  },
  'europe': {
    name: 'Europe',
    status: 'coming-soon',
    flag: '🇪🇺',
    countries: [
      { id: 'A1F83G8C2ARO7P', name: 'UK', flag: '🇬🇧' },
      { id: 'A1PA6795UKMFR9', name: 'Germany', flag: '🇩🇪' },
      // ... etc
    ]
  },
  'far-east': {
    name: 'Far East',
    status: 'coming-soon',
    flag: '🇯🇵',
    countries: [
      { id: 'A1VC38T7YXB528', name: 'Japan', flag: '🇯🇵' },
      // ... etc
    ]
  }
}
```

---

## ⚙️ PRODUCT SETTINGS MODAL (Popup)

### Açılış
- Dashboard'da "Product Settings" butonuna tıkla → Popup modal açılır
- Ayrı sayfa YOK, her şey dashboard'da

### Modal İçeriği
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Product Settings                                         [X] Close │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📋 TABS: [All Products] [COGS Settings] [Bulk Import]                 │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  🔍 Search: [Enter ASIN, SKU or product name...]                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ☑️ Product                    COGS   Tax   3PL   Total  Actions │   │
│  │ ───────────────────────────────────────────────────────────────│   │
│  │ ☑️ ▼ Turkish Delight Pack    $4.50  $0.30 $0.50 $5.30  [Edit]  │   │
│  │    └─ Assorted Fruit 16oz   $4.50  $0.30 $0.50 $5.30          │   │
│  │    └─ Assorted Fruit 8.8oz  $3.20  $0.20 $0.40 $3.80          │   │
│  │    └─ Pistachio 8.8oz       $3.80  $0.25 $0.45 $4.50          │   │
│  │                                                                 │   │
│  │ ☐ ▶ Wireless Headphones     $12.00 $0.80 $1.20 $14.00 [Edit]  │   │
│  │ ☐ ▶ Smart Watch Band        $2.50  $0.15 $0.30 $2.95  [Edit]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📊 Selected: 3 products                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Bulk Actions:                                                   │   │
│  │ [Apply Same COGS to Selected] [Apply to All Children] [Delete] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  💡 Tip: Use AI Chat to bulk import COGS via Excel or set by ASIN     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### COGS Giriş Yöntemleri

**1. Manuel Giriş (Modal'da)**
- Ürün satırında "Edit" butonuna tıkla
- COGS, Tax, 3PL değerlerini gir
- Save

**2. Parent → All Children (Toplu)**
- Parent ürünü seç
- "Apply to All Children" butonuna tıkla
- Tüm child'lara aynı COGS uygulanır

**3. AI Chat ile Bulk (Excel)**
```
User: "Upload my COGS Excel file"
AI: "Sure! Please upload your Excel file with columns: ASIN, COGS, Tax, 3PL"
     [Upload File Button]
User: *uploads file*
AI: "Found 45 products. 40 matched, 5 not found. Apply COGS to matched products?"
     [Yes, Apply] [Review First]
```

**4. AI Chat ile ASIN Girişi**
```
User: "Set COGS $5.50 for ASIN B08XYZ1234"
AI: "Done! COGS updated to $5.50 for 'Turkish Delight Variety Pack'"

User: "Set COGS $4.00 for parent B08XYZ1234 and all children"
AI: "Done! COGS $4.00 applied to parent and 3 child products:
     - Assorted Fruit 16oz
     - Assorted Fruit 8.8oz
     - Pistachio 8.8oz"
```

---

## 📡 API DURUMU & ALTYAPI

### Onaylı API'ler (Şu An Çalışır) ✅
| API | Rol | Ne Sunuyor | Durum |
|-----|-----|-----------|-------|
| **Finances API** | Finance and Accounting | Fee'ler, payout'lar, financial data | ✅ Aktif |
| **Seller API** | Selling Partner Insights | Hesap bilgisi, marketplace list | ✅ Aktif |
| **Orders API** | Inventory and Order Tracking | Siparişler, order items | ✅ Aktif |
| **Brand Analytics** | Brand Analytics | Arama terimleri, market share | ✅ Aktif |

### Onay Bekleyen API'ler (Coming Soon) ⏳
| API | Rol | Ne Sunacak | Durum |
|-----|-----|-----------|-------|
| **Listings API** | Product Listing | Ürün detayları (title, image, price) | ⏳ Onay bekliyor |
| **FBA Inventory API** | Amazon Fulfillment | FBA stok seviyeleri | ⏳ Onay bekliyor |

### Altyapı Stratejisi
```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Ürün Verisi Kaynakları                                     │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Orders API  │     │ Listings API│     │ FBA Inv API │       │
│  │ ✅ ÇALIŞIR  │     │ ⏳ BEKLEMEDE │     │ ⏳ BEKLEMEDE │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DATA AGGREGATOR                       │   │
│  │  • Orders API'den ASIN/SKU al                           │   │
│  │  • Listings API gelince title/image ekle                │   │
│  │  • FBA Inv API gelince stock ekle                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     DASHBOARD UI                         │   │
│  │  • Şimdi: ASIN/SKU göster, title "Coming Soon"          │   │
│  │  • Sonra: Full product info göster                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### "Coming Soon" UI Patterns
```tsx
// Listings API onay beklerken
<ProductRow>
  <ProductImage src={null} placeholder="📦" />
  <ProductTitle>
    {product.asin}
    <Badge variant="muted">Title coming soon</Badge>
  </ProductTitle>
  ...
</ProductRow>

// FBA Inventory API onay beklerken
<StockCell>
  <span className="text-muted">--</span>
  <Tooltip>Stock data coming soon</Tooltip>
</StockCell>

// Europe/Far East marketplace seçildiğinde
<MarketplaceCard disabled>
  <Flag>🇪🇺</Flag>
  <Name>Europe</Name>
  <Badge variant="purple">Coming Soon</Badge>
</MarketplaceCard>
```

---

## 📁 DOSYA YAPISI (GÜNCELLENMİŞ)

```
src/
├── components/
│   └── dashboard/
│       ├── Header.tsx                    # Üst navigation
│       ├── MarketplaceSelector.tsx       # 🆕 Region/Country selector
│       ├── PeriodSelector.tsx            # 6 hazır set + Custom
│       ├── PeriodCard.tsx                # Tek period kartı
│       ├── PeriodCardsGrid.tsx           # 4'lü veya 1'li grid
│       ├── DetailedBreakdownModal.tsx    # More butonu modalı
│       ├── ProductTable.tsx              # Ürün tablosu
│       ├── ProductRow.tsx                # Parent/Child satır
│       ├── ProductSettingsModal.tsx      # 🆕 COGS ayarları popup
│       ├── ProductSettingsTabs.tsx       # 🆕 All Products / COGS / Bulk Import
│       ├── COGSEditor.tsx                # 🆕 Inline COGS düzenleme
│       ├── AIChatBar.tsx                 # Alt chat bar
│       ├── AIChatModal.tsx               # Genişletilmiş chat
│       └── ComingSoonBadge.tsx           # 🆕 "Coming Soon" badge
│
├── lib/
│   ├── api/
│   │   ├── amazon-client.ts              # SP-API client
│   │   ├── orders-api.ts                 # ✅ Orders API (çalışır)
│   │   ├── finances-api.ts               # ✅ Finances API (çalışır)
│   │   ├── listings-api.ts               # ⏳ Listings API (altyapı hazır)
│   │   └── fba-inventory-api.ts          # ⏳ FBA Inventory API (altyapı hazır)
│   │
│   └── ai/
│       ├── chat-router.ts                # Haiku/Opus routing
│       ├── cogs-commands.ts              # 🆕 COGS AI commands
│       └── prompts.ts                    # AI system prompts
│
└── app/
    └── dashboard/
        └── page.tsx                      # Ana dashboard (tek sayfa)
```

---

## 📅 UYGULAMA ADIMLARI (GÜNCELLENMİŞ)

### ADIM 1: Temizlik (30 dk)
- [ ] Eski dashboard component'lerini yedekle
- [ ] Yeni boş component'ler oluştur
- [ ] Tailwind light mode config

### ADIM 2: Header + Marketplace Selector (1 saat)
- [ ] Header component
- [ ] MarketplaceSelector component
- [ ] 3 region: NA (aktif), EU (coming soon), FE (coming soon)
- [ ] Country dropdown (USA, Canada, Mexico)

### ADIM 3: Period Selector + Cards (2 saat)
- [ ] 6 hazır karşılaştırma seti
- [ ] Custom date range
- [ ] 4'lü period kartları
- [ ] More butonu → Detailed Breakdown Modal

### ADIM 4: Detailed Breakdown Modal (1.5 saat)
- [ ] Collapsible sections
- [ ] Tüm metrikler (Sales, Units, Ad Spend, Fees, Profit, etc.)
- [ ] Coming Soon badge'ler (stock data vb.)

### ADIM 5: Product Table (2 saat)
- [ ] Parent-Child yapısı
- [ ] Tüm kolonlar
- [ ] Coming Soon placeholder'lar
- [ ] Export CSV

### ADIM 6: Product Settings Modal (2 saat)
- [ ] Popup modal (ayrı sayfa değil)
- [ ] 3 tab: All Products, COGS Settings, Bulk Import
- [ ] COGS inline editor
- [ ] Parent → All Children toplu atama
- [ ] Search by ASIN/SKU

### ADIM 7: AI Chat Bar + COGS Commands (2 saat)
- [ ] Fixed bottom bar
- [ ] Haiku/Opus routing
- [ ] Excel bulk upload
- [ ] ASIN-based COGS set
- [ ] Parent → Children COGS command

### ADIM 8: API Altyapısı (1 saat)
- [ ] Orders API entegrasyonu (çalışır)
- [ ] Finances API entegrasyonu (çalışır)
- [ ] Listings API altyapısı (coming soon)
- [ ] FBA Inventory API altyapısı (coming soon)

### ADIM 9: Entegrasyon & Polish (1 saat)
- [ ] Tüm component'leri birleştir
- [ ] Her şeyin bağlı olduğunu test et
- [ ] Loading/Empty/Error states
- [ ] Responsive test

---

## ⏱️ TOPLAM TAHMİNİ SÜRE

| Adım | Süre |
|------|------|
| Temizlik | 30 dk |
| Header + Marketplace | 1 saat |
| Period Selector + Cards | 2 saat |
| Detailed Breakdown Modal | 1.5 saat |
| Product Table | 2 saat |
| **Product Settings Modal** | 2 saat |
| **AI Chat + COGS Commands** | 2 saat |
| API Altyapısı | 1 saat |
| Entegrasyon & Polish | 1 saat |
| **TOPLAM** | **~13 saat** |

---

## 🔗 ENTEGRASYON NOKTALARI

### Her Şey Birbirine Bağlı!

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  MarketplaceSelector ──────────────────────────────────────┐   │
│         │                                                   │   │
│         ▼                                                   │   │
│  PeriodCards ← → ProductTable ← → ProductSettingsModal     │   │
│         │              │                   │                │   │
│         ▼              ▼                   ▼                │   │
│  DetailedBreakdownModal              COGSEditor            │   │
│                                            │                │   │
│                                            ▼                │   │
│  ┌─────────────────────────────────────────────────────┐   │   │
│  │                    AI CHAT                           │   │   │
│  │  • "Show me today's sales" → PeriodCard select      │   │   │
│  │  • "Set COGS for B08XYZ" → COGSEditor update        │   │   │
│  │  • "Upload Excel" → Bulk COGS import                │   │   │
│  │  • "Switch to Canada" → MarketplaceSelector change  │   │   │
│  └─────────────────────────────────────────────────────┘   │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ BAŞARI KRİTERLERİ

- [ ] Clear & Simple - 5 saniyede anlaşılır
- [ ] Marketplace selector çalışıyor (NA aktif, diğerleri coming soon)
- [ ] 4'lü period karşılaştırması çalışıyor
- [ ] More butonu detaylı breakdown gösteriyor
- [ ] Product Settings popup açılıyor
- [ ] COGS manuel/bulk/AI ile girilebiliyor
- [ ] Parent → Children COGS atama çalışıyor
- [ ] Onaylı API'ler veri gösteriyor
- [ ] Bekleyen API'ler "Coming Soon" gösteriyor
- [ ] AI Chat her şeyi kontrol edebiliyor
- [ ] Tüm sistemler entegre, kopukluk yok

---

## 🚀 BAŞLIYORUZ!

**Onay:** ✅ Kullanıcı onayladı

**Sonraki Adım:** ADIM 1 - Temizlik

---

**Son Güncelleme:** 18 Ocak 2026
