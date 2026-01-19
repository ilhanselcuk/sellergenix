# Amazon Advertising API Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**API Version:** v3
**Durum:** 📋 Faz 2'de Başvuru Yapılacak

---

## 📋 Genel Bakış

Amazon Advertising API, satıcıların PPC kampanyalarını programatik olarak yönetmesini sağlar:
- Sponsored Products
- Sponsored Brands
- Sponsored Display
- Kampanya oluşturma/düzenleme
- Performans raporları
- Bid optimization

---

## ⚠️ Önemli: SP-API'den Farklı!

```
┌─────────────────────────────────────────────────────────────┐
│  Amazon Advertising API ≠ Amazon SP-API                     │
│                                                             │
│  • Farklı başvuru süreci                                    │
│  • Farklı credentials                                       │
│  • Farklı OAuth flow                                        │
│  • Farklı rate limits                                       │
│  • Farklı endpoints                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Başvuru Süreci

### Adım 1: Amazon Advertising Console'a Erişim

1. [advertising.amazon.com](https://advertising.amazon.com) adresine git
2. Seller Central credentials ile giriş yap
3. API Access başvurusu yap

### Adım 2: Developer Account Oluştur

```
URL: https://advertising.amazon.com/API/docs
Application Type: Seller Tool
Use Case: Campaign Management & Analytics
```

### Adım 3: Credentials Al

```env
# Amazon Ads API Credentials
AMAZON_ADS_CLIENT_ID=amzn1.application-oa2-client.xxxxx
AMAZON_ADS_CLIENT_SECRET=xxxxx
AMAZON_ADS_PROFILE_ID=123456789  # Per-marketplace

# Scope
AMAZON_ADS_SCOPE=advertising::campaign_management
```

---

## 🌍 Regional Endpoints

| Region | Endpoint |
|--------|----------|
| North America | `advertising-api.amazon.com` |
| Europe | `advertising-api-eu.amazon.com` |
| Far East | `advertising-api-fe.amazon.com` |

---

## 📊 API Capabilities

### 1. Campaign Management

```typescript
// Campaign Types
type CampaignType =
  | 'sponsoredProducts'
  | 'sponsoredBrands'
  | 'sponsoredDisplay';

// Campaign Structure
interface Campaign {
  campaignId: number;
  name: string;
  campaignType: CampaignType;
  targetingType: 'manual' | 'auto';
  state: 'enabled' | 'paused' | 'archived';
  dailyBudget: number;
  startDate: string;
  endDate?: string;
  bidding: {
    strategy: 'legacyForSales' | 'autoForSales' | 'manual';
    adjustments: BidAdjustment[];
  };
}

interface AdGroup {
  adGroupId: number;
  campaignId: number;
  name: string;
  state: 'enabled' | 'paused' | 'archived';
  defaultBid: number;
}

interface Keyword {
  keywordId: number;
  adGroupId: number;
  campaignId: number;
  keywordText: string;
  matchType: 'exact' | 'phrase' | 'broad';
  state: 'enabled' | 'paused' | 'archived';
  bid: number;
}
```

### 2. Reporting API

```typescript
// Report Types
type ReportType =
  | 'campaigns'
  | 'adGroups'
  | 'keywords'
  | 'productAds'
  | 'targets'
  | 'searchTerm';

// Report Metrics
interface CampaignReport {
  campaignId: number;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;           // Ad spend
  attributedSales7d: number;
  attributedSales14d: number;
  attributedSales30d: number;
  attributedUnitsOrdered7d: number;
  attributedUnitsOrdered14d: number;
  attributedUnitsOrdered30d: number;
}

// Calculated Metrics
interface CalculatedMetrics {
  acos: number;        // (cost / sales) * 100
  roas: number;        // sales / cost
  cpc: number;         // cost / clicks
  ctr: number;         // (clicks / impressions) * 100
  conversionRate: number;  // (orders / clicks) * 100
}
```

---

## 💻 Implementation (Faz 2)

### Authentication

```typescript
// src/lib/amazon-ads/auth.ts

interface AdsTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function getAdsAccessToken(
  refreshToken: string
): Promise<AdsTokenResponse> {
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_ADS_CLIENT_ID!,
      client_secret: process.env.AMAZON_ADS_CLIENT_SECRET!,
    }),
  });

  return response.json();
}
```

### Get Advertising Profiles

```typescript
// src/lib/amazon-ads/profiles.ts

interface Profile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  dailyBudget: number;
  timezone: string;
  accountInfo: {
    marketplaceStringId: string;
    id: string;
    type: 'seller' | 'vendor';
    name: string;
  };
}

