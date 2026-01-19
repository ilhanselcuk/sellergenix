# WhatsApp Business API - Templates Guide

**Son Güncelleme:** 17 Ocak 2026
**Provider:** Twilio
**Durum:** ✅ Aktif Kullanımda (Diğer Projeler)

---

## 📋 Genel Bakış

WhatsApp Business API üzerinden satıcılara:
- Günlük/haftalık performans özetleri
- Kritik uyarılar (low stock, negative review)
- Ödeme bildirimleri
- AI-powered insights
gönderilecek.

---

## 🔧 Twilio Setup

### Credentials

```env
# .env.local
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886  # Twilio sandbox veya business number
```

### Twilio Client

```typescript
// src/lib/twilio/client.ts

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsAppMessage(
  to: string,
  template: string,
  variables: Record<string, string>
): Promise<string> {
  const message = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    contentSid: template,  // Template SID
    contentVariables: JSON.stringify(variables),
  });

  return message.sid;
}
```

---

## 📝 Template Definitions

### Template Naming Convention

```
sellergenix_{platform}_{alert_type}

Examples:
- sellergenix_amazon_daily_summary
- sellergenix_amazon_low_stock
- sellergenix_shopify_new_order
- sellergenix_global_weekly_report
```

---

## 🔔 Amazon Templates

### 1. Daily Sales Summary
**Template ID:** `sellergenix_amazon_daily_summary`
**Category:** UTILITY
**Trigger:** Cron job - her gün 08:00 (user timezone)

```
📊 *SellerGenix Daily Report*
━━━━━━━━━━━━━━━━━━━━━━

📅 {{1}}  (Date)

💰 *Revenue:* ${{2}}
📦 *Orders:* {{3}}
📈 *Units:* {{4}}
💵 *Net Profit:* ${{5}}

📊 *vs Yesterday:*
Revenue: {{6}}
Orders: {{7}}

🔗 View full report: {{8}}

_Powered by SellerGenix_
```

**Variables:**
| # | Variable | Example |
|---|----------|---------|
| 1 | Date | "January 16, 2026" |
| 2 | Revenue | "2,456.78" |
| 3 | Orders | "45" |
| 4 | Units | "68" |
| 5 | Net Profit | "890.12" |
| 6 | Revenue Change | "+12.5%" |
| 7 | Orders Change | "+8 orders" |
| 8 | Report URL | "https://app.sellergenix.io/d/..." |

### 2. Low Stock Alert
**Template ID:** `sellergenix_amazon_low_stock`
**Category:** ALERT
**Trigger:** Stok < threshold (default: 14 gün)

```
⚠️ *LOW STOCK ALERT*
━━━━━━━━━━━━━━━━━━━━━━

🏷️ *Product:* {{1}}
📦 *ASIN:* {{2}}

📊 *Current Stock:* {{3}} units
⏰ *Days Left:* {{4}} days
📈 *Daily Sales:* {{5}} units/day

💡 *Recommendation:*
Order {{6}} units to cover 30 days

🔗 View inventory: {{7}}

_Act fast to avoid stockouts!_
```

**Variables:**
| # | Variable | Example |
|---|----------|---------|
| 1 | Product Name | "Premium Yoga Mat" |
| 2 | ASIN | "B08XYZ1234" |
| 3 | Current Stock | "45" |
| 4 | Days Left | "7" |
| 5 | Daily Sales | "6.5" |
| 6 | Recommended Order | "150" |
| 7 | Inventory URL | "https://app.sellergenix.io/inv/..." |

### 3. High ACOS Alert
**Template ID:** `sellergenix_amazon_high_acos`
**Category:** ALERT
**Trigger:** ACOS > break-even ACOS

```
🚨 *HIGH ACOS ALERT*
━━━━━━━━━━━━━━━━━━━━━━

📢 *Campaign:* {{1}}
📊 *Current ACOS:* {{2}}%
⚠️ *Break-even:* {{3}}%

💸 *You're losing money!*

📈 *Last 7 Days:*
• Spend: ${{4}}
• Sales: ${{5}}
• Loss: ${{6}}

💡 *AI Recommendation:*
{{7}}

🔗 Optimize now: {{8}}
```

