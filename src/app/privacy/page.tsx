'use client'

/**
 * Privacy Policy Page - SellerGenix
 * Modern Google Material Design
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Lock, Users, FileText } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#34a853]/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4285f4]/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#9333ea]/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="backdrop-blur-md bg-white/90 border-b-2 border-[#e5e7eb] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">SG</span>
              </div>
              <span className="text-2xl font-black text-[#343a40]">SellerGenix</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#e5e7eb] text-[#6c757d] hover:border-[#4285f4] hover:text-[#4285f4] rounded-xl font-bold transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#34a853] to-[#137333] rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#343a40] mb-4">Privacy Policy</h1>
          <div className="text-[#6c757d] space-y-1">
            <p><strong>Effective Date:</strong> September 26, 2025</p>
            <p><strong>Last Updated:</strong> September 26, 2025</p>
            <p><strong>Version:</strong> 1.0</p>
          </div>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-[#e5e7eb] p-8 lg:p-12 shadow-lg"
        >
          {/* Company Information */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">Company Information</h2>
            </div>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[#343a40]"><strong>Company Name:</strong> MENTOREIS LLC</p>
                  <p className="text-[#343a40]"><strong>Platform:</strong> SellerGenix</p>
                  <p className="text-[#343a40]"><strong>Website:</strong> www.sellergenix.io</p>
                  <p className="text-[#343a40]"><strong>Email:</strong> info@sellergenix.io</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#343a40]"><strong>Address:</strong> 2501 Chatham Road, STE 5143</p>
                  <p className="text-[#343a40]"><strong>City:</strong> Springfield, IL 62704</p>
                  <p className="text-[#343a40]"><strong>Country:</strong> United States of America</p>
                  <p className="text-[#343a40]"><strong>Phone:</strong> +1 (206) 312-8915</p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Policy Scope */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">1. Privacy Policy Scope</h2>
            <p className="text-[#6c757d] mb-6 leading-relaxed">
              This Privacy Policy explains how MENTOREIS LLC (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, protects,
              and shares personal information through the SellerGenix platform (&quot;Platform&quot;) and all related services.
            </p>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">Scope / Coverage:</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>SellerGenix platform users</li>
              <li>Amazon SP-API integrations</li>
              <li>Third-party service providers</li>
              <li>Analytics and consulting clients</li>
              <li>Business partners</li>
            </ul>
          </section>

          {/* Data Collection */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#9333ea] to-[#7e22ce] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">2. Data Collection</h2>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">2.1 Personal Data</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Identity Information:</strong> Name, surname, company name</li>
              <li><strong>Contact Information:</strong> Email, phone, address</li>
              <li><strong>Financial Information:</strong> Payment details (processed securely)</li>
              <li><strong>Business Information:</strong> Amazon seller account details, product information</li>
              <li><strong>Technical Information:</strong> IP address, browser information, cookies</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">2.2 Amazon SP-API Integration Data</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Amazon API Data:</strong> Seller performance data, product listings, order information</li>
              <li><strong>Stripe API:</strong> Payment processing data, invoice information</li>
              <li><strong>WhatsApp API:</strong> Communication records, message logs</li>
              <li><strong>Analytics Data:</strong> Platform usage statistics, performance metrics</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">2.3 Automatically Collected Data</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>System logs</li>
              <li>Performance metrics</li>
              <li>Usage statistics</li>
              <li>Error reports</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">3. Data Usage Purposes</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.1 Service Delivery</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Amazon analytics and reporting services</li>
              <li>PPC optimization and management</li>
              <li>Profit tracking and analysis</li>
              <li>WhatsApp notifications and alerts</li>
              <li>Customer support provision</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.2 API Integrations</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Amazon SP-API:</strong> Sales analysis, performance reports</li>
              <li><strong>Stripe Payment API:</strong> Secure payment processing</li>
              <li><strong>Communication APIs:</strong> Automated notifications, reminders</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.3 Business Development</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>Service quality improvement</li>
              <li>New feature development</li>
              <li>Market analysis</li>
              <li>Customer segmentation</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ea4335] to-[#c5221f] rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">4. Data Sharing (Amazon AUP 4.6 Compliance)</h2>
            </div>

            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-6 border-2 border-[#4285f4]/30 mb-6">
              <h3 className="text-xl font-bold text-[#343a40] mb-3">Amazon Information Data Sharing Policy</h3>
              <p className="text-[#6c757d] mb-3">
                <strong>In compliance with Amazon Acceptable Use Policy (AUP) Section 4.6:</strong>
              </p>
              <p className="text-[#6c757d] leading-relaxed">
                SellerGenix <strong>DOES NOT</strong> disclose Amazon Information (individually labelled or aggregated)
                to other application users, affiliated entities, or any outside parties, except as required to perform
                acceptable authorized user activities for sellers who have explicitly authorized our application.
              </p>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">4.1 Amazon Information Handling</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb] mb-6">
              <h4 className="font-bold text-[#343a40] mb-3">What Amazon Information We Access:</h4>
              <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
                <li>Sales performance data (revenue, units sold, orders)</li>
                <li>Product listing information (ASIN, SKU, pricing)</li>
                <li>Inventory levels and FBA stock data</li>
                <li>Advertising campaign performance (PPC data)</li>
                <li>Financial transaction data (fees, payouts)</li>
                <li>Customer order information (for fulfillment purposes only)</li>
              </ul>

              <h4 className="font-bold text-[#343a40] mb-3">How Amazon Information is Used:</h4>
              <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
                <li><strong>Exclusively for the authorized seller:</strong> Data is displayed only to the seller who owns it</li>
                <li><strong>Analytics and reporting:</strong> Generate performance insights specific to each seller</li>
                <li><strong>PPC optimization:</strong> Improve advertising campaigns for individual sellers</li>
                <li><strong>Profit calculations:</strong> Calculate accurate profitability metrics</li>
                <li><strong>Alerts and notifications:</strong> Send performance alerts to authorized sellers</li>
              </ul>

              <h4 className="font-bold text-[#343a40] mb-3">What We DO NOT Do with Amazon Information:</h4>
              <ul className="list-disc list-inside text-[#ea4335] space-y-2">
                <li>❌ Share or sell data to third parties</li>
                <li>❌ Aggregate data across multiple sellers</li>
                <li>❌ Use data for competitor analysis or benchmarking</li>
                <li>❌ Share insights about Amazon&apos;s business</li>
                <li>❌ Target Amazon customers for marketing</li>
                <li>❌ Provide data to external data services</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">4.2 Outside Parties with Whom We Share Data</h3>
            <p className="text-[#6c757d] mb-6 leading-relaxed">
              The following is a <strong>complete list</strong> of all outside parties with whom SellerGenix shares information,
              including the type of data shared and the purpose:
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-5 border-2 border-[#4285f4]/20">
                <h4 className="font-bold text-[#343a40] mb-2">1. Supabase Inc. (Database Provider)</h4>
                <p className="text-sm text-[#6c757d] mb-2"><strong>Location:</strong> United States (AWS infrastructure)</p>
                <p className="text-sm text-[#343a40] mb-2"><strong>Data Shared:</strong></p>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1 mb-2">
                  <li>Amazon sales data, product information, inventory levels</li>
                  <li>User account information (email, company name)</li>
                  <li>Analytics and performance metrics</li>
                </ul>
                <p className="text-sm text-[#6c757d]"><strong>Purpose:</strong> Secure database hosting, encrypted storage, backup and recovery</p>
                <p className="text-sm text-[#6c757d]"><strong>Security:</strong> AES-256 encryption at rest, TLS 1.3 in transit, SOC 2 Type II certified</p>
              </div>

              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
                <h4 className="font-bold text-[#343a40] mb-2">2. Stripe Inc. (Payment Processor)</h4>
                <p className="text-sm text-[#6c757d] mb-2"><strong>Location:</strong> United States</p>
                <p className="text-sm text-[#343a40] mb-2"><strong>Data Shared:</strong></p>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1 mb-2">
                  <li>Payment information (credit card details - tokenized)</li>
                  <li>Billing information (name, address, email)</li>
                  <li>Subscription status and invoices</li>
                  <li><strong>NO Amazon sales data or business metrics</strong></li>
                </ul>
                <p className="text-sm text-[#6c757d]"><strong>Purpose:</strong> Process subscription payments, invoice generation, refund processing</p>
                <p className="text-sm text-[#6c757d]"><strong>Security:</strong> PCI DSS Level 1 certified, tokenized payments, fraud prevention</p>
              </div>

              <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-5 border-2 border-[#fbbc05]/20">
                <h4 className="font-bold text-[#343a40] mb-2">3. Twilio Inc. (WhatsApp Business API)</h4>
                <p className="text-sm text-[#6c757d] mb-2"><strong>Location:</strong> United States</p>
                <p className="text-sm text-[#343a40] mb-2"><strong>Data Shared:</strong></p>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1 mb-2">
                  <li>Phone numbers (for WhatsApp delivery)</li>
                  <li>Alert messages (sales milestones, inventory warnings)</li>
                  <li>Notification content (performance summaries)</li>
                  <li><strong>NO raw Amazon data or customer information</strong></li>
                </ul>
                <p className="text-sm text-[#6c757d]"><strong>Purpose:</strong> Deliver real-time notifications and alerts to sellers</p>
                <p className="text-sm text-[#6c757d]"><strong>Security:</strong> End-to-end encrypted messages, ISO 27001 certified, GDPR compliant</p>
              </div>

              <div className="bg-gradient-to-br from-[#9333ea]/10 to-[#7e22ce]/5 rounded-xl p-5 border-2 border-[#9333ea]/20">
                <h4 className="font-bold text-[#343a40] mb-2">4. Vercel Inc. (Hosting Provider)</h4>
                <p className="text-sm text-[#6c757d] mb-2"><strong>Location:</strong> United States (AWS/Google Cloud)</p>
                <p className="text-sm text-[#343a40] mb-2"><strong>Data Shared:</strong></p>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1 mb-2">
                  <li>Application code and frontend assets</li>
                  <li>Server logs and error reports</li>
                  <li><strong>NO user data, Amazon data, or business metrics</strong></li>
                </ul>
                <p className="text-sm text-[#6c757d]"><strong>Purpose:</strong> Web application hosting, CDN distribution, performance optimization</p>
                <p className="text-sm text-[#6c757d]"><strong>Security:</strong> DDoS protection, SSL/TLS encryption, SOC 2 compliant</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-5 border-2 border-[#fbbc05]/30 mb-6">
              <h4 className="font-bold text-[#343a40] mb-3 flex items-center gap-2">
                <span className="text-[#fbbc05]">⚠️</span> Important: No Other Data Sharing
              </h4>
              <p className="text-[#6c757d] text-sm leading-relaxed">
                The above list represents <strong>ALL outside parties</strong> with whom SellerGenix shares any data.
                We do not share data with marketing agencies, analytics companies, data brokers, or any other third parties
                not explicitly listed above. All data sharing is strictly limited to what is necessary to provide our services.
              </p>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.3 Data Sharing Safeguards</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Due diligence:</strong> All third-party providers undergo security audits and compliance verification</li>
              <li><strong>Data Processing Agreements:</strong> Contractual obligations require same or stricter data protection standards</li>
              <li><strong>Minimum necessary principle:</strong> Only essential data is shared with each provider</li>
              <li><strong>Encryption requirements:</strong> All data transfers use AES-256 encryption and TLS 1.3</li>
              <li><strong>Regular audits:</strong> Quarterly security assessments of all third-party providers</li>
              <li><strong>Legal basis:</strong> GDPR Article 6(1)(b) (contract performance) and Article 28 (data processing agreements)</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.4 Seller Transparency</h3>
            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-5 border-2 border-[#4285f4]/20 mb-6">
              <p className="text-[#343a40] font-bold mb-2">We are completely transparent with sellers about:</p>
              <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2">
                <li>What Amazon data we access (detailed in our Terms of Service)</li>
                <li>Which third parties receive data and why (listed above)</li>
                <li>How data is protected (encryption, access controls, audits)</li>
                <li>Seller rights (access, deletion, portability under GDPR/CCPA)</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.5 Legal Data Sharing</h3>
            <p className="text-[#6c757d] mb-2">Data may be shared with legal authorities when required by law:</p>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>Court orders and subpoenas</li>
              <li>Legal investigations by law enforcement</li>
              <li>Regulatory compliance requests</li>
              <li>National security requirements</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">5. Data Security</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.1 Technical Security Measures</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Encryption:</strong> AES-256 bit encryption</li>
              <li><strong>SSL/TLS:</strong> All data transfers encrypted</li>
              <li><strong>Access Control:</strong> Multi-factor authentication</li>
              <li><strong>Firewall:</strong> Enterprise-level security firewalls</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.2 Organizational Measures</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Data protection training</li>
              <li>Confidentiality agreements</li>
              <li>Regular security audits</li>
              <li>Incident response plans</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.3 API Security</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>OAuth 2.0 authorization</li>
              <li>Rate limiting</li>
              <li>API key encryption</li>
              <li>Request/response logging</li>
            </ul>
          </section>

          {/* User Rights */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">6. User Rights</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.1 GDPR Rights (EU Citizens)</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Right of Access:</strong> View your data</li>
              <li><strong>Right of Rectification:</strong> Correct inaccurate information</li>
              <li><strong>Right to Erasure:</strong> &quot;Right to be forgotten&quot;</li>
              <li><strong>Right to Restriction:</strong> Limit processing</li>
              <li><strong>Right to Portability:</strong> Data transfer</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.2 CCPA Rights (California)</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Learn about personal information categories</li>
              <li>Learn about information sharing</li>
              <li>Request deletion</li>
              <li>Opt-out of sale</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.3 Exercising Rights</h3>
            <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
              <p className="text-[#343a40] font-bold mb-2">Contact:</p>
              <p className="text-[#6c757d] mb-1">Email: info@sellergenix.io</p>
              <p className="text-[#6c757d] mb-2">Phone: +1 (206) 312-8915</p>
              <p className="text-[#343a40] font-bold">Response Time: 30 days</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">7. Contact Information</h2>
            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#34a853]/5 rounded-xl p-8 border-2 border-[#4285f4]/20">
              <h3 className="text-xl font-bold text-[#343a40] mb-4">Data Protection Officer</h3>
              <div className="space-y-2 text-[#6c757d]">
                <p className="text-[#343a40] font-bold">MENTOREIS LLC</p>
                <p>2501 Chatham Road, STE 5143</p>
                <p>Springfield, IL 62704</p>
                <p>United States</p>
                <p><strong>Phone:</strong> +1 (206) 312-8915</p>
                <p><strong>Email:</strong> info@sellergenix.io</p>
                <p><strong>Website:</strong> www.sellergenix.io</p>
                <p><strong>Business Hours:</strong> Monday - Friday, 09:00 - 17:00 EST</p>
              </div>
            </div>
          </section>

          {/* Legal Compliance */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">8. Legal Compliance</h2>
            <p className="text-[#6c757d] mb-4">This Privacy Policy complies with the following laws:</p>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>GDPR (General Data Protection Regulation)</li>
              <li>CCPA (California Consumer Privacy Act)</li>
              <li>COPPA (Children&apos;s Online Privacy Protection Act)</li>
              <li>HIPAA (Health Insurance Portability and Accountability Act)</li>
              <li>SOX (Sarbanes-Oxley Act)</li>
              <li>Illinois Personal Information Protection Act</li>
            </ul>
          </section>

          {/* Document Information */}
          <section className="border-t-2 border-[#e5e7eb] pt-8">
            <div className="text-center text-[#6c757d]">
              <p className="mb-4 text-[#343a40]">This document is legally binding and is regularly updated. The latest version is available on our website.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Document ID:</strong> SG-PP-2025-001</p>
                <p><strong>Approved by:</strong> MENTOREIS LLC Legal Department</p>
                <p><strong>Date:</strong> September 26, 2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-[#343a40] text-white py-16 relative z-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center">
                  <span className="text-lg font-black text-white">SG</span>
                </div>
                <span className="text-xl font-black">SellerGenix</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                AI-Powered Analytics for Amazon Excellence
              </p>
              <p className="text-gray-500 text-xs">
                © 2025 MENTOREIS LLC. All rights reserved.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/features" className="block text-gray-400 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</Link>
                <Link href="/dashboard" className="block text-gray-400 hover:text-white transition-colors">Dashboard</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">Contact</Link>
                <a href="mailto:info@sellergenix.io" className="block text-gray-400 hover:text-white transition-colors">Support</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/sales-agreement" className="block text-gray-400 hover:text-white transition-colors">Sales Agreement</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              Made with care by MENTOREIS LLC • Springfield, IL 62704
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
