'use client'

/**
 * SettingsClient Component - SellerGenix
 * Client-side settings management with tabs for Account, Company, and Billing
 * Clean Light Theme
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
  Bell,
  ShoppingBag,
  Link,
  Unlink,
  RefreshCw,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react'
import {
  connectWithManualTokenAction,
  getAmazonConnectionAction,
  disconnectAmazonAction,
  testAmazonConnectionAction,
  syncProductsAction
} from '@/app/actions/amazon-actions'
import SyncStatusIndicator from '@/components/dashboard/SyncStatusIndicator'

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

type TabType = 'account' | 'company' | 'billing' | 'amazon'

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

  // Amazon connection state
  const [amazonConnection, setAmazonConnection] = useState<any>(null)
  const [amazonLoading, setAmazonLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [amazonError, setAmazonError] = useState<string | null>(null)
  const [amazonSuccess, setAmazonSuccess] = useState<string | null>(null)
  const [showTokenInput, setShowTokenInput] = useState(false)

  // Load Amazon connection on mount
  React.useEffect(() => {
    loadAmazonConnection()
  }, [])

  const loadAmazonConnection = async () => {
    setAmazonLoading(true)
    const result = await getAmazonConnectionAction(userId)
    if (result.success && result.connection) {
      setAmazonConnection(result.connection)
    }
    setAmazonLoading(false)
  }

  const handleConnectAmazon = async () => {
    if (!refreshToken.trim()) {
      setAmazonError('Please enter your refresh token')
      return
    }
    setIsConnecting(true)
    setAmazonError(null)
    setAmazonSuccess(null)

    const result = await connectWithManualTokenAction(userId, refreshToken.trim())

    if (result.success && result.connection) {
      setAmazonConnection(result.connection)
      setAmazonSuccess('Amazon account connected successfully! Syncing 2 years of data in background...')
      setRefreshToken('')
      setShowTokenInput(false)
    } else {
      setAmazonError(result.error || 'Failed to connect Amazon account')
    }
    setIsConnecting(false)
  }

  const handleDisconnectAmazon = async () => {
    if (!confirm('Are you sure you want to disconnect your Amazon account? All synced data will be preserved.')) {
      return
    }
    setAmazonLoading(true)
    const result = await disconnectAmazonAction(userId)
    if (result.success) {
      setAmazonConnection(null)
      setAmazonSuccess('Amazon account disconnected')
    } else {
      setAmazonError(result.error || 'Failed to disconnect')
    }
    setAmazonLoading(false)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setAmazonError(null)
    const result = await testAmazonConnectionAction(userId)
    if (result.success) {
      setAmazonSuccess('Connection is working!')
      loadAmazonConnection()
    } else {
      setAmazonError(result.error || 'Connection test failed')
    }
    setIsTesting(false)
  }

  const handleSyncProducts = async () => {
    setIsSyncing(true)
    setAmazonError(null)
    setAmazonSuccess(null)
    const result = await syncProductsAction(userId)
    if (result.success) {
      setAmazonSuccess(`Synced ${result.productsSync || 0} products successfully!`)
    } else {
      setAmazonError(result.error || 'Sync failed')
    }
    setIsSyncing(false)
  }

  const handleSyncOrdersAndProducts = async () => {
    setIsSyncing(true)
    setAmazonError(null)
    setAmazonSuccess(null)

    try {
      // Use async API - returns immediately, sync runs in background
      const response = await fetch('/api/sync/start', { method: 'POST' })
      const result = await response.json()

      if (result.success) {
        setAmazonSuccess('Sync started! Check the progress indicator in the bottom-right corner.')
        // Don't wait for completion - sync runs in background
        // User can close the page and data will still sync
      } else {
        setAmazonError(result.error || 'Failed to start sync')
      }
    } catch (error) {
      setAmazonError(error instanceof Error ? error.message : 'Failed to start sync')
    }

    setIsSyncing(false)
  }

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
      case 'visa': return 'Visa'
      case 'mastercard': return 'Mastercard'
      case 'amex': return 'Amex'
      default: return 'Card'
    }
  }

  const currentPlan = profile?.subscription_tier || 'professional'

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: User, description: 'Email & password' },
    { id: 'amazon' as TabType, label: 'Amazon', icon: ShoppingBag, description: 'Connect store' },
    { id: 'company' as TabType, label: 'Company', icon: Building2, description: 'Business info' },
    { id: 'billing' as TabType, label: 'Billing', icon: CreditCard, description: 'Plans & invoices' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your account, company info, and billing</p>
        </div>

        {/* Save Status */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Changes saved!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-bold">{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.id ? 'text-gray-500' : 'text-gray-400'}`}>
                {tab.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={accountForm.currentPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={accountForm.newPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        placeholder="********"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="********"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Amazon Tab */}
          {activeTab === 'amazon' && (
            <motion.div
              key="amazon"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Amazon Seller Central Connection
              </h3>

              {/* Status Messages */}
              <AnimatePresence>
                {amazonError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{amazonError}</p>
                    <button onClick={() => setAmazonError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
                  </motion.div>
                )}
                {amazonSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-emerald-700 text-sm">{amazonSuccess}</p>
                    <button onClick={() => setAmazonSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">×</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {amazonLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : amazonConnection ? (
                /* Connected State */
                <div className="space-y-6">
                  {/* Connection Status Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <ShoppingBag className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-black text-gray-900">Amazon Connected</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">
                              {amazonConnection.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">Seller ID: <span className="font-mono">{amazonConnection.seller_id || 'N/A'}</span></p>
                          <p className="text-gray-500 text-sm">Marketplaces: {amazonConnection.marketplace_ids?.length || 0} connected</p>
                          {amazonConnection.last_sync_at && (
                            <p className="text-gray-400 text-xs mt-1">
                              Last sync: {new Date(amazonConnection.last_sync_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-emerald-200">
                      <button
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Test Connection
                      </button>
                      <button
                        onClick={handleSyncOrdersAndProducts}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Sync Orders & Products
                      </button>
                      <button
                        onClick={handleDisconnectAmazon}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors ml-auto"
                      >
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Marketplace List */}
                  {amazonConnection.marketplace_ids && amazonConnection.marketplace_ids.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Connected Marketplaces</h4>
                      <div className="flex flex-wrap gap-2">
                        {amazonConnection.marketplace_ids.map((id: string) => (
                          <span key={id} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-600">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Connected State */
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-orange-500" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Connect Your Amazon Account</h4>
                    <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                      Connect your Amazon Seller Central account to sync your products, orders, and sales data automatically.
                    </p>

                    {!showTokenInput ? (
                      <button
                        onClick={() => setShowTokenInput(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      >
                        <Link className="w-5 h-5" />
                        Connect Amazon Account
                      </button>
                    ) : (
                      <div className="max-w-lg mx-auto text-left space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-bold text-blue-800 mb-2">How to get your Refresh Token:</h5>
                          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Go to Amazon Solution Provider Portal</li>
                            <li>Find &quot;SellerGenix&quot; app</li>
                            <li>Click &quot;Authorize app&quot;</li>
                            <li>Copy the refresh token</li>
                          </ol>
                          <a
                            href="https://sellercentral.amazon.com/apps/manage"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold mt-2"
                          >
                            Open Seller Central Apps <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Refresh Token</label>
                          <textarea
                            value={refreshToken}
                            onChange={(e) => setRefreshToken(e.target.value)}
                            placeholder="Paste your refresh token here (starts with Atzr|...)"
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono text-sm"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => { setShowTokenInput(false); setRefreshToken(''); }}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-600 hover:text-gray-900 font-semibold rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConnectAmazon}
                            disabled={isConnecting || !refreshToken.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Link className="w-5 h-5" />
                                Connect
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Company Information
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                This information will appear on your invoices and billing documents.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="123 Main Street, Suite 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    placeholder="New York"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={companyForm.state}
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={companyForm.zipCode}
                      onChange={(e) => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Country
                  </label>
                  <select
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
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
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Current Plan
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-black text-gray-900 capitalize">{currentPlan}</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4">
                        Your subscription renews on January 1, 2025
                      </p>
                      <ul className="space-y-2">
                        {(planFeatures[currentPlan as keyof typeof planFeatures] || planFeatures.professional).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-gray-900">
                        ${currentPlan === 'starter' ? 19 : currentPlan === 'professional' ? 39 : currentPlan === 'business' ? 79 : 199}
                      </div>
                      <div className="text-gray-500 text-sm">per month</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6 pt-6 border-t border-blue-200">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors">
                      <Crown className="w-4 h-4" />
                      Upgrade Plan
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 font-semibold rounded-lg transition-colors">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Methods
                  </h3>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                  >
                    <span className="text-lg">+</span>
                    Add Payment Method
                  </button>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={`bg-gray-50 border rounded-xl p-4 flex items-center justify-between ${
                        pm.isDefault ? 'border-blue-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-9 rounded flex items-center justify-center ${
                          pm.type === 'visa' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
                          pm.type === 'mastercard' ? 'bg-gradient-to-br from-red-600 to-orange-600' :
                          pm.type === 'amex' ? 'bg-gradient-to-br from-cyan-600 to-blue-600' :
                          'bg-gradient-to-br from-gray-600 to-gray-700'
                        }`}>
                          <span className="text-white text-xs font-bold uppercase">{pm.type}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-semibold">**** **** **** {pm.last4}</p>
                            {pm.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">Expires {pm.expMonth}/{pm.expYear}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!pm.isDefault && (
                          <button
                            onClick={() => handleSetDefaultCard(pm.id)}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCard(pm.id)}
                          className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {paymentMethods.length === 0 && (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-3">No payment methods added yet</p>
                      <button
                        onClick={() => setShowAddPaymentModal(true)}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                      >
                        Add Your First Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Billing History
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Invoice</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-gray-900 font-mono text-sm">{invoice.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-500 text-sm">
                              {new Date(invoice.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600 text-sm">{invoice.plan}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-900 font-semibold">${invoice.amount}.00</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                              invoice.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="flex items-center gap-1 ml-auto px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold"
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
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-semibold">Cancel Subscription</p>
                      <p className="text-gray-500 text-sm">
                        Your subscription will remain active until the end of the billing period.
                      </p>
                    </div>
                    <button className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-100 font-semibold rounded-lg transition-colors">
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowAddPaymentModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gray-900">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Add Payment Method
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Enter your card details securely</p>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCardNumber(newCard.cardNumber)}
                        onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value.replace(/\s/g, '') })}
                        maxLength={19}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-mono"
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
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={newCard.cardholderName}
                      onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Expiry & CVC */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Month
                      </label>
                      <select
                        value={newCard.expMonth}
                        onChange={(e) => setNewCard({ ...newCard, expMonth: e.target.value })}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
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
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Year
                      </label>
                      <select
                        value={newCard.expYear}
                        onChange={(e) => setNewCard({ ...newCard, expYear: e.target.value })}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
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
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={newCard.cvc}
                        onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        maxLength={4}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-mono"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-emerald-700 text-xs">
                      Your payment information is encrypted and secure. We use Stripe for payment processing.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={isAddingCard || !newCard.cardNumber || !newCard.expMonth || !newCard.expYear || !newCard.cvc}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Sync Status Indicator */}
      <SyncStatusIndicator />
    </div>
  )
}
