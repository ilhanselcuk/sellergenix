// Context Builder for AI Chat
// Fetches user's real e-commerce data to provide to Claude
// Uses Amazon Sales API for accurate metrics (same as dashboard)

import { createClient } from '@supabase/supabase-js';
import { getMetricsForDateRange } from '@/lib/amazon-sp-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AdsBreakdown {
  sponsoredProducts: number;      // SP campaigns
  sponsoredBrands: number;        // SB campaigns
  sponsoredBrandsVideo: number;   // SBV campaigns
  sponsoredDisplay: number;       // SD campaigns
  total: number;
  // Sales from ads (attributed)
  sponsoredProductsSales?: number;
  sponsoredBrandsSales?: number;
  sponsoredBrandsVideoSales?: number;
  sponsoredDisplaySales?: number;
  totalSales?: number;
  // Calculated metrics
  acos?: number;  // (total spend / total sales) * 100
  roas?: number;  // total sales / total spend
}

export interface PeriodMetrics {
  label: string;
  startDate: string;
  endDate: string;
  sales: number;
  orders: number;
  units: number;
  amazonFees: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  adSpend: number;
  acos: number;
  // Amazon Ads breakdown from Advertising API
  adsBreakdown?: AdsBreakdown;
}

export interface ProductSummary {
  name: string;
  asin: string;
  sku: string;
  revenue: number;
  profit: number;
  units: number;
  margin: number;
}

export interface FeeBreakdown {
  fbaFulfillment: number;
  referral: number;
  storage: number;
  subscription: number;
  refundCommission: number;
  other: number;
  total: number;
}

export interface SoldProduct {
  name: string;
  asin: string;
  sku: string;
  quantity: number;
  price: number;
  orderId: string;
  orderTime: string;
}

export interface ProductSales {
  name: string;
  asin: string;
  sku: string;
  totalUnits: number;
  totalRevenue: number;
  orderCount: number;
}

export interface UserContext {
  seller: {
    storeName: string;
    marketplace: string;
  };
  periods: {
    today: PeriodMetrics;
    yesterday: PeriodMetrics;
    thisMonth: PeriodMetrics;
    lastMonth: PeriodMetrics;
    last7Days: PeriodMetrics;
    last30Days: PeriodMetrics;
  };
  feeBreakdown: {
    thisMonth: FeeBreakdown;
    lastMonth: FeeBreakdown;
  };
  // Amazon Advertising data (from Advertising API)
  adsData: {
    thisMonth: AdsBreakdown | undefined;
    lastMonth: AdsBreakdown | undefined;
    last7Days: AdsBreakdown | undefined;
    last30Days: AdsBreakdown | undefined;
  };
  topProducts: ProductSummary[];
  todaySoldProducts: SoldProduct[];
  yesterdaySoldProducts: SoldProduct[];
  thisMonthProductSales: ProductSales[];
  lastMonthProductSales: ProductSales[];
  trends: {
    salesTrend: 'up' | 'down' | 'stable';
    profitTrend: 'up' | 'down' | 'stable';
    salesChangePercent: number;
    profitChangePercent: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  refunds: {
    thisMonth: { count: number; amount: number };
    lastMonth: { count: number; amount: number };
  };
}

// PST timezone helpers (Amazon US uses PST)
function getPSTToday(): { year: number; month: number; day: number } {
  const now = new Date();
  const pstTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  return {
    year: pstTime.getUTCFullYear(),
    month: pstTime.getUTCMonth(),
    day: pstTime.getUTCDate(),
  };
}

function createPSTMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 8, 0, 0, 0));
}

function createPSTEndOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day + 1, 7, 59, 59, 999));
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Get user's Amazon refresh token from database
async function getUserRefreshToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('amazon_connections')
    .select('refresh_token')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  return data?.refresh_token || null;
}

