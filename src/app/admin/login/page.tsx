/**
 * Admin Login Page
 * Separate authentication from regular users
 * Premium dark theme matching main site
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

type Step = 'email' | 'password' | 'set-password'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string>('')

  // Step 1: Check email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, checkOnly: true })
      })

      const data = await response.json()

      if (data.isFirstLogin) {
        setAdminId(data.adminId)
        setAdminName(data.adminName || '')
        setStep('set-password')
        return
      }

      if (data.requiresPassword) {
        setAdminName(data.adminName || '')
        setStep('password')
        return
      }

      if (!response.ok) {
        setError(data.error || 'Email not found')
        return
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Login with password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Successful login - redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Set new password (first login)
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password: newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to set password')
        return
      }

      // Password set successfully - redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    setStep('email')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            {step === 'email' && 'Admin Portal'}
            {step === 'password' && 'Welcome Back'}
            {step === 'set-password' && 'Set Your Password'}
          </h1>
          <p className="text-slate-400">
            {step === 'email' && 'Enter your admin email to continue'}
            {step === 'password' && `Sign in as ${adminName || email}`}
            {step === 'set-password' && 'Create a secure password for your account'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-slate-800/20 rounded-2xl p-px">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleCheckEmail} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sellergenix.io"
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Password */}
            {step === 'password' && (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email display */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(adminName || email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{adminName || 'Admin'}</p>
                    <p className="text-xs text-slate-500 truncate">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoFocus
                      className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 3: Set Password */}
            {step === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
                    <KeyRound className="w-4 h-4" />
                    First Time Login
                  </div>
                  <p className="text-amber-400/80 text-sm">
                    Welcome, {adminName || 'Admin'}! Please create a secure password.
                  </p>
                </div>

                {/* Email display */}
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-300">{email}</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      autoFocus
                      minLength={8}
                      className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1/4 h-1 rounded ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <div className={`w-1/4 h-1 rounded ${newPassword.length >= 10 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <div className={`w-1/4 h-1 rounded ${/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <div className={`w-1/4 h-1 rounded ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Use 8+ characters with uppercase, numbers, and symbols
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      Set Password & Continue
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            SellerGenix Admin Portal
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  )
}
