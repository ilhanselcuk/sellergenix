// AI Chat Service
// Routes queries between Haiku (fast/cheap) and Opus (powerful/expensive)

import Anthropic from '@anthropic-ai/sdk';
import { classifyQuery } from './classifier';
import { HAIKU_SYSTEM_PROMPT, OPUS_SYSTEM_PROMPT } from './prompts';
import { getUserContext, getFullHistoricalContext, getCustomRangeMetrics, UserContext, PeriodMetrics } from './context';

// =============================================
// CUSTOM DATE RANGE DETECTION
// Detects date ranges in user messages (TR + EN formats)
// Examples: "25 Ekim - 25 Ocak", "Oct 25 to Jan 25", "15/12/2025 - 10/01/2026"
// =============================================

interface DetectedDateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  originalText: string; // The matched text for display
}

// Turkish and English month mappings
const MONTH_MAP: { [key: string]: number } = {
  // Turkish
  'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'haziran': 6,
  'temmuz': 7, 'ağustos': 8, 'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12,
  // English
  'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
  'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
  'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
  'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12
};

function detectCustomDateRange(message: string): DetectedDateRange | null {
  const lowerMessage = message.toLowerCase();
  const currentYear = new Date().getFullYear();

  // =============================================
  // RANGE PATTERNS (two dates)
  // =============================================

  // Pattern 1: "25 Ekim - 25 Ocak" or "25 Ekim ile 25 Ocak" (Turkish range)
  const monthPatternTR = /(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(\d{4}))?\s*(?:-|ile|arası|ve|to)\s*(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(\d{4}))?/i;

  // Pattern 2: "Oct 25 to Jan 25" or "October 25 - January 25" (English range)
  const monthPatternEN = /(?:(\d{1,2})\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?(?:,?\s*(\d{4}))?\s*(?:-|to|and|vs|versus)\s*(?:(\d{1,2})\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?(?:,?\s*(\d{4}))?/i;

  // Pattern 3: "DD/MM/YYYY - DD/MM/YYYY"
  const numericPattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(?:-|to)\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/;

  // Pattern 4: "YYYY-MM-DD to YYYY-MM-DD"
  const isoPattern = /(\d{4})-(\d{1,2})-(\d{1,2})\s*(?:-|to|ile)\s*(\d{4})-(\d{1,2})-(\d{1,2})/;

  // =============================================
  // SINGLE DATE PATTERNS (one date = that day only)
  // =============================================

  // Pattern 5: "12 Kasım 2025" or "12 kasım" (Turkish single date)
  const singleDateTR = /(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(\d{4}))?/i;

  // Pattern 6: "Nov 12, 2025" or "November 12" or "12 Nov" (English single date)
  const singleDateEN = /(?:(\d{1,2})\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})?(?:,?\s*(\d{4}))?/i;

  let matchTR = lowerMessage.match(monthPatternTR);
  let matchEN = lowerMessage.match(monthPatternEN);
  let matchNumeric = message.match(numericPattern);
  let matchISO = message.match(isoPattern);

  // Only check single date if no range pattern matched
  let singleMatchTR = !matchTR ? lowerMessage.match(singleDateTR) : null;
  let singleMatchEN = !matchEN ? lowerMessage.match(singleDateEN) : null;

  try {
    // Turkish pattern: "25 Ekim - 25 Ocak"
    if (matchTR) {
      const startDay = parseInt(matchTR[1]);
      const startMonth = MONTH_MAP[matchTR[2].toLowerCase()];
      const startYear = matchTR[3] ? parseInt(matchTR[3]) : (startMonth > new Date().getMonth() + 1 ? currentYear - 1 : currentYear);
      const endDay = parseInt(matchTR[4]);
      const endMonth = MONTH_MAP[matchTR[5].toLowerCase()];
      const endYear = matchTR[6] ? parseInt(matchTR[6]) : currentYear;

      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
        endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
        originalText: matchTR[0]
      };
    }

    // English pattern: "Oct 25 to Jan 25"
    if (matchEN) {
      // Handle both "Oct 25" and "25 Oct" formats
      const startDay = matchEN[1] ? parseInt(matchEN[1]) : (matchEN[3] ? parseInt(matchEN[3]) : 1);
      const startMonth = MONTH_MAP[matchEN[2].toLowerCase()];
      const startYear = matchEN[4] ? parseInt(matchEN[4]) : (startMonth > new Date().getMonth() + 1 ? currentYear - 1 : currentYear);
      const endDay = matchEN[5] ? parseInt(matchEN[5]) : (matchEN[7] ? parseInt(matchEN[7]) : new Date(currentYear, matchEN[6] ? MONTH_MAP[matchEN[6].toLowerCase()] : 1, 0).getDate());
      const endMonth = MONTH_MAP[matchEN[6].toLowerCase()];
      const endYear = matchEN[8] ? parseInt(matchEN[8]) : currentYear;

      return {
        startDate: `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
        endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
        originalText: matchEN[0]
      };
    }

    // Numeric pattern: "25/10/2025 - 25/01/2026"
    if (matchNumeric) {
      return {
        startDate: `${matchNumeric[3]}-${matchNumeric[2].padStart(2, '0')}-${matchNumeric[1].padStart(2, '0')}`,
        endDate: `${matchNumeric[6]}-${matchNumeric[5].padStart(2, '0')}-${matchNumeric[4].padStart(2, '0')}`,
        originalText: matchNumeric[0]
      };
    }

    // ISO pattern: "2025-10-25 to 2026-01-25"
    if (matchISO) {
      return {
        startDate: `${matchISO[1]}-${matchISO[2].padStart(2, '0')}-${matchISO[3].padStart(2, '0')}`,
        endDate: `${matchISO[4]}-${matchISO[5].padStart(2, '0')}-${matchISO[6].padStart(2, '0')}`,
        originalText: matchISO[0]
      };
    }

    // =============================================
    // SINGLE DATE HANDLING (same day start/end)
    // =============================================

    // Turkish single date: "12 Kasım 2025" or "12 kasım"
    if (singleMatchTR) {
      const day = parseInt(singleMatchTR[1]);
      const month = MONTH_MAP[singleMatchTR[2].toLowerCase()];
      // If year not specified, use current year or previous year if month is in the future
      const year = singleMatchTR[3] ? parseInt(singleMatchTR[3]) :
        (month > new Date().getMonth() + 1 ? currentYear - 1 : currentYear);

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        startDate: dateStr,
        endDate: dateStr, // Same day
        originalText: singleMatchTR[0]
      };
    }

    // English single date: "Nov 12, 2025" or "November 12" or "12 Nov"
    if (singleMatchEN) {
      // Handle both "Nov 12" and "12 Nov" formats
      const day = singleMatchEN[1] ? parseInt(singleMatchEN[1]) :
        (singleMatchEN[3] ? parseInt(singleMatchEN[3]) : 1);
      const month = MONTH_MAP[singleMatchEN[2].toLowerCase()];
      const year = singleMatchEN[4] ? parseInt(singleMatchEN[4]) :
        (month > new Date().getMonth() + 1 ? currentYear - 1 : currentYear);

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        startDate: dateStr,
        endDate: dateStr, // Same day
        originalText: singleMatchEN[0]
      };
    }
  } catch (e) {
    // If parsing fails, return null
    return null;
  }

  return null;
}

// Format custom range metrics for AI context
function formatCustomRangeContext(metrics: PeriodMetrics, range: DetectedDateRange): string {
  return `
=== CUSTOM DATE RANGE (User requested: "${range.originalText}") ===
Period: ${range.startDate} to ${range.endDate}

- Sales: $${metrics.sales.toLocaleString()}
- Orders: ${metrics.orders}
- Units: ${metrics.units}
- Amazon Fees: $${metrics.amazonFees.toLocaleString()}
- Gross Profit: $${metrics.grossProfit.toLocaleString()}
- Net Profit: $${metrics.netProfit.toLocaleString()}
- Margin: ${metrics.margin}%
- Ad Spend: $${metrics.adSpend.toLocaleString()}
- ACOS: ${metrics.acos}%

Note: This is REAL data from Amazon Sales API for the exact date range specified.
`;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  model: 'haiku' | 'opus';
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
  classification: {
    confidence: number;
    reason: string;
  };
}

function formatContextForAI(context: UserContext): string {
  return `
=== SELLER INFORMATION ===
Store: ${context.seller.storeName}
Marketplace: ${context.seller.marketplace}

=== PERIOD METRICS (All data from Amazon Sales API - Real-time accurate) ===

TODAY (${context.periods.today.startDate}):
- Sales: $${context.periods.today.sales.toLocaleString()}
- Orders: ${context.periods.today.orders}
- Units: ${context.periods.today.units}
- Amazon Fees: $${context.periods.today.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.today.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.today.netProfit.toLocaleString()}
- Margin: ${context.periods.today.margin}%
- Ad Spend: $${context.periods.today.adSpend.toLocaleString()}
- ACOS: ${context.periods.today.acos}%

YESTERDAY (${context.periods.yesterday.startDate}):
- Sales: $${context.periods.yesterday.sales.toLocaleString()}
- Orders: ${context.periods.yesterday.orders}
- Units: ${context.periods.yesterday.units}
- Amazon Fees: $${context.periods.yesterday.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.yesterday.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.yesterday.netProfit.toLocaleString()}
- Margin: ${context.periods.yesterday.margin}%
- Ad Spend: $${context.periods.yesterday.adSpend.toLocaleString()}
- ACOS: ${context.periods.yesterday.acos}%

LAST 7 DAYS (${context.periods.last7Days.startDate} to ${context.periods.last7Days.endDate}):
- Sales: $${context.periods.last7Days.sales.toLocaleString()}
- Orders: ${context.periods.last7Days.orders}
- Units: ${context.periods.last7Days.units}
- Amazon Fees: $${context.periods.last7Days.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.last7Days.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.last7Days.netProfit.toLocaleString()}
- Margin: ${context.periods.last7Days.margin}%
- Ad Spend: $${context.periods.last7Days.adSpend.toLocaleString()}
- ACOS: ${context.periods.last7Days.acos}%

LAST 30 DAYS (${context.periods.last30Days.startDate} to ${context.periods.last30Days.endDate}):
- Sales: $${context.periods.last30Days.sales.toLocaleString()}
- Orders: ${context.periods.last30Days.orders}
- Units: ${context.periods.last30Days.units}
- Amazon Fees: $${context.periods.last30Days.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.last30Days.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.last30Days.netProfit.toLocaleString()}
- Margin: ${context.periods.last30Days.margin}%
- Ad Spend: $${context.periods.last30Days.adSpend.toLocaleString()}
- ACOS: ${context.periods.last30Days.acos}%

THIS MONTH (${context.periods.thisMonth.startDate} to ${context.periods.thisMonth.endDate}):
- Sales: $${context.periods.thisMonth.sales.toLocaleString()}
- Orders: ${context.periods.thisMonth.orders}
- Units: ${context.periods.thisMonth.units}
- Amazon Fees: $${context.periods.thisMonth.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.thisMonth.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.thisMonth.netProfit.toLocaleString()}
- Margin: ${context.periods.thisMonth.margin}%
- Ad Spend: $${context.periods.thisMonth.adSpend.toLocaleString()}
- ACOS: ${context.periods.thisMonth.acos}%

LAST MONTH (${context.periods.lastMonth.startDate} to ${context.periods.lastMonth.endDate}):
- Sales: $${context.periods.lastMonth.sales.toLocaleString()}
- Orders: ${context.periods.lastMonth.orders}
- Units: ${context.periods.lastMonth.units}
- Amazon Fees: $${context.periods.lastMonth.amazonFees.toLocaleString()}
- Gross Profit: $${context.periods.lastMonth.grossProfit.toLocaleString()}
- Net Profit: $${context.periods.lastMonth.netProfit.toLocaleString()}
- Margin: ${context.periods.lastMonth.margin}%
- Ad Spend: $${context.periods.lastMonth.adSpend.toLocaleString()}
- ACOS: ${context.periods.lastMonth.acos}%

=== FEE BREAKDOWN (This Month) ===
- FBA Fulfillment Fees: $${context.feeBreakdown.thisMonth.fbaFulfillment.toLocaleString()}
- Referral Fees: $${context.feeBreakdown.thisMonth.referral.toLocaleString()}
- Storage Fees: $${context.feeBreakdown.thisMonth.storage.toLocaleString()}
- Subscription Fees: $${context.feeBreakdown.thisMonth.subscription.toLocaleString()}
- Other Fees: $${context.feeBreakdown.thisMonth.other.toLocaleString()}
- Total Fees: $${context.feeBreakdown.thisMonth.total.toLocaleString()}

=== FEE BREAKDOWN (Last Month) ===
- FBA Fulfillment Fees: $${context.feeBreakdown.lastMonth.fbaFulfillment.toLocaleString()}
- Referral Fees: $${context.feeBreakdown.lastMonth.referral.toLocaleString()}
- Storage Fees: $${context.feeBreakdown.lastMonth.storage.toLocaleString()}
- Subscription Fees: $${context.feeBreakdown.lastMonth.subscription.toLocaleString()}
- Other Fees: $${context.feeBreakdown.lastMonth.other.toLocaleString()}
- Total Fees: $${context.feeBreakdown.lastMonth.total.toLocaleString()}

=== TRENDS ===
- Sales Trend: ${context.trends.salesTrend} (${context.trends.salesChangePercent > 0 ? '+' : ''}${context.trends.salesChangePercent}% vs last month)
- Profit Trend: ${context.trends.profitTrend} (${context.trends.profitChangePercent > 0 ? '+' : ''}${context.trends.profitChangePercent}% vs last month)

=== REFUNDS ===
- This Month: ${context.refunds.thisMonth.count} refunds ($${context.refunds.thisMonth.amount.toLocaleString()})
- Last Month: ${context.refunds.lastMonth.count} refunds ($${context.refunds.lastMonth.amount.toLocaleString()})

=== TOP PRODUCTS (Last 30 Days - Top 10) ===
${context.topProducts.map((p, i) => `
${i + 1}. ${p.name}
   ASIN: ${p.asin} | SKU: ${p.sku}
   Revenue: $${p.revenue.toLocaleString()} | Profit: $${p.profit.toLocaleString()} | Units: ${p.units} | Margin: ${p.margin}%
`).join('')}

=== TODAY'S SOLD PRODUCTS (${context.periods.today.startDate}) ===
${context.todaySoldProducts.length > 0
  ? context.todaySoldProducts.map((p, i) => `
${i + 1}. ${p.name}
   ASIN: ${p.asin} | SKU: ${p.sku}
   Quantity: ${p.quantity} | Price: $${p.price.toLocaleString()}
   Order ID: ${p.orderId} | Time: ${new Date(p.orderTime).toLocaleString()}
`).join('')
  : 'No products sold today yet.'}

=== YESTERDAY'S SOLD PRODUCTS (${context.periods.yesterday.startDate}) ===
${context.yesterdaySoldProducts.length > 0
  ? context.yesterdaySoldProducts.map((p, i) => `
${i + 1}. ${p.name}
   ASIN: ${p.asin} | SKU: ${p.sku}
   Quantity: ${p.quantity} | Price: $${p.price.toLocaleString()}
   Order ID: ${p.orderId} | Time: ${new Date(p.orderTime).toLocaleString()}
`).join('')
  : 'No products sold yesterday.'}

=== THIS MONTH PRODUCT SALES (${context.periods.thisMonth.startDate} to ${context.periods.thisMonth.endDate}) ===
${context.thisMonthProductSales.length > 0
  ? context.thisMonthProductSales.map((p, i) => `
${i + 1}. ${p.name}
   ASIN: ${p.asin} | SKU: ${p.sku}
   Units Sold: ${p.totalUnits} | Revenue: $${p.totalRevenue.toLocaleString()} | Orders: ${p.orderCount}
`).join('')
  : 'No product sales data for this month.'}

=== LAST MONTH PRODUCT SALES (${context.periods.lastMonth.startDate} to ${context.periods.lastMonth.endDate}) ===
${context.lastMonthProductSales.length > 0
  ? context.lastMonthProductSales.map((p, i) => `
${i + 1}. ${p.name}
   ASIN: ${p.asin} | SKU: ${p.sku}
   Units Sold: ${p.totalUnits} | Revenue: $${p.totalRevenue.toLocaleString()} | Orders: ${p.orderCount}
`).join('')
  : 'No product sales data for last month.'}

=== ACTIVE ALERTS ===
${context.alerts.length > 0
  ? context.alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.message}`).join('\n')
  : 'No active alerts'}
`;
}

function formatHistoricalContext(historical: {
  totalSales: number;
  totalOrders: number;
  totalUnits: number;
  oldestOrderDate: string | null;
  newestOrderDate: string | null;
  monthlyBreakdown: Array<{ month: string; sales: number; orders: number }>;
}): string {
  if (!historical.oldestOrderDate) {
    return '\n=== HISTORICAL DATA ===\nNo historical data available.';
  }

  return `
=== HISTORICAL DATA (ALL TIME) ===
Data Range: ${historical.oldestOrderDate} to ${historical.newestOrderDate}
Total Sales (All Time): $${historical.totalSales.toLocaleString()}
Total Orders (All Time): ${historical.totalOrders.toLocaleString()}
Total Units (All Time): ${historical.totalUnits.toLocaleString()}

=== MONTHLY BREAKDOWN ===
${historical.monthlyBreakdown.map(m =>
  `${m.month}: Sales $${m.sales.toLocaleString()} | Orders: ${m.orders}`
).join('\n')}
`;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Classify query to determine model
  const classification = classifyQuery(request.message);

  // Detect custom date range in user message
  const detectedRange = detectCustomDateRange(request.message);

  // Fetch all data in parallel
  const fetchPromises: [
    Promise<UserContext>,
    Promise<{ totalSales: number; totalOrders: number; totalUnits: number; oldestOrderDate: string | null; newestOrderDate: string | null; monthlyBreakdown: Array<{ month: string; sales: number; orders: number }> }>,
    Promise<PeriodMetrics | null>
  ] = [
    getUserContext(request.userId),
    getFullHistoricalContext(request.userId),
    detectedRange
      ? getCustomRangeMetrics(request.userId, detectedRange.startDate, detectedRange.endDate)
      : Promise.resolve(null)
  ];

  const [context, historical, customRangeMetrics] = await Promise.all(fetchPromises);

  // Select model based on classification
  const modelId = classification.model === 'opus'
    ? 'claude-sonnet-4-20250514'  // Using Sonnet for cost-effectiveness (Opus is $15/$75 per MTok)
    : 'claude-3-5-haiku-20241022';

  const systemPrompt = classification.model === 'opus'
    ? OPUS_SYSTEM_PROMPT
    : HAIKU_SYSTEM_PROMPT;

  const maxTokens = classification.model === 'opus' ? 4096 : 1024;

  // Build custom range context if detected
  const customRangeContext = detectedRange && customRangeMetrics
    ? formatCustomRangeContext(customRangeMetrics, detectedRange)
    : '';

  // Build messages array
  const messages: Anthropic.MessageParam[] = [
    // First: Inject context with full historical data + custom range if detected
    {
      role: 'user',
      content: `[SELLER DATA CONTEXT - Use this to answer questions]
${formatContextForAI(context)}
${formatHistoricalContext(historical)}
${customRangeContext}
[END CONTEXT]

I've loaded your complete e-commerce data including full historical records.${customRangeContext ? ' I also fetched PRECISE data for your requested custom date range - use this exact data for your answer.' : ''} Please use this data to answer my questions accurately. Do not mention the context format in your responses.`,
    },
    {
      role: 'assistant',
      content: 'I have your e-commerce data ready. How can I help you today? Feel free to ask about your sales, profits, or any business metrics.',
    },
    // Add conversation history (last 10 messages for context)
    ...(request.conversationHistory || []).slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    // Add current message
    {
      role: 'user',
      content: request.message,
    },
  ];

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  // Calculate cost
  // Haiku: $0.25/$1.25 per MTok | Sonnet: $3/$15 per MTok
  const inputCost = classification.model === 'opus'
    ? (response.usage.input_tokens / 1_000_000) * 3
    : (response.usage.input_tokens / 1_000_000) * 0.25;

  const outputCost = classification.model === 'opus'
    ? (response.usage.output_tokens / 1_000_000) * 15
    : (response.usage.output_tokens / 1_000_000) * 1.25;

  const totalCost = inputCost + outputCost;

  // Extract text response
  const textContent = response.content.find(c => c.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '';

  return {
    response: responseText,
    model: classification.model,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    cost: Math.round(totalCost * 1000000) / 1000000, // Round to 6 decimal places
    classification: {
      confidence: classification.confidence,
      reason: classification.reason,
    },
  };
}
