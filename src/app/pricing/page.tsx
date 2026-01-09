/**
 * Pricing Page - SellerGenix
 * Premium Dark Theme - TRANSPARENT about what's included
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, Zap, Shield, Star, Sparkles, Clock, Menu } from 'lucide-react'

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const plans = [
    {
      name: 'Starter',
      price: 29,
      description: 'Perfect for new sellers getting started',
      features: [
        { text: 'Up to 50 products', included: true },
        { text: 'Analytics Dashboard (7 views)', included: true },
        { text: 'COGS & Profit Tracking', included: true },
        { text: 'Amazon Integration', included: true },
        { text: 'Data Export (CSV)', included: true },
        { text: 'Email support (48h response)', included: true },
        { text: 'PPC Optimization', included: false, comingSoon: true },
        { text: 'WhatsApp Alerts', included: false, comingSoon: true },
        { text: 'Multi-marketplace', included: false, comingSoon: true },
        { text: 'AI Insights', included: false, comingSoon: true },
      ],
      cta: 'Start Free Trial',
      popular: false,
      gradient: 'from-blue-600 to-blue-700',
    },
    {
      name: 'Professional',
      price: 79,
      description: 'Best for growing Amazon businesses',
      features: [
        { text: 'Up to 500 products', included: true },
        { text: 'Analytics Dashboard (7 views)', included: true },
        { text: 'Advanced COGS & Profit Tracking', included: true },
        { text: 'Amazon Integration', included: true },
        { text: 'Data Export (CSV, Excel)', included: true },
        { text: 'Priority email support (12h)', included: true },
        { text: 'PPC Optimization', included: true, comingSoon: true },
        { text: 'WhatsApp Alerts', included: true, comingSoon: true },
        { text: 'Multi-marketplace (up to 3)', included: true, comingSoon: true },
        { text: 'AI Insights', included: true, comingSoon: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-purple-600 to-purple-700',
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'Custom solutions for large operations',
      features: [
        { text: 'Unlimited products', included: true },
        { text: 'Custom analytics dashboard', included: true },
        { text: 'Enterprise COGS management', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Full data export suite', included: true },
        { text: '24/7 priority support', included: true },
        { text: 'PPC Automation', included: true, comingSoon: true },
        { text: 'Unlimited WhatsApp Alerts', included: true, comingSoon: true },
        { text: 'Unlimited marketplaces', included: true, comingSoon: true },
        { text: 'Custom AI Solutions', included: true, comingSoon: true },
      ],
      cta: 'Request Quote',
      popular: false,
      gradient: 'from-emerald-600 to-emerald-700',
    },
  ]

  const faqs = [
    {
      question: 'What features are available right now?',
      answer: 'Currently available: Analytics Dashboard (7 views), Product Management, COGS Tracking, Profit Calculations, Amazon Integration, and Data Export. See our Features page for the full list.',
    },
    {
      question: 'What features are coming soon?',
      answer: 'We\'re actively building: PPC Campaign Optimization, WhatsApp Alerts, Multi-marketplace Support, Real-time Amazon Sync, Inventory Management, and AI-Powered Insights. These are marked with "Coming Soon" badges in the pricing plans.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure payment processor Stripe.',
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate the difference.',
    },
    {
      question: 'What happens after the free trial?',
      answer: 'After your 14-day free trial ends, you\'ll be automatically charged for your selected plan. You can cancel anytime during the trial period with no charges.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with SellerGenix, contact us within 30 days for a full refund.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <span className="text-xl font-black text-white">SG</span>
              </div>
              <span className="text-xl font-black text-white">SellerGenix</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-white font-semibold">
                Pricing
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="hidden sm:block text-slate-400 hover:text-white font-semibold transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:block px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Start Free Trial
              </Link>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800"
          >
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-white font-semibold"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Contact
              </Link>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-center"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">All plans include 14-day free trial</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">Simple, Transparent</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>

            {/* Transparency Notice */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">Features marked &quot;Coming Soon&quot; are in development</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/25">
                      <span className="text-white text-xs font-black flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        MOST POPULAR
                      </span>
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plan.gradient} rounded-2xl p-px h-full ${plan.popular ? 'shadow-2xl shadow-purple-500/20' : ''}`}>
                  <div className="bg-slate-900 rounded-2xl p-8 h-full flex flex-col">
                    <div className="mb-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center mb-4`}>
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      {plan.price ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-black text-white">${plan.price}</span>
                            <span className="text-slate-400 font-semibold">/month</span>
                          </div>
                          <p className="text-slate-500 text-sm">Billed monthly or save 20% with annual</p>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-white">Custom</span>
                          <p className="text-slate-400 mt-2">Tailored to your needs</p>
                        </>
                      )}
                    </div>

                    <Link
                      href={plan.price ? "/auth/register" : "/contact"}
                      className={`w-full py-4 px-6 rounded-xl font-black transition-all duration-300 mb-8 block text-center ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                          : 'border-2 border-slate-700 text-white hover:border-purple-500/50 hover:text-white'
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    <div className="space-y-4 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                feature.included ? 'text-slate-300' : 'text-slate-600'
                              }`}
                            >
                              {feature.text}
                            </span>
                            {feature.comingSoon && feature.included && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs font-bold text-amber-400">
                                SOON
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Available Now Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 rounded-2xl p-px">
              <div className="bg-slate-900 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">What&apos;s Included Today</h2>
                    <p className="text-slate-400 text-sm">All plans include these working features</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Analytics Dashboard with 7 view modes',
                    'Product Management & COGS Tracking',
                    'Profit & ROI Calculations',
                    'P&L Reports with 40+ metrics',
                    'Amazon Integration',
                    'Data Export (CSV/Excel)',
                    'Secure Authentication',
                    'Settings & Account Management',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Contact Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20 rounded-3xl p-px">
              <div className="bg-slate-900 rounded-3xl p-12 text-center">
                <h2 className="text-3xl font-black text-white mb-4">Need a Custom Solution?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Enterprise plans include custom features, dedicated support, and volume discounts.
                  Contact our sales team to discuss your specific needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Link
                    href="/contact"
                    className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-black text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Request Custom Quote
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="mailto:info@sellergenix.io"
                    className="px-10 py-4 border-2 border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl font-black transition-all duration-300"
                  >
                    Email Sales Team
                  </a>
                </div>
                <div className="text-slate-500 text-sm space-y-1">
                  <p>info@sellergenix.io</p>
                  <p>+1 (206) 312-8915</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">Common Questions</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-400">
              Everything you need to know about our pricing
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300">
                  <div className="bg-slate-900 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-400">{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="relative z-10 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure Payments',
                description: 'All transactions processed securely through Stripe with bank-level encryption',
                gradient: 'from-blue-600 to-blue-700'
              },
              {
                icon: Check,
                title: '30-Day Money Back',
                description: 'Not satisfied? Get a full refund within 30 days, no questions asked',
                gradient: 'from-emerald-600 to-emerald-700'
              },
              {
                icon: Star,
                title: 'Amazon SP-API Partner',
                description: 'Official Amazon Solution Provider with certified security standards',
                gradient: 'from-amber-600 to-amber-700'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300">
                  <div className="bg-slate-900 rounded-2xl p-8 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white">
                  SG
                </div>
                <span className="text-xl font-black text-white">SellerGenix</span>
              </div>
              <p className="text-slate-500 text-sm">
                AI-Powered Analytics for Amazon Excellence. Built with transparency.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <div className="space-y-3 text-sm">
                <Link href="/features" className="block text-slate-500 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-slate-500 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <div className="space-y-3 text-sm">
                <Link href="/contact" className="block text-slate-500 hover:text-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="space-y-3 text-sm">
                <Link href="/terms" className="block text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/sales-agreement" className="block text-slate-500 hover:text-white transition-colors">Sales Agreement</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} SellerGenix. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>Made with transparency for Amazon Sellers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
