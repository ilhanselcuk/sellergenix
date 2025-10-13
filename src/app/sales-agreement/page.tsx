import Link from "next/link";

export default function SalesAgreement() {
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

      {/* Sales Agreement Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Sales Agreement</h1>
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
                  <p><strong>Seller:</strong> MENTOREIS LLC</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Sales Agreement Scope</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1 Parties</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>SELLER:</strong> MENTOREIS LLC</li>
              <li><strong>BUYER:</strong> Individual or entity purchasing SellerGenix services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.2 Subject of Sale</h3>
            <p className="text-gray-700 mb-4">
              Sale of SellerGenix platform subscriptions, AI-powered Amazon analytics services,
              and related digital business intelligence tools for Amazon sellers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1.3 Contract Validity</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Online sales platform acceptance</li>
              <li>Electronic signature confirmation</li>
              <li>Payment completion verification</li>
              <li>Email confirmation delivery</li>
            </ul>
          </section>

          {/* Products and Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Products & Services Definition</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Subscription Packages</h3>

            <div className="space-y-6">
              <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🆓 Free Trial Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Duration:</strong> 14 days</p>
                    <p><strong>Price:</strong> $0 USD</p>
                    <p><strong>Features:</strong> Full platform access</p>
                  </div>
                  <div>
                    <p><strong>Limitations:</strong> Trial period only</p>
                    <p><strong>Support:</strong> Email support</p>
                    <p><strong>Data Export:</strong> Limited</p>
                  </div>
                </div>
              </div>

              <div className="bg-success-50 rounded-lg p-6 border border-success-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🚀 Starter Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Monthly:</strong> $29 USD</p>
                    <p><strong>Annual:</strong> $290 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Basic analytics</p>
                  </div>
                  <div>
                    <p><strong>Products:</strong> Up to 100 ASINs</p>
                    <p><strong>Support:</strong> Email & Chat</p>
                    <p><strong>Data Retention:</strong> 6 months</p>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 rounded-lg p-6 border border-warning-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">💼 Professional Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Monthly:</strong> $79 USD</p>
                    <p><strong>Annual:</strong> $790 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Advanced analytics + PPC</p>
                  </div>
                  <div>
                    <p><strong>Products:</strong> Up to 500 ASINs</p>
                    <p><strong>Support:</strong> Priority support</p>
                    <p><strong>Data Retention:</strong> 2 years</p>
                  </div>
                </div>
              </div>

              <div className="bg-danger-50 rounded-lg p-6 border border-danger-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🏢 Enterprise Package</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Monthly:</strong> $199 USD</p>
                    <p><strong>Annual:</strong> $1,990 USD (Save 17%)</p>
                    <p><strong>Features:</strong> Full platform + Custom</p>
                  </div>
                  <div>
                    <p><strong>Products:</strong> Unlimited ASINs</p>
                    <p><strong>Support:</strong> Dedicated account manager</p>
                    <p><strong>Data Retention:</strong> Unlimited</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-8">2.2 Add-on Services</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔧 Custom Integration</h4>
                <p className="text-gray-700 text-sm"><strong>Price:</strong> $500-2,000 USD</p>
                <p className="text-gray-700 text-sm">Custom API integrations and automations</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Advanced Reporting</h4>
                <p className="text-gray-700 text-sm"><strong>Price:</strong> $200-800 USD</p>
                <p className="text-gray-700 text-sm">Custom dashboards and report generation</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎓 Training & Onboarding</h4>
                <p className="text-gray-700 text-sm"><strong>Price:</strong> $300-1,200 USD</p>
                <p className="text-gray-700 text-sm">Personalized training sessions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📱 WhatsApp Premium</h4>
                <p className="text-gray-700 text-sm"><strong>Price:</strong> $50/month USD</p>
                <p className="text-gray-700 text-sm">Advanced notification features</p>
              </div>
            </div>
          </section>

          {/* Pricing and Payment */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Pricing & Payment</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Currency & Exchange</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>All prices displayed in USD (US Dollar)</li>
              <li>Foreign exchange risk belongs to customer</li>
              <li>Automatic currency conversion at checkout</li>
              <li>Real-time exchange rates applied</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Accepted Payment Methods</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Credit Cards:</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Visa, Mastercard, American Express</li>
                    <li>Discover, JCB, UnionPay</li>
                    <li>Debit cards (Visa/Mastercard logo)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Security:</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Stripe Payment Processor (PCI DSS Level 1)</li>
                    <li>SSL encryption for all transactions</li>
                    <li>3D Secure authentication</li>
                    <li>Advanced fraud detection</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Payment Terms</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Payment Schedule:</strong> Monthly or annual subscription</li>
              <li><strong>Auto-renewal:</strong> Automatic subscription renewal</li>
              <li><strong>Invoice:</strong> Automatic email delivery</li>
              <li><strong>Receipt:</strong> Immediate post-payment confirmation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Taxes & Additional Fees</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Sales Tax:</strong> According to state regulations</li>
              <li><strong>Processing Fees:</strong> Included in subscription price</li>
              <li><strong>International Fees:</strong> Foreign transaction fees may apply</li>
              <li><strong>VAT:</strong> Applicable for EU customers</li>
            </ul>
          </section>

          {/* Service Delivery */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Service Delivery & Implementation</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Account Activation</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Immediate:</strong> Account activated upon payment confirmation</li>
              <li><strong>Access:</strong> Platform credentials sent via email</li>
              <li><strong>Setup:</strong> Automated onboarding process</li>
              <li><strong>Support:</strong> Setup assistance available</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Platform Access</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Availability:</strong> 24/7 web-based access</li>
                <li><strong>Uptime:</strong> 99.9% availability guarantee</li>
                <li><strong>Mobile:</strong> Responsive design for all devices</li>
                <li><strong>Updates:</strong> Regular feature releases included</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Data Integration</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Amazon SP-API:</strong> Secure connection setup</li>
              <li><strong>Data Sync:</strong> Initial sync within 24 hours</li>
              <li><strong>Historical Data:</strong> Up to 2 years import</li>
              <li><strong>Real-time Updates:</strong> 15-minute refresh intervals</li>
            </ul>
          </section>

          {/* Cancellation Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancellation & Refund Policy</h2>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">⚠️ Important Notice</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>No Refunds:</strong> All subscription purchases are final</li>
                <li><strong>Digital Services:</strong> No cancellation right after activation</li>
                <li><strong>Non-refundable:</strong> After payment confirmation</li>
                <li><strong>Exception:</strong> Free trial period only</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Subscription Management</h3>
            <div className="space-y-4">
              <div className="bg-success-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">✅ Allowed Actions</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Cancel auto-renewal anytime</li>
                  <li>Downgrade/upgrade subscription plans</li>
                  <li>Access until current period ends</li>
                  <li>Data export before cancellation</li>
                </ul>
              </div>

              <div className="bg-danger-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Not Allowed</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Refund of current subscription period</li>
                  <li>Partial refunds for unused time</li>
                  <li>Chargeback disputes (violation of terms)</li>
                  <li>Free service extension requests</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Exception Cases</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-2"><strong>Limited exceptions may apply for:</strong></p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Technical failures preventing service access (documented)</li>
                <li>Billing errors (within 30 days)</li>
                <li>Force majeure events</li>
                <li>Legal compliance requirements</li>
              </ul>
              <p className="text-gray-700 text-sm mt-2"><strong>Process:</strong> Case-by-case evaluation, documentation required, 30-day investigation period</p>
            </div>
          </section>

          {/* Warranty & Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Warranty & Liability</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Service Guarantee</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-success-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">✅ What We Guarantee</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>99.9% platform uptime</li>
                  <li>Data security compliance</li>
                  <li>Feature functionality as described</li>
                  <li>Customer support response times</li>
                </ul>
              </div>

              <div className="bg-danger-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">❌ No Guarantee For</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Specific business results</li>
                  <li>Amazon policy compliance</li>
                  <li>Market performance outcomes</li>
                  <li>Third-party service availability</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Liability Limitations</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Maximum Liability:</strong> Total fees paid in the last 12 months</li>
                <li><strong>Excluded Damages:</strong> Consequential, indirect, punitive damages</li>
                <li><strong>Business Losses:</strong> No compensation for lost profits or opportunities</li>
                <li><strong>Third-party Claims:</strong> Limited to our direct responsibility</li>
              </ul>
            </div>
          </section>

          {/* Legal Framework */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Legal Framework</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Governing Law & Jurisdiction</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Primary Law:</strong> Illinois State Law</li>
                <li><strong>Federal Law:</strong> US Federal Law (where applicable)</li>
                <li><strong>Jurisdiction:</strong> Springfield, Illinois courts</li>
                <li><strong>Venue:</strong> Sangamon County, Illinois</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Dispute Resolution</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Step 1:</strong> Direct negotiation (30 days)</li>
              <li><strong>Step 2:</strong> Mediation through AAA</li>
              <li><strong>Step 3:</strong> Binding arbitration</li>
              <li><strong>Emergency Relief:</strong> Injunctive relief available</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales & General Inquiries</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>MENTOREIS LLC</strong></p>
                    <p>2501 Chatham Road, STE 5143</p>
                    <p>Springfield, IL 62704</p>
                    <p>United States</p>
                    <p><strong>Phone:</strong> +1 (206) 312-8915</p>
                    <p><strong>Email:</strong> media@mentoreis.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Support & Technical</h3>
                  <div className="space-y-2 text-gray-700">
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
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Agreement Acceptance</h2>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                <strong>By completing payment and using SellerGenix services, you acknowledge:</strong>
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Read and understood all terms</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Accept no-refund policy</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Agree to payment terms</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Accept service limitations</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Consent to data processing</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Agree to governing law</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Accept electronic signature</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    <span className="text-gray-700 text-sm">Authorize recurring billing</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Document Information */}
          <section className="border-t border-gray-200 pt-8">
            <div className="text-center text-gray-600">
              <p className="mb-2">This sales agreement constitutes a legal contract and is regularly updated. The latest version is available on our website.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Document ID:</strong> SG-SA-2025-001</p>
                <p><strong>Approved by:</strong> MENTOREIS LLC Sales Department</p>
                <p><strong>Date:</strong> September 26, 2025</p>
                <p><strong>Version:</strong> 1.0</p>
                <p><strong>Digital Signature:</strong> Blockchain verified</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}