export async function getProfiles(accessToken: string): Promise<Profile[]> {
  const response = await fetch(
    'https://advertising-api.amazon.com/v2/profiles',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
      },
    }
  );

  return response.json();
}
```

### Get Campaigns

```typescript
// src/lib/amazon-ads/campaigns.ts

interface GetCampaignsParams {
  stateFilter?: ('enabled' | 'paused' | 'archived')[];
  name?: string;
  campaignIdFilter?: number[];
}

export async function getCampaigns(
  accessToken: string,
  profileId: string,
  params?: GetCampaignsParams
): Promise<Campaign[]> {
  const url = new URL('https://advertising-api.amazon.com/sp/campaigns');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
      'Amazon-Advertising-API-Scope': profileId,
      'Content-Type': 'application/vnd.spCampaign.v3+json',
    },
  });

  return response.json();
}
```

### Request Report

```typescript
// src/lib/amazon-ads/reports.ts

interface ReportRequest {
  reportDate: string;  // YYYYMMDD
  metrics: string[];
  segment?: string;
}

export async function requestReport(
  accessToken: string,
  profileId: string,
  recordType: 'campaigns' | 'adGroups' | 'keywords' | 'searchTerm',
  reportRequest: ReportRequest
): Promise<{ reportId: string }> {
  const response = await fetch(
    `https://advertising-api.amazon.com/v2/sp/${recordType}/report`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
        'Amazon-Advertising-API-Scope': profileId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportRequest),
    }
  );

  return response.json();
}

