/**
 * Amazon SP-API Authorization Route
 *
 * This endpoint initiates the OAuth flow by redirecting directly to Amazon's authorization page
 *
 * GET /api/amazon/auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAmazonAuthorizationUrl } from '@/lib/amazon-sp-api'

export async function GET(request: NextRequest) {
  try {
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15)

    // Get the authorization URL
    const authorizationUrl = getAmazonAuthorizationUrl({ state })

    // Redirect directly to Amazon OAuth page
    return NextResponse.redirect(authorizationUrl)
  } catch (error: any) {
    console.error('Failed to generate authorization URL:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
    return NextResponse.redirect(`${baseUrl}/dashboard?error=auth_failed`)
  }
}