**Variables:**
| # | Variable | Example |
|---|----------|---------|
| 1 | Campaign Name | "Main Product - Auto" |
| 2 | Current ACOS | "45.2" |
| 3 | Break-even ACOS | "32.0" |
| 4 | Spend | "456.78" |
| 5 | Sales | "1,012.34" |
| 6 | Estimated Loss | "134.56" |
| 7 | AI Recommendation | "Reduce bids on low-converting keywords" |
| 8 | Campaign URL | "https://app.sellergenix.io/ppc/..." |

### 4. Negative Review Alert
**Template ID:** `sellergenix_amazon_negative_review`
**Category:** ALERT
**Trigger:** New 1-2 star review (Oxylabs)

```
⭐ *NEGATIVE REVIEW ALERT*
━━━━━━━━━━━━━━━━━━━━━━

🏷️ *Product:* {{1}}
📦 *ASIN:* {{2}}

⭐ *Rating:* {{3}} stars
👤 *Reviewer:* {{4}}

💬 *Review:*
"{{5}}"

📊 *Impact:*
Old Rating: {{6}} → New: {{7}}

💡 *Suggested Action:*
{{8}}

🔗 View review: {{9}}
```

### 5. Payout Received
**Template ID:** `sellergenix_amazon_payout`
**Category:** UTILITY
**Trigger:** Payout event (Finances API)

```
💰 *PAYOUT RECEIVED*
━━━━━━━━━━━━━━━━━━━━━━

✅ Amazon deposited funds to your account

💵 *Amount:* ${{1}}
📅 *Date:* {{2}}
🏦 *Period:* {{3}} - {{4}}

📊 *Breakdown:*
• Sales: ${{5}}
• Fees: -${{6}}
• Refunds: -${{7}}

🔗 View details: {{8}}
```

### 6. Weekly Performance Report
**Template ID:** `sellergenix_amazon_weekly_report`
**Category:** UTILITY
**Trigger:** Cron job - Pazartesi 09:00

```
📊 *WEEKLY PERFORMANCE*
━━━━━━━━━━━━━━━━━━━━━━

📅 Week of {{1}}

💰 *Revenue:* ${{2}}
📦 *Orders:* {{3}}
💵 *Net Profit:* ${{4}}
📈 *Margin:* {{5}}%

📊 *vs Last Week:*
Revenue: {{6}}
Profit: {{7}}

🏆 *Top Product:*
{{8}} - ${{9}} profit

⚠️ *Needs Attention:*
{{10}}

🔗 Full report: {{11}}
```

---

## 🛍️ Shopify Templates

### 1. New Order Notification
**Template ID:** `sellergenix_shopify_new_order`
**Category:** UTILITY
**Trigger:** Webhook - orders/create

```
🛒 *NEW ORDER*
━━━━━━━━━━━━━━━━━━━━━━

📦 *Order #{{1}}*
💰 *Total:* ${{2}}
📊 *Items:* {{3}}

👤 *Customer:* {{4}}
🌍 *Location:* {{5}}

📝 *Products:*
{{6}}

🔗 View order: {{7}}
```

### 2. Daily Summary
**Template ID:** `sellergenix_shopify_daily_summary`
**Category:** UTILITY
**Trigger:** Cron job - her gün 08:00

```
🛍️ *Shopify Daily Report*
━━━━━━━━━━━━━━━━━━━━━━

📅 {{1}}

💰 *Revenue:* ${{2}}
📦 *Orders:* {{3}}
📈 *AOV:* ${{4}}

📊 *vs Yesterday:*
Revenue: {{5}}
Orders: {{6}}

🔗 View report: {{7}}
```

### 3. Low Stock Alert
**Template ID:** `sellergenix_shopify_low_stock`
**Category:** ALERT
**Trigger:** Inventory webhook

```
⚠️ *SHOPIFY LOW STOCK*
━━━━━━━━━━━━━━━━━━━━━━

🏷️ *Product:* {{1}}
🔢 *SKU:* {{2}}

📦 *Current Stock:* {{3}} units

💡 *Action Required:*
Restock soon to avoid lost sales

🔗 Manage inventory: {{4}}
```

---

## 🌍 Global Templates (Cross-Platform)