// Get Amazon Ads breakdown for a period from ads_daily_metrics table
async function getAdsBreakdownForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AdsBreakdown | undefined> {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: adsData } = await supabase
    .from('ads_daily_metrics')
    .select(`
      sp_spend, sb_spend, sbv_spend, sd_spend, total_spend,
      sp_sales, sb_sales, sbv_sales, sd_sales, total_sales,
      acos, roas
    `)
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  if (!adsData || adsData.length === 0) {
    return undefined;
  }

  // Aggregate all days
  const aggregated = adsData.reduce((acc, day) => {
    acc.sponsoredProducts += day.sp_spend || 0;
    acc.sponsoredBrands += day.sb_spend || 0;
    acc.sponsoredBrandsVideo += day.sbv_spend || 0;
    acc.sponsoredDisplay += day.sd_spend || 0;
    acc.total += day.total_spend || 0;
    acc.sponsoredProductsSales += day.sp_sales || 0;
    acc.sponsoredBrandsSales += day.sb_sales || 0;
    acc.sponsoredBrandsVideoSales += day.sbv_sales || 0;
    acc.sponsoredDisplaySales += day.sd_sales || 0;
    acc.totalSales += day.total_sales || 0;
    return acc;
  }, {
    sponsoredProducts: 0,
    sponsoredBrands: 0,
    sponsoredBrandsVideo: 0,
    sponsoredDisplay: 0,
    total: 0,
    sponsoredProductsSales: 0,
    sponsoredBrandsSales: 0,
    sponsoredBrandsVideoSales: 0,
    sponsoredDisplaySales: 0,
    totalSales: 0,
  });

  // Calculate ACOS and ROAS
  const acos = aggregated.totalSales > 0
    ? (aggregated.total / aggregated.totalSales) * 100
    : 0;
  const roas = aggregated.total > 0
    ? aggregated.totalSales / aggregated.total
    : 0;

  return {
    sponsoredProducts: Math.round(aggregated.sponsoredProducts * 100) / 100,
    sponsoredBrands: Math.round(aggregated.sponsoredBrands * 100) / 100,
    sponsoredBrandsVideo: Math.round(aggregated.sponsoredBrandsVideo * 100) / 100,
    sponsoredDisplay: Math.round(aggregated.sponsoredDisplay * 100) / 100,
    total: Math.round(aggregated.total * 100) / 100,
    sponsoredProductsSales: Math.round(aggregated.sponsoredProductsSales * 100) / 100,
    sponsoredBrandsSales: Math.round(aggregated.sponsoredBrandsSales * 100) / 100,
    sponsoredBrandsVideoSales: Math.round(aggregated.sponsoredBrandsVideoSales * 100) / 100,
    sponsoredDisplaySales: Math.round(aggregated.sponsoredDisplaySales * 100) / 100,
    totalSales: Math.round(aggregated.totalSales * 100) / 100,
    acos: Math.round(acos * 10) / 10,
    roas: Math.round(roas * 100) / 100,
  };
}