// Poll for report completion
export async function getReportStatus(
  accessToken: string,
  profileId: string,
  reportId: string
): Promise<{ status: string; location?: string }> {
  const response = await fetch(
    `https://advertising-api.amazon.com/v2/reports/${reportId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.AMAZON_ADS_CLIENT_ID!,
        'Amazon-Advertising-API-Scope': profileId,
      },
    }
  );

  return response.json();
}

// Download completed report
export async function downloadReport(
  location: string
): Promise<any[]> {
  const response = await fetch(location);
  const gzipped = await response.arrayBuffer();

  // Decompress gzip
  const decompressed = await decompress(gzipped);
  return JSON.parse(decompressed);
}
```

### ACOS/ROAS Calculation

```typescript
// src/lib/amazon-ads/calculations.ts

interface PpcMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
}

export function calculatePpcMetrics(data: PpcMetrics) {
  const acos = data.sales > 0
    ? (data.spend / data.sales) * 100
    : 0;

  const roas = data.spend > 0
    ? data.sales / data.spend
    : 0;

  const cpc = data.clicks > 0
    ? data.spend / data.clicks
    : 0;

  const ctr = data.impressions > 0
    ? (data.clicks / data.impressions) * 100
    : 0;

  const conversionRate = data.clicks > 0
    ? (data.orders / data.clicks) * 100
    : 0;

  return {
    acos: Math.round(acos * 100) / 100,
    roas: Math.round(roas * 100) / 100,
    cpc: Math.round(cpc * 100) / 100,
    ctr: Math.round(ctr * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}

// Break-even ACOS calculation
export function calculateBreakEvenAcos(
  sellingPrice: number,
  cogs: number,
  amazonFees: number
): number {
  const profit = sellingPrice - cogs - amazonFees;
  const breakEvenAcos = (profit / sellingPrice) * 100;
  return Math.round(breakEvenAcos * 100) / 100;
}
```

---

## 🤖 AI-Powered Bid Optimization (Opus)

```typescript
// src/lib/amazon-ads/ai-optimizer.ts

interface OptimizationContext {
  campaign: Campaign;
  keywords: KeywordReport[];
  targetAcos: number;
  breakEvenAcos: number;
  budget: number;
}

const OPTIMIZATION_PROMPT = `
You are an Amazon PPC optimization expert. Analyze this campaign data and provide specific bid recommendations.

Campaign: {campaignName}
Current Daily Budget: ${budget}
Target ACOS: {targetAcos}%
Break-even ACOS: {breakEvenAcos}%

Keyword Performance (last 30 days):
{keywordData}

Rules:
1. If keyword ACOS < Target ACOS and sales > 0: Consider increasing bid by 10-20%
2. If keyword ACOS > Break-even ACOS: Consider decreasing bid by 15-30% or pausing
3. If keyword has high clicks but no sales: Review relevance or pause
4. If keyword has good conversion rate but low impressions: Increase bid significantly

Provide specific recommendations in JSON format:
{
  "keywords": [
    {
      "keywordId": number,
      "currentBid": number,
      "recommendedBid": number,
      "action": "increase" | "decrease" | "pause" | "keep",
      "reason": string
    }
  ],
  "budgetRecommendation": {
    "current": number,
    "recommended": number,
    "reason": string
  },
  "summary": string
}
`;

export async function getOptimizationRecommendations(
  context: OptimizationContext
): Promise<OptimizationResult> {
  // This uses Opus because it's a complex strategic analysis
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: OPTIMIZATION_PROMPT
          .replace('{campaignName}', context.campaign.name)
          .replace('{budget}', context.budget.toString())
          .replace('{targetAcos}', context.targetAcos.toString())
          .replace('{breakEvenAcos}', context.breakEvenAcos.toString())
          .replace('{keywordData}', JSON.stringify(context.keywords, null, 2)),
      },
    ],
  });

  return JSON.parse(response.content[0].text);
}
```

---

## ⚡ Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| Campaigns | 10 requests/second |
| Ad Groups | 10 requests/second |
| Keywords | 10 requests/second |
| Reports | 1 request/minute (create) |
| Bulk Operations | 5 requests/second |

---

## 🗄️ Database Schema

```sql
-- Amazon Ads connection (separate from SP-API)
CREATE TABLE amazon_ads_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  marketplace_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_name TEXT,
  account_type TEXT,  -- 'seller' or 'vendor'
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Campaigns
CREATE TABLE amazon_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_type TEXT NOT NULL,  -- 'sp', 'sb', 'sd'
  name TEXT,
  state TEXT,
  targeting_type TEXT,
  daily_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Daily campaign metrics
CREATE TABLE amazon_ad_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- Core metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,

  -- Attribution (7-day, 14-day, 30-day)
  sales_7d DECIMAL(10,2) DEFAULT 0,
  sales_14d DECIMAL(10,2) DEFAULT 0,
  sales_30d DECIMAL(10,2) DEFAULT 0,
  orders_7d INTEGER DEFAULT 0,
  orders_14d INTEGER DEFAULT 0,
  orders_30d INTEGER DEFAULT 0,
  units_7d INTEGER DEFAULT 0,
  units_14d INTEGER DEFAULT 0,
  units_30d INTEGER DEFAULT 0,

  -- Calculated
  acos DECIMAL(5,2),
  roas DECIMAL(5,2),
  cpc DECIMAL(5,2),
  ctr DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id, date)
);

-- Search term reports
CREATE TABLE amazon_ad_search_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT NOT NULL,
  keyword_id TEXT,
  search_term TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI optimization history
CREATE TABLE amazon_ad_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  optimization_type TEXT,  -- 'bid', 'budget', 'keyword'
  recommendations JSONB,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE amazon_ads_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_ad_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_ad_search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_ad_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own ads data" ON amazon_ads_connections
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ads data" ON amazon_ad_campaigns
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ads data" ON amazon_ad_daily_metrics
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ads data" ON amazon_ad_search_terms
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ads data" ON amazon_ad_optimizations
  FOR ALL USING (auth.uid() = user_id);
```

---

## 📊 Dashboard Widgets (Faz 2)

### PPC Performance Card
```
┌─────────────────────────────────────┐
│  📊 PPC Performance (30D)           │
├─────────────────────────────────────┤
│  Ad Spend    │  $2,345.67  │  ↑ 12% │
│  PPC Sales   │  $8,901.23  │  ↑ 18% │
│  ACOS        │  26.3%      │  ↓ 5%  │
│  ROAS        │  3.79x      │  ↑ 8%  │
├─────────────────────────────────────┤
│  Break-even ACOS: 32%               │
│  Status: ✅ Profitable              │
└─────────────────────────────────────┘
```

### Campaign List
```
┌─────────────────────────────────────────────────────┐
│  Campaign              │ Spend   │ Sales   │ ACOS  │
├────────────────────────┼─────────┼─────────┼───────┤
│  Main - Auto           │ $456    │ $1,890  │ 24.1% │
│  Brand - Exact         │ $234    │ $980    │ 23.9% │
│  Competitor - Phrase   │ $189    │ $560    │ 33.8% │
│  Discovery - Broad     │ $345    │ $890    │ 38.8% │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 İlgili Kaynaklar

- [Amazon Ads API Documentation](https://advertising.amazon.com/API/docs/en-us)
- [Sponsored Products API](https://advertising.amazon.com/API/docs/en-us/sponsored-products/3-0/openapi/prod)
- [Reporting API](https://advertising.amazon.com/API/docs/en-us/reporting/v3/overview)
- [Best Practices Guide](https://advertising.amazon.com/API/docs/en-us/get-started/best-practices)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 2 (SP-API tamamlandıktan sonra)
