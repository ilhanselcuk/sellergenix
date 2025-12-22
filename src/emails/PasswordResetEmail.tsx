/**
 * Password Reset Email Template - SellerGenix
 * Sent when user requests password reset
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  resetUrl: string
  userName?: string
}

export function PasswordResetEmail({
  resetUrl = 'https://sellergenix.io/auth/reset-password',
  userName = 'there',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SellerGenix password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td align="center">
                  <div style={logoContainer}>
                    <span style={logoText}>SG</span>
                  </div>
                  <Text style={brandName}>SellerGenix</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Reset Your Password</Heading>

            <Text style={paragraph}>
              Hey {userName},
            </Text>

            <Text style={paragraph}>
              We received a request to reset your password for your SellerGenix account.
              Click the button below to create a new password.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={smallText}>
              This link will expire in 1 hour for security reasons.
            </Text>

            <Hr style={divider} />

            {/* Security Notice */}
            <Section style={securityBox}>
              <Text style={securityTitle}>🔒 Security Notice</Text>
              <Text style={securityText}>
                If you didn't request a password reset, please ignore this email or contact
                our support team immediately. Your account security is our top priority.
              </Text>
            </Section>

            <Text style={helpText}>
              Having trouble? Copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              {resetUrl}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 SellerGenix. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://sellergenix.io/privacy" style={footerLink}>Privacy Policy</Link>
              {' • '}
              <Link href="https://sellergenix.io/terms" style={footerLink}>Terms of Service</Link>
              {' • '}
              <Link href="https://sellergenix.io/contact" style={footerLink}>Support</Link>
            </Text>
            <Text style={footerAddress}>
              MENTOREIS LLC, 2501 Chatham Road, STE 5143, Springfield, IL 62704
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#0a0f1c',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  backgroundColor: '#0a0f1c',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const header = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'inline-block',
  width: '60px',
  height: '60px',
  background: 'linear-gradient(135deg, #ea4335, #ef4444, #dc2626)',
  borderRadius: '16px',
  lineHeight: '60px',
  marginBottom: '12px',
}

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '900' as const,
}

const brandName = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '900' as const,
  margin: '0',
}

const content = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '40px',
  margin: '24px 0',
}

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '900' as const,
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const paragraph = {
  color: '#9ca3af',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  background: 'linear-gradient(90deg, #4285f4, #3b82f6, #2563eb)',
  borderRadius: '12px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '700' as const,
  padding: '16px 32px',
  textDecoration: 'none',
}

const divider = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  margin: '32px 0',
}

const securityBox = {
  background: 'rgba(251, 191, 36, 0.1)',
  border: '1px solid rgba(251, 191, 36, 0.3)',
  borderRadius: '16px',
  padding: '20px',
  margin: '24px 0',
}

const securityTitle = {
  color: '#fbbf24',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
}

const securityText = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const helpText = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '24px 0 8px',
}

const linkText = {
  color: '#4285f4',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  margin: '0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerLinks = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerLink = {
  color: '#4285f4',
  textDecoration: 'none',
}

const footerAddress = {
  color: '#4b5563',
  fontSize: '11px',
  margin: '8px 0 0',
}

export default PasswordResetEmail
