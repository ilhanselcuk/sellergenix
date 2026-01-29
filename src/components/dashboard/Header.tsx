'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

interface HeaderProps {
  userName?: string
  userEmail?: string
  userImage?: string
}

export default function Header({ userName = 'User', userEmail = '', userImage }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, title: 'Low stock alert', message: 'Turkish Delight 16oz is running low', time: '5m ago', unread: true },
    { id: 2, title: 'New order', message: 'You received 3 new orders', time: '1h ago', unread: true },
    { id: 3, title: 'ACOS improved', message: 'Your ACOS dropped by 5%', time: '2h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: STARBUCKS.white,
        borderBottom: `1px solid ${STARBUCKS.lightGreen}`
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="SellerGenix"
                width={140}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Navigation - Starbucks Theme */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  color: STARBUCKS.white,
                  background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/analytics"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: STARBUCKS.primaryGreen,
                  backgroundColor: 'transparent'
                }}
              >
                Analytics
              </Link>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: STARBUCKS.primaryGreen,
                  backgroundColor: 'transparent'
                }}
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowUserMenu(false)
                }}
                className="relative p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: STARBUCKS.primaryGreen }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: STARBUCKS.gold }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown - Starbucks Theme */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg py-2 z-50"
                  style={{
                    backgroundColor: STARBUCKS.white,
                    border: `1px solid ${STARBUCKS.lightGreen}`
                  }}
                >
                  <div
                    className="px-4 py-2"
                    style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: notification.unread ? `${STARBUCKS.lightGreen}50` : 'transparent'
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span
                              className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: STARBUCKS.primaryGreen }}
                            />
                          )}
                          <div className={notification.unread ? '' : 'ml-5'}>
                            <p className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>{notification.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: STARBUCKS.primaryGreen }}>{notification.message}</p>
                            <p className="text-xs mt-1" style={{ color: `${STARBUCKS.primaryGreen}80` }}>{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="px-4 py-2"
                    style={{ borderTop: `1px solid ${STARBUCKS.lightGreen}` }}
                  >
                    <button
                      className="text-sm font-medium hover:opacity-80"
                      style={{ color: STARBUCKS.primaryGreen }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:opacity-80"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: STARBUCKS.primaryGreen }} />
              </button>

              {/* User dropdown - Starbucks Theme */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-2 z-50"
                  style={{
                    backgroundColor: STARBUCKS.white,
                    border: `1px solid ${STARBUCKS.lightGreen}`
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
                  >
                    <p className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>{userName}</p>
                    {userEmail && (
                      <p className="text-xs mt-0.5" style={{ color: STARBUCKS.primaryGreen }}>{userEmail}</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-80"
                      style={{ color: STARBUCKS.primaryGreen }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {/* TODO: Logout */}}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
