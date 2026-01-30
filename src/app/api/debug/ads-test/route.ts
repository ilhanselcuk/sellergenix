/**
 * Debug endpoint to test Amazon Ads Reports API directly
 * This bypasses Inngest to get direct console output
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    // Step 1: Get ads connection
    const { data: conn, error: connError } = await supabase
      .from("amazon_ads_connections")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (connError || !conn) {
      return NextResponse.json({
        error: "No active ads connection found",
        connError,
      });
    }

    results.connection = {
      profile_id: conn.profile_id,
      country_code: conn.country_code,
      profile_name: conn.profile_name,
    };

    // Step 2: Create Ads Client
    const { createAdsClient } = await import("@/lib/amazon-ads-api/client");

    (results.steps as string[]).push("Creating ads client...");

    const clientResult = await createAdsClient(
      conn.refresh_token,
      conn.profile_id,
      conn.country_code
    );

    if (!clientResult.success || !clientResult.client) {
      return NextResponse.json({
        ...results,
        error: "Client creation failed",
        clientError: clientResult.error,
      });
    }

    (results.steps as string[]).push("Client created successfully");
    results.clientBaseUrl = clientResult.client.getBaseUrl();

    // Step 3: Try to create a simple SP report for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Also try 7 days ago for more likely data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    (results.steps as string[]).push(`Testing date range: ${weekAgoStr} to ${yesterdayStr}`);

    // Step 4: Create report request manually to see raw response
    // V3 API - Start with MINIMAL columns to ensure it works
    const reportRequestBody = {
      name: `SellerGenix_Debug_${Date.now()}`,
      startDate: weekAgoStr,
      endDate: yesterdayStr,
      configuration: {
        adProduct: "SPONSORED_PRODUCTS",
        groupBy: ["campaign"],
        // MINIMAL columns first - V3 API might reject unknown columns
        columns: [
          "campaignId",
          "campaignName",
          "impressions",
          "clicks",
          "cost",
        ],
        reportTypeId: "spCampaigns",
        timeUnit: "SUMMARY",
        format: "GZIP_JSON",
      },
    };

    results.reportRequest = reportRequestBody;
    (results.steps as string[]).push("Sending report creation request...");

    // Use the client to make the request
    const createResponse = await clientResult.client.post<{ reportId: string }>(
      "/reporting/reports",
      reportRequestBody
    );

    results.createReportResponse = createResponse;

    if (!createResponse.success || !createResponse.data?.reportId) {
      return NextResponse.json({
        ...results,
        error: "Report creation failed",
      });
    }

    const reportId = createResponse.data.reportId;
    (results.steps as string[]).push(`Report created: ${reportId}`);

    // Step 5: Poll for report completion (max 120 seconds)
    let reportStatus: {
      status: string;
      url?: string;
      failureReason?: string;
    } | null = null;
    const maxWait = 120000; // 2 minutes
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      (results.steps as string[]).push(`Polling report status...`);

      const statusResponse = await clientResult.client.get<{
        reportId: string;
        status: string;
        url?: string;
        failureReason?: string;
      }>(`/reporting/reports/${reportId}`);

      results.lastStatusResponse = statusResponse;

      if (!statusResponse.success) {
        (results.steps as string[]).push(`Status check failed: ${statusResponse.error}`);
        break;
      }

      reportStatus = statusResponse.data || null;
      (results.steps as string[]).push(`Status: ${reportStatus?.status}`);

      if (reportStatus?.status === "COMPLETED") {
        break;
      }

      if (reportStatus?.status === "FAILED") {
        results.reportFailureReason = reportStatus.failureReason;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    if (!reportStatus || reportStatus.status !== "COMPLETED") {
      return NextResponse.json({
        ...results,
        error: `Report did not complete. Final status: ${reportStatus?.status || "unknown"}`,
      });
    }

    // Step 6: Download report data
    if (!reportStatus.url) {
      return NextResponse.json({
        ...results,
        error: "Report completed but no download URL provided",
      });
    }

    (results.steps as string[]).push(`Downloading report from URL...`);
    results.downloadUrl = reportStatus.url.substring(0, 100) + "...";

    const downloadResponse = await fetch(reportStatus.url);
    const downloadStatus = downloadResponse.status;
    const downloadHeaders = {
      contentType: downloadResponse.headers.get("content-type"),
      contentEncoding: downloadResponse.headers.get("content-encoding"),
      contentLength: downloadResponse.headers.get("content-length"),
    };

    results.downloadStatus = downloadStatus;
    results.downloadHeaders = downloadHeaders;

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      return NextResponse.json({
        ...results,
        error: `Download failed: ${downloadStatus}`,
        downloadError: errorText.substring(0, 500),
      });
    }

    // Get raw text first
    const rawText = await downloadResponse.text();
    results.rawTextLength = rawText.length;
    results.rawTextPreview = rawText.substring(0, 1000);

    // Try to parse as JSON
    try {
      const reportData = JSON.parse(rawText);
      results.parsedDataType = Array.isArray(reportData) ? "array" : typeof reportData;

      if (Array.isArray(reportData)) {
        results.rowCount = reportData.length;
        if (reportData.length > 0) {
          results.firstRowKeys = Object.keys(reportData[0]);
          results.firstRowSample = reportData[0];
          results.allRows = reportData.slice(0, 10); // First 10 rows

          // Calculate totals
          let totalCost = 0;
          let totalSales = 0;
          let totalImpressions = 0;
          let totalClicks = 0;

          for (const row of reportData) {
            // Check all possible field names
            totalCost += row.cost || 0;
            totalSales += row.sales14d || row.attributedSales14d || row.sales || 0;
            totalImpressions += row.impressions || 0;
            totalClicks += row.clicks || 0;
          }

          results.calculatedTotals = {
            cost: totalCost,
            sales: totalSales,
            impressions: totalImpressions,
            clicks: totalClicks,
          };
        }
      } else {
        results.parsedData = reportData;
      }
    } catch (parseError) {
      results.parseError = String(parseError);
    }

    (results.steps as string[]).push("Report download and parse complete!");

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      ...results,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
