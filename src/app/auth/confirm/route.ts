/**
 * Email Confirmation Callback Route
 *
 * Handles the email confirmation link from Supabase Auth
 * Redirects to dashboard on success or login on error
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Email confirmed successfully, redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Error confirming email, redirect to login with error
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(
      new URL(`/auth/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
    )
  }

  // Missing parameters, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
