/**
 * Debug endpoint to check ads data in database for a user
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "zyraamazon@gmail.com";
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    // Step 1: Get user ID from email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        error: "User not found",
        email,
        profileError,
      });
    }

    const userId = profile.id;

    // Step 2: Check ads_daily_metrics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: adsData, error: adsError } = await supabase
      .from("ads_daily_metrics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    // Step 3: Check service_fees for advertising
    const { data: settlementAds, error: settlementError } = await supabase
      .from("service_fees")
      .select("*")
      .eq("user_id", userId)
      .eq("category", "advertising")
      .order("fee_date", { ascending: false })
      .limit(20);

    // Step 4: Check amazon_ads_connections
    const { data: adsConnection, error: connError } = await supabase
      .from("amazon_ads_connections")
      .select("*")
      .eq("user_id", userId);

    // Step 5: Check ASIN-level ads data
    const { data: asinAdsData, error: asinAdsError } = await supabase
      .from("ads_asin_daily_metrics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(50);

    // Group ASIN ads by ASIN
    const asinSummary: Record<string, { totalSpend: number; totalSales: number; days: number }> = {};
    if (asinAdsData && asinAdsData.length > 0) {
      for (const row of asinAdsData) {
        if (!asinSummary[row.asin]) {
          asinSummary[row.asin] = { totalSpend: 0, totalSales: 0, days: 0 };
        }
        asinSummary[row.asin].totalSpend += parseFloat(row.spend) || 0;
        asinSummary[row.asin].totalSales += parseFloat(row.sales) || 0;
        asinSummary[row.asin].days += 1;
      }
    }

    // Step 6: Calculate totals
    let adsApiTotal = 0;
    let settlementTotal = 0;
    let asinAdsTotal = 0;

    if (adsData && adsData.length > 0) {
      adsApiTotal = adsData.reduce((acc, d) => acc + (parseFloat(d.total_spend) || 0), 0);
    }

    if (settlementAds && settlementAds.length > 0) {
      settlementTotal = settlementAds.reduce((acc, d) => acc + Math.abs(parseFloat(d.amount) || 0), 0);
    }

    if (asinAdsData && asinAdsData.length > 0) {
      asinAdsTotal = asinAdsData.reduce((acc, d) => acc + (parseFloat(d.spend) || 0), 0);
    }

    // Yesterday specific check
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const yesterdayAds = adsData?.filter(d => d.date === yesterdayStr) || [];

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: profile.email,
        name: profile.full_name,
      },
      adsConnection: {
        found: adsConnection && adsConnection.length > 0,
        count: adsConnection?.length || 0,
        details: adsConnection,
      },
      adsApiData: {
        found: adsData && adsData.length > 0,
        count: adsData?.length || 0,
        dateRange: { start: startDate.toISOString().split("T")[0], end: endDate.toISOString().split("T")[0] },
        totalSpend: adsApiTotal,
        recentDays: adsData?.slice(0, 10) || [],
        error: adsError,
      },
      yesterdayAds: {
        date: yesterdayStr,
        found: yesterdayAds.length > 0,
        data: yesterdayAds,
      },
      settlementAds: {
        found: settlementAds && settlementAds.length > 0,
        count: settlementAds?.length || 0,
        totalAmount: settlementTotal,
        records: settlementAds || [],
        error: settlementError,
      },
      asinAds: {
        found: asinAdsData && asinAdsData.length > 0,
        count: asinAdsData?.length || 0,
        totalSpend: asinAdsTotal,
        uniqueAsins: Object.keys(asinSummary).length,
        byAsin: asinSummary,
        recentRecords: asinAdsData?.slice(0, 10) || [],
        error: asinAdsError,
      },
      summary: {
        hasAdsApiData: (adsData?.length || 0) > 0,
        hasSettlementAds: (settlementAds?.length || 0) > 0,
        hasAsinAds: (asinAdsData?.length || 0) > 0,
        adsApiTotal,
        settlementTotal,
        asinAdsTotal,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
