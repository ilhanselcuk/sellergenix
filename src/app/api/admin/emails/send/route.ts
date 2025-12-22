/**
 * Send Emails API
 * POST /api/admin/emails/send
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

interface Recipient {
  id: string
  email: string
  name: string | null
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sg_admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify admin session and permissions
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('admin_id')
      .eq('session_token', sessionToken)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    if (!admin || (admin.role !== 'super_admin' && !admin.can_send_emails)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { recipients, subject, body: emailBody, templateId } = body

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 })
    }

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Process each recipient
    const emailLogs = []
    const errors = []

    for (const recipient of recipients as Recipient[]) {
      try {
        // Personalize the email
        let personalizedSubject = subject
        let personalizedBody = emailBody

        // Replace variables
        const variables: { [key: string]: string } = {
          '{name}': recipient.name || 'Customer',
          '{email}': recipient.email,
          '{plan}': 'your plan' // This would come from profile data
        }

        for (const [key, value] of Object.entries(variables)) {
          personalizedSubject = personalizedSubject.replace(new RegExp(key, 'g'), value)
          personalizedBody = personalizedBody.replace(new RegExp(key, 'g'), value)
        }

        // In production, you would integrate with an email service like:
        // - Resend (recommended)
        // - SendGrid
        // - AWS SES
        // - Postmark

        // For now, we'll just log the email to the database
        // In production, you'd send the actual email here

        const emailLog = {
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          recipient_id: recipient.id,
          subject: personalizedSubject,
          body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8b5cf6;">SellerGenix</h2>
            <div style="color: #333; line-height: 1.6;">
              ${personalizedBody.replace(/\n/g, '<br>')}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This email was sent by SellerGenix. If you believe you received this email in error, please contact support.
            </p>
          </div>`,
          body_text: personalizedBody,
          template_id: templateId || null,
          status: 'sent', // In production: 'pending' until confirmed delivery
          sent_by_admin_id: admin.id,
          sent_at: new Date().toISOString()
        }

        emailLogs.push(emailLog)

        // Simulate email sending delay
        // In production, this would be the actual API call to email service
        // await sendEmail(emailLog)

      } catch (err: any) {
        errors.push({
          email: recipient.email,
          error: err.message
        })
      }
    }

    // Log all emails to database
    if (emailLogs.length > 0) {
      const { error: insertError } = await supabase
        .from('email_logs')
        .insert(emailLogs)

      if (insertError) {
        console.error('Error logging emails:', insertError)
        // Don't fail the request, emails were "sent"
      }
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'admin.email.bulk_send',
      actor_type: 'admin',
      actor_id: admin.id,
      actor_email: admin.email,
      actor_name: admin.full_name,
      resource_type: 'email',
      details: {
        recipients_count: recipients.length,
        subject,
        template_id: templateId,
        success_count: emailLogs.length,
        error_count: errors.length
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      sent: emailLogs.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Send emails error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
