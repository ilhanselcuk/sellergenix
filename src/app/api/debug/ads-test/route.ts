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
  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get("days") || "7", 10);
  const reportIdToCheck = searchParams.get("reportId");
  const includeSales = searchParams.get("includeSales") === "true";

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    params: { daysBack, reportIdToCheck, includeSales },
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

    // First, check if the profile has campaigns (sanity check)
    const listCampaigns = searchParams.get("listCampaigns") === "true";
    if (listCampaigns) {
      (results.steps as string[]).push("Listing SP campaigns to verify account (v3 API)...");

      // Try to list SP campaigns via v3 campaigns API (POST with body)
      // V3 requires specific Accept header: application/vnd.spcampaign.v3+json
      const campaignsResponse = await clientResult.client.request<{campaigns: unknown[]}>(
        "/sp/campaigns/list",
        {
          method: "POST",
          headers: {
            "Accept": "application/vnd.spcampaign.v3+json",
            "Content-Type": "application/vnd.spcampaign.v3+json",
          },
          body: JSON.stringify({
            maxResults: 100,
          }),
        }
      );
      results.campaignsResponse = campaignsResponse;

      if (campaignsResponse.success && campaignsResponse.data) {
        const campaigns = campaignsResponse.data.campaigns || campaignsResponse.data;
        results.campaignCount = Array.isArray(campaigns) ? campaigns.length : 0;
        if (Array.isArray(campaigns) && campaigns.length > 0) {
          results.sampleCampaign = campaigns[0];
        }
      }

      return NextResponse.json(results);
    }

    // If reportId is provided, just check its status
    if (reportIdToCheck) {
      (results.steps as string[]).push(`Checking status of existing report: ${reportIdToCheck}`);

      const statusResponse = await clientResult.client.get<{
        reportId: string;
        status: string;
        url?: string;
        failureReason?: string;
        configuration?: unknown;
      }>(`/reporting/reports/${reportIdToCheck}`);

      results.existingReportStatus = statusResponse;

      if (statusResponse.success && statusResponse.data?.url) {
        // Download and decompress the GZIP data
        const downloadResponse = await fetch(statusResponse.data.url);

        let rawText: string;
        try {
          // Try to decompress GZIP data
          const arrayBuffer = await downloadResponse.arrayBuffer();
          const decompressedStream = new Response(arrayBuffer).body!
            .pipeThrough(new DecompressionStream("gzip"));
          rawText = await new Response(decompressedStream).text();
          results.decompressed = true;
        } catch {
          // If decompression fails, try as plain text
          rawText = await downloadResponse.clone().text();
          results.decompressed = false;
        }

        results.rawTextLength = rawText.length;
        results.rawTextPreview = rawText.substring(0, 2000);
        try {
          const reportData = JSON.parse(rawText);
          results.rowCount = Array.isArray(reportData) ? reportData.length : 0;
          if (Array.isArray(reportData) && reportData.length > 0) {
            results.firstRowKeys = Object.keys(reportData[0]);
            results.allRows = reportData.slice(0, 20);
          }
        } catch (e) {
          results.parseError = String(e);
        }
      }

      return NextResponse.json(results);
    }

    // Step 3: Try to create a simple SP report (use daysBack parameter)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const endDateStr = endDate.toISOString().split("T")[0];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];

    (results.steps as string[]).push(`Testing date range: ${startDateStr} to ${endDateStr} (${daysBack} days)`);

    // Step 4: Create report request manually to see raw response
    // V3 API - Simplest possible request with basic columns only
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Base columns that always work
    const columns = [
      "campaignId",
      "campaignName",
      "impressions",
      "clicks",
      "cost",
    ];

    // Optionally include sales/purchases columns (may not work for all profiles)
    if (includeSales) {
      columns.push("purchases", "sales");
    }

    const reportRequestBody = {
      name: `SellerGenix_Debug_${uniqueId}`,
      startDate: startDateStr,
      endDate: endDateStr,
      configuration: {
        adProduct: "SPONSORED_PRODUCTS",
        groupBy: ["campaign"],
        columns,
        reportTypeId: "spCampaigns",
        timeUnit: "SUMMARY",
        format: "GZIP_JSON",  // Only GZIP_JSON is supported for spCampaigns
      },
    };

    results.reportRequest = reportRequestBody;
    (results.steps as string[]).push("Sending report creation request...");

    // Use the client to make the request with v3 headers
    const createResponse = await clientResult.client.request<{ reportId: string }>(
      "/reporting/reports",
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.createasyncreportrequest.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportRequestBody),
      }
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

    // Step 5: Poll for report completion (max 5 minutes)
    // Some reports take longer to process, especially for larger date ranges
    let reportStatus: {
      status: string;
      url?: string;
      failureReason?: string;
    } | null = null;
    const maxWait = 300000; // 5 minutes
    const pollInterval = 10000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      (results.steps as string[]).push(`Polling report status...`);

      const statusResponse = await clientResult.client.request<{
        reportId: string;
        status: string;
        url?: string;
        failureReason?: string;
      }>(`/reporting/reports/${reportId}`, {
        method: "GET",
        headers: {
          "Accept": "application/vnd.createasyncreportrequest.v3+json",
        },
      });

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

    // Get raw data and decompress if needed (GZIP_JSON format)
    let rawText: string;
    try {
      // Try to decompress GZIP data
      const arrayBuffer = await downloadResponse.arrayBuffer();
      const decompressedStream = new Response(arrayBuffer).body!
        .pipeThrough(new DecompressionStream("gzip"));
      rawText = await new Response(decompressedStream).text();
      results.decompressed = true;
    } catch {
      // If decompression fails, try as plain text
      rawText = await downloadResponse.clone().text();
      results.decompressed = false;
    }

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