### 1. Multi-Platform Weekly Summary
**Template ID:** `sellergenix_global_weekly_summary`
**Category:** UTILITY
**Trigger:** Cron job - Pazartesi 09:00

```
📊 *WEEKLY BUSINESS SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━

📅 Week of {{1}}

🏪 *By Platform:*

🛒 *Amazon:*
• Revenue: ${{2}}
• Profit: ${{3}}

🛍️ *Shopify:*
• Revenue: ${{4}}
• Profit: ${{5}}

📈 *Total:*
• Revenue: ${{6}}
• Profit: ${{7}}
• Growth: {{8}}

🔗 Full dashboard: {{9}}
```

### 2. AI Insight Alert
**Template ID:** `sellergenix_ai_insight`
**Category:** UTILITY
**Trigger:** AI analysis finds opportunity

```
🤖 *AI INSIGHT*
━━━━━━━━━━━━━━━━━━━━━━

💡 *Opportunity Detected:*

{{1}}

📊 *Potential Impact:*
{{2}}

🎯 *Recommended Action:*
{{3}}

🔗 Take action: {{4}}

_Powered by SellerGenix AI_
```

---

## 💻 Implementation

### Notification Service

```typescript
// src/lib/notifications/whatsapp.ts

import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/twilio/client';

interface NotificationPayload {
  userId: string;
  templateId: string;
  variables: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  // Get user's WhatsApp number
  const { data: user } = await supabase
    .from('profiles')
    .select('whatsapp_number, notification_preferences')
    .eq('id', payload.userId)
    .single();

  if (!user?.whatsapp_number) {
    console.log('User has no WhatsApp number configured');
    return;
  }

  // Check notification preferences
  const prefs = user.notification_preferences || {};
  const templateCategory = getTemplateCategory(payload.templateId);

  if (prefs[templateCategory] === false) {
    console.log(`User has disabled ${templateCategory} notifications`);
    return;
  }

  // Send message
  const messageSid = await sendWhatsAppMessage(
    user.whatsapp_number,
    payload.templateId,
    payload.variables
  );

  // Log notification
  await supabase.from('notification_history').insert({
    user_id: payload.userId,
    channel: 'whatsapp',
    template_id: payload.templateId,
    message_sid: messageSid,
    status: 'sent',
    created_at: new Date().toISOString(),
  });
}

function getTemplateCategory(templateId: string): string {
  if (templateId.includes('alert') || templateId.includes('low_stock')) {
    return 'alerts';
  }
  if (templateId.includes('daily') || templateId.includes('weekly')) {
    return 'reports';
  }
  if (templateId.includes('payout') || templateId.includes('order')) {
    return 'transactions';
  }
  return 'general';
}
```

### Scheduled Reports (Cron)

```typescript
// src/app/api/cron/daily-reports/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications/whatsapp';
import { calculateDailyMetrics } from '@/lib/amazon/calculations';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all users with WhatsApp enabled
  const { data: users } = await supabase
    .from('profiles')
    .select('id, whatsapp_number, timezone')
    .not('whatsapp_number', 'is', null);

  const now = new Date();

  for (const user of users || []) {
    // Check if it's 8 AM in user's timezone
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone || 'America/New_York' }));
    if (userTime.getHours() !== 8) continue;

    try {
      // Get yesterday's metrics
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const metrics = await calculateDailyMetrics(user.id, yesterday);

      // Send daily summary
      await sendNotification({
        userId: user.id,
        templateId: 'sellergenix_amazon_daily_summary',
        variables: {
          '1': yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          '2': metrics.totalSales.toLocaleString(),
          '3': metrics.totalOrders.toString(),
          '4': metrics.totalUnits.toString(),
          '5': metrics.netProfit.toLocaleString(),
          '6': `${metrics.revenueChange > 0 ? '+' : ''}${metrics.revenueChange}%`,
          '7': `${metrics.ordersChange > 0 ? '+' : ''}${metrics.ordersChange} orders`,
          '8': `https://app.sellergenix.io/dashboard?date=${yesterday.toISOString().split('T')[0]}`,
        },
      });
    } catch (error) {
      console.error(`Failed to send daily report for user ${user.id}:`, error);
    }
  }

  return NextResponse.json({ success: true });
}
```

### Low Stock Alert Trigger

```typescript
// src/lib/alerts/low-stock.ts