async function getMetricsForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date,
  label: string,
  refreshToken?: string
): Promise<PeriodMetrics> {
  // Create PST-adjusted dates for database queries
  // startDate and endDate come in as UTC midnight (from getCustomRangeMetrics or period functions)
  // We need to convert them to PST day boundaries for accurate filtering
  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const startDay = startDate.getUTCDate();
  const endYear = endDate.getUTCFullYear();
  const endMonth = endDate.getUTCMonth();
  const endDay = endDate.getUTCDate();

  // PST midnight = UTC 08:00 (start of PST day)
  const dbStartDate = createPSTMidnight(startYear, startMonth, startDay);
  // PST end of day = next day UTC 07:59:59.999
  const dbEndDate = createPSTEndOfDay(endYear, endMonth, endDay);

  // Try to use Amazon Sales API for accurate data (same as dashboard)
  if (refreshToken) {
    try {
      const marketplaceIds = ['ATVPDKIKX0DER']; // US marketplace
      const result = await getMetricsForDateRange(refreshToken, marketplaceIds, startDate, endDate);

      if (result.success && result.metrics) {
        // Parse totalSales from object { amount: string, currencyCode: string }
        const totalSales = parseFloat(result.metrics.totalSales.amount) || 0;
        const totalUnits = result.metrics.unitCount;
        const totalOrders = result.metrics.orderCount;

        // FIXED: Query database using PST-adjusted date boundaries
        // This ensures we filter by actual PST order date, matching Amazon's timezone
        const { data: ordersForPeriod } = await supabase
          .from('orders')
          .select('amazon_order_id')
          .eq('user_id', userId)
          .gte('purchase_date', dbStartDate.toISOString())
          .lte('purchase_date', dbEndDate.toISOString())
          .neq('order_status', 'Canceled');

        const orderIdsForPeriod = ordersForPeriod?.map(o => o.amazon_order_id) || [];

        // Get fees from database (synced from Finances API) - now filtered by actual order date
        let items: any[] = [];
        if (orderIdsForPeriod.length > 0) {
          const { data } = await supabase
            .from('order_items')
            .select('total_amazon_fees, estimated_amazon_fee, asin, quantity_ordered, item_price')
            .eq('user_id', userId)
            .in('amazon_order_id', orderIdsForPeriod);
          items = data || [];
        }

        let totalFees = 0;
        for (const item of items) {
          totalFees += item.total_amazon_fees || item.estimated_amazon_fee || 0;
        }

        // Get REAL COGS from products table (user input, not estimated!)
        const { data: productCogs } = await supabase
          .from('products')
          .select('asin, cogs')
          .eq('user_id', userId)
          .not('cogs', 'is', null);

        const cogsMap = new Map<string, number>(
          productCogs?.map(p => [p.asin, p.cogs || 0]) || []
        );

        // Calculate real COGS from order items (already fetched above with correct date filtering)
        let totalCogs = 0;
        for (const item of items) {
          const cogPerUnit = cogsMap.get(item.asin) || 0;
          totalCogs += cogPerUnit * (item.quantity_ordered || 1);
        }

        // If no COGS data from products table, fallback to 30% estimate
        const estimatedCogs = totalCogs > 0 ? totalCogs : totalSales * 0.3;

        // Get REAL ad spend from service_fees table (advertising category)
        const { data: adFees } = await supabase
          .from('service_fees')
          .select('amount')
          .eq('user_id', userId)
          .eq('category', 'advertising')
          .gte('fee_date', startDate.toISOString().split('T')[0])
          .lte('fee_date', endDate.toISOString().split('T')[0]);

        const realAdSpend = adFees?.reduce((sum, f) => sum + Math.abs(f.amount || 0), 0) || 0;
        // If no ad spend data, fallback to 8% estimate
        const adSpend = realAdSpend > 0 ? realAdSpend : totalSales * 0.08;

        const grossProfit = totalSales - totalFees - estimatedCogs;
        const netProfit = grossProfit - adSpend;
        const margin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
        const acos = adSpend > 0 && totalSales > 0 ? (adSpend / totalSales) * 100 : 0;

        // Fetch ads breakdown from Amazon Advertising API data
        const adsBreakdown = await getAdsBreakdownForPeriod(userId, startDate, endDate);

        return {
          label,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          sales: Math.round(totalSales * 100) / 100,
          orders: totalOrders,
          units: totalUnits,
          amazonFees: Math.round(totalFees * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          margin: Math.round(margin * 10) / 10,
          adSpend: adsBreakdown?.total || Math.round(adSpend * 100) / 100,
          acos: adsBreakdown?.acos || Math.round(acos * 10) / 10,
          adsBreakdown,
        };
      }
    } catch (error) {
      console.error('Failed to get metrics from Amazon Sales API:', error);
      // Fall through to database fallback
    }
  }

  // Fallback: Use database (less accurate but works without refresh token)
  // Use PST-adjusted dates for accurate filtering
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_total, order_status')
    .eq('user_id', userId)
    .gte('purchase_date', dbStartDate.toISOString())
    .lte('purchase_date', dbEndDate.toISOString())
    .neq('order_status', 'Canceled');

  const orderIds = orders?.map(o => o.amazon_order_id) || [];

  let items: any[] = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('user_id', userId)
      .in('amazon_order_id', orderIds);
    items = data || [];
  }

  let totalSales = 0;
  let totalUnits = 0;
  let totalFees = 0;

  for (const item of items) {
    const price = item.item_price || 0;
    const qty = item.quantity_ordered || 1;
    totalSales += price;
    totalUnits += qty;
    totalFees += item.total_amazon_fees || item.estimated_amazon_fee || 0;
  }

  const totalOrders = orders?.length || 0;

  // Get REAL COGS from products table (user input, not estimated!)
  const { data: productCogs } = await supabase
    .from('products')
    .select('asin, cogs')
    .eq('user_id', userId)
    .not('cogs', 'is', null);

  const cogsMap = new Map<string, number>(
    productCogs?.map(p => [p.asin, p.cogs || 0]) || []
  );

  // Calculate real COGS from order items
  let totalCogs = 0;
  for (const item of items) {
    const cogPerUnit = cogsMap.get(item.asin) || 0;
    totalCogs += cogPerUnit * (item.quantity_ordered || 1);
  }

  // If no COGS data from products table, fallback to 30% estimate
  const estimatedCogs = totalCogs > 0 ? totalCogs : totalSales * 0.3;

  // Get REAL ad spend from service_fees table (advertising category)
  const { data: adFees } = await supabase
    .from('service_fees')
    .select('amount')
    .eq('user_id', userId)
    .eq('category', 'advertising')
    .gte('fee_date', startDate.toISOString().split('T')[0])
    .lte('fee_date', endDate.toISOString().split('T')[0]);

  const realAdSpend = adFees?.reduce((sum, f) => sum + Math.abs(f.amount || 0), 0) || 0;
  // If no ad spend data, fallback to 8% estimate
  const adSpend = realAdSpend > 0 ? realAdSpend : totalSales * 0.08;

  const grossProfit = totalSales - totalFees - estimatedCogs;
  const netProfit = grossProfit - adSpend;
  const margin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  const acos = adSpend > 0 && totalSales > 0 ? (adSpend / totalSales) * 100 : 0;

  // Fetch ads breakdown from Amazon Advertising API data
  const adsBreakdown = await getAdsBreakdownForPeriod(userId, startDate, endDate);

  return {
    label,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    sales: Math.round(totalSales * 100) / 100,
    orders: totalOrders,
    units: totalUnits,
    amazonFees: Math.round(totalFees * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    margin: Math.round(margin * 10) / 10,
    adSpend: adsBreakdown?.total || Math.round(adSpend * 100) / 100,
    acos: adsBreakdown?.acos || Math.round(acos * 10) / 10,
    adsBreakdown,
  };
}

async function getTopProducts(userId: string, limit: number = 5): Promise<ProductSummary[]> {
  // Get last 30 days of order items
  const pst = getPSTToday();
  const endDate = createPSTEndOfDay(pst.year, pst.month, pst.day);
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // FIXED: First get orders by purchase_date, then get order_items by order IDs
  // This ensures we filter by actual order date, not database insertion date
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString())
    .neq('order_status', 'Canceled');

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.amazon_order_id);

  // Note: Column names in order_items table: title (not item_title), seller_sku (not sku)
  const { data: items } = await supabase
    .from('order_items')
    .select('asin, seller_sku, title, item_price, quantity_ordered, total_amazon_fees, estimated_amazon_fee')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  if (!items || items.length === 0) return [];

  // Aggregate by ASIN
  const productMap = new Map<string, {
    name: string;
    asin: string;
    sku: string;
    revenue: number;
    units: number;
    fees: number;
  }>();

  for (const item of items) {
    const asin = item.asin || 'Unknown';
    const existing = productMap.get(asin) || {
      name: item.title || 'Unknown Product',
      asin,
      sku: item.seller_sku || '',
      revenue: 0,
      units: 0,
      fees: 0,
    };

    existing.revenue += item.item_price || 0;
    existing.units += item.quantity_ordered || 1;
    existing.fees += item.total_amazon_fees || item.estimated_amazon_fee || 0;
    productMap.set(asin, existing);
  }

  // Sort by revenue and take top N
  const products = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return products.map(p => {
    const cogs = p.revenue * 0.3; // Estimate
    const profit = p.revenue - p.fees - cogs;
    const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
    return {
      name: p.name,
      asin: p.asin,
      sku: p.sku,
      revenue: Math.round(p.revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      units: p.units,
      margin: Math.round(margin * 10) / 10,
    };
  });
}

