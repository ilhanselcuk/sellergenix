import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/90 border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SG</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SellerGenix</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-primary-500 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Terms of Service Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <div className="text-gray-600 space-y-2">
              <p><strong>Effective Date:</strong> September 26, 2025</p>
              <p><strong>Last Updated:</strong> September 26, 2025</p>
              <p><strong>Version:</strong> 1.0</p>
            </div>
          </div>

          {/* Company Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Company Name:</strong> MENTOREIS LLC</p>
                  <p><strong>Platform:</strong> SellerGenix</p>
                  <p><strong>Website:</strong> www.sellergenix.io</p>
                  <p><strong>Email:</strong> media@mentoreis.com</p>
                </div>
                <div>
                  <p><strong>Address:</strong> 2501 Chatham Road, STE 5143</p>
                  <p><strong>City:</strong> Springfield, IL 62704</p>
                  <p><strong>Country:</strong> United States of America</p>
                  <p><strong>Phone:</strong> +1 (206) 312-8915</p>
                </div>
              </div>
            </div>
          </section>

          {/* Agreement Scope */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement Scope</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Parties</h3>
            <p className="text-gray-700 mb-4">
              This agreement is between MENTOREIS LLC (&quot;Company&quot;, &quot;Service Provider&quot;) and the individual or entity
              using SellerGenix services (&quot;Customer&quot;, &quot;User&quot;).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Subject Matter</h3>
            <p className="text-gray-700 mb-4">
              Provision of Amazon analytics platform services, API integrations, and AI-powered business intelligence
              tools for Amazon sellers through the SellerGenix platform.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Service Areas</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Amazon Seller Central analytics and reporting</li>
              <li>PPC campaign optimization and management</li>
              <li>Profit tracking and financial analysis</li>
              <li>WhatsApp notifications and alerts</li>
              <li>Real-time performance monitoring</li>
              <li>Business intelligence and insights</li>
            </ul>
          </section>

          {/* Services Provided */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services Provided</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Platform Features</h3>
            <div className="space-y-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Real-time Analytics</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Sales performance tracking</li>
                  <li>Inventory management</li>
                  <li>Profit margin analysis</li>
                  <li>Market trend insights</li>
                </ul>
              </div>

              <div className="bg-success-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 PPC Optimization</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Automated bid management</li>
                  <li>Keyword research and optimization</li>
                  <li>ACOS optimization</li>
                  <li>Campaign performance analysis</li>
                </ul>
              </div>

              <div className="bg-warning-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💰 Profit Maximization</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>FBA fee calculation</li>
                  <li>COGS tracking</li>
                  <li>Net profit analysis</li>
                  <li>ROI optimization</li>
                </ul>
              </div>

              <div className="bg-danger-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔔 Smart Notifications</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>WhatsApp alerts</li>
                  <li>Stock level warnings</li>
                  <li>Price change notifications</li>
                  <li>Performance alerts</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 API Integrations</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Amazon SP-API:</strong> Seller Central data synchronization</li>
              <li><strong>Advertising API:</strong> PPC campaign management</li>
              <li><strong>FBA API:</strong> Inventory and fulfillment tracking</li>
              <li><strong>Twilio WhatsApp API:</strong> Notification delivery</li>
              <li><strong>Stripe API:</strong> Secure payment processing</li>
            </ul>
          </section>

          {/* Service Delivery */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Service Delivery</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Platform Access</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Availability:</strong> 99.9% uptime guarantee</li>
              <li><strong>Access:</strong> 24/7 web-based platform</li>
              <li><strong>Support:</strong> Business hours (Mon-Fri, 09:00-17:00 EST)</li>
              <li><strong>Updates:</strong> Regular feature enhancements</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Data Synchronization</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Real-time:</strong> Amazon data sync every 15 minutes</li>
              <li><strong>Historical data:</strong> Up to 2 years of data retention</li>
              <li><strong>Accuracy:</strong> 99.5% data accuracy guarantee</li>
              <li><strong>Latency:</strong> Under 5 minute data processing time</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Customer Support</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Email Support:</strong> 24 hours response</p>
                  <p><strong>WhatsApp:</strong> 4 hours response (business hours)</p>
                  <p><strong>Phone:</strong> Immediate (business hours)</p>
                </div>
                <div>
                  <p><strong>Emergency:</strong> 2 hours response</p>
                  <p><strong>Technical Issues:</strong> 4-8 hours resolution</p>
                  <p><strong>Feature Requests:</strong> 48-72 hours evaluation</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Obligations */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Obligations</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Account Requirements</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide accurate and current information</li>
              <li>Maintain security of account credentials</li>
              <li>Valid Amazon Seller Central account required</li>
              <li>Compliance with Amazon&apos;s Terms of Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 API Access & Security</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Secure sharing of Amazon SP-API credentials</li>
              <li>Responsible use of platform features</li>
              <li>No unauthorized access attempts</li>
              <li>Report security incidents immediately</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Acceptable Use</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use services for legitimate business purposes only</li>
              <li>No violation of applicable laws or regulations</li>
              <li>No interference with platform operations</li>
              <li>No sharing of account access with unauthorized parties</li>
            </ul>
          </section>

          {/* Pricing and Payment */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Pricing and Payment</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Subscription Plans</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Free Trial</h4>
                <p className="text-gray-700 text-sm">14-day free trial with full feature access</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Subscription Tiers</h4>
                <p className="text-gray-700 text-sm">Multiple pricing tiers based on business size and features needed</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Payment Terms</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Currency:</strong> All prices in USD</li>
              <li><strong>Billing:</strong> Monthly or annual subscription</li>
              <li><strong>Payment Methods:</strong> Credit card, debit card (via Stripe)</li>
              <li><strong>Auto-renewal:</strong> Automatic subscription renewal</li>
              <li><strong>Taxes:</strong> Applicable sales tax may apply</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Refund Policy</h3>
            <div className="bg-warning-50 rounded-lg p-4">
              <p className="text-gray-700 font-semibold mb-2">⚠️ Important Notice:</p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>No refunds after subscription activation</li>
                <li>Cancellation allowed with 24-hour notice</li>
                <li>Free trial cancellation anytime during trial period</li>
                <li>Exceptional circumstances evaluated case-by-case</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Service Limitations</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Analytics and insights are for informational purposes only</li>
              <li>No guarantee of specific business results</li>
              <li>Amazon policy changes may affect service functionality</li>
              <li>Market conditions impact beyond our control</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Technical Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Platform Uptime:</strong> 99.9% availability target</li>
              <li><strong>Data Security:</strong> Industry-standard protection</li>
              <li><strong>Backup & Recovery:</strong> Regular data backups</li>
              <li><strong>Third-party APIs:</strong> No guarantee of external service availability</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Financial Limitations</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Maximum Liability:</strong> Amount paid for services in the last 12 months</li>
                <li><strong>Excluded Damages:</strong> Consequential, indirect, or punitive damages</li>
                <li><strong>Business Loss:</strong> No compensation for lost profits or opportunities</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 User Termination</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Cancel subscription anytime through platform settings</li>
              <li>24-hour notice required for current billing period</li>
              <li>Access continues until end of paid period</li>
              <li>Data export available for 30 days after termination</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Company Termination</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Material breach of terms</li>
              <li>Non-payment for 30+ days</li>
              <li>Violation of acceptable use policy</li>
              <li>Legal compliance requirements</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Post-Termination</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Data retention as per privacy policy</li>
              <li>Outstanding payment obligations continue</li>
              <li>Confidentiality obligations survive</li>
              <li>API access immediately revoked</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Applicable Law:</strong> Illinois State Law</li>
                <li><strong>Federal Law:</strong> US Federal Law (where applicable)</li>
                <li><strong>Jurisdiction:</strong> Springfield, Illinois</li>
                <li><strong>Dispute Resolution:</strong> Mediation followed by arbitration</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Notices & Support</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>MENTOREIS LLC</strong></p>
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
          <section className="border-t border-gray-200 pt-8">
            <div className="text-center text-gray-600">
              <p className="mb-2">This agreement constitutes a legal contract and is regularly updated. The latest version is available on our website.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Document ID:</strong> SG-TOS-2025-001</p>
                <p><strong>Approved by:</strong> MENTOREIS LLC Legal Department</p>
                <p><strong>Date:</strong> September 26, 2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}