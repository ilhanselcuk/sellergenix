'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Target,
  DollarSign,
  Bell,
  Globe,
  TrendingUp,
  PieChart,
  MessageSquare,
  RefreshCw,
  Lock,
  CheckCircle,
} from 'lucide-react'
import DashboardMockup from '../../../components/landing/DashboardMockup'
import PPCVisualization from '../../../components/landing/PPCVisualization'
import ProfitVisualization from '../../../components/landing/ProfitVisualization'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-time Analytics Dashboard',
      description:
        'Get instant insights into your Amazon business performance with our comprehensive analytics dashboard.',
      details: [
        'Live sales tracking with 15-minute data refresh',
        'Product performance metrics (units sold, revenue, profit margin)',
        'Best Seller Rank (BSR) tracking and trend analysis',
        'Inventory level monitoring with low-stock alerts',
        'Historical data comparison (daily, weekly, monthly, yearly)',
        'Custom date range analysis',
        'Visual charts and graphs for easy interpretation',
        'Export data to CSV/Excel for further analysis',
      ],
      color: 'from-primary-500 to-blue-600',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'PPC Campaign Optimization',
      description:
        'Automate and optimize your Amazon advertising campaigns for maximum ROI and reduced ACOS.',
      details: [
        'Automated bid management based on performance',
        'ACOS optimization with target goals',
        'Break-even ACOS calculation per product',
        'Keyword performance tracking and analysis',
        'Campaign profitability reports',
        'Negative keyword recommendations',
        'Budget allocation optimization',
        'Ad spend tracking and forecasting',
        'A/B testing for ad variations',
      ],
      color: 'from-success-500 to-green-600',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Profit Tracking & Analysis',
      description:
        'Understand your true profitability with accurate cost tracking and margin analysis.',
      details: [
        'Automatic Amazon fee calculation (FBA, referral, storage)',
        'COGS (Cost of Goods Sold) management - constant or period-based',
        'Gross profit and net profit calculations',
        'Profit margin analysis by product and category',
        'ROI (Return on Investment) tracking',
        'Refund impact analysis on profitability',
        'Shipping cost tracking',
        'Monthly P&L (Profit & Loss) reports',
        'Break-even analysis',
      ],
      color: 'from-warning-500 to-amber-600',
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: 'Smart WhatsApp Alerts',
      description:
        'Stay informed with real-time notifications delivered directly to your WhatsApp.',
      details: [
        'Customizable alert thresholds',
        'Low inventory stock warnings',
        'Price change notifications',
        'BSR rank changes',
        'Sales milestones and achievements',
        'Negative review alerts',
        'Buy Box loss notifications',
        'Ad budget overspend warnings',
        'Daily/weekly performance summaries',
      ],
      color: 'from-danger-500 to-red-600',
    },
  ]

  const advancedFeatures = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Multi-Marketplace Support',
      description:
        'Manage multiple Amazon marketplaces from a single dashboard (US, UK, DE, FR, IT, ES, CA, MX, and more).',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Trend Analysis & Forecasting',
      description:
        'AI-powered sales forecasting and trend detection to help you plan inventory and marketing strategies.',
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: 'Portfolio Management',
      description:
        'Manage multiple products and brands with portfolio-level analytics and reporting.',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Customer Review Monitoring',
      description:
        'Track customer reviews and ratings with sentiment analysis and automated alerts for negative feedback.',
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Automated Data Sync',
      description:
        'Seamless integration with Amazon SP-API ensures your data is always up-to-date without manual work.',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Bank-Level Security',
      description:
        'Enterprise-grade encryption, OAuth 2.0 authentication, and GDPR/CCPA compliance to protect your data.',
    },
  ]

  const integrations = [
    {
      name: 'Amazon SP-API',
      description: 'Official Amazon Selling Partner API for real-time data access',
      features: ['Sales data', 'Order information', 'Inventory levels', 'Product listings'],
    },
    {
      name: 'Amazon Advertising API',
      description: 'Direct integration for PPC campaign management',
      features: ['Campaign performance', 'Bid automation', 'Keyword tracking', 'Ad spend data'],
    },
    {
      name: 'Twilio WhatsApp API',
      description: 'Business messaging for instant notifications',
      features: ['Real-time alerts', 'Custom messages', 'Two-way communication', 'Delivery tracking'],
    },
    {
      name: 'Stripe Payment API',
      description: 'Secure payment processing',
      features: ['Subscription billing', 'Invoice management', 'Payment security', 'Fraud protection'],
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
              Powerful Features for
              <br />
              <span className="bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent">
                Amazon Excellence
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Everything you need to monitor, optimize, and grow your Amazon business with AI-powered
              analytics and automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {/* Feature 1: Real-time Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-white">Real-time Analytics Dashboard</h3>
                </div>
                <p className="text-lg text-white/70 mb-6">
                  Get instant insights into your Amazon business performance with our comprehensive analytics dashboard.
                </p>
                <div className="grid gap-3">
                  {mainFeatures[0].details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-600/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <DashboardMockup />
                </div>
              </div>
            </motion.div>

            {/* Feature 2: PPC Optimization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-success-500/20 to-green-600/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <PPCVisualization />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-white">PPC Campaign Optimization</h3>
                </div>
                <p className="text-lg text-white/70 mb-6">
                  Automate and optimize your Amazon advertising campaigns for maximum ROI and reduced ACOS.
                </p>
                <div className="grid gap-3">
                  {mainFeatures[1].details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Profit Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-white">Profit Tracking & Analysis</h3>
                </div>
                <p className="text-lg text-white/70 mb-6">
                  Understand your true profitability with accurate cost tracking and margin analysis.
                </p>
                <div className="grid gap-3">
                  {mainFeatures[2].details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-warning-500/20 to-amber-600/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <ProfitVisualization />
                </div>
              </div>
            </motion.div>

            {/* Feature 4: WhatsApp Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-danger-500/20 to-red-600/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-success-500/10 to-green-600/10 border border-success-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl">📈</span>
                        </div>
                        <div>
                          <p className="text-success-400 font-semibold text-sm">Sales Milestone</p>
                          <p className="text-white/80 text-sm">Congratulations! You hit $10,000 in sales today!</p>
                          <p className="text-white/40 text-xs mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-warning-500/10 to-amber-600/10 border border-warning-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-warning-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl">⚠️</span>
                        </div>
                        <div>
                          <p className="text-warning-400 font-semibold text-sm">Low Stock Alert</p>
                          <p className="text-white/80 text-sm">Product ASIN-XYZ123 has only 12 units left</p>
                          <p className="text-white/40 text-xs mt-1">15 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-primary-500/10 to-blue-600/10 border border-primary-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl">💰</span>
                        </div>
                        <div>
                          <p className="text-primary-400 font-semibold text-sm">Daily Summary</p>
                          <p className="text-white/80 text-sm">Revenue: $3,450 | Orders: 42 | ACOS: 18%</p>
                          <p className="text-white/40 text-xs mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-danger-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-white">Smart WhatsApp Alerts</h3>
                </div>
                <p className="text-lg text-white/70 mb-6">
                  Stay informed with real-time notifications delivered directly to your WhatsApp.
                </p>
                <div className="grid gap-3">
                  {mainFeatures[3].details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Advanced Capabilities</h2>
            <p className="text-xl text-white/60">
              Additional features to take your Amazon business to the next level
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-success-500/20 rounded-lg flex items-center justify-center text-primary-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Seamless Integrations</h2>
            <p className="text-xl text-white/60">
              Direct integrations with essential services for your Amazon business
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white/5 to-primary-500/5 backdrop-blur-xl border border-white/10 rounded-xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-2">{integration.name}</h3>
                <p className="text-white/60 mb-6">{integration.description}</p>
                <div className="space-y-2">
                  {integration.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                      <span className="text-white/80 text-sm">{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-white/60">Platform Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent mb-2">
                15min
              </div>
              <div className="text-white/60">Data Refresh Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent mb-2">
                &lt;5min
              </div>
              <div className="text-white/60">Alert Delivery Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent mb-2">
                2 years
              </div>
              <div className="text-white/60">Data Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Amazon Business?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-success-500 hover:from-primary-600 hover:to-success-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 hover:scale-105 transition-all duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
            >
              Contact Sales
            </Link>
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