// Get metrics for a custom date range (for AI queries like "Oct 25 to Jan 25")
export async function getCustomRangeMetrics(
  userId: string,
  startDateStr: string,
  endDateStr: string
): Promise<PeriodMetrics> {
  // Parse dates (expecting YYYY-MM-DD format)
  // IMPORTANT: Do NOT apply PST conversion here!
  // getMetricsForDateRange() in sales.ts already handles PST conversion.
  // Double conversion was causing date range to be off by 1 day.

  // Create dates at UTC midnight (will be converted to PST in sales.ts)
  const startDate = new Date(startDateStr + 'T00:00:00.000Z');
  const endDate = new Date(endDateStr + 'T00:00:00.000Z');

  const label = `${startDateStr} to ${endDateStr}`;

  // Get refresh token for accurate Sales API data
  const refreshToken = await getUserRefreshToken(userId);

  return getMetricsForPeriod(userId, startDate, endDate, label, refreshToken || undefined);
}

// Get metrics for a specific day (e.g., "January 25, 2026")
export async function getSpecificDayMetrics(
  userId: string,
  dateStr: string  // YYYY-MM-DD format
): Promise<PeriodMetrics> {
  return getCustomRangeMetrics(userId, dateStr, dateStr);
}

// Get metrics for a specific week (ISO week number)
export async function getWeekMetrics(
  userId: string,
  weekNumber: number,  // 1-53
  year: number
): Promise<PeriodMetrics> {
  // Calculate the start date of the ISO week
  // ISO weeks start on Monday
  const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1
  const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday (0) to 7
  const firstMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);

  // Add weeks to get to the target week
  const weekStart = new Date(firstMonday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  const startDateStr = weekStart.toISOString().split('T')[0];
  const endDateStr = weekEnd.toISOString().split('T')[0];

  const label = `Week ${weekNumber}, ${year}`;

  const refreshToken = await getUserRefreshToken(userId);
  return getMetricsForPeriod(userId, weekStart, weekEnd, label, refreshToken || undefined);
}

