/**
 * Email Sending API Route
 *
 * POST /api/email/send
 * Sends emails using Resend with premium templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { resend, emailConfig } from '@/lib/resend'
import { ConfirmationEmail, WelcomeEmail, PasswordResetEmail } from '@/emails'
import { render } from '@react-email/components'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to' },
        { status: 400 }
      )
    }

    let subject: string
    let html: string

    switch (type) {
      case 'confirmation':
        subject = 'Confirm your SellerGenix account'
        html = await render(
          ConfirmationEmail({
            confirmationUrl: data?.confirmationUrl || 'https://sellergenix.io/confirm',
            userName: data?.userName || 'there',
          })
        )
        break

      case 'welcome':
        subject = 'Welcome to SellerGenix! 🎉'
        html = await render(
          WelcomeEmail({
            userName: data?.userName || 'there',
            dashboardUrl: data?.dashboardUrl || 'https://sellergenix.io/dashboard',
          })
        )
        break

      case 'password-reset':
        subject = 'Reset your SellerGenix password'
        html = await render(
          PasswordResetEmail({
            resetUrl: data?.resetUrl || 'https://sellergenix.io/auth/reset-password',
            userName: data?.userName || 'there',
          })
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: emailConfig.replyTo,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: emailData?.id,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
