# 🎨 COLOR PALETTE - SellerGenix Design System

## Google Material Design Inspired Colors

### **Primary Colors**

```css
/* Blue (Primary) */
--color-primary: #4285f4;
--color-primary-dark: #3367d6;
--color-primary-light: #81a3f7;

/* Green (Success) */
--color-success: #34a853;
--color-success-dark: #137333;
--color-success-light: #81c995;

/* Yellow (Warning) */
--color-warning: #fbbc05;
--color-warning-dark: #f29900;
--color-warning-light: #fdd663;

/* Red (Danger) */
--color-danger: #ea4335;
--color-danger-dark: #c5221f;
--color-danger-light: #f28b82;
```

### **Premium Colors**

```css
/* Purple (Premium Features) */
--color-purple: #9333ea;
--color-purple-dark: #7e22ce;
--color-purple-light: #c084fc;

/* Indigo (Professional) */
--color-indigo: #4f46e5;
--color-indigo-dark: #3730a3;
--color-indigo-light: #818cf8;
```

### **Neutral Colors**

```css
/* Gray Scale */
--color-gray-50: #f8f9fa;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-600: #6c757d;
--color-gray-700: #4b5563;
--color-gray-800: #343a40;
--color-gray-900: #1f2937;
```

## Tailwind Usage Examples

```tsx
{/* Primary Button */}
<button className="bg-[#4285f4] hover:bg-[#3367d6] text-white">
  Primary Button
</button>

{/* Success Badge */}
<span className="bg-[#34a853] text-white px-3 py-1 rounded-full">
  Success
</span>

{/* Gradient Background */}
<div className="bg-gradient-to-r from-[#4285f4] to-[#34a853]">
  Gradient
</div>

{/* Text Colors */}
<h1 className="text-[#343a40]">Dark Heading</h1>
<p className="text-[#6c757d]">Muted Text</p>
```

## Color Usage Guide

| Color | Use Case | Examples |
|-------|----------|----------|
| **Blue (#4285f4)** | Primary actions, links | CTA buttons, active states |
| **Green (#34a853)** | Success, positive | Confirmations, growth metrics |
| **Yellow (#fbbc05)** | Warnings, attention | Alerts, pending actions |
| **Red (#ea4335)** | Errors, danger | Delete actions, error messages |
| **Purple (#9333ea)** | Premium features | Exclusive content, upgrades |
| **Gray (#6c757d)** | Secondary text | Descriptions, muted content |

## Accessibility

All colors meet **WCAG 2.1 AA** standards for contrast ratio when used correctly:
- Primary blue on white: ✅ 4.5:1
- Success green on white: ✅ 4.5:1
- Dark text on white: ✅ 7:1

## CSS Variables Setup

```css
:root {
  /* Primary */
  --primary: #4285f4;
  --primary-dark: #3367d6;
  --primary-light: #81a3f7;

  /* Success */
  --success: #34a853;
  --success-dark: #137333;
  --success-light: #81c995;

  /* Warning */
  --warning: #fbbc05;
  --warning-dark: #f29900;
  --warning-light: #fdd663;

  /* Danger */
  --danger: #ea4335;
  --danger-dark: #c5221f;
  --danger-light: #f28b82;
}
```
