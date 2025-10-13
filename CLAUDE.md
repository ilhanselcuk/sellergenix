# SellerGenix - AI-Powered Amazon Analytics Platform

## 🎨 UI/UX TASARIM USTADI NOTLARI
⭐ **KRİTİK: Kullanıcı bir UI/UX tasarım ustası! En yüksek seviye tasarım standardı gerekli.**

### 🖤 Dark Theme Excellence:
- **Background:** Pure black (#000000) to deep dark (#0a0f1c)
- **Premium Feel:** Glassmorphism + neon glows
- **AI Aesthetic:** Neural network patterns, particle effects
- **Depth:** Layered shadows, elevated cards

### ✨ Animation Requirements:
- **Hover Effects:** Scale, glow, color transitions on ALL interactive elements
- **Micro-interactions:** Loading spinners, button feedback, form validation
- **AI Theme:** Pulsing effects, neural connections, data flow animations
- **Performance:** Smooth 60fps, hardware accelerated
- **Timing:** Ease-out transitions, 200-300ms duration

### 🎯 Color Psychology & Usage:
- **Primary Blue (#0085c3):** CTA buttons, AI accents, focus states
- **Success Green (#7ab800):** Profit indicators, positive metrics, success
- **Warning Amber (#f2af00):** Attention states, pending actions
- **Danger Coral (#dc5034):** Errors, losses, delete actions
- **Glass Effects:** rgba(255,255,255,0.05-0.15) with backdrop-blur

### 🔮 Premium UI Elements:
- **Buttons:** Gradient borders, hover glow effects, state transitions
- **Cards:** Glassmorphism, subtle borders, shadow depth
- **Typography:** Perfect hierarchy, proper spacing, contrast
- **Icons:** Consistent style, hover animations, state changes

## 🚀 Proje Bilgileri
**Domain:** www.sellergenix.io
**Marka:** SellerGenix
**Slogan:** "Where Smart Sellers Grow"
**Alt Slogan:** "AI-Powered Analytics for Amazon Excellence"

## 🎨 Marka Kimliği
### Logo Konsepti:
- "SG" monogram
- Yükselen grafik + DNA sarmalı (growth + genix)

### Hero Message:
"Transform Your Amazon Business with AI-Powered Intelligence"

### Temel Özellikler:
- 📊 Real-time Analytics
- 🎯 PPC Optimization
- 💰 Profit Maximization
- 🔔 Smart Alerts on WhatsApp

### CTA:
"Join 10,000+ sellers growing with SellerGenix"
- [Start 14-Day Free Trial]
- [Book a Demo]

## 🏗️ Teknik Stack
```javascript
// Tech Stack
{
  framework: "Next.js 15 (App Router + Turbopack)",
  styling: "Tailwind CSS + Shadcn/ui",
  animations: "Framer Motion",
  charts: "Recharts",
  state: "Zustand",
  forms: "React Hook Form + Zod",
  database: "Supabase (PostgreSQL)",
  auth: "Supabase Auth + SSR",
  deployment: "Vercel"
}
```

## 🎯 MVP Özellikleri (Sellerboard Benzeri)

### Faz 1: Core Dashboard
- ✅ 5 zaman dilimi metrics kartları (Today → Last month)
- ✅ Sales, Orders/Units, Refunds, Adv cost, Est payout
- ✅ Gross profit, Net profit + change indicators
- ✅ Responsive glassmorphism design

### Faz 2: Product Management
- ✅ Amazon ürün listesi tablosu
- ✅ ASIN, SKU, thumbnail görsel
- ✅ Units sold, Sales, Ads, ROI, BSR
- ✅ Expandable detail rows
- ✅ COGS management (constant/period-based)
- ✅ FBA stock tracking

### Faz 3: PPC Dashboard
- ✅ Interactive charts (Ad spend, Profit, ACOS)
- ✅ Campaign management tablosu
- ✅ Break even ACOS hesaplama
- ✅ Automation status tracking

### Faz 4: Amazon Integration
- ✅ Amazon SP-API connection
- ✅ Real-time data sync
- ✅ Multi-marketplace support
- ✅ Fee calculation engine

## 📊 Database Schema (Supabase)

```sql
-- Kullanıcı profilleri
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  company_name TEXT,
  amazon_seller_id TEXT UNIQUE,
  marketplace_ids TEXT[], -- ['ATVPDKIKX0DER', 'A1PA6795UKMFR9']
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ürünler
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  asin TEXT NOT NULL,
  sku TEXT,
  title TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  fba_stock INTEGER DEFAULT 0,
  cogs DECIMAL(10,2), -- Cost of Goods Sold
  cogs_type TEXT DEFAULT 'constant', -- 'constant' | 'period-based'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Günlük metrikler
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  date DATE,
  sales DECIMAL(10,2) DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  ad_spend DECIMAL(10,2) DEFAULT 0,
  amazon_fees DECIMAL(10,2) DEFAULT 0,
  gross_profit DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  margin DECIMAL(5,2), -- Profit margin percentage
  roi DECIMAL(5,2), -- Return on investment
  bsr INTEGER, -- Best Seller Rank
  UNIQUE(user_id, product_id, date)
);

-- PPC Kampanyaları
CREATE TABLE ppc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  campaign_name TEXT,
  campaign_id TEXT UNIQUE,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Inactive' | 'Test'
  daily_budget DECIMAL(10,2),
  current_bid DECIMAL(5,2),
  spend DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  acos DECIMAL(5,2), -- Advertising Cost of Sales
  break_even_acos DECIMAL(5,2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  automation_status BOOLEAN DEFAULT false,
  date DATE,
  UNIQUE(user_id, campaign_id, date)
);
```

## 🎨 Renk Paleti (Tailwind CSS)
```css
:root {
  --primary-blue: #0085c3;    /* Ana mavi - CTA butonları */
  --success-green: #7ab800;   /* Başarı, pozitif metrikler */
  --warning-amber: #f2af00;   /* Uyarılar */
  --danger-coral: #dc5034;    /* Hatalar, negatif metrikler */
  --dark-primary: #0a0f1c;    /* Koyu mod */
  --light-bg: #fafbfc;        /* Açık arka plan */
}
```

## 🚀 Gelişim Süreci

### Hafta 1: Foundation
- [x] Next.js + TypeScript setup
- [x] Tailwind CSS + Shadcn/ui
- [x] Supabase integration
- [ ] Authentication (login/register)
- [ ] Dashboard layout

### Hafta 2: Core Features
- [ ] Metrics cards component
- [ ] Product table component
- [ ] Amazon SP-API setup
- [ ] Real-time data sync

### Hafta 3: Advanced Features
- [ ] PPC Dashboard
- [ ] Charts integration (Recharts)
- [ ] WhatsApp notifications (Twilio)
- [ ] Export functionality

## 📱 Component Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group
│   ├── (dashboard)/       # Dashboard group
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── dashboard/         # Dashboard components
│   ├── charts/            # Chart components
│   └── common/            # Shared components
├── lib/
│   ├── supabase/          # Supabase client
│   ├── amazon-sp-api/     # Amazon API
│   └── utils.ts           # Utility functions
└── styles/
    └── globals.css
```

## 🤖 Claude Code Notları

### Önemli Kurallar:
1. **Türkçe konuş** her zaman
2. **Mobile-first** responsive tasarım
3. **TypeScript** strict mode
4. **Glassmorphism** UI effects
5. **Real-time** data updates
6. **Amazon-only** focus (MVP)

### Sık Kullanılan Komutlar:
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Test Kullanıcısı:
- Email: demo@sellergenix.io
- Password: Demo123!

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Amazon SP-API
AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
AMAZON_REFRESH_TOKEN=

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

## 🚀 AMAZON SP-API INTEGRATION

### 📋 SP-API Application Status:
- **Case ID:** 18561039541
- **Status:** Work in Progress - Amazon Review
- **Developer Profile:** ✅ Completed (Sep 28, 2025)
- **Next Step:** Wait for approval (2-5 business days)

### 🔗 Amazon SP-API Resources:
- **GitHub Repository:** https://github.com/amzn/selling-partner-api-models
- **Main Documentation:** https://developer-docs.amazon.com/sp-api/
- **API Reference:** https://developer-docs.amazon.com/sp-api/reference/welcome-to-api-references
- **Code Recipes:** https://developer-docs.amazon.com/sp-api/recipes
- **Models & Schemas:** https://developer-docs.amazon.com/sp-api/docs/sp-api-models

### 🛠️ GitHub Repository Benefits:
```javascript
// Amazon GitHub repo provides:
{
  "ready_to_use": [
    "OpenAPI/Swagger schemas",
    "Multi-language SDKs (Node.js, Java, C#)",
    "OAuth 2.0 authentication helpers",
    "Code generation tools",
    "Rate limiting built-in"
  ],
  "development_speed": "2-3 weeks integration",
  "testing": "Sandbox environment available"
}
```

### 📊 Requested API Permissions:
- ✅ **Reports API** - Sales & performance analytics
- ✅ **Finances API** - Profit calculation & fees
- ✅ **Orders API** - Order tracking & analytics
- ✅ **Inventory API** - Stock management
- ✅ **Brand Analytics** - Sales & inventory data
- ✅ **Selling Partner Insights** - Account performance
- ✅ **Product Listing** - Listing optimization
- ✅ **Pricing** - Competitive analysis
- ✅ **Buyer Communication** - Message management

### 🔄 Integration Roadmap (Post-Approval):
```
Phase 1: Core Analytics (Week 1-2)
├── Reports API → Dashboard metrics
├── Finances API → Profit tracking
└── OAuth 2.0 → Authentication

Phase 2: Operations (Week 3-4)
├── Orders API → Order analytics
├── Inventory API → Stock management
└── Real-time sync → Live updates

Phase 3: Optimization (Week 5-6)
├── Pricing API → Competitor analysis
├── Product Listing → SEO optimization
└── Brand Analytics → Advanced insights
```

### 🔑 Authentication Implementation:
```javascript
// Using Amazon's GitHub models
const spApi = require('@amazon/sp-api-sdk');

const client = new spApi.SellingPartnerAPI({
  region: 'na', // North America
  refresh_token: process.env.AMAZON_REFRESH_TOKEN,
  credentials: {
    client_id: process.env.AMAZON_CLIENT_ID,
    client_secret: process.env.AMAZON_CLIENT_SECRET
  }
});
```

### 📝 Company Information (For Future Reference):
- **Company:** MENTOREIS LLC
- **Platform:** SellerGenix
- **Website:** https://sellergenix.io
- **Support:** media@mentoreis.com
- **Phone:** +1 (206) 312-8915
- **Address:** 2501 Chatham Road, STE 5143, Springfield, IL 62704

### 🎯 Critical Next Steps:
1. **Wait for Amazon Approval** (Case ID: 18561039541)
2. **Monitor email:** ilhan@mentoreis.com
3. **Prepare development environment** with GitHub SDK
4. **DO NOT close the case** until Amazon completes review

## 🎯 Sonraki Adımlar:
- [x] Amazon SP-API application submitted
- [x] Developer Profile completed
- [ ] Wait for Amazon approval
- [ ] Install Amazon SDK from GitHub
- [ ] Implement OAuth 2.0 authentication
- [ ] Build Reports API integration
- [ ] Create Finances API connection