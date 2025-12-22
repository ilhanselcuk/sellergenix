'use client'

/**
 * SettingsClient Component - SellerGenix
 * Client-side settings management with tabs for Account, Company, and Billing
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building2,
  CreditCard,
  Mail,
  Lock,
  Save,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Crown,
  Calendar,
  DollarSign,
  Receipt,
  ChevronRight,
  Settings,
  Shield,
  Bell
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  company_name: string | null
  amazon_seller_id?: string | null
  subscription_tier: string | null
}

interface SettingsClientProps {
  userId: string
  userEmail: string
  profile: Profile | null
}

// Mock billing data
const mockInvoices = [
  { id: 'INV-2024-001', date: '2024-12-01', amount: 39, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-002', date: '2024-11-01', amount: 39, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-003', date: '2024-10-01', amount: 39, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-004', date: '2024-09-01', amount: 19, status: 'paid', plan: 'Starter' },
  { id: 'INV-2024-005', date: '2024-08-01', amount: 19, status: 'paid', plan: 'Starter' },
]

const planFeatures = {
  starter: ['Up to 300 orders/month', 'Basic analytics', 'Email support', '1 Amazon account'],
  professional: ['Up to 1,500 orders/month', 'Advanced analytics', 'Priority support', '3 Amazon accounts', 'AI insights'],
  business: ['Up to 5,000 orders/month', 'Full analytics suite', 'Dedicated support', '10 Amazon accounts', 'AI insights', 'API access'],
  enterprise: ['Unlimited orders', 'Custom analytics', '24/7 support', 'Unlimited accounts', 'AI insights', 'API access', 'Custom integrations'],
}

type TabType = 'account' | 'company' | 'billing'

// Mock payment methods
const initialPaymentMethods = [
  { id: 'pm_1', type: 'visa', last4: '4242', expMonth: 12, expYear: 2025, isDefault: true },
]

export function SettingsClient({ userId, userEmail, profile }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Payment method state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods)
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    cardholderName: ''
  })
  const [isAddingCard, setIsAddingCard] = useState(false)

  // Account form state
  const [accountForm, setAccountForm] = useState({
    fullName: profile?.full_name || '',
    email: userEmail,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: profile?.company_name || '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: ''
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    // In production, this would download the actual invoice PDF
    alert(`Downloading invoice ${invoiceId}...`)
  }

  const handleAddPaymentMethod = async () => {
    setIsAddingCard(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Add new card to list
    const cardType = newCard.cardNumber.startsWith('4') ? 'visa' :
                     newCard.cardNumber.startsWith('5') ? 'mastercard' :
                     newCard.cardNumber.startsWith('3') ? 'amex' : 'card'

    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      type: cardType,
      last4: newCard.cardNumber.slice(-4),
      expMonth: parseInt(newCard.expMonth),
      expYear: parseInt(newCard.expYear),
      isDefault: paymentMethods.length === 0
    }

    setPaymentMethods([...paymentMethods, newPaymentMethod])
    setNewCard({ cardNumber: '', expMonth: '', expYear: '', cvc: '', cardholderName: '' })
    setShowAddPaymentModal(false)
    setIsAddingCard(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleSetDefaultCard = (cardId: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === cardId
    })))
  }

  const handleDeleteCard = (cardId: string) => {
    if (paymentMethods.length === 1) {
      alert('You must have at least one payment method.')
      return
    }
    const updatedMethods = paymentMethods.filter(pm => pm.id !== cardId)
    // If deleted card was default, make first card default
    if (!updatedMethods.some(pm => pm.isDefault) && updatedMethods.length > 0) {
      updatedMethods[0].isDefault = true
    }
    setPaymentMethods(updatedMethods)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa': return '💳 Visa'
      case 'mastercard': return '💳 Mastercard'
      case 'amex': return '💳 Amex'
      default: return '💳 Card'
    }
  }

  const currentPlan = profile?.subscription_tier || 'professional'

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: User, description: 'Email & password' },
    { id: 'company' as TabType, label: 'Company', icon: Building2, description: 'Business info' },
    { id: 'billing' as TabType, label: 'Billing', icon: CreditCard, description: 'Plans & invoices' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-400" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Manage your account, company info, and billing</p>
        </div>

        {/* Save Status */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Changes saved!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-bold">{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.id ? 'text-white/70' : 'text-slate-500'}`}>
                {tab.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-8"
            >
              {/* Profile Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={accountForm.currentPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={accountForm.newPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Company Information
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                This information will appear on your invoices and billing documents.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="123 Main Street, Suite 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="New York"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={companyForm.state}
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={companyForm.zipCode}
                      onChange={(e) => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Country
                  </label>
                  <select
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-8"
            >
              {/* Current Plan */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Current Plan
                </h3>
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-black text-white capitalize">{currentPlan}</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">
                        Your subscription renews on January 1, 2025
                      </p>
                      <ul className="space-y-2">
                        {(planFeatures[currentPlan as keyof typeof planFeatures] || planFeatures.professional).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">
                        ${currentPlan === 'starter' ? 19 : currentPlan === 'professional' ? 39 : currentPlan === 'business' ? 79 : 199}
                      </div>
                      <div className="text-slate-400 text-sm">per month</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors">
                      <Crown className="w-4 h-4" />
                      Upgrade Plan
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold rounded-lg transition-colors">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Payment Methods
                  </h3>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    <span className="text-lg">+</span>
                    Add Payment Method
                  </button>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={`bg-slate-800/50 border rounded-xl p-4 flex items-center justify-between ${
                        pm.isDefault ? 'border-purple-500/50' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-9 rounded flex items-center justify-center ${
                          pm.type === 'visa' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
                          pm.type === 'mastercard' ? 'bg-gradient-to-br from-red-600 to-orange-600' :
                          pm.type === 'amex' ? 'bg-gradient-to-br from-cyan-600 to-blue-600' :
                          'bg-gradient-to-br from-slate-600 to-slate-700'
                        }`}>
                          <span className="text-white text-xs font-bold uppercase">{pm.type}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">•••• •••• •••• {pm.last4}</p>
                            {pm.isDefault && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm">Expires {pm.expMonth}/{pm.expYear}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!pm.isDefault && (
                          <button
                            onClick={() => handleSetDefaultCard(pm.id)}
                            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCard(pm.id)}
                          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {paymentMethods.length === 0 && (
                    <div className="bg-slate-800/50 border border-dashed border-slate-600 rounded-xl p-8 text-center">
                      <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 mb-3">No payment methods added yet</p>
                      <button
                        onClick={() => setShowAddPaymentModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
                      >
                        Add Your First Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Billing History
                </h3>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/80">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Invoice</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Plan</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-white font-mono text-sm">{invoice.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-400 text-sm">
                              {new Date(invoice.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300 text-sm">{invoice.plan}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-white font-semibold">${invoice.amount}.00</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                              invoice.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="flex items-center gap-1 ml-auto px-3 py-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors text-sm font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">Cancel Subscription</p>
                      <p className="text-slate-400 text-sm">
                        Your subscription will remain active until the end of the billing period.
                      </p>
                    </div>
                    <button className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/20 font-semibold rounded-lg transition-colors">
                      Cancel Plan
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Payment Method Modal */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowAddPaymentModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Add Payment Method
                  </h3>
                  <p className="text-white/70 text-sm mt-1">Enter your card details securely</p>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCardNumber(newCard.cardNumber)}
                        onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value.replace(/\s/g, '') })}
                        maxLength={19}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                        placeholder="1234 5678 9012 3456"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] font-bold flex items-center justify-center">VISA</div>
                        <div className="w-8 h-5 bg-red-500 rounded text-white text-[8px] font-bold flex items-center justify-center">MC</div>
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={newCard.cardholderName}
                      onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Expiry & CVC */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        Month
                      </label>
                      <select
                        value={newCard.expMonth}
                        onChange={(e) => setNewCard({ ...newCard, expMonth: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m.toString().padStart(2, '0')}>
                            {m.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        Year
                      </label>
                      <select
                        value={newCard.expYear}
                        onChange={(e) => setNewCard({ ...newCard, expYear: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={y.toString()}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={newCard.cvc}
                        onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        maxLength={4}
                        className="w-full px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-400 text-xs">
                      Your payment information is encrypted and secure. We use Stripe for payment processing.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={isAddingCard || !newCard.cardNumber || !newCard.expMonth || !newCard.expYear || !newCard.cvc}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingCard ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Add Card
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
