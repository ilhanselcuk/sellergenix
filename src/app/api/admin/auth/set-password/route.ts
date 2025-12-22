/**
 * Admin Set Password API
 * For first-time login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const ADMIN_SESSION_COOKIE = 'sg_admin_session'
const SESSION_DURATION_HOURS = 24

export async function POST(request: NextRequest) {
  try {
    const { adminId, password } = await request.json()

    if (!adminId || !password) {
      return NextResponse.json({ error: 'Admin ID and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = await createClient()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get admin to verify they exist and need to set password
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .single()

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Only allow setting password if it's empty (first login)
    if (admin.password_hash && admin.password_hash !== '') {
      return NextResponse.json({ error: 'Password already set' }, { status: 400 })
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // Update admin with new password
    await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)

    // Create session
    const sessionToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

    await supabase.from('admin_sessions').insert({
      admin_id: admin.id,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString()
    })

    // Update admin login info
    await supabase
      .from('admin_users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: ipAddress,
        login_count: 1
      })
      .eq('id', admin.id)

    // Log password set
    await supabase.from('audit_logs').insert({
      actor_type: 'admin',
      actor_id: admin.id,
      actor_email: admin.email,
      actor_name: admin.full_name,
      actor_role: admin.role,
      action: 'password.set',
      action_type: 'update',
      resource_type: 'admin',
      resource_id: admin.id,
      ip_address: ipAddress,
      user_agent: userAgent
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_HOURS * 60 * 60
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
