# Amazon Advertising API - Comprehensive Reference Guide

**Last Updated:** 30 Ocak 2026
**SellerGenix Integration Status:** ✅ Active
**API Version:** v3 (Reports), v2 (Legacy Support)

---

## 📚 Official Documentation Links

| Resource | URL | Description |
|----------|-----|-------------|
| **API Overview** | https://advertising.amazon.com/API/docs/en-us/guides/overview | Main documentation hub |
| **API Reference** | https://advertising.amazon.com/API/docs/en-us/reference/api-overview | Endpoint specifications |
| **Bulksheets** | https://advertising.amazon.com/API/docs/en-us/bulksheets/no-code-overview | Bulk operations |
| **GitHub Tools** | https://github.com/amzn/ads-advanced-tools-docs | Postman collections, code artifacts |
| **Getting Started** | https://advertising.amazon.com/API/docs/en-us/guides/get-started/overview | First steps guide |
| **Authorization** | https://advertising.amazon.com/API/docs/en-us/guides/account-management/authorization/overview | OAuth setup |
| **Rate Limiting** | https://advertising.amazon.com/API/docs/en-us/reference/concepts/rate-limiting | Throttling info |

---

## 🌍 Regional Endpoints

### Production Endpoints

| Region | Code | Endpoint | Marketplaces |
|--------|------|----------|--------------|
| **North America** | NA | `https://advertising-api.amazon.com` | US, CA, MX, BR |
| **Europe** | EU | `https://advertising-api-eu.amazon.com` | UK, FR, IT, ES, DE, NL, AE, SE, PL, TR |
| **Far East** | FE | `https://advertising-api-fe.amazon.com` | JP, AU, SG |

### Sandbox Endpoints

| Region | Endpoint |
|--------|----------|
| North America | `https://advertising-api-test.amazon.com` |
| Europe | `https://advertising-api-eu-test.amazon.com` |
| Far East | `https://advertising-api-fe-test.amazon.com` |

> ⚠️ **CRITICAL:** Authorization occurs at the region level. If you attempt to set a region that is not associated with your advertiser profile, the API will reject your requests.

---

## 🔐 Authentication

### OAuth 2.0 Flow

1. **Application Registration:** Create LwA (Login with Amazon) Security Profile
2. **Authorization URL:** `https://www.amazon.com/ap/oa`
3. **Token Exchange:** `https://api.amazon.com/auth/o2/token`
4. **Scope:** `advertising::campaign_management`

### Required Headers

```http
Authorization: Bearer {access_token}
Amazon-Advertising-API-ClientId: {client_id}
Amazon-Advertising-API-Scope: {profile_id}
Content-Type: application/json
```

### Token Refresh

Access tokens expire after 1 hour. Use refresh token to get new access token:

```http
POST https://api.amazon.com/auth/o2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_id}
&client_secret={client_secret}
```

---

## 📊 Campaign Types

### Supported Ad Types

| Type | Code | Description | Reports API Version |
|------|------|-------------|---------------------|
| **Sponsored Products** | SP | Product-level ads in search results | v3 (Full support) |
| **Sponsored Brands** | SB | Brand/headline search ads | v3 (New support) |
| **Sponsored Brands Video** | SBV | Video ads in search results | v3 (New support) |
| **Sponsored Display** | SD | Display/retargeting ads | v3 (New support) |
| **DSP** | DSP | Demand-Side Platform (programmatic) | Separate API |

### Naming Convention

- `_sp_` = Sponsored Products
- `_sb_` = Sponsored Brands
- `_sbv_` = Sponsored Brands Video
- `_sd_` = Sponsored Display

---

## 📈 Reports API

### Version Migration Status

| Ad Type | v2 Status | v3 Status | Notes |
|---------|-----------|-----------|-------|
| Sponsored Products | Available | ✅ Full | Migrate to v3 |
| Sponsored Brands | Available | ✅ Full | Newly supported |
| Sponsored Display | Available | ✅ Full | Newly supported |

### Report Request Flow

```
1. POST /reporting/reports (Request report)
   ↓
2. GET /reporting/reports/{reportId} (Poll status)
   ↓ (Status: COMPLETED)
3. Download report from URL
```

### Key Report Types

| Report Type | Description | Max Date Range |
|-------------|-------------|----------------|
| `campaigns` | Campaign-level metrics | 60 days |
| `adGroups` | Ad group metrics | 60 days |
| `keywords` | Keyword performance | 60 days |
| `targets` | Targeting report | 60 days |
| `asins` | ASIN-level breakdown | 60 days |
| `searchTerms` | Search term report | 60 days |

