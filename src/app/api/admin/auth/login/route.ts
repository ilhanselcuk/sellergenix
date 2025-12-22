/**
 * Admin Login API
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
    const { email, password, checkOnly } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get admin by email
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (adminError || !admin) {
      // Log failed attempt (fire and forget)
      void supabase.from('audit_logs').insert({
        actor_type: 'admin',
        actor_email: email,
        action: 'login.failed',
        action_type: 'login',
        metadata: { reason: 'User not found' },
        ip_address: ipAddress,
        user_agent: userAgent
      })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check if account is active
    if (!admin.is_active) {
      return NextResponse.json({ error: 'Account is disabled. Contact super admin.' }, { status: 403 })
    }

    // Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 423 })
    }

    // If checkOnly mode, just return whether user needs to set password or enter it
    if (checkOnly) {
      // Check if this is first login (empty password hash)
      if (!admin.password_hash || admin.password_hash === '') {
        return NextResponse.json({
          success: true,
          isFirstLogin: true,
          adminId: admin.id,
          adminName: admin.full_name
        })
      } else {
        // User has password, needs to enter it
        return NextResponse.json({
          success: true,
          requiresPassword: true,
          adminName: admin.full_name
        })
      }
    }

    // From here on, password is required for actual login
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Check if this is first login (empty password hash) - shouldn't happen if checkOnly was used
    if (!admin.password_hash || admin.password_hash === '') {
      return NextResponse.json({
        success: true,
        isFirstLogin: true,
        adminId: admin.id,
        adminName: admin.full_name
      })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash)

    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = (admin.failed_login_attempts || 0) + 1
      const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null

      await supabase
        .from('admin_users')
        .update({
          failed_login_attempts: failedAttempts,
          locked_until: lockUntil
        })
        .eq('id', admin.id)

      await supabase.from('audit_logs').insert({
        actor_type: 'admin',
        actor_id: admin.id,
        actor_email: admin.email,
        actor_name: admin.full_name,
        action: 'login.failed',
        action_type: 'login',
        metadata: { reason: 'Invalid password', attempts: failedAttempts },
        ip_address: ipAddress,
        user_agent: userAgent
      })

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

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

    // Update admin record
    await supabase
      .from('admin_users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: ipAddress,
        login_count: (admin.login_count || 0) + 1,
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq('id', admin.id)

    // Log successful login
    await supabase.from('audit_logs').insert({
      actor_type: 'admin',
      actor_id: admin.id,
      actor_email: admin.email,
      actor_name: admin.full_name,
      actor_role: admin.role,
      action: 'login.success',
      action_type: 'login',
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
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
