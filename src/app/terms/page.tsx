'use client'

/**
 * Terms of Service Page - SellerGenix
 * Modern Google Material Design
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Scale, Shield } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4285f4]/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#34a853]/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#fbbc05]/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4285f4] to-[#3367d6] rounded-2xl mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#343a40] mb-4">Terms of Service</h1>
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
                  <p className="text-[#343a40]"><strong>Email:</strong> media@mentoreis.com</p>
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

          {/* Agreement Scope */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">1. Agreement Scope</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.1 Parties</h3>
            <p className="text-[#6c757d] mb-6 leading-relaxed">
              This agreement is between MENTOREIS LLC (&quot;Company&quot;, &quot;Service Provider&quot;) and the individual or entity
              using SellerGenix services (&quot;Customer&quot;, &quot;User&quot;).
            </p>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.2 Subject Matter</h3>
            <p className="text-[#6c757d] mb-6 leading-relaxed">
              Provision of Amazon analytics platform services, API integrations, and AI-powered business intelligence
              tools for Amazon sellers through the SellerGenix platform.
            </p>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.3 Service Areas</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Amazon Seller Central analytics and reporting</li>
              <li>PPC campaign optimization and management</li>
              <li>Profit tracking and financial analysis</li>
              <li>WhatsApp notifications and alerts</li>
              <li>Real-time performance monitoring</li>
              <li>Business intelligence and insights</li>
            </ul>
          </section>

          {/* Services Provided */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">2. Services Provided</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">2.1 Platform Features</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-5 border-2 border-[#4285f4]/20">
                <h4 className="font-bold text-[#343a40] mb-3 flex items-center gap-2">
                  <span className="text-[#4285f4]">📊</span> Real-time Analytics
                </h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                  <li>Sales performance tracking</li>
                  <li>Inventory management</li>
                  <li>Profit margin analysis</li>
                  <li>Market trend insights</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
                <h4 className="font-bold text-[#343a40] mb-3 flex items-center gap-2">
                  <span className="text-[#34a853]">🎯</span> PPC Optimization
                </h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                  <li>Automated bid management</li>
                  <li>Keyword research and optimization</li>
                  <li>ACOS optimization</li>
                  <li>Campaign performance analysis</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-5 border-2 border-[#fbbc05]/20">
                <h4 className="font-bold text-[#343a40] mb-3 flex items-center gap-2">
                  <span className="text-[#fbbc05]">💰</span> Profit Maximization
                </h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                  <li>FBA fee calculation</li>
                  <li>COGS tracking</li>
                  <li>Net profit analysis</li>
                  <li>ROI optimization</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#ea4335]/10 to-[#c5221f]/5 rounded-xl p-5 border-2 border-[#ea4335]/20">
                <h4 className="font-bold text-[#343a40] mb-3 flex items-center gap-2">
                  <span className="text-[#ea4335]">🔔</span> Smart Notifications
                </h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                  <li>WhatsApp alerts</li>
                  <li>Stock level warnings</li>
                  <li>Price change notifications</li>
                  <li>Performance alerts</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">2.2 API Integrations</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li><strong>Amazon SP-API:</strong> Seller Central data synchronization</li>
              <li><strong>Advertising API:</strong> PPC campaign management</li>
              <li><strong>FBA API:</strong> Inventory and fulfillment tracking</li>
              <li><strong>Twilio WhatsApp API:</strong> Notification delivery</li>
              <li><strong>Stripe API:</strong> Secure payment processing</li>
            </ul>
          </section>

          {/* Service Delivery */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">3. Service Delivery</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.1 Platform Access</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Availability:</strong> 99.9% uptime guarantee</li>
              <li><strong>Access:</strong> 24/7 web-based platform</li>
              <li><strong>Support:</strong> Business hours (Mon-Fri, 09:00-17:00 EST)</li>
              <li><strong>Updates:</strong> Regular feature enhancements</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.2 Data Synchronization</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Real-time:</strong> Amazon data sync every 15 minutes</li>
              <li><strong>Historical data:</strong> Up to 2 years of data retention</li>
              <li><strong>Accuracy:</strong> 99.5% data accuracy guarantee</li>
              <li><strong>Latency:</strong> Under 5 minute data processing time</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.3 Customer Support</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[#343a40]"><strong>Email Support:</strong> 24 hours response</p>
                  <p className="text-[#343a40]"><strong>WhatsApp:</strong> 4 hours response (business hours)</p>
                  <p className="text-[#343a40]"><strong>Phone:</strong> Immediate (business hours)</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#343a40]"><strong>Emergency:</strong> 2 hours response</p>
                  <p className="text-[#343a40]"><strong>Technical Issues:</strong> 4-8 hours resolution</p>
                  <p className="text-[#343a40]"><strong>Feature Requests:</strong> 48-72 hours evaluation</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Obligations */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ea4335] to-[#c5221f] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">4. User Obligations</h2>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.1 Account Requirements</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Provide accurate and current information</li>
              <li>Maintain security of account credentials</li>
              <li>Valid Amazon Seller Central account required</li>
              <li>Compliance with Amazon&apos;s Terms of Service</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.2 API Access & Security</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Secure sharing of Amazon SP-API credentials</li>
              <li>Responsible use of platform features</li>
              <li>No unauthorized access attempts</li>
              <li>Report security incidents immediately</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.3 Acceptable Use</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>Use services for legitimate business purposes only</li>
              <li>No violation of applicable laws or regulations</li>
              <li>No interference with platform operations</li>
              <li>No sharing of account access with unauthorized parties</li>
            </ul>
          </section>

          {/* Pricing and Payment */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">5. Pricing and Payment</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">5.1 Subscription Plans</h3>
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
                <h4 className="font-bold text-[#343a40] mb-2">Free Trial</h4>
                <p className="text-[#6c757d] text-sm">14-day free trial with full feature access</p>
              </div>
              <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-5 border-2 border-[#4285f4]/20">
                <h4 className="font-bold text-[#343a40] mb-2">Subscription Tiers</h4>
                <p className="text-[#6c757d] text-sm">Multiple pricing tiers based on business size and features needed</p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.2 Payment Terms</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Currency:</strong> All prices in USD</li>
              <li><strong>Billing:</strong> Monthly or annual subscription</li>
              <li><strong>Payment Methods:</strong> Credit card, debit card (via Stripe)</li>
              <li><strong>Auto-renewal:</strong> Automatic subscription renewal</li>
              <li><strong>Taxes:</strong> Applicable sales tax may apply</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.3 Refund Policy</h3>
            <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-5 border-2 border-[#fbbc05]/30">
              <p className="text-[#343a40] font-bold mb-3 flex items-center gap-2">
                <span className="text-[#fbbc05]">⚠️</span> Important Notice
              </p>
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li>No refunds after subscription activation</li>
                <li>Cancellation allowed with 24-hour notice</li>
                <li>Free trial cancellation anytime during trial period</li>
                <li>Exceptional circumstances evaluated case-by-case</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">6. Limitation of Liability</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.1 Service Limitations</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Analytics and insights are for informational purposes only</li>
              <li>No guarantee of specific business results</li>
              <li>Amazon policy changes may affect service functionality</li>
              <li>Market conditions impact beyond our control</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.2 Technical Responsibilities</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Platform Uptime:</strong> 99.9% availability target</li>
              <li><strong>Data Security:</strong> Industry-standard protection</li>
              <li><strong>Backup & Recovery:</strong> Regular data backups</li>
              <li><strong>Third-party APIs:</strong> No guarantee of external service availability</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.3 Financial Limitations</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb]">
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>Maximum Liability:</strong> Amount paid for services in the last 12 months</li>
                <li><strong>Excluded Damages:</strong> Consequential, indirect, or punitive damages</li>
                <li><strong>Business Loss:</strong> No compensation for lost profits or opportunities</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">7. Termination</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">7.1 User Termination</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Cancel subscription anytime through platform settings</li>
              <li>24-hour notice required for current billing period</li>
              <li>Access continues until end of paid period</li>
              <li>Data export available for 30 days after termination</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">7.2 Company Termination</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>Material breach of terms</li>
              <li>Non-payment for 30+ days</li>
              <li>Violation of acceptable use policy</li>
              <li>Legal compliance requirements</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">7.3 Post-Termination</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>Data retention as per privacy policy</li>
              <li>Outstanding payment obligations continue</li>
              <li>Confidentiality obligations survive</li>
              <li>API access immediately revoked</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">8. Governing Law</h2>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb]">
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>Applicable Law:</strong> Illinois State Law</li>
                <li><strong>Federal Law:</strong> US Federal Law (where applicable)</li>
                <li><strong>Jurisdiction:</strong> Springfield, Illinois</li>
                <li><strong>Dispute Resolution:</strong> Mediation followed by arbitration</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">9. Contact Information</h2>
            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#34a853]/5 rounded-xl p-8 border-2 border-[#4285f4]/20">
              <h3 className="text-xl font-bold text-[#343a40] mb-4">Legal Notices & Support</h3>
              <div className="space-y-2 text-[#6c757d]">
                <p className="text-[#343a40] font-bold">MENTOREIS LLC</p>
                <p>2501 Chatham Road, STE 5143</p>
                <p>Springfield, IL 62704</p>
                <p>United States</p>
                <p><strong>Phone:</strong> +1 (206) 312-8915</p>
                <p><strong>Email:</strong> media@mentoreis.com</p>
                <p><strong>Website:</strong> www.sellergenix.io</p>
                <p><strong>Business Hours:</strong> Monday - Friday, 09:00 - 17:00 EST</p>
              </div>
            </div>
          </section>

          {/* Document Information */}
          <section className="border-t-2 border-[#e5e7eb] pt-8">
            <div className="text-center text-[#6c757d]">
              <p className="mb-4 text-[#343a40]">This agreement constitutes a legal contract and is regularly updated. The latest version is available on our website.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Document ID:</strong> SG-TOS-2025-001</p>
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
                <a href="mailto:media@mentoreis.com" className="block text-gray-400 hover:text-white transition-colors">Support</a>
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