### Important Limitations

- **Maximum date range per request:** 60 days
- **Data availability:** Up to 48 hours delay
- **Restatement periods:** 1, 7, and 28 days after conversion

---

## 📐 Attribution Windows

### By Campaign Type

| Campaign Type | Attribution Window | Notes |
|---------------|-------------------|-------|
| **Sponsored Products** | 7 days (Sellers), 14 days (Vendors) | Click-to-purchase |
| **Sponsored Brands** | 14 days | Includes brand halo effect |
| **Sponsored Display** | 14 days | Click and view attribution |
| **Amazon Attribution** | 14 days | Off-Amazon traffic |

### Restatement Schedule

Conversion data is restated at:
- **Day 1:** Initial data
- **Day 7:** First restatement
- **Day 28:** Final restatement

> ⚠️ For 14-day attribution window, restatement can update data up to **42 days** (14 + 28) after the report date.

---

## 📊 Key Metrics

### Performance Metrics

| Metric | Description | Formula |
|--------|-------------|---------|
| **Impressions** | Ad views | Count of times ad was shown |
| **Clicks** | Ad clicks | Count of clicks on ad |
| **CTR** | Click-through rate | `(Clicks / Impressions) × 100` |
| **CPC** | Cost per click | `Ad Spend / Clicks` |
| **Spend** | Total ad cost | Sum of all ad costs |

### Conversion Metrics

| Metric | Description | Formula |
|--------|-------------|---------|
| **Orders** | Attributed orders | Orders within attribution window |
| **Sales** | Attributed revenue | Revenue within attribution window |
| **Units** | Units sold | Items sold from ad clicks |
| **CVR** | Conversion rate | `(Orders / Clicks) × 100` |

### Profitability Metrics

| Metric | Description | Formula |
|--------|-------------|---------|
| **ACOS** | Advertising Cost of Sales | `(Ad Spend / Ad Sales) × 100` |
| **ROAS** | Return on Ad Spend | `Ad Sales / Ad Spend` |
| **TACoS** | Total ACOS | `(Ad Spend / Total Sales) × 100` |

### ACOS Benchmarks

| Level | ACOS Range | Interpretation |
|-------|------------|----------------|
| Excellent | < 15% | Highly profitable |
| Good | 15-25% | Profitable |
| Acceptable | 25-35% | Break-even to low profit |
| Poor | > 35% | Unprofitable (may be okay for new products) |

---

## ⚡ Rate Limiting

### Throttling Behavior

- **Response Code:** HTTP 429 (Too Many Requests)
- **Header:** `Retry-After` indicates wait time in seconds
- **Algorithm:** Token bucket with dynamic refill

### Best Practices

1. **Implement exponential backoff** for retries
2. **Respect `Retry-After` header** value
3. **Use batch operations** where possible
4. **Monitor rate limit headers** in responses
5. **Contact support** for higher limits if needed

### Rate Limit Handling

```typescript
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.headers['retry-after'] || Math.pow(2, i) * 1000
        await sleep(retryAfter)
        continue
      }
      throw error
    }
  }
}
```

---

## 🔧 Bulk Operations

### Bulksheets

Amazon Ads API supports bulk operations for:
- Creating/updating campaigns
- Creating/updating ad groups
- Creating/updating keywords
- Creating/updating targets

### Bulk Request Format

Bulk operations typically use array payloads:

```json
[
  { "campaignId": 123, "budget": 100 },
  { "campaignId": 456, "budget": 200 }
]
```

---

## 🛠️ GitHub Resources

### Repository: amzn/ads-advanced-tools-docs

| Resource | Description |
|----------|-------------|
| **Postman Collection** | Ready-to-use API request collection |
| **CloudFormation Template** | Amazon Marketing Stream setup |
| **Jupyter Notebooks** | Code examples and tutorials |
| **Discussions** | Community Q&A |

### Useful Third-Party Libraries

| Language | Library | URL |
|----------|---------|-----|
| Python | python-amazon-ad-api | https://github.com/denisneuf/python-amazon-ad-api |
| Node.js | amazon-advertising-api | npm package |

---

## 📅 Data Timing Considerations

### Data Availability

