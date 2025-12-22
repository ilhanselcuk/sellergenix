/**
 * Resend Email Service Configuration
 *
 * Custom email sending with branded templates
 */

import { Resend } from 'resend'

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const emailConfig = {
  from: `${process.env.RESEND_FROM_NAME || 'SellerGenix'} <${process.env.RESEND_FROM_EMAIL || 'info@sellergenix.io'}>`,
  replyTo: 'support@sellergenix.io',
}
