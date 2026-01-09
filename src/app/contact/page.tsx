/**
 * Contact Page - SellerGenix
 * Premium Dark Theme - Matching other pages
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, ArrowRight, Sparkles, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: 'general',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: 'general',
        message: '',
      })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
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
              <Link href="/pricing" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="text-white font-semibold">
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
                className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-white font-semibold"
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
      <section className="relative z-10 pt-32 pb-16">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">We respond within 24 hours</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">Get in</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Have questions? Need a custom enterprise solution? Our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-px">
                  <div className="bg-slate-900 rounded-2xl p-8">
                    <h2 className="text-2xl font-black text-white mb-6">Contact Information</h2>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold mb-1">Email</h3>
                          <a
                            href="mailto:info@sellergenix.io"
                            className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                          >
                            info@sellergenix.io
                          </a>
                          <p className="text-slate-500 text-sm mt-1">24-hour response time</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold mb-1">Phone</h3>
                          <a
                            href="tel:+12063128915"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                          >
                            +1 (206) 312-8915
                          </a>
                          <p className="text-slate-500 text-sm mt-1">Mon-Fri, 9:00 AM - 5:00 PM EST</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold mb-1">Address</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            MENTOREIS LLC
                            <br />
                            2501 Chatham Road, STE 5143
                            <br />
                            Springfield, IL 62704
                            <br />
                            United States
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold mb-1">Business Hours</h3>
                          <p className="text-slate-400 text-sm">
                            Monday - Friday: 9:00 AM - 5:00 PM EST
                            <br />
                            Saturday - Sunday: Closed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Support Response Times */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 rounded-2xl p-px">
                  <div className="bg-slate-900 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-white mb-4">Support Response Times</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email Support:</span>
                        <span className="text-white font-bold">24 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone Support:</span>
                        <span className="text-white font-bold">Immediate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Enterprise:</span>
                        <span className="text-emerald-400 font-bold">2 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px">
                  <div className="bg-slate-900 rounded-2xl p-8">
                    <h2 className="text-2xl font-black text-white mb-6">Send us a Message</h2>

                    {submitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Send className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Message Sent!</h3>
                        <p className="text-slate-400">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="name" className="block text-white text-sm font-bold mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              required
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              placeholder="John Doe"
                            />
                          </div>

                          <div>
                            <label htmlFor="email" className="block text-white text-sm font-bold mb-2">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="company" className="block text-white text-sm font-bold mb-2">
                              Company Name
                            </label>
                            <input
                              type="text"
                              id="company"
                              name="company"
                              value={formData.company}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              placeholder="Your Company"
                            />
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-white text-sm font-bold mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="subject" className="block text-white text-sm font-bold mb-2">
                            Subject *
                          </label>
                          <select
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          >
                            <option value="general">General Inquiry</option>
                            <option value="sales">Sales & Pricing</option>
                            <option value="enterprise">Enterprise Quote Request</option>
                            <option value="support">Technical Support</option>
                            <option value="partnership">Partnership</option>
                            <option value="feedback">Feedback</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="message" className="block text-white text-sm font-bold mb-2">
                            Message *
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            required
                            rows={6}
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                            placeholder="Tell us about your needs..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Send Message
                            </>
                          )}
                        </button>

                        <p className="text-slate-500 text-sm">
                          * Required fields. We typically respond within 24 hours during business days.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Quote Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20 rounded-3xl p-px">
              <div className="bg-slate-900 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Need an Enterprise Quote?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                  For businesses with more than 500 products or requiring custom features, our Enterprise
                  plan offers unlimited scalability, dedicated support, and tailored solutions.
                </p>
                <div className="space-y-4">
                  <p className="text-white font-medium">
                    <strong>Enterprise features include:</strong>
                  </p>
                  <p className="text-slate-400">
                    Unlimited products • Custom analytics • Dedicated account manager • 24/7 priority support
                  </p>
                  <p className="text-purple-400 font-bold">
                    Select &quot;Enterprise Quote Request&quot; in the form above to get started
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
