/**
 * Email Notification Client Component
 * Send emails to customers, view history, manage templates
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Send,
  Users,
  Search,
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Plus
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_send_emails: boolean
}

interface Customer {
  id: string
  email: string
  full_name: string | null
  subscription_tier: string
  subscription_status: string
}

interface EmailLog {
  id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  template_id: string | null
  status: 'sent' | 'failed' | 'pending' | 'bounced'
  error_message: string | null
  created_at: string
  sent_at: string | null
  sent_by_admin_id: string | null
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
  category: string
  variables: string[]
  is_active: boolean
}

interface EmailNotificationClientProps {
  admin: AdminUser
  customers: Customer[]
  emailLogs: EmailLog[]
  templates: EmailTemplate[]
}

export function EmailNotificationClient({
  admin,
  customers,
  emailLogs,
  templates
}: EmailNotificationClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Email compose state
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          customer.email.toLowerCase().includes(query) ||
          customer.full_name?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Tier filter
      if (filterTier !== 'all' && customer.subscription_tier !== filterTier) {
        return false
      }

      // Status filter
      if (filterStatus !== 'all' && customer.subscription_status !== filterStatus) {
        return false
      }

      return true
    })
  }, [customers, searchQuery, filterTier, filterStatus])

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(customerId)) {
        newSet.delete(customerId)
      } else {
        newSet.add(customerId)
      }
      return newSet
    })
  }

  const selectAllFiltered = () => {
    const allIds = new Set(filteredCustomers.map(c => c.id))
    setSelectedCustomers(allIds)
  }

  const clearSelection = () => {
    setSelectedCustomers(new Set())
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setEmailSubject(template.subject)
      setEmailBody(template.body_text)
    }
  }

  const sendEmails = async () => {
    if (selectedCustomers.size === 0) {
      setError('Please select at least one recipient')
      return
    }

    if (!emailSubject || !emailBody) {
      setError('Subject and message are required')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const recipients = customers.filter(c => selectedCustomers.has(c.id))

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({ id: r.id, email: r.email, name: r.full_name })),
          subject: emailSubject,
          body: emailBody,
          templateId: selectedTemplate || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      setSuccess(`Successfully queued ${recipients.length} email(s) for delivery`)
      setSelectedCustomers(new Set())
      setEmailSubject('')
      setEmailBody('')
      setSelectedTemplate('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-400" />
            Email Notifications
          </h1>
          <p className="text-slate-400 mt-1">Send emails to customers and manage templates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1 w-fit">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'templates', label: 'Templates', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3"
        >
          <XCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipients Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px h-full">
              <div className="bg-slate-900 rounded-2xl p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Select Recipients
                  </h2>
                  <span className="text-sm text-purple-400 font-bold">
                    {selectedCustomers.size} selected
                  </span>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Plans</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={selectAllFiltered}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Select All ({filteredCustomers.length})
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear Selection
                  </button>
                </div>

                {/* Customer List */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                  {filteredCustomers.map((customer) => (
                    <label
                      key={customer.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCustomers.has(customer.id)
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {customer.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{customer.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        customer.subscription_tier === 'enterprise'
                          ? 'bg-amber-500/20 text-amber-400'
                          : customer.subscription_tier === 'professional'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {customer.subscription_tier}
                      </span>
                    </label>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500">No customers found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compose Email */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-px h-full">
              <div className="bg-slate-900 rounded-2xl p-6 h-full flex flex-col">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-400" />
                  Compose Email
                </h2>

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-400 mb-2">
                      Use Template (Optional)
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => applyTemplate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select a template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject line..."
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Body */}
                <div className="flex-1 mb-4">
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your email message here..."
                    className="w-full h-full min-h-[200px] px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Variables Help */}
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {['{name}', '{email}', '{plan}'].map((v) => (
                      <code key={v} className="px-2 py-0.5 bg-slate-700 text-purple-400 rounded text-xs">
                        {v}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={sendEmails}
                  disabled={isLoading || selectedCustomers.size === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send to {selectedCustomers.size} Recipient{selectedCustomers.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Recipient</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Subject</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.length > 0 ? (
                      emailLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <span className={`text-xs font-bold ${
                                log.status === 'sent' ? 'text-emerald-400' :
                                log.status === 'failed' || log.status === 'bounced' ? 'text-red-400' :
                                'text-amber-400'
                              }`}>
                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-bold text-white">{log.recipient_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{log.recipient_email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-white truncate max-w-xs">{log.subject}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-xs text-slate-500">
                              {log.sent_at
                                ? new Date(log.sent_at).toLocaleString()
                                : new Date(log.created_at).toLocaleString()
                              }
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500">No emails sent yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Email Templates</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-bold transition-all">
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>

              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{template.name}</h3>
                          <span className="text-xs text-slate-500">{template.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-slate-700 rounded transition-colors">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 hover:bg-slate-700 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.subject}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 3).map((v) => (
                          <span key={v} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No templates created yet</p>
                  <p className="text-sm text-slate-600 mt-1">Create templates to speed up email composition</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
