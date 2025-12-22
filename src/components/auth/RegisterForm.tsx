'use client'

/**
 * Register Form Component
 *
 * Handles user registration with Supabase Auth
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-[#ea4335]/10 border border-[#ea4335]/30 text-[#ea4335] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-[#343a40] mb-2">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-[#34a853] transition-all"
          placeholder="John Doe"
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#343a40] mb-2">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-[#34a853] transition-all"
          placeholder="you@company.com"
          disabled={loading}
        />
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-semibold text-[#343a40] mb-2">
          Company name <span className="text-[#6c757d] text-xs font-normal">(optional)</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          value={formData.companyName}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-[#34a853] transition-all"
          placeholder="Your Company LLC"
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-[#343a40] mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-[#34a853] transition-all pr-12"
            placeholder="••••••••"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#343a40] transition-colors"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-[#6c757d] mt-1">
          Minimum 8 characters
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#343a40] mb-2">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-[#34a853] transition-all"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="group relative overflow-hidden w-full py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#34a853] to-[#137333] rounded-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-700 -translate-x-full"></div>
        <span className="relative text-white font-black text-lg flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </span>
      </button>

      {/* Free trial info */}
      <div className="mt-4 p-3 bg-[#34a853]/10 border border-[#34a853]/30 rounded-xl">
        <p className="text-xs text-[#34a853] flex items-center gap-2 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>14-day free trial • No credit card required</span>
        </p>
      </div>
    </form>
  )
}