// Get metrics for "this week" or "last week"
export async function getRelativeWeekMetrics(
  userId: string,
  which: 'this' | 'last'
): Promise<PeriodMetrics> {
  const pst = getPSTToday();
  const today = createPSTMidnight(pst.year, pst.month, pst.day);

  // Find Monday of current week
  const dayOfWeek = today.getUTCDay() || 7; // Sunday = 7
  const mondayThisWeek = new Date(today.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);

  let weekStart: Date;
  let weekEnd: Date;
  let label: string;

  if (which === 'this') {
    weekStart = mondayThisWeek;
    weekEnd = today; // Up to today
    label = 'This Week';
  } else {
    weekStart = new Date(mondayThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    weekEnd = new Date(mondayThisWeek.getTime() - 1 * 24 * 60 * 60 * 1000); // Sunday
    label = 'Last Week';
  }

  const refreshToken = await getUserRefreshToken(userId);
  return getMetricsForPeriod(userId, weekStart, weekEnd, label, refreshToken || undefined);
}

// Get metrics for a quarter (Q1, Q2, Q3, Q4)
export async function getQuarterMetrics(
  userId: string,
  quarter: 1 | 2 | 3 | 4,
  year: number
): Promise<PeriodMetrics> {
  const quarterMonths: { [key: number]: [number, number] } = {
    1: [0, 2],   // Jan-Mar (months are 0-indexed)
    2: [3, 5],   // Apr-Jun
    3: [6, 8],   // Jul-Sep
    4: [9, 11],  // Oct-Dec
  };

  const [startMonth, endMonth] = quarterMonths[quarter];
  const startDate = new Date(Date.UTC(year, startMonth, 1));
  const endDate = new Date(Date.UTC(year, endMonth + 1, 0)); // Last day of end month

  const label = `Q${quarter} ${year}`;

  const refreshToken = await getUserRefreshToken(userId);
  return getMetricsForPeriod(userId, startDate, endDate, label, refreshToken || undefined);
}

// Get metrics for a full year
export async function getYearMetrics(
  userId: string,
  year: number
): Promise<PeriodMetrics> {
  const startDate = new Date(Date.UTC(year, 0, 1));  // Jan 1
  const endDate = new Date(Date.UTC(year, 11, 31)); // Dec 31

  const label = `Year ${year}`;

  const refreshToken = await getUserRefreshToken(userId);
  return getMetricsForPeriod(userId, startDate, endDate, label, refreshToken || undefined);
}

// Get metrics for a specific month
export async function getMonthMetrics(
  userId: string,
  month: number, // 1-12
  year: number
): Promise<PeriodMetrics> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));  // First day of month
  const endDate = new Date(Date.UTC(year, month, 0)); // Last day of month

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const label = `${monthNames[month - 1]} ${year}`;

  const refreshToken = await getUserRefreshToken(userId);
  return getMetricsForPeriod(userId, startDate, endDate, label, refreshToken || undefined);
}

// Compare two periods and return comparison data
export interface PeriodComparison {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  changes: {
    sales: { value: number; percent: number; improved: boolean };
    orders: { value: number; percent: number; improved: boolean };
    units: { value: number; percent: number; improved: boolean };
    amazonFees: { value: number; percent: number; improved: boolean };
    grossProfit: { value: number; percent: number; improved: boolean };
    netProfit: { value: number; percent: number; improved: boolean };
    margin: { value: number; percent: number; improved: boolean };
    adSpend: { value: number; percent: number; improved: boolean };
    acos: { value: number; percent: number; improved: boolean };
  };
  summary: string;
}

export function comparePeriods(
  period1: PeriodMetrics,
  period2: PeriodMetrics
): PeriodComparison {
  const calculateChange = (
    current: number,
    previous: number,
    higherIsBetter: boolean = true
  ) => {
    const value = current - previous;
    const percent = previous !== 0 ? (value / previous) * 100 : current > 0 ? 100 : 0;
    const improved = higherIsBetter ? value > 0 : value < 0;
    return {
      value: Math.round(value * 100) / 100,
      percent: Math.round(percent * 10) / 10,
      improved,
    };
  };

  const changes = {
    sales: calculateChange(period1.sales, period2.sales, true),
    orders: calculateChange(period1.orders, period2.orders, true),
    units: calculateChange(period1.units, period2.units, true),
    amazonFees: calculateChange(period1.amazonFees, period2.amazonFees, false), // Lower is better
    grossProfit: calculateChange(period1.grossProfit, period2.grossProfit, true),
    netProfit: calculateChange(period1.netProfit, period2.netProfit, true),
    margin: calculateChange(period1.margin, period2.margin, true),
    adSpend: calculateChange(period1.adSpend, period2.adSpend, false), // Lower is better (efficiency)
    acos: calculateChange(period1.acos, period2.acos, false), // Lower is better
  };

  // Generate summary
  const improvements = Object.values(changes).filter(c => c.improved).length;
  const declines = Object.values(changes).filter(c => !c.improved).length;

  let summary = `Comparing ${period1.label} vs ${period2.label}: `;
  if (changes.netProfit.improved) {
    summary += `Net profit increased by ${changes.netProfit.percent}%. `;
  } else {
    summary += `Net profit decreased by ${Math.abs(changes.netProfit.percent)}%. `;
  }

  if (changes.sales.improved) {
    summary += `Sales ${changes.sales.percent > 0 ? 'up' : 'same'} ${Math.abs(changes.sales.percent)}%. `;
  } else {
    summary += `Sales down ${Math.abs(changes.sales.percent)}%. `;
  }

  summary += `Overall: ${improvements} metrics improved, ${declines} declined.`;

  return {
    period1,
    period2,
    changes,
    summary,
  };
}

