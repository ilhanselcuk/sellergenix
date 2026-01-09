'use client'

/**
 * Register Form Component - Premium Dark Theme
 *
 * Handles user registration with Supabase Auth
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, User, Building, Loader2, Check } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (!data.user) {
        throw new Error('Failed to create account')
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicators
  const passwordLength = formData.password.length >= 8
  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-500 text-xs">!</span>
          </div>
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-[#6c757d] mb-2">
          Full name
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d]">
            <User className="w-5 h-5" />
          </div>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34a853]/50 focus:border-[#34a853] transition-all hover:border-gray-400"
            style={{ color: '#1f2937', WebkitTextFillColor: '#1f2937' }}
            placeholder="John Doe"
            disabled={loading}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#6c757d] mb-2">
          Email address
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d]">
            <Mail className="w-5 h-5" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34a853]/50 focus:border-[#34a853] transition-all hover:border-gray-400"
            style={{ color: '#1f2937', WebkitTextFillColor: '#1f2937' }}
            placeholder="you@company.com"
            disabled={loading}
          />
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-semibold text-[#6c757d] mb-2">
          Company name <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d]">
            <Building className="w-5 h-5" />
          </div>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34a853]/50 focus:border-[#34a853] transition-all hover:border-gray-400"
            style={{ color: '#1f2937', WebkitTextFillColor: '#1f2937' }}
            placeholder="Your Company LLC"
            disabled={loading}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-[#6c757d] mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d]">
            <Lock className="w-5 h-5" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34a853]/50 focus:border-[#34a853] transition-all hover:border-gray-400"
            style={{ color: '#1f2937', WebkitTextFillColor: '#1f2937' }}
            placeholder="••••••••"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#343a40] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {/* Password strength indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 text-xs ${passwordLength ? 'text-[#34a853]' : 'text-[#6c757d]'}`}>
            <Check className={`w-3 h-3 ${passwordLength ? 'opacity-100' : 'opacity-50'}`} />
            <span>8+ characters</span>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#6c757d] mb-2">
          Confirm password
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c757d]">
            <Lock className="w-5 h-5" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all hover:border-gray-400 ${
              formData.confirmPassword.length > 0
                ? passwordMatch
                  ? 'border-[#34a853] focus:ring-[#34a853]/50 focus:border-[#34a853]'
                  : 'border-red-400 focus:ring-red-400/50 focus:border-red-400'
                : 'border-gray-300 focus:ring-[#34a853]/50 focus:border-[#34a853]'
            }`}
            style={{ color: '#1f2937', WebkitTextFillColor: '#1f2937' }}
            placeholder="••••••••"
            disabled={loading}
          />
          {formData.confirmPassword.length > 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {passwordMatch ? (
                <Check className="w-5 h-5 text-[#34a853]" />
              ) : (
                <span className="text-red-500 text-xs font-bold">✕</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !passwordLength || !passwordMatch}
        className="group relative overflow-hidden w-full py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#34a853] via-emerald-600 to-[#137333] rounded-xl"></div>

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-700 -translate-x-full"></div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(52,168,83,0.5)]"></div>

        <span className="relative text-white font-black text-lg flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </span>
      </button>
    </form>
  )
}
