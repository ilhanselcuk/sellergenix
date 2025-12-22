/**
 * Email Confirmation Template - SellerGenix
 * Premium dark theme with brand colors
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ConfirmationEmailProps {
  confirmationUrl: string
  userName?: string
}

export function ConfirmationEmail({
  confirmationUrl = 'https://sellergenix.io/confirm',
  userName = 'there',
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your SellerGenix account</Preview>
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
            <Heading style={heading}>Confirm Your Email</Heading>

            <Text style={paragraph}>
              Hey {userName}! 👋
            </Text>

            <Text style={paragraph}>
              Thanks for signing up for SellerGenix! We're excited to have you on board.
              Please confirm your email address by clicking the button below.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={confirmationUrl}>
                Confirm Email Address
              </Button>
            </Section>

            <Text style={smallText}>
              This link will expire in 24 hours. If you didn't create an account with SellerGenix,
              you can safely ignore this email.
            </Text>

            <Hr style={divider} />

            {/* What's Next Section */}
            <Heading as="h3" style={subheading}>
              What's next?
            </Heading>

            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={featureItem}>
                  <div style={featureIcon}>📊</div>
                  <div>
                    <Text style={featureTitle}>Connect Your Amazon Account</Text>
                    <Text style={featureDesc}>Link your seller account to start tracking metrics</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={featureItem}>
                  <div style={featureIcon}>🎯</div>
                  <div>
                    <Text style={featureTitle}>Set Up Your Dashboard</Text>
                    <Text style={featureDesc}>Customize views to track what matters most</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={featureItem}>
                  <div style={featureIcon}>💰</div>
                  <div>
                    <Text style={featureTitle}>Start Optimizing Profits</Text>
                    <Text style={featureDesc}>Use AI insights to grow your business</Text>
                  </div>
                </td>
              </tr>
            </table>
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
  background: 'linear-gradient(135deg, #4285f4, #9b59b6, #34a853)',
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

const subheading = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '700' as const,
  margin: '24px 0 16px',
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
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  background: 'linear-gradient(90deg, #4285f4, #9b59b6, #34a853)',
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

const featureItem = {
  padding: '12px 0',
  display: 'flex',
  alignItems: 'flex-start' as const,
}

const featureIcon = {
  fontSize: '24px',
  marginRight: '16px',
  verticalAlign: 'top' as const,
  display: 'inline-block',
  width: '32px',
}

const featureTitle = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 0 4px',
}

const featureDesc = {
  color: '#6b7280',
  fontSize: '13px',
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

export default ConfirmationEmail