// Helper to compare two time periods by their names
export async function comparePeriodsAsync(
  userId: string,
  period1Metrics: PeriodMetrics,
  period2Metrics: PeriodMetrics
): Promise<PeriodComparison> {
  return comparePeriods(period1Metrics, period2Metrics);
}

// Get ALL historical data summary for the user
export async function getFullHistoricalContext(userId: string): Promise<{
  totalSales: number;
  totalOrders: number;
  totalUnits: number;
  oldestOrderDate: string | null;
  newestOrderDate: string | null;
  monthlyBreakdown: Array<{ month: string; sales: number; orders: number }>;
}> {
  // Get all orders for this user
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, order_total, purchase_date')
    .eq('user_id', userId)
    .neq('order_status', 'Canceled')
    .order('purchase_date', { ascending: true });

  if (!orders || orders.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      totalUnits: 0,
      oldestOrderDate: null,
      newestOrderDate: null,
      monthlyBreakdown: [],
    };
  }

  const orderIds = orders.map(o => o.amazon_order_id);

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('item_price, quantity_ordered, amazon_order_id')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  // Calculate totals
  let totalSales = 0;
  let totalUnits = 0;
  for (const item of items || []) {
    totalSales += item.item_price || 0;
    totalUnits += item.quantity_ordered || 1;
  }

  // Build monthly breakdown
  const monthlyMap = new Map<string, { sales: number; orders: number }>();

  // Create a map of order totals from items
  const orderTotals = new Map<string, number>();
  for (const item of items || []) {
    const current = orderTotals.get(item.amazon_order_id) || 0;
    orderTotals.set(item.amazon_order_id, current + (item.item_price || 0));
  }

  for (const order of orders) {
    const date = new Date(order.purchase_date);
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(monthKey) || { sales: 0, orders: 0 };
    existing.sales += orderTotals.get(order.amazon_order_id) || 0;
    existing.orders += 1;
    monthlyMap.set(monthKey, existing);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      sales: Math.round(data.sales * 100) / 100,
      orders: data.orders,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    totalOrders: orders.length,
    totalUnits,
    oldestOrderDate: orders[0]?.purchase_date?.split('T')[0] || null,
    newestOrderDate: orders[orders.length - 1]?.purchase_date?.split('T')[0] || null,
    monthlyBreakdown,
  };
}

