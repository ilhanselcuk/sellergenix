/**
 * Admin Sidebar Component
 * Navigation for admin panel with role-based visibility
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Mail,
  Shield,
  ScrollText,
  Settings,
  Bell,
  TrendingUp,
  Package,
  Activity,
  ChevronRight
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  can_manage_admins: boolean
  can_manage_customers: boolean
  can_view_revenue: boolean
  can_send_emails: boolean
  can_view_audit_logs: boolean
  can_modify_settings: boolean
}

interface AdminSidebarProps {
  admin: AdminUser
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null // Everyone can see
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    permission: 'can_manage_customers'
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
    permission: 'can_view_revenue'
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: Receipt,
    permission: 'can_view_revenue'
  },
  {
    name: 'Revenue Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    permission: 'can_view_revenue'
  },
  {
    name: 'Email Center',
    href: '/admin/emails',
    icon: Mail,
    permission: 'can_send_emails'
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: Bell,
    permission: 'can_send_emails'
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ScrollText,
    permission: 'can_view_audit_logs'
  },
  {
    name: 'Admin Users',
    href: '/admin/admins',
    icon: Shield,
    permission: 'can_manage_admins'
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'can_modify_settings'
  }
]

const systemHealthItems = [
  {
    name: 'Amazon Connections',
    href: '/admin/amazon',
    icon: Package
  },
  {
    name: 'System Health',
    href: '/admin/health',
    icon: Activity
  }
]

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()

  const hasPermission = (permission: string | null): boolean => {
    if (!permission) return true
    if (admin.role === 'super_admin') return true
    return admin[permission as keyof AdminUser] === true
  }

  const isActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-lg font-black text-white">SG</span>
          </div>
          <div>
            <span className="text-lg font-black text-white">SellerGenix</span>
            <p className="text-xs text-slate-500">Admin Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
          Main Menu
        </div>

        {navigationItems.map((item) => {
          if (!hasPermission(item.permission)) return null

          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
              <span className="flex-1">{item.name}</span>
              {active && <ChevronRight className="w-4 h-4 text-purple-400" />}
            </Link>
          )
        })}

        {/* System Section */}
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-3 px-3">
          System
        </div>

        {systemHealthItems.map((item) => {
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
              <span className="flex-1">{item.name}</span>
              {active && <ChevronRight className="w-4 h-4 text-purple-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Admin Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{admin.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{admin.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
