# 🧩 COMPONENTS - SellerGenix Design System

## Button Components

### 1. Primary Button (Gradient)

```tsx
<button className="relative group overflow-hidden px-8 py-4 rounded-xl">
  {/* Gradient Background */}
  <div className="absolute inset-0 bg-gradient-to-r from-[#4285f4] to-[#34a853] rounded-xl"></div>

  {/* Shine Effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-700 -translate-x-full"></div>

  {/* Text */}
  <span className="relative text-white font-bold">Button Text</span>

  {/* Glow */}
  <div className="absolute -inset-1 bg-gradient-to-r from-[#4285f4] to-[#34a853] rounded-xl blur opacity-30 group-hover:opacity-50 -z-10 transition-opacity"></div>
</button>
```

### 2. Secondary Button (Outline)

```tsx
<button className="group relative border-2 border-[#4285f4] text-[#4285f4] px-8 py-4 rounded-xl font-bold hover:bg-[#4285f4] hover:text-white transition-all duration-300">
  Secondary Button
</button>
```

### 3. Simple Button

```tsx
<button className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
  Simple Button
</button>
```

## Card Components

### 1. Basic Card

```tsx
<div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
  <h3 className="text-xl font-bold text-[#343a40] mb-4">Card Title</h3>
  <p className="text-[#6c757d]">Card content goes here.</p>
</div>
```

### 2. Icon Card

```tsx
<div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
  {/* Icon */}
  <div className="w-12 h-12 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center mb-4">
    <span className="text-white text-2xl">🚀</span>
  </div>

  {/* Content */}
  <h3 className="text-xl font-bold text-[#343a40] mb-2">Card Title</h3>
  <p className="text-[#6c757d]">Description text here.</p>
</div>
```

### 3. Gradient Card

```tsx
<div className="group relative bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
  {/* Background Animation */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>

  {/* Content */}
  <div className="relative z-10 text-white">
    <h3 className="text-xl font-bold mb-2">Premium Card</h3>
    <p className="text-blue-100">This is a premium gradient card.</p>
  </div>
</div>
```

### 4. Stat Card (Dashboard)

```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center">
      <span className="text-white text-xl">💰</span>
    </div>
    <button className="text-[#4285f4] hover:text-[#34a853] font-medium text-sm transition-colors">
      View →
    </button>
  </div>

  {/* Content */}
  <h3 className="text-sm font-semibold text-[#6c757d] mb-1">Total Revenue</h3>
  <p className="text-3xl font-bold text-[#343a40]">$12,345</p>
</div>
```

## Input Components

### 1. Text Input

```tsx
<div>
  <label className="block text-sm font-medium text-[#343a40] mb-2">
    Email address
  </label>
  <input
    type="email"
    className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
    placeholder="you@example.com"
  />
</div>
```

### 2. Password Input (with toggle)

```tsx
<div>
  <label className="block text-sm font-medium text-[#343a40] mb-2">
    Password
  </label>
  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      className="w-full px-4 py-3 bg-white border-2 border-[#e5e7eb] rounded-xl text-[#343a40] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all pr-12"
      placeholder="••••••••"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#343a40] transition-colors"
    >
      👁️
    </button>
  </div>
</div>
```

## Badge Components

```tsx
{/* Success Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#34a853] text-white">
  ✓ Active
</span>

{/* Warning Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#fbbc05] text-white">
  ⚠ Pending
</span>

{/* Danger Badge */}
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#ea4335] text-white">
  ✕ Inactive
</span>
```

## Loading States

### Spinner

```tsx
<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4285f4]"></div>
```

### Skeleton

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```