export async function checkLowStock(userId: string): Promise<void> {
  // Get inventory with sales velocity
  const { data: inventory } = await supabase
    .from('amazon_products')
    .select(`
      *,
      daily_metrics:amazon_daily_metrics(units)
    `)
    .eq('user_id', userId)
    .gt('fba_quantity', 0);

  for (const product of inventory || []) {
    // Calculate daily sales velocity (last 30 days)
    const last30DaysUnits = product.daily_metrics
      ?.slice(-30)
      .reduce((sum: number, d: any) => sum + (d.units || 0), 0) || 0;
    const dailyVelocity = last30DaysUnits / 30;

    if (dailyVelocity === 0) continue;

    const daysOfStock = product.fba_quantity / dailyVelocity;

    // Alert if < 14 days of stock
    if (daysOfStock < 14) {
      // Check if we already sent an alert recently
      const { data: recentAlert } = await supabase
        .from('notification_history')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', 'sellergenix_amazon_low_stock')
        .eq('metadata->>asin', product.asin)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recentAlert) continue; // Already alerted today

      await sendNotification({
        userId,
        templateId: 'sellergenix_amazon_low_stock',
        variables: {
          '1': product.title || 'Unknown Product',
          '2': product.asin,
          '3': product.fba_quantity.toString(),
          '4': Math.floor(daysOfStock).toString(),
          '5': dailyVelocity.toFixed(1),
          '6': Math.ceil(dailyVelocity * 30).toString(),
          '7': `https://app.sellergenix.io/inventory/${product.asin}`,
        },
        priority: daysOfStock < 7 ? 'high' : 'normal',
      });
    }
  }
}
```

---

## 🗄️ Database Schema

```sql
-- User notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  whatsapp_number TEXT,
  notification_preferences JSONB DEFAULT '{
    "alerts": true,
    "reports": true,
    "transactions": true,
    "insights": true
  }'::jsonb,
  timezone TEXT DEFAULT 'America/New_York';

-- Notification history
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,  -- 'whatsapp', 'email', 'push'
  template_id TEXT NOT NULL,
  message_sid TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed'
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_user ON notification_history(user_id);
CREATE INDEX idx_notification_template ON notification_history(template_id);
CREATE INDEX idx_notification_created ON notification_history(created_at DESC);

-- RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notification_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## 📊 Template Approval Status

| Template | Platform | Status | Notes |
|----------|----------|--------|-------|
| `sellergenix_amazon_daily_summary` | Amazon | ✅ Approved | |
| `sellergenix_amazon_low_stock` | Amazon | ✅ Approved | |
| `sellergenix_amazon_high_acos` | Amazon | ✅ Approved | |
| `sellergenix_amazon_negative_review` | Amazon | ✅ Approved | |
| `sellergenix_amazon_payout` | Amazon | ✅ Approved | |
| `sellergenix_amazon_weekly_report` | Amazon | ✅ Approved | |
| `sellergenix_shopify_new_order` | Shopify | 📋 Pending | Faz 3 |
| `sellergenix_shopify_daily_summary` | Shopify | 📋 Pending | Faz 3 |
| `sellergenix_shopify_low_stock` | Shopify | 📋 Pending | Faz 3 |
| `sellergenix_global_weekly_summary` | Global | 📋 Pending | Faz 3 |
| `sellergenix_ai_insight` | AI | ✅ Approved | |

---

## ⚙️ Notification Settings UI

```typescript
// User preferences page component

interface NotificationPreferences {
  alerts: boolean;      // Low stock, high ACOS, negative reviews
  reports: boolean;     // Daily/weekly summaries
  transactions: boolean; // Payouts, new orders
  insights: boolean;    // AI recommendations
}

// Default: All enabled
const defaultPreferences: NotificationPreferences = {
  alerts: true,
  reports: true,
  transactions: true,
  insights: true,
};
```

---

## 🔗 İlgili Kaynaklar

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Message Templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)
- [Template Guidelines](https://www.facebook.com/business/help/2055875911147364)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 1 (Amazon templates aktif)
