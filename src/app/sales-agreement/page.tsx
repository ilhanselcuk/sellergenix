'use client'

/**
 * Sales Agreement Page - SellerGenix
 * Modern Google Material Design
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, FileCheck, DollarSign, ShieldCheck } from 'lucide-react'

export default function SalesAgreement() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#fbbc05]/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea4335]/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#4285f4]/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#fbbc05] to-[#f29900] rounded-2xl mb-6">
            <FileCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-[#343a40] mb-4">Sales Agreement</h1>
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
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">Company Information</h2>
            </div>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[#343a40]"><strong>Seller:</strong> MENTOREIS LLC</p>
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
            <h2 className="text-3xl font-black text-[#343a40] mb-6">1. Sales Agreement Scope</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.1 Parties</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>SELLER:</strong> MENTOREIS LLC</li>
              <li><strong>BUYER:</strong> Individual or entity purchasing SellerGenix services</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.2 Subject of Sale</h3>
            <p className="text-[#6c757d] mb-6 leading-relaxed">
              Sale of SellerGenix platform subscriptions, AI-powered Amazon analytics services,
              and related digital business intelligence tools for Amazon sellers.
            </p>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">1.3 Contract Validity</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li>Online sales platform acceptance</li>
              <li>Electronic signature confirmation</li>
              <li>Payment completion verification</li>
              <li>Email confirmation delivery</li>
            </ul>
          </section>

          {/* Products and Services */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#34a853] to-[#137333] rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#343a40]">2. Products & Services Definition</h2>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">2.1 Subscription Packages</h3>

            <div className="space-y-4 mb-8">
              <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-6 border-2 border-[#4285f4]/20">
                <h4 className="text-lg font-bold text-[#343a40] mb-3">🆓 Free Trial Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Duration:</strong> 14 days</p>
                    <p><strong>Price:</strong> $0 USD</p>
                    <p><strong>Features:</strong> Full platform access</p>
                  </div>
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Limitations:</strong> Trial period only</p>
                    <p><strong>Support:</strong> Email support</p>
                    <p><strong>Data Export:</strong> Limited</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-6 border-2 border-[#34a853]/20">
                <h4 className="text-lg font-bold text-[#343a40] mb-3">🚀 Starter Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Monthly:</strong> $29 USD</p>
                    <p><strong>Annual:</strong> $290 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Basic analytics</p>
                  </div>
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Products:</strong> Up to 100 ASINs</p>
                    <p><strong>Support:</strong> Email & Chat</p>
                    <p><strong>Data Retention:</strong> 6 months</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-6 border-2 border-[#fbbc05]/20">
                <h4 className="text-lg font-bold text-[#343a40] mb-3">💼 Professional Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Monthly:</strong> $79 USD</p>
                    <p><strong>Annual:</strong> $790 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Advanced analytics + PPC</p>
                  </div>
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Products:</strong> Up to 500 ASINs</p>
                    <p><strong>Support:</strong> Priority support</p>
                    <p><strong>Data Retention:</strong> 2 years</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#ea4335]/10 to-[#c5221f]/5 rounded-xl p-6 border-2 border-[#ea4335]/20">
                <h4 className="text-lg font-bold text-[#343a40] mb-3">🏢 Enterprise Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Monthly:</strong> $199 USD</p>
                    <p><strong>Annual:</strong> $1,990 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Full platform + Custom</p>
                  </div>
                  <div className="space-y-1 text-[#6c757d]">
                    <p><strong>Products:</strong> Unlimited ASINs</p>
                    <p><strong>Support:</strong> Dedicated account manager</p>
                    <p><strong>Data Retention:</strong> Unlimited</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">2.2 Add-on Services</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
                <h4 className="font-bold text-[#343a40] mb-2">🔧 Custom Integration</h4>
                <p className="text-[#6c757d] text-sm mb-1"><strong>Price:</strong> $500-2,000 USD</p>
                <p className="text-[#6c757d] text-sm">Custom API integrations and automations</p>
              </div>
              <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
                <h4 className="font-bold text-[#343a40] mb-2">📊 Advanced Reporting</h4>
                <p className="text-[#6c757d] text-sm mb-1"><strong>Price:</strong> $200-800 USD</p>
                <p className="text-[#6c757d] text-sm">Custom dashboards and report generation</p>
              </div>
              <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
                <h4 className="font-bold text-[#343a40] mb-2">🎓 Training & Onboarding</h4>
                <p className="text-[#6c757d] text-sm mb-1"><strong>Price:</strong> $300-1,200 USD</p>
                <p className="text-[#6c757d] text-sm">Personalized training sessions</p>
              </div>
              <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
                <h4 className="font-bold text-[#343a40] mb-2">📱 WhatsApp Premium</h4>
                <p className="text-[#6c757d] text-sm mb-1"><strong>Price:</strong> $50/month USD</p>
                <p className="text-[#6c757d] text-sm">Advanced notification features</p>
              </div>
            </div>
          </section>

          {/* Pricing and Payment */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">3. Pricing & Payment</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.1 Currency & Exchange</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li>All prices displayed in USD (US Dollar)</li>
              <li>Foreign exchange risk belongs to customer</li>
              <li>Automatic currency conversion at checkout</li>
              <li>Real-time exchange rates applied</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.2 Accepted Payment Methods</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-6 border-2 border-[#e5e7eb] mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-[#343a40] mb-2">Credit Cards:</h4>
                  <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                    <li>Visa, Mastercard, American Express</li>
                    <li>Discover, JCB, UnionPay</li>
                    <li>Debit cards (Visa/Mastercard logo)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[#343a40] mb-2">Payment Security:</h4>
                  <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-1">
                    <li>Stripe Payment Processor (PCI DSS Level 1)</li>
                    <li>SSL encryption for all transactions</li>
                    <li>3D Secure authentication</li>
                    <li>Advanced fraud detection</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.3 Payment Terms</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Payment Schedule:</strong> Monthly or annual subscription</li>
              <li><strong>Auto-renewal:</strong> Automatic subscription renewal</li>
              <li><strong>Invoice:</strong> Automatic email delivery</li>
              <li><strong>Receipt:</strong> Immediate post-payment confirmation</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">3.4 Taxes & Additional Fees</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li><strong>Sales Tax:</strong> According to state regulations</li>
              <li><strong>Processing Fees:</strong> Included in subscription price</li>
              <li><strong>International Fees:</strong> Foreign transaction fees may apply</li>
              <li><strong>VAT:</strong> Applicable for EU customers</li>
            </ul>
          </section>

          {/* Service Delivery */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">4. Service Delivery & Implementation</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.1 Account Activation</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2 mb-6">
              <li><strong>Immediate:</strong> Account activated upon payment confirmation</li>
              <li><strong>Access:</strong> Platform credentials sent via email</li>
              <li><strong>Setup:</strong> Automated onboarding process</li>
              <li><strong>Support:</strong> Setup assistance available</li>
            </ul>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.2 Platform Access</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb] mb-6">
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>Availability:</strong> 24/7 web-based access</li>
                <li><strong>Uptime:</strong> 99.9% availability guarantee</li>
                <li><strong>Mobile:</strong> Responsive design for all devices</li>
                <li><strong>Updates:</strong> Regular feature releases included</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">4.3 Data Integration</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li><strong>Amazon SP-API:</strong> Secure connection setup</li>
              <li><strong>Data Sync:</strong> Initial sync within 24 hours</li>
              <li><strong>Historical Data:</strong> Up to 2 years import</li>
              <li><strong>Real-time Updates:</strong> 15-minute refresh intervals</li>
            </ul>
          </section>

          {/* Cancellation Policy */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">5. Cancellation & Refund Policy</h2>

            <div className="bg-gradient-to-br from-[#fbbc05]/10 to-[#f29900]/5 rounded-xl p-6 border-2 border-[#fbbc05]/30 mb-6">
              <h3 className="text-xl font-bold text-[#343a40] mb-3 flex items-center gap-2">
                <span className="text-[#fbbc05]">⚠️</span> Important Notice
              </h3>
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>No Refunds:</strong> All subscription purchases are final</li>
                <li><strong>Digital Services:</strong> No cancellation right after activation</li>
                <li><strong>Non-refundable:</strong> After payment confirmation</li>
                <li><strong>Exception:</strong> Free trial period only</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">5.1 Subscription Management</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
                <h4 className="font-bold text-[#343a40] mb-3">✅ Allowed Actions</h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2">
                  <li>Cancel auto-renewal anytime</li>
                  <li>Downgrade/upgrade subscription plans</li>
                  <li>Access until current period ends</li>
                  <li>Data export before cancellation</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#ea4335]/10 to-[#c5221f]/5 rounded-xl p-5 border-2 border-[#ea4335]/20">
                <h4 className="font-bold text-[#343a40] mb-3">❌ Not Allowed</h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2">
                  <li>Refund of current subscription period</li>
                  <li>Partial refunds for unused time</li>
                  <li>Chargeback disputes (violation of terms)</li>
                  <li>Free service extension requests</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">5.2 Exception Cases</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
              <p className="text-[#343a40] font-bold mb-2">Limited exceptions may apply for:</p>
              <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2 mb-3">
                <li>Technical failures preventing service access (documented)</li>
                <li>Billing errors (within 30 days)</li>
                <li>Force majeure events</li>
                <li>Legal compliance requirements</li>
              </ul>
              <p className="text-[#6c757d] text-sm"><strong>Process:</strong> Case-by-case evaluation, documentation required, 30-day investigation period</p>
            </div>
          </section>

          {/* Warranty & Liability */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">6. Warranty & Liability</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-4">6.1 Service Guarantee</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#34a853]/10 to-[#137333]/5 rounded-xl p-5 border-2 border-[#34a853]/20">
                <h4 className="font-bold text-[#343a40] mb-3">✅ What We Guarantee</h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2">
                  <li>99.9% platform uptime</li>
                  <li>Data security compliance</li>
                  <li>Feature functionality as described</li>
                  <li>Customer support response times</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#ea4335]/10 to-[#c5221f]/5 rounded-xl p-5 border-2 border-[#ea4335]/20">
                <h4 className="font-bold text-[#343a40] mb-3">❌ No Guarantee For</h4>
                <ul className="list-disc list-inside text-[#6c757d] text-sm space-y-2">
                  <li>Specific business results</li>
                  <li>Amazon policy compliance</li>
                  <li>Market performance outcomes</li>
                  <li>Third-party service availability</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">6.2 Liability Limitations</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb]">
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>Maximum Liability:</strong> Total fees paid in the last 12 months</li>
                <li><strong>Excluded Damages:</strong> Consequential, indirect, punitive damages</li>
                <li><strong>Business Losses:</strong> No compensation for lost profits or opportunities</li>
                <li><strong>Third-party Claims:</strong> Limited to our direct responsibility</li>
              </ul>
            </div>
          </section>

          {/* Legal Framework */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">7. Legal Framework</h2>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">7.1 Governing Law & Jurisdiction</h3>
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-xl p-5 border-2 border-[#e5e7eb] mb-6">
              <ul className="list-disc list-inside text-[#6c757d] space-y-2">
                <li><strong>Primary Law:</strong> Illinois State Law</li>
                <li><strong>Federal Law:</strong> US Federal Law (where applicable)</li>
                <li><strong>Jurisdiction:</strong> Springfield, Illinois courts</li>
                <li><strong>Venue:</strong> Sangamon County, Illinois</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-[#343a40] mb-3">7.2 Dispute Resolution</h3>
            <ul className="list-disc list-inside text-[#6c757d] space-y-2">
              <li><strong>Step 1:</strong> Direct negotiation (30 days)</li>
              <li><strong>Step 2:</strong> Mediation through AAA</li>
              <li><strong>Step 3:</strong> Binding arbitration</li>
              <li><strong>Emergency Relief:</strong> Injunctive relief available</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">8. Contact Information</h2>
            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#34a853]/5 rounded-xl p-8 border-2 border-[#4285f4]/20">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-[#343a40] mb-3">Sales & General Inquiries</h3>
                  <div className="space-y-2 text-[#6c757d]">
                    <p className="text-[#343a40] font-bold">MENTOREIS LLC</p>
                    <p>2501 Chatham Road, STE 5143</p>
                    <p>Springfield, IL 62704</p>
                    <p>United States</p>
                    <p><strong>Phone:</strong> +1 (206) 312-8915</p>
                    <p><strong>Email:</strong> media@mentoreis.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#343a40] mb-3">Support & Technical</h3>
                  <div className="space-y-2 text-[#6c757d]">
                    <p><strong>Website:</strong> www.sellergenix.io</p>
                    <p><strong>Support Portal:</strong> support.sellergenix.io</p>
                    <p><strong>WhatsApp:</strong> +1 (206) 312-8915</p>
                    <p><strong>Business Hours:</strong> Mon-Fri, 09:00-17:00 EST</p>
                    <p><strong>Emergency:</strong> 24/7 WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Agreement Acceptance */}
          <section className="mb-12">
            <h2 className="text-3xl font-black text-[#343a40] mb-6">9. Agreement Acceptance</h2>
            <div className="bg-gradient-to-br from-[#4285f4]/10 to-[#3367d6]/5 rounded-xl p-6 border-2 border-[#4285f4]/20">
              <p className="text-[#343a40] font-bold mb-4">
                By completing payment and using SellerGenix services, you acknowledge:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Read and understood all terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Accept no-refund policy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Agree to payment terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Accept service limitations</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Consent to data processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Agree to governing law</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Accept electronic signature</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-[#34a853] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#6c757d] text-sm">Authorize recurring billing</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Document Information */}
          <section className="border-t-2 border-[#e5e7eb] pt-8">
            <div className="text-center text-[#6c757d]">
              <p className="mb-4 text-[#343a40]">This sales agreement constitutes a legal contract and is regularly updated. The latest version is available on our website.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Document ID:</strong> SG-SA-2025-001</p>
                <p><strong>Approved by:</strong> MENTOREIS LLC Sales Department</p>
                <p><strong>Date:</strong> September 26, 2025</p>
                <p><strong>Version:</strong> 1.0</p>
                <p><strong>Digital Signature:</strong> Blockchain verified</p>
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
