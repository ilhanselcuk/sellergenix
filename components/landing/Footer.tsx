'use client'

import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-white/10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-white">SellerGenix</span>
            </div>
            <p className="text-white/60 leading-relaxed mb-4">
              AI-powered Amazon analytics platform for smart sellers who want to scale their business efficiently.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                📧
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                📱
              </a>
              <a href="#" className="text-white/40 hover:text-white transition-colors">
                🐦
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/sales-agreement" className="text-white/60 hover:text-white transition-colors">Sales Agreement</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/40 text-sm mb-4 md:mb-0">
              <p>&copy; 2025 MENTOREIS LLC. All rights reserved.</p>
              <p className="mt-1">2501 Chatham Road, STE 5143, Springfield, IL 62704, United States</p>
            </div>
            <div className="text-white/40 text-sm">
              <p>Phone: +1 (206) 312-8915</p>
              <p>Email: media@mentoreis.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer