/**
 * Debug endpoint to directly sync ASIN-level ads data without Inngest
 * This bypasses Inngest for local development
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createAdsClient,
  getDailyAsinAdsMetrics,
} from "@/lib/amazon-ads-api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("days") || "30", 10);

    // Get the active ads connection
    const { data: conn, error: connError } = await supabase
      .from("amazon_ads_connections")
      .select("user_id, profile_id, refresh_token, country_code")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (connError || !conn) {
      return NextResponse.json({
        error: "No active Amazon Ads connection found",
        details: connError,
      }, { status: 404 });
    }

    console.log(`🎯 Starting ASIN ads sync for user ${conn.user_id}, profile ${conn.profile_id}`);

    // Create ads client
    const clientResult = await createAdsClient(
      conn.refresh_token,
      conn.profile_id,
      conn.country_code || "US"
    );

    if (!clientResult.success || !clientResult.client) {
      return NextResponse.json({
        error: "Failed to create ads client",
        details: clientResult.error,
      }, { status: 500 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    console.log(`📅 Fetching ASIN ads for ${startDateStr} to ${endDateStr}`);

    // Fetch ASIN-level ads metrics
    const asinMetricsResult = await getDailyAsinAdsMetrics(
      clientResult.client,
      startDateStr,
      endDateStr
    );

    if (!asinMetricsResult.success) {
      return NextResponse.json({
        error: "Failed to fetch ASIN ads metrics",
        details: asinMetricsResult.error,
      }, { status: 500 });
    }

    const asinMetrics = asinMetricsResult.data || [];
    console.log(`✅ Got ${asinMetrics.length} ASIN-day records from Amazon Ads API`);

    if (asinMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No ASIN-level ads data available from Amazon",
        userId: conn.user_id,
        profileId: conn.profile_id,
        dateRange: { start: startDateStr, end: endDateStr },
        recordsFound: 0,
      });
    }

    // Transform and upsert to database
    const records = asinMetrics.map((m) => ({
      user_id: conn.user_id,
      profile_id: conn.profile_id,
      date: m.date,
      asin: m.asin,
      sku: m.sku || null,
      spend: m.spend || 0,
      sales: m.sales || 0,
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      orders: m.orders || 0,
      acos: m.spend > 0 && m.sales > 0 ? (m.spend / m.sales) * 100 : null,
      roas: m.spend > 0 ? m.sales / m.spend : null,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : null,
      cpc: m.clicks > 0 ? m.spend / m.clicks : null,
      updated_at: new Date().toISOString(),
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from("ads_asin_daily_metrics")
        .upsert(batch, {
          onConflict: "user_id,profile_id,date,asin",
        });

      if (upsertError) {
        console.error(`❌ Batch upsert error:`, upsertError);
        return NextResponse.json({
          error: "Database upsert failed",
          details: upsertError,
          insertedSoFar: insertedCount,
        }, { status: 500 });
      }

      insertedCount += batch.length;
      console.log(`📝 Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
    }

    // Get unique ASINs for summary
    const uniqueAsins = [...new Set(asinMetrics.map((m) => m.asin))];
    const totalSpend = asinMetrics.reduce((sum, m) => sum + (m.spend || 0), 0);
    const totalSales = asinMetrics.reduce((sum, m) => sum + (m.sales || 0), 0);

    return NextResponse.json({
      success: true,
      message: `Synced ${insertedCount} ASIN-day records`,
      userId: conn.user_id,
      profileId: conn.profile_id,
      dateRange: { start: startDateStr, end: endDateStr },
      stats: {
        totalRecords: insertedCount,
        uniqueAsins: uniqueAsins.length,
        asins: uniqueAsins,
        totalSpend: totalSpend.toFixed(2),
        totalSales: totalSales.toFixed(2),
      },
    });
  } catch (error) {
    console.error("ASIN ads sync error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Show current ASIN ads data status
  try {
    const { data: conn } = await supabase
      .from("amazon_ads_connections")
      .select("user_id, profile_id")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!conn) {
      return NextResponse.json({ error: "No active ads connection" });
    }

    const { data, count } = await supabase
      .from("ads_asin_daily_metrics")
      .select("*", { count: "exact" })
      .eq("user_id", conn.user_id)
      .order("date", { ascending: false })
      .limit(20);

    // Get unique ASINs
    const { data: asinData } = await supabase
      .from("ads_asin_daily_metrics")
      .select("asin")
      .eq("user_id", conn.user_id);

    const uniqueAsins = [...new Set((asinData || []).map((d) => d.asin))];

    return NextResponse.json({
      success: true,
      userId: conn.user_id,
      totalRecords: count,
      uniqueAsins: uniqueAsins.length,
      asins: uniqueAsins,
      recentData: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
