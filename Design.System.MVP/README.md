# 🎨 DESIGN SYSTEM MVP - SellerGenix Platform

> **Amaç:** Bu tasarım sistemi başka projelerde birebir kullanılabilir şekilde hazırlanmıştır.
> Her bölümde **kod örnekleri, renk kodları, spacing değerleri ve kullanım notları** bulunur.

---

## 📐 **GENEL PRENSİPLER**

### **Design Philosophy:**
1. ✅ **Modern & Premium** - Gradient'ler, gölgeler, blur efektleri
2. ✅ **Google Material Design Inspired** - Google renk paleti (#4285f4 mavi, #34a853 yeşil)
3. ✅ **Responsive-First** - Mobile-first yaklaşım, her ekran boyutunda mükemmel
4. ✅ **Micro-Interactions** - Her hover, click, transition'da animasyon
5. ✅ **Glassmorphism** - Şeffaf arka planlar, backdrop-blur efektleri
6. ✅ **Bold Typography** - Kalın fontlar, büyük başlıklar, net hiyerarşi

---

## 🎨 **RENK PALETİ**

### **Primary Colors (Google Palette)**

```css
/* Mavi (Primary - Güven, Profesyonellik) */
--color-primary: #4285f4;
--color-primary-dark: #3367d6;
--color-primary-light: #81a3f7;

/* Yeşil (Success - Başarı, Büyüme) */
--color-success: #34a853;
--color-success-dark: #137333;
--color-success-light: #81c995;

/* Sarı (Warning/Attention) */
--color-warning: #fbbc05;
--color-warning-dark: #f29900;
--color-warning-light: #fdd663;

/* Kırmızı (Danger/Alert) */
--color-danger: #ea4335;
--color-danger-dark: #c5221f;
--color-danger-light: #f28b82;
```

### **Tailwind Class Kullanımı:**

```tsx
// Primary Blue
<div className="bg-[#4285f4] text-white">...</div>

// Success Green
<div className="bg-[#34a853] text-white">...</div>

// Gradient (Primary → Success)
<div className="bg-gradient-to-r from-[#4285f4] to-[#34a853]">...</div>
```

---

## 📏 **SPACING**

- **Section Padding:** py-20 (desktop), py-12 (mobile)
- **Container Max Width:** max-w-7xl
- **Card Padding:** p-6 (small), p-8 (medium)
- **Gap:** gap-6 (standard), gap-8 (large)

---

## 🔲 **BORDER RADIUS**

- **Small:** rounded-lg (8px)
- **Medium:** rounded-xl (12px)
- **Large:** rounded-2xl (16px)
- **Extra Large:** rounded-3xl (24px)

---

## 🌟 **SHADOW LEVELS**

```tsx
shadow-sm   // Subtle
shadow-md   // Small
shadow-lg   // Medium
shadow-xl   // Large
shadow-2xl  // Extra Large
```

---

## 📝 **TİPOGRAFİ**

| Element | Mobile | Desktop | Weight | Class |
|---------|--------|---------|--------|-------|
| Hero | 48px | 72px | 900 | text-5xl lg:text-7xl font-black |
| H1 | 36px | 48px | 800 | text-4xl md:text-5xl font-bold |
| H2 | 30px | 36px | 700 | text-3xl md:text-4xl font-bold |
| Body | 16px | 18px | 400 | text-base md:text-lg |

---

## 🎬 **ANIMASYONLAR**

### **Framer Motion:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### **Tailwind Transitions:**
```tsx
transition-all duration-300  // Standard
transition-all duration-500  // Slow
```

---

## 🔗 **QUICK LINKS**

- [Colors.md](./Colors.md) - Detaylı renk paleti
- [Components.md](./Components.md) - Component örnekleri
- [Layout.md](./Layout.md) - Layout sistemleri
- [Animations.md](./Animations.md) - Animasyon örnekleri

---

**Version:** 1.0.0
**Last Updated:** Ocak 2025
**Project:** SellerGenix - Amazon Analytics Platform
