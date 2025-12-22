/**
 * Logout Route
 *
 * Handles user sign out
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Sign out
  await supabase.auth.signOut()

  // Redirect to home
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
