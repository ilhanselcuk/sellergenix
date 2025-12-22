/**
 * Admin Authentication System
 * Separate from regular user auth - uses admin_users table
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const ADMIN_SESSION_COOKIE = 'sg_admin_session'
const SESSION_DURATION_HOURS = 24

export interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  is_active: boolean
  can_manage_admins: boolean
  can_manage_customers: boolean
  can_view_revenue: boolean
  can_send_emails: boolean
  can_view_audit_logs: boolean
  can_modify_settings: boolean
  last_login_at: string | null
  login_count: number
  created_at: string
}

export interface AdminSession {
  id: string
  admin_id: string
  session_token: string
  ip_address: string | null
  user_agent: string | null
  expires_at: string
  created_at: string
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create admin session
 */
export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const supabase = await createClient()

  const sessionToken = uuidv4()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_id: adminId,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    console.error('Failed to create admin session:', error)
    throw new Error('Failed to create session')
  }

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_HOURS * 60 * 60
  })

  return sessionToken
}

/**
 * Get current admin from session
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

    if (!sessionToken) {
      return null
    }

    const supabase = await createClient()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return null
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await destroyAdminSession(sessionToken)
      return null
    }

    // Get admin user
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      return null
    }

    return admin as AdminUser
  } catch (error) {
    console.error('Error getting current admin:', error)
    return null
  }
}

/**
 * Admin login
 */
export async function adminLogin(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string; admin?: AdminUser; isFirstLogin?: boolean }> {
  const supabase = await createClient()

  // Get admin by email
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (adminError || !admin) {
    // Log failed attempt
    await logAdminAction(null, email, 'Unknown', 'login.failed', 'login', null, null, null, null, { reason: 'User not found' }, ipAddress, userAgent)
    return { success: false, error: 'Invalid email or password' }
  }

  // Check if account is active
  if (!admin.is_active) {
    return { success: false, error: 'Account is disabled. Contact super admin.' }
  }

  // Check if account is locked
  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    return { success: false, error: 'Account is temporarily locked. Try again later.' }
  }

  // Check if this is first login (empty password hash)
  if (!admin.password_hash || admin.password_hash === '') {
    // First login - need to set password
    return { success: true, admin, isFirstLogin: true }
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.password_hash)

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

    await logAdminAction(admin.id, admin.email, admin.full_name, 'login.failed', 'login', null, null, null, null, { reason: 'Invalid password', attempts: failedAttempts }, ipAddress, userAgent)

    return { success: false, error: 'Invalid email or password' }
  }

  // Successful login - update admin record
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

  // Create session
  await createAdminSession(admin.id, ipAddress, userAgent)

  // Log successful login
  await logAdminAction(admin.id, admin.email, admin.full_name, 'login.success', 'login', null, null, null, null, null, ipAddress, userAgent)

  return { success: true, admin }
}

/**
 * Set password for admin (first login or reset)
 */
export async function setAdminPassword(
  adminId: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const supabase = await createClient()
  const passwordHash = await hashPassword(newPassword)

  const { error } = await supabase
    .from('admin_users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', adminId)

  if (error) {
    return { success: false, error: 'Failed to set password' }
  }

  // Create session after setting password
  await createAdminSession(adminId, ipAddress, userAgent)

  return { success: true }
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (sessionToken) {
    await destroyAdminSession(sessionToken)
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

/**
 * Destroy admin session
 */
async function destroyAdminSession(sessionToken: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('admin_sessions')
    .delete()
    .eq('session_token', sessionToken)
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  actorId: string | null,
  actorEmail: string,
  actorName: string,
  action: string,
  actionType: string,
  resourceType?: string | null,
  resourceId?: string | null,
  resourceName?: string | null,
  oldValues?: object | null,
  newValues?: object | null,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: object | null
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('audit_logs').insert({
      actor_type: actorId ? 'admin' : 'system',
      actor_id: actorId,
      actor_email: actorEmail,
      actor_name: actorName,
      actor_role: actorId ? 'admin' : null,
      action,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Check if admin has permission
 */
export function hasPermission(admin: AdminUser, permission: keyof AdminUser): boolean {
  if (admin.role === 'super_admin') return true

  return admin[permission] === true
}

/**
 * Require admin authentication (for use in server components/actions)
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    throw new Error('Unauthorized')
  }

  return admin
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: keyof AdminUser): Promise<AdminUser> {
  const admin = await requireAdmin()

  if (!hasPermission(admin, permission)) {
    throw new Error('Forbidden')
  }

  return admin
}
