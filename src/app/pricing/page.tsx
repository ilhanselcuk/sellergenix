'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      description: 'Perfect for new sellers getting started',
      features: [
        { text: 'Up to 50 products', included: true },
        { text: 'Real-time analytics dashboard', included: true },
        { text: 'Basic profit tracking', included: true },
        { text: 'Email support (48h response)', included: true },
        { text: 'Amazon SP-API integration', included: true },
        { text: 'WhatsApp alerts (100/month)', included: true },
        { text: 'PPC optimization', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Multi-marketplace support', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      price: 149,
      description: 'Best for growing Amazon businesses',
      features: [
        { text: 'Up to 500 products', included: true },
        { text: 'Real-time analytics dashboard', included: true },
        { text: 'Advanced profit tracking', included: true },
        { text: 'Priority email support (12h)', included: true },
        { text: 'Amazon SP-API integration', included: true },
        { text: 'Unlimited WhatsApp alerts', included: true },
        { text: 'PPC optimization & automation', included: true },
        { text: 'Advanced analytics & insights', included: true },
        { text: 'Multi-marketplace (up to 3)', included: true },
        { text: 'Phone support', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'Custom solutions for large operations',
      features: [
        { text: 'Unlimited products', included: true },
        { text: 'Custom analytics dashboard', included: true },
        { text: 'Enterprise profit tracking', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Amazon SP-API integration', included: true },
        { text: 'Unlimited WhatsApp alerts', included: true },
        { text: 'PPC optimization & automation', included: true },
        { text: 'Custom AI insights', included: true },
        { text: 'Unlimited marketplaces', included: true },
        { text: '24/7 priority support', included: true },
      ],
      cta: 'Request Quote',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0f1c] to-black">
      {/* Header */}
      <header className="backdrop-blur-md bg-black/50 border-b border-white/5 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">SG</span>
              </div>
              <span className="text-xl font-bold text-white">SellerGenix</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-white/60 hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-500/10 border border-success-500/20 rounded-full">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
              <span className="text-success-500 text-sm font-medium">All plans include 14-day free trial</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-gradient-to-b ${
                  plan.popular
                    ? 'from-primary-500/10 to-black/50 border-2 border-primary-500/50'
                    : 'from-white/5 to-black/50 border border-white/10'
                } backdrop-blur-xl rounded-2xl p-8 ${
                  plan.popular ? 'shadow-2xl shadow-primary-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-primary-500 to-success-500 rounded-full">
                      <span className="text-white text-xs font-bold">MOST POPULAR</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/60 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {plan.price ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">${plan.price}</span>
                        <span className="text-white/60">/month</span>
                      </div>
                      <p className="text-white/40 text-sm mt-2">Billed monthly or save 20% with annual</p>
                    </>
                  ) : (
                    <div className="py-4">
                      <span className="text-4xl font-bold text-white">Custom</span>
                      <p className="text-white/60 text-sm mt-2">Tailored to your needs</p>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 mb-8 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-500 to-success-500 hover:from-primary-600 hover:to-success-600 text-white shadow-lg hover:shadow-primary-500/50 hover:scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-white/20 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-white' : 'text-white/30 line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-500/10 to-success-500/10 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Solution?</h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              Enterprise plans include custom features, dedicated support, and volume discounts.
              Contact our sales team to discuss your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-success-500 hover:from-primary-600 hover:to-success-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 hover:scale-105 transition-all duration-200"
              >
                Request Custom Quote
              </Link>
              <a
                href="mailto:media@mentoreis.com"
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
              >
                Email Sales Team
              </a>
            </div>
            <div className="mt-8 text-white/40 text-sm">
              <p>📧 media@mentoreis.com</p>
              <p>📞 +1 (206) 312-8915</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure payment processor Stripe.',
              },
              {
                question: 'Can I change plans later?',
                answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate the difference.',
              },
              {
                question: 'What happens after the free trial?',
                answer: 'After your 14-day free trial ends, you&apos;ll be automatically charged for your selected plan. You can cancel anytime during the trial period with no charges.',
              },
              {
                question: 'Do you offer refunds?',
                answer: 'We offer a 30-day money-back guarantee. If you&apos;re not satisfied with SellerGenix, contact us within 30 days for a full refund.',
              },
              {
                question: 'Is there a setup fee?',
                answer: 'No setup fees! All plans include free onboarding and setup assistance. Our team will help you get started quickly.',
              },
              {
                question: 'What if I need more than 500 products?',
                answer: 'Enterprise plans support unlimited products. Contact our sales team for a custom quote tailored to your business size.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-white/60">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-2">Secure Payments</h3>
              <p className="text-white/60">
                All transactions processed securely through Stripe with bank-level encryption
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">GDPR Compliant</h3>
              <p className="text-white/60">
                Full compliance with GDPR, CCPA, and international data protection regulations
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-white mb-2">Amazon Approved</h3>
              <p className="text-white/60">
                Official Amazon SP-API partner with certified security standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/40 text-sm mb-4 md:mb-0">
              <p>&copy; 2025 MENTOREIS LLC. All rights reserved.</p>
              <p className="mt-1">2501 Chatham Road, STE 5143, Springfield, IL 62704, United States</p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-white/60 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
