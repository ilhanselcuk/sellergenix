/**
 * Welcome Email Template - SellerGenix
 * Sent after email confirmation
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

interface WelcomeEmailProps {
  userName?: string
  dashboardUrl?: string
}

export function WelcomeEmail({
  userName = 'there',
  dashboardUrl = 'https://sellergenix.io/dashboard',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SellerGenix - Your 14-day free trial has started!</Preview>
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
            <Heading style={heading}>Welcome to SellerGenix! 🎉</Heading>

            <Text style={paragraph}>
              Hey {userName}!
            </Text>

            <Text style={paragraph}>
              Your account is now active and your <strong style={{ color: '#34a853' }}>14-day free trial</strong> has officially started.
              You now have full access to all premium features.
            </Text>

            {/* Trial Banner */}
            <Section style={trialBanner}>
              <Text style={trialText}>
                ✨ <strong>14-Day Free Trial Active</strong> ✨
              </Text>
              <Text style={trialSubtext}>
                No credit card required • Cancel anytime
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                Go to Dashboard
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Quick Start Guide */}
            <Heading as="h3" style={subheading}>
              Quick Start Guide
            </Heading>

            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={stepItem}>
                  <div style={stepNumber}>1</div>
                  <div style={stepContent}>
                    <Text style={stepTitle}>Connect Amazon</Text>
                    <Text style={stepDesc}>Link your Seller Central account in just 2 clicks</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={stepItem}>
                  <div style={stepNumber}>2</div>
                  <div style={stepContent}>
                    <Text style={stepTitle}>Set Your COGS</Text>
                    <Text style={stepDesc}>Add product costs for accurate profit tracking</Text>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={stepItem}>
                  <div style={stepNumber}>3</div>
                  <div style={stepContent}>
                    <Text style={stepTitle}>Track & Optimize</Text>
                    <Text style={stepDesc}>Use AI insights to maximize your profits</Text>
                  </div>
                </td>
              </tr>
            </table>

            <Hr style={divider} />

            {/* Support Section */}
            <Section style={supportSection}>
              <Text style={supportTitle}>Need Help Getting Started?</Text>
              <Text style={supportText}>
                Our team is here to help you succeed. Book a free 15-minute onboarding call
                or reach out anytime.
              </Text>
              <Link href="https://sellergenix.io/contact" style={supportLink}>
                Contact Support →
              </Link>
            </Section>
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
  background: 'linear-gradient(135deg, #34a853, #22c55e, #137333)',
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

const trialBanner = {
  background: 'linear-gradient(135deg, rgba(52, 168, 83, 0.2), rgba(34, 197, 94, 0.2))',
  border: '1px solid rgba(52, 168, 83, 0.3)',
  borderRadius: '16px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const trialText = {
  color: '#34a853',
  fontSize: '18px',
  fontWeight: '700' as const,
  margin: '0 0 4px',
}

const trialSubtext = {
  color: '#22c55e',
  fontSize: '14px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  background: 'linear-gradient(90deg, #34a853, #22c55e, #137333)',
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

const stepItem = {
  padding: '16px 0',
}

const stepNumber = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  background: 'linear-gradient(135deg, #4285f4, #3b82f6)',
  borderRadius: '50%',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700' as const,
  lineHeight: '32px',
  textAlign: 'center' as const,
  marginRight: '16px',
  verticalAlign: 'top' as const,
}

const stepContent = {
  display: 'inline-block',
  verticalAlign: 'top' as const,
  width: 'calc(100% - 56px)',
}

const stepTitle = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  margin: '0 0 4px',
}

const stepDesc = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

const supportSection = {
  background: 'rgba(66, 133, 244, 0.1)',
  border: '1px solid rgba(66, 133, 244, 0.2)',
  borderRadius: '16px',
  padding: '20px',
  textAlign: 'center' as const,
}

const supportTitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
}

const supportText = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '0 0 12px',
}

const supportLink = {
  color: '#4285f4',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
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

export default WelcomeEmail
