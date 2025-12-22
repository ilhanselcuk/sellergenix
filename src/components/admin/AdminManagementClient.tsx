/**
 * Admin Management Client Component
 * Manage admin users, roles, and permissions
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Users,
  CreditCard,
  DollarSign,
  Send,
  Code,
  ChevronDown
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  is_active: boolean
  can_manage_admins: boolean
  can_manage_customers: boolean
  can_view_revenue: boolean
  can_send_emails: boolean
  can_access_api: boolean
  last_login: string | null
  failed_login_attempts: number
  created_at: string
  updated_at: string
}

interface AdminManagementClientProps {
  currentAdmin: AdminUser
  admins: AdminUser[]
}

const roleColors = {
  super_admin: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  support: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  viewer: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
}

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Support',
  viewer: 'Viewer'
}

export function AdminManagementClient({ currentAdmin, admins }: AdminManagementClientProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state for new/edit admin
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'viewer' as AdminUser['role'],
    can_manage_admins: false,
    can_manage_customers: true,
    can_view_revenue: false,
    can_send_emails: false,
    can_access_api: false
  })

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'viewer',
      can_manage_admins: false,
      can_manage_customers: true,
      can_view_revenue: false,
      can_send_emails: false,
      can_access_api: false
    })
    setError('')
  }

  const handleAddAdmin = async () => {
    if (!formData.email || !formData.full_name) {
      setError('Email and name are required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/manage/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create admin')
      }

      setShowAddModal(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/manage/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAdmin.id,
          ...formData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin')
      }

      setEditingAdmin(null)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/manage/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingAdmin.id })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete admin')
      }

      setDeletingAdmin(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      const res = await fetch('/api/admin/manage/toggle-active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: admin.id, is_active: !admin.is_active })
      })

      if (!res.ok) {
        throw new Error('Failed to toggle status')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openEditModal = (admin: AdminUser) => {
    setFormData({
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      can_manage_admins: admin.can_manage_admins,
      can_manage_customers: admin.can_manage_customers,
      can_view_revenue: admin.can_view_revenue,
      can_send_emails: admin.can_send_emails,
      can_access_api: admin.can_access_api
    })
    setEditingAdmin(admin)
    setError('')
  }

  const permissions = [
    { key: 'can_manage_admins', label: 'Manage Admins', icon: Shield, description: 'Add, edit, remove admin users' },
    { key: 'can_manage_customers', label: 'Manage Customers', icon: Users, description: 'View and edit customer data' },
    { key: 'can_view_revenue', label: 'View Revenue', icon: DollarSign, description: 'Access revenue and subscription data' },
    { key: 'can_send_emails', label: 'Send Emails', icon: Send, description: 'Send notification emails to customers' },
    { key: 'can_access_api', label: 'API Access', icon: Code, description: 'Access admin API endpoints' }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-amber-400" />
            Admin Management
          </h1>
          <p className="text-slate-400 mt-1">Manage admin users, roles, and permissions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/25"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = admins.filter(a => a.role === role).length
          const colors = roleColors[role as keyof typeof roleColors]
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className={`text-xs ${colors.text}`}>{label}</p>
                </div>
                <Shield className={`w-8 h-8 ${colors.text} opacity-50`} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Admins Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Admin</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Permissions</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Last Login</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const colors = roleColors[admin.role]
                    const isCurrent = admin.id === currentAdmin.id
                    const activePermissions = permissions.filter(p => admin[p.key as keyof AdminUser])

                    return (
                      <tr
                        key={admin.id}
                        className={`border-b border-slate-800/50 ${isCurrent ? 'bg-purple-500/5' : 'hover:bg-slate-800/30'} transition-colors`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-2">
                                {admin.full_name}
                                {isCurrent && (
                                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text}`}>
                            {roleLabels[admin.role]}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => !isCurrent && handleToggleActive(admin)}
                            disabled={isCurrent}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              admin.is_active
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            } ${isCurrent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            {admin.is_active ? (
                              <><Check className="w-3 h-3" /> Active</>
                            ) : (
                              <><X className="w-3 h-3" /> Inactive</>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {activePermissions.slice(0, 3).map((perm) => (
                              <div
                                key={perm.key}
                                className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center"
                                title={perm.label}
                              >
                                <perm.icon className="w-3 h-3 text-slate-400" />
                              </div>
                            ))}
                            {activePermissions.length > 3 && (
                              <span className="text-xs text-slate-500">+{activePermissions.length - 3}</span>
                            )}
                            {activePermissions.length === 0 && (
                              <span className="text-xs text-slate-600">None</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-slate-500">
                            {admin.last_login
                              ? new Date(admin.last_login).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(admin)}
                              disabled={admin.role === 'super_admin' && !isCurrent}
                              className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </button>
                            {!isCurrent && admin.role !== 'super_admin' && (
                              <button
                                onClick={() => setDeletingAdmin(admin)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingAdmin) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowAddModal(false); setEditingAdmin(null); resetForm() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">
                  {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {editingAdmin ? 'Update admin details and permissions' : 'Create a new admin user'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingAdmin}
                      placeholder="admin@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Role</label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminUser['role'] })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                    >
                      <option value="viewer">Viewer - Read-only access</option>
                      <option value="support">Support - Customer management</option>
                      <option value="admin">Admin - Full management access</option>
                      <option value="super_admin" disabled={!editingAdmin || editingAdmin.role !== 'super_admin'}>
                        Super Admin - All permissions
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-3">Permissions</label>
                  <div className="space-y-2">
                    {permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className={`flex items-center justify-between p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors ${
                          formData[perm.key as keyof typeof formData] ? 'ring-1 ring-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <perm.icon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-bold text-white">{perm.label}</p>
                            <p className="text-xs text-slate-500">{perm.description}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData[perm.key as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowAddModal(false); setEditingAdmin(null); resetForm() }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editingAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeletingAdmin(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Admin</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to delete <span className="font-bold text-white">{deletingAdmin.full_name}</span>?
                They will lose all access to the admin panel.
              </p>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingAdmin(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete Admin'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
