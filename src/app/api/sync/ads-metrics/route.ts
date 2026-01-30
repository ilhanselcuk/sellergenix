// API endpoint to trigger Amazon Ads metrics sync
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/inngest/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const userId = searchParams.get("userId") || body.userId;
    const monthsBack = body.monthsBack || 24;

    if (!userId) {
      // Try to get userId from the most recent ads connection
      const { data: conn } = await supabase
        .from("amazon_ads_connections")
        .select("user_id, profile_id, refresh_token, country_code")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!conn) {
        return NextResponse.json(
          { error: "No active Amazon Ads connection found" },
          { status: 404 }
        );
      }

      // Trigger Inngest sync for this connection
      await inngest.send({
        name: "amazon/sync.ads",
        data: {
          userId: conn.user_id,
          profileId: conn.profile_id,
          refreshToken: conn.refresh_token,
          countryCode: conn.country_code,
          monthsBack,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Ads sync started for profile ${conn.profile_id} (${conn.country_code})`,
        monthsBack,
      });
    }

    // Get all active ads connections for this user
    const { data: connections } = await supabase
      .from("amazon_ads_connections")
      .select("profile_id, refresh_token, country_code")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: "No active Amazon Ads connections found for this user" },
        { status: 404 }
      );
    }

    // Trigger sync for each connection
    const events = connections.map((conn) => ({
      name: "amazon/sync.ads" as const,
      data: {
        userId,
        profileId: conn.profile_id,
        refreshToken: conn.refresh_token,
        countryCode: conn.country_code,
        monthsBack,
      },
    }));

    await inngest.send(events);

    return NextResponse.json({
      success: true,
      message: `Ads sync started for ${connections.length} profile(s)`,
      profiles: connections.map((c) => `${c.profile_id} (${c.country_code})`),
      monthsBack,
    });
  } catch (error) {
    console.error("Ads sync API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Get ads metrics summary
    const query = supabase
      .from("ads_daily_metrics")
      .select("*", { count: "exact" });

    if (userId) {
      query.eq("user_id", userId);
    }

    const { count, data } = await query
      .order("date", { ascending: false })
      .limit(10);

    // Get connection status
    const connQuery = supabase
      .from("amazon_ads_connections")
      .select("profile_id, profile_name, country_code, last_sync_at, is_active");

    if (userId) {
      connQuery.eq("user_id", userId);
    }

    const { data: connections } = await connQuery;

    return NextResponse.json({
      success: true,
      totalRecords: count,
      recentMetrics: data,
      connections,
    });
  } catch (error) {
    console.error("Ads status API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
