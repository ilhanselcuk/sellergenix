import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SellerGenix Brand Colors
        primary: {
          50: '#e6f4ff',
          100: '#bae7ff',
          500: '#0085c3', // Primary Blue
          600: '#006ba3',
          700: '#005182',
          900: '#002c47',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#7ab800', // Success Green
          600: '#62951f',
          700: '#4a7317',
          900: '#365314',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f2af00', // Warning Amber
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#dc5034', // Danger Coral
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        // NEW: Premium Purple Palette 💜
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Primary Purple
          600: '#9333ea', // Deep Purple
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          700: '#334155',
          900: '#0a0f1c', // Dark Primary
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(10, 15, 28, 0.1)',
          purple: 'rgba(168, 85, 247, 0.1)', // Purple glass
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, rgba(0, 133, 195, 0.1) 0%, rgba(122, 184, 0, 0.1) 100%)',
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'fade-in': 'fade-in 1s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-up': 'slide-up 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(0, 133, 195, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(0, 133, 195, 0.6)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
export default config;