// Get fee breakdown for a period
async function getFeeBreakdown(userId: string, startDate: Date, endDate: Date): Promise<FeeBreakdown> {
  // FIXED: First get orders by purchase_date, then get order_items by order IDs
  // This ensures we filter by actual order date, not database insertion date
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString())
    .neq('order_status', 'Canceled');

  const orderIds = orders?.map(o => o.amazon_order_id) || [];

  let items: any[] = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from('order_items')
      .select('total_fba_fulfillment_fees, total_referral_fees, total_amazon_fees')
      .eq('user_id', userId)
      .in('amazon_order_id', orderIds);
    items = data || [];
  }

  // Get service fees (subscription, storage)
  const { data: serviceFees } = await supabase
    .from('service_fees')
    .select('amount, fee_type')
    .eq('user_id', userId)
    .gte('posted_date', startDate.toISOString())
    .lte('posted_date', endDate.toISOString());

  let fbaFulfillment = 0;
  let referral = 0;
  let other = 0;
  for (const item of items || []) {
    fbaFulfillment += Math.abs(item.total_fba_fulfillment_fees || 0);
    referral += Math.abs(item.total_referral_fees || 0);
    other += Math.abs(item.total_amazon_fees || 0) - Math.abs(item.total_fba_fulfillment_fees || 0) - Math.abs(item.total_referral_fees || 0);
  }

  let subscription = 0;
  let storage = 0;
  for (const fee of serviceFees || []) {
    const amount = Math.abs(fee.amount || 0);
    if (fee.fee_type?.toLowerCase().includes('subscription')) {
      subscription += amount;
    } else if (fee.fee_type?.toLowerCase().includes('storage')) {
      storage += amount;
    } else {
      other += amount;
    }
  }

  const total = fbaFulfillment + referral + storage + subscription + other;

  return {
    fbaFulfillment: Math.round(fbaFulfillment * 100) / 100,
    referral: Math.round(referral * 100) / 100,
    storage: Math.round(storage * 100) / 100,
    subscription: Math.round(subscription * 100) / 100,
    refundCommission: 0, // Will be added when we have refund data
    other: Math.round(Math.max(0, other) * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Get refund data for a period
async function getRefundData(userId: string, startDate: Date, endDate: Date): Promise<{ count: number; amount: number }> {
  // Query order_items that have refund data
  const { data: items } = await supabase
    .from('order_items')
    .select('refund_amount, fee_refund_commission')
    .eq('user_id', userId)
    .or('refund_amount.gt.0,fee_refund_commission.gt.0') // Items with refund activity
    // Note: ideally we would filter by refund_date, but order_items only has created_at/updated_at
    // For now, we use updated_at as a proxy for when the refund was processed/synced
    .gte('updated_at', startDate.toISOString())
    .lte('updated_at', endDate.toISOString());

  if (!items || items.length === 0) {
    return { count: 0, amount: 0 };
  }

  let count = 0;
  let amount = 0;

  for (const item of items) {
    // refund_amount is what was returned to customer (cost to seller)
    // If refund_amount is missing but commission exists, it's still a refund event
    const refundAmt = Math.abs(item.refund_amount || 0);

    if (refundAmt > 0 || (item.fee_refund_commission || 0) > 0) {
      count++;
      amount += refundAmt;
    }
  }

  return {
    count,
    amount: Math.round(amount * 100) / 100
  };
}

// Get aggregated product sales for a period (e.g., this month)
async function getProductSalesForPeriod(userId: string, startDate: Date, endDate: Date): Promise<ProductSales[]> {
  // Get orders for this period
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString())
    .neq('order_status', 'Canceled');

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.amazon_order_id);

  // Get order items for these orders
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, seller_sku, title, item_price, quantity_ordered')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  if (!items || items.length === 0) return [];

  // Aggregate by ASIN
  const productMap = new Map<string, {
    name: string;
    asin: string;
    sku: string;
    totalUnits: number;
    totalRevenue: number;
    orderIds: Set<string>;
  }>();

  for (const item of items) {
    const asin = item.asin || 'Unknown';
    const existing = productMap.get(asin) || {
      name: item.title || 'Unknown Product',
      asin,
      sku: item.seller_sku || '',
      totalUnits: 0,
      totalRevenue: 0,
      orderIds: new Set<string>(),
    };

    existing.totalUnits += item.quantity_ordered || 1;
    existing.totalRevenue += item.item_price || 0;
    existing.orderIds.add(item.amazon_order_id);
    productMap.set(asin, existing);
  }

  // Convert to array and sort by revenue
  return Array.from(productMap.values())
    .map(p => ({
      name: p.name,
      asin: p.asin,
      sku: p.sku,
      totalUnits: p.totalUnits,
      totalRevenue: Math.round(p.totalRevenue * 100) / 100,
      orderCount: p.orderIds.size,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// Get sold products for a specific day
async function getSoldProductsForDay(userId: string, startDate: Date, endDate: Date): Promise<SoldProduct[]> {
  // Get orders for this day
  const { data: orders } = await supabase
    .from('orders')
    .select('amazon_order_id, purchase_date')
    .eq('user_id', userId)
    .gte('purchase_date', startDate.toISOString())
    .lte('purchase_date', endDate.toISOString())
    .neq('order_status', 'Canceled');

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.amazon_order_id);
  const orderDateMap = new Map(orders.map(o => [o.amazon_order_id, o.purchase_date]));

  // Get order items for these orders
  // Note: Column names in order_items table: title (not item_title), seller_sku (not sku)
  const { data: items } = await supabase
    .from('order_items')
    .select('amazon_order_id, asin, seller_sku, title, item_price, quantity_ordered')
    .eq('user_id', userId)
    .in('amazon_order_id', orderIds);

  if (!items || items.length === 0) return [];

  return items.map(item => ({
    name: item.title || 'Unknown Product',
    asin: item.asin || 'N/A',
    sku: item.seller_sku || 'N/A',
    quantity: item.quantity_ordered || 1,
    price: item.item_price || 0,
    orderId: item.amazon_order_id,
    orderTime: orderDateMap.get(item.amazon_order_id) || '',
  }));
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const pst = getPSTToday();

  // Get user's refresh token for Amazon Sales API access
  const refreshToken = await getUserRefreshToken(userId);

  // Calculate date ranges for all periods
  const todayStart = createPSTMidnight(pst.year, pst.month, pst.day);
  const todayEnd = createPSTEndOfDay(pst.year, pst.month, pst.day);

  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

  const thisMonthStart = createPSTMidnight(pst.year, pst.month, 1);
  const thisMonthEnd = todayEnd;

  const lastMonth = pst.month === 0 ? 11 : pst.month - 1;
  const lastMonthYear = pst.month === 0 ? pst.year - 1 : pst.year;
  const lastMonthStart = createPSTMidnight(lastMonthYear, lastMonth, 1);
  const lastMonthEnd = createPSTEndOfDay(lastMonthYear, lastMonth, getDaysInMonth(lastMonthYear, lastMonth));

  // Last 7 days and last 30 days
  const last7DaysStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30DaysStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all period metrics in parallel (using Amazon Sales API when refresh token available)
  const [
    today,
    yesterday,
    thisMonth,
    lastMonth_metrics,
    last7Days,
    last30Days,
    topProducts,
    connection,
    feeBreakdownThisMonth,
    feeBreakdownLastMonth,
    refundsThisMonth,
    refundsLastMonth,
    todaySoldProducts,
    yesterdaySoldProducts,
    thisMonthProductSales,
    lastMonthProductSales
  ] = await Promise.all([
    getMetricsForPeriod(userId, todayStart, todayEnd, 'Today', refreshToken || undefined),
    getMetricsForPeriod(userId, yesterdayStart, yesterdayEnd, 'Yesterday', refreshToken || undefined),
    getMetricsForPeriod(userId, thisMonthStart, thisMonthEnd, 'This Month', refreshToken || undefined),
    getMetricsForPeriod(userId, lastMonthStart, lastMonthEnd, 'Last Month', refreshToken || undefined),
    getMetricsForPeriod(userId, last7DaysStart, todayEnd, 'Last 7 Days', refreshToken || undefined),
    getMetricsForPeriod(userId, last30DaysStart, todayEnd, 'Last 30 Days', refreshToken || undefined),
    getTopProducts(userId, 10), // Increased to 10 products
    supabase
      .from('amazon_connections')
      .select('seller_name, marketplace_ids')
      .eq('user_id', userId)
      .single(),
    getFeeBreakdown(userId, thisMonthStart, thisMonthEnd),
    getFeeBreakdown(userId, lastMonthStart, lastMonthEnd),
    getRefundData(userId, thisMonthStart, thisMonthEnd),
    getRefundData(userId, lastMonthStart, lastMonthEnd),
    getSoldProductsForDay(userId, todayStart, todayEnd),
    getSoldProductsForDay(userId, yesterdayStart, yesterdayEnd),
    getProductSalesForPeriod(userId, thisMonthStart, thisMonthEnd),
    getProductSalesForPeriod(userId, lastMonthStart, lastMonthEnd),
  ]);

  // Calculate trends (this month vs last month)
  const salesChange = lastMonth_metrics.sales > 0
    ? ((thisMonth.sales - lastMonth_metrics.sales) / lastMonth_metrics.sales) * 100
    : 0;
  const profitChange = lastMonth_metrics.netProfit > 0
    ? ((thisMonth.netProfit - lastMonth_metrics.netProfit) / lastMonth_metrics.netProfit) * 100
    : 0;

  // Generate alerts
  const alerts: UserContext['alerts'] = [];

  if (thisMonth.margin < 15) {
    alerts.push({
      type: 'low_margin',
      message: `Profit margin is only ${thisMonth.margin}%. Consider optimizing costs.`,
      severity: 'high',
    });
  }

  if (thisMonth.acos > 30) {
    alerts.push({
      type: 'high_acos',
      message: `ACOS is ${thisMonth.acos}%, which is above the recommended 25%.`,
      severity: 'medium',
    });
  }

  if (salesChange < -10) {
    alerts.push({
      type: 'sales_decline',
      message: `Sales are down ${Math.abs(salesChange).toFixed(1)}% compared to last month.`,
      severity: 'medium',
    });
  }

  return {
    seller: {
      storeName: connection?.data?.seller_name || 'Your Store',
      marketplace: 'Amazon US',
    },
    periods: {
      today,
      yesterday,
      thisMonth,
      lastMonth: lastMonth_metrics,
      last7Days,
      last30Days,
    },
    feeBreakdown: {
      thisMonth: feeBreakdownThisMonth,
      lastMonth: feeBreakdownLastMonth,
    },
    // Amazon Ads data is now included in each period's adsBreakdown
    // Also provide a convenient summary for quick access
    adsData: {
      thisMonth: thisMonth.adsBreakdown,
      lastMonth: lastMonth_metrics.adsBreakdown,
      last7Days: last7Days.adsBreakdown,
      last30Days: last30Days.adsBreakdown,
    },
    topProducts,
    todaySoldProducts,
    yesterdaySoldProducts,
    thisMonthProductSales,
    lastMonthProductSales,
    trends: {
      salesTrend: salesChange > 5 ? 'up' : salesChange < -5 ? 'down' : 'stable',
      profitTrend: profitChange > 5 ? 'up' : profitChange < -5 ? 'down' : 'stable',
      salesChangePercent: Math.round(salesChange * 10) / 10,
      profitChangePercent: Math.round(profitChange * 10) / 10,
    },
    alerts,
    refunds: {
      thisMonth: refundsThisMonth,
      lastMonth: refundsLastMonth,
    },
  };
}