| Data Type | Typical Delay | Notes |
|-----------|---------------|-------|
| Impressions | 2-4 hours | Near real-time |
| Clicks | 2-4 hours | Near real-time |
| Spend | 2-4 hours | Near real-time |
| Orders/Sales | 12-48 hours | Attribution processing |
| ACOS/ROAS | 12-48 hours | Calculated from above |

### Recommendations

1. **Wait 48 hours** before considering data complete
2. **Allow 7 days** for small adjustments before optimization decisions
3. **Account for restatement** when analyzing historical data
4. **Use moving averages** instead of single-day metrics

---

## 🔄 SellerGenix Integration Details

### Sync Schedule

| Sync Type | Frequency | Data Range |
|-----------|-----------|------------|
| **Initial Sync** | On OAuth callback | 24 months |
| **Scheduled Sync** | Every 3 hours | Last 7 days (rolling) |

### Data Storage

```sql
-- Table: ads_daily_metrics
- user_id, profile_id, date
- total_spend, sp_spend, sb_spend, sbv_spend, sd_spend
- total_sales, sp_sales, sb_sales, sbv_sales, sd_sales
- impressions, clicks, orders, units
- acos, roas, ctr, cpc, cvr
```

### Chunk Strategy (Timeout-Safe)

```
24 months = ~720 days
720 days ÷ 60 days/chunk = 12 chunks

Process: Newest → Oldest (progressive loading)
Timeout protection: Each chunk = separate Inngest step
```

---

## 🚨 Common Issues & Solutions

### Issue: Region Mismatch

**Symptom:** API requests fail with authorization error
**Solution:** Ensure profile_id matches the region you're calling

### Issue: Empty Report Data

**Symptom:** Report returns no data
**Cause:** Data not yet available (up to 48 hour delay)
**Solution:** Wait and retry, use `Retry-After` header

### Issue: Rate Limit Exceeded

**Symptom:** HTTP 429 responses
**Solution:** Implement exponential backoff, reduce request frequency

### Issue: Stale Conversion Data

**Symptom:** ACOS changes over time
**Cause:** Attribution restatement (up to 42 days)
**Solution:** Account for restatement in analysis, wait 7+ days for stable data

---

## 📞 Support

- **API Support Email:** ads-api-support@amazon.com
- **Documentation Issues:** https://github.com/amzn/ads-advanced-tools-docs/issues
- **Discussion Forum:** https://github.com/amzn/ads-advanced-tools-docs/discussions

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| Jan 2025 | v3 | Portfolios API deprecated |
| 2024 | v3 | SB/SD reports added to v3 |
| 2023 | v3 | SP reports v3 released |

---

## 🔗 Quick Reference URLs

### For SellerGenix Development

```
# Guides
https://advertising.amazon.com/API/docs/en-us/guides/overview
https://advertising.amazon.com/API/docs/en-us/guides/get-started/overview
https://advertising.amazon.com/API/docs/en-us/guides/reporting/v2/sponsored-ads-reports

# API Reference
https://advertising.amazon.com/API/docs/en-us/reference/api-overview
https://advertising.amazon.com/API/docs/en-us/reference/sponsored-products/2/reports
https://advertising.amazon.com/API/docs/en-us/reference/sponsored-brands/2/reports
https://advertising.amazon.com/API/docs/en-us/reference/sponsored-display/2/reports

# Account & Auth
https://advertising.amazon.com/API/docs/en-us/guides/account-management/authorization/overview

# GitHub
https://github.com/amzn/ads-advanced-tools-docs
```

---

**Sources:**
- [Amazon Ads API Overview](https://advertising.amazon.com/API/docs/en-us/reference/api-overview)
- [Saras Analytics - Amazon Advertising API Guide](https://www.sarasanalytics.com/blog/amazon-advertising-api)
- [Amazon Ads Sponsored Ads Reports](https://advertising.amazon.com/API/docs/en-us/guides/reporting/v2/sponsored-ads-reports)
- [Openbridge - Attribution & Timing](https://docs.openbridge.com/en/articles/4208366-amazon-advertising-attribution-definitions-and-timing)
- [Amazon Ads Rate Limiting](https://advertising.amazon.com/API/docs/en-us/reference/concepts/rate-limiting)
- [GitHub - amzn/ads-advanced-tools-docs](https://github.com/amzn/ads-advanced-tools-docs)
- [GitHub - python-amazon-ad-api](https://github.com/denisneuf/python-amazon-ad-api)
