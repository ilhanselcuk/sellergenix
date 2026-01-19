# AI Chat Integration Guide

**Son Güncelleme:** 17 Ocak 2026
**Model:** Claude Haiku + Opus
**Durum:** 📋 Faz 1'de Implement Edilecek

---

## 📋 Genel Bakış

SellerGenix AI Chat, satıcıların doğal dilde:
- Satış verilerini sorgulamasını
- Performans analizlerini almasını
- Strateji önerileri istemesini
- Sorunları teşhis etmesini
sağlayan AI asistan.

---

## 🤖 Model Stratejisi

### Haiku vs Opus Routing

```
┌─────────────────────────────────────────────────────────────┐
│                     QUERY ROUTING                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User Query                                                │
│        │                                                    │
│        ▼                                                    │
│   ┌─────────────┐                                          │
│   │  Classifier │                                          │
│   └──────┬──────┘                                          │
│          │                                                  │
│    ┌─────┴─────┐                                           │
│    │           │                                            │
│    ▼           ▼                                            │
│ ┌──────┐  ┌──────┐                                         │
│ │Haiku │  │ Opus │                                         │
│ │ 90%  │  │ 10%  │                                         │
│ └──────┘  └──────┘                                         │
│                                                             │
│ Simple:           Complex:                                  │
│ • Data lookups    • Strategy advice                         │
│ • Basic math      • Multi-factor analysis                   │
│ • Status checks   • Optimization plans                      │
│ • Formatting      • Competitor analysis                     │
│                                                             │
│ ~$0.002/query     ~$0.10/query                             │
└─────────────────────────────────────────────────────────────┘
```

### Cost Analysis

| Model | Input | Output | Avg Query Cost |
|-------|-------|--------|----------------|
| **Haiku** | $0.25/MTok | $1.25/MTok | ~$0.002 |
| **Opus** | $15/MTok | $75/MTok | ~$0.10 |
| **Blended (90/10)** | - | - | **~$0.01** |

### Classification Rules

```typescript
// src/lib/ai/classifier.ts

interface ClassificationResult {
  model: 'haiku' | 'opus';
  confidence: number;
  reason: string;
}

// Keywords that trigger Opus (complex queries)
const OPUS_TRIGGERS = [
  // Strategy
  'strateji', 'strategy', 'optimize', 'optimizasyon',
  'nasıl artırırım', 'how to increase', 'how to improve',
  'nasıl düşürürüm', 'how to reduce', 'how to decrease',

  // Analysis
  'analiz', 'analysis', 'karşılaştır', 'compare',
  'değerlendir', 'evaluate', 'assess',

  // Planning
  'plan', 'roadmap', 'öneri', 'recommendation',
  'tavsiye', 'advice', 'suggest',

  // Complex
  'neden', 'why', 'sebep', 'reason',
  'sorun', 'problem', 'issue',
  'çöz', 'solve', 'fix',
];

// Keywords that stay with Haiku (simple queries)
const HAIKU_PATTERNS = [
  /^(dünkü?|bugünkü?|bu hafta|bu ay)/i,  // Time-based lookups
  /^(kaç|ne kadar|toplam)/i,              // Simple aggregations
  /^(göster|listele|show|list)/i,         // Display requests
  /(satış|sipariş|gelir|kâr)/i,           // Metric lookups
  /\?$/,                                   // Short questions
];

export function classifyQuery(query: string): ClassificationResult {
  const lowerQuery = query.toLowerCase();

  // Check for Opus triggers
  for (const trigger of OPUS_TRIGGERS) {
    if (lowerQuery.includes(trigger)) {
      return {
        model: 'opus',
        confidence: 0.9,
        reason: `Complex query: contains "${trigger}"`,
      };
    }
  }

  // Check query length (long queries often need more reasoning)
  if (query.length > 200) {
    return {
      model: 'opus',
      confidence: 0.7,
      reason: 'Long query requiring detailed analysis',
    };
  }

  // Check for Haiku patterns
  for (const pattern of HAIKU_PATTERNS) {
    if (pattern.test(query)) {
      return {
        model: 'haiku',
        confidence: 0.9,
        reason: 'Simple data lookup or aggregation',
      };
    }
  }

  // Default to Haiku for cost efficiency
  return {
    model: 'haiku',
    confidence: 0.6,
    reason: 'Default to efficient model',
  };
}
```

---

## 💬 System Prompts

### Haiku System Prompt

```typescript
const HAIKU_SYSTEM_PROMPT = `You are SellerGenix AI, a helpful assistant for Amazon and e-commerce sellers.

CAPABILITIES:
- Answer questions about sales, orders, revenue, profit
- Provide data lookups and simple calculations
- Format data in readable tables
- Give quick status updates

CONTEXT:
You have access to the user's e-commerce data including:
- Sales and revenue metrics
- Order counts and details
- Profit margins and ACOS
- Inventory levels
- Product performance

RESPONSE STYLE:
- Be concise and direct
- Use emojis sparingly for clarity (📊 💰 📦)
- Format numbers with proper separators ($1,234.56)
- Use tables for comparative data
- Keep responses under 200 words for simple queries

LIMITATIONS:
- For complex strategy questions, acknowledge and suggest they ask for detailed analysis
- Don't make up data - use only what's provided in context
- If unsure, say so

LANGUAGE:
- Respond in the same language as the user's query
- Support both Turkish and English`;
```

### Opus System Prompt

```typescript
const OPUS_SYSTEM_PROMPT = `You are SellerGenix AI, an expert e-commerce strategist and analyst for Amazon sellers.

CAPABILITIES:
- Deep analysis of sales trends and patterns
- Strategic recommendations for growth
- PPC optimization strategies
- Pricing strategy advice
- Competitive analysis insights
- Problem diagnosis and solutions

EXPERTISE AREAS:
1. Amazon Seller Performance
   - ACOS optimization
   - Organic ranking strategies
   - Review management
   - Account health

2. Financial Analysis
   - Profit margin optimization
   - Fee reduction strategies
   - Cash flow management
   - ROI calculations

3. Inventory Management
   - Restock timing
   - Seasonal planning
   - Dead stock identification
   - FBA vs FBM decisions

4. PPC Strategy
   - Campaign structure
   - Bid optimization
   - Keyword strategy
   - Budget allocation

RESPONSE STYLE:
- Provide thorough, actionable analysis
- Structure responses with clear sections
- Include specific numbers and calculations
- Offer multiple options when appropriate
- Prioritize recommendations by impact
- Use markdown formatting for readability

FRAMEWORK FOR RECOMMENDATIONS:
1. Current State: What the data shows
2. Problem/Opportunity: What needs attention
3. Recommendation: Specific actions to take
4. Expected Impact: Quantified results
5. Implementation: Step-by-step guide

LANGUAGE:
- Respond in the same language as the user's query
- Support both Turkish and English
- Use industry-standard terminology`;
```

---

## 🔧 Implementation

### AI Chat Service

```typescript
// src/lib/ai/chat.ts

import Anthropic from '@anthropic-ai/sdk';
import { classifyQuery } from './classifier';
import { HAIKU_SYSTEM_PROMPT, OPUS_SYSTEM_PROMPT } from './prompts';
import { getUserContext } from './context';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  userId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  response: string;
  model: 'haiku' | 'opus';
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Classify query
  const classification = classifyQuery(request.message);

  // Get user's data context
  const context = await getUserContext(request.userId);

  // Select model and prompt
  const modelId = classification.model === 'opus'
    ? 'claude-opus-4-5-20251101'
    : 'claude-3-5-haiku-20241022';

  const systemPrompt = classification.model === 'opus'
    ? OPUS_SYSTEM_PROMPT
    : HAIKU_SYSTEM_PROMPT;

  // Build messages
  const messages: Anthropic.MessageParam[] = [
    // Add context as first user message
    {
      role: 'user',
      content: `[CONTEXT - User's E-commerce Data]
${JSON.stringify(context, null, 2)}
[END CONTEXT]

Please use this data to answer my questions. Do not mention the context format in your response.`,
    },
    {
      role: 'assistant',
      content: 'I have your e-commerce data loaded. How can I help you today?',
    },
    // Add conversation history
    ...(request.conversationHistory || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    // Add current message
    {
      role: 'user',
      content: request.message,
    },
  ];

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: modelId,
    max_tokens: classification.model === 'opus' ? 4096 : 1024,
    system: systemPrompt,
    messages,
  });

  // Calculate cost
  const inputCost = classification.model === 'opus'
    ? (response.usage.input_tokens / 1_000_000) * 15
    : (response.usage.input_tokens / 1_000_000) * 0.25;

  const outputCost = classification.model === 'opus'
    ? (response.usage.output_tokens / 1_000_000) * 75
    : (response.usage.output_tokens / 1_000_000) * 1.25;

  const totalCost = inputCost + outputCost;

  // Log usage
  await logAiUsage(request.userId, {
    model: classification.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cost: totalCost,
    query: request.message,
  });

  return {
    response: response.content[0].type === 'text'
      ? response.content[0].text
      : '',
    model: classification.model,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    cost: totalCost,
  };
}
```

### Context Builder

```typescript
// src/lib/ai/context.ts

interface UserContext {
  summary: {
    totalRevenue30d: number;
    totalOrders30d: number;
    totalProfit30d: number;
    avgOrderValue: number;
    profitMargin: number;
    acos: number;
  };
  topProducts: Array<{
    name: string;
    asin: string;
    revenue: number;
    profit: number;
    units: number;
  }>;
  recentTrends: {
    revenueChange: number;
    ordersChange: number;
    profitChange: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  inventory: {
    lowStockCount: number;
    totalValue: number;
  };
  ppc?: {
    totalSpend: number;
    totalSales: number;
    acos: number;
    roas: number;
  };
}

export async function getUserContext(userId: string): Promise<UserContext> {
  // Fetch all relevant data in parallel
  const [metrics, products, inventory, alerts, ppc] = await Promise.all([
    getDailyMetrics(userId, 30),
    getTopProducts(userId, 5),
    getInventorySummary(userId),
    getActiveAlerts(userId),
    getPpcMetrics(userId, 30),
  ]);

  // Calculate summary
  const totalRevenue = metrics.reduce((sum, m) => sum + m.total_sales, 0);
  const totalOrders = metrics.reduce((sum, m) => sum + m.total_orders, 0);
  const totalProfit = metrics.reduce((sum, m) => sum + m.net_profit, 0);
  const totalAdSpend = metrics.reduce((sum, m) => sum + m.ad_spend, 0);
  const totalAdSales = metrics.reduce((sum, m) => sum + m.ad_sales, 0);

  // Calculate week-over-week changes
  const last7 = metrics.slice(-7);
  const prev7 = metrics.slice(-14, -7);
  const last7Revenue = last7.reduce((sum, m) => sum + m.total_sales, 0);
  const prev7Revenue = prev7.reduce((sum, m) => sum + m.total_sales, 0);

  return {
    summary: {
      totalRevenue30d: totalRevenue,
      totalOrders30d: totalOrders,
      totalProfit30d: totalProfit,
      avgOrderValue: totalRevenue / totalOrders,
      profitMargin: (totalProfit / totalRevenue) * 100,
      acos: totalAdSpend > 0 ? (totalAdSpend / totalAdSales) * 100 : 0,
    },
    topProducts: products.map(p => ({
      name: p.title,
      asin: p.asin,
      revenue: p.total_sales,
      profit: p.net_profit,
      units: p.units_sold,
    })),
    recentTrends: {
      revenueChange: ((last7Revenue - prev7Revenue) / prev7Revenue) * 100,
      ordersChange: 0, // Calculate similarly
      profitChange: 0, // Calculate similarly
    },
    alerts: alerts.map(a => ({
      type: a.alert_type,
      message: a.message,
      severity: a.severity,
    })),
    inventory: {
      lowStockCount: inventory.lowStockCount,
      totalValue: inventory.totalValue,
    },
    ppc: ppc ? {
      totalSpend: ppc.totalSpend,
      totalSales: ppc.totalSales,
      acos: ppc.acos,
      roas: ppc.roas,
    } : undefined,
  };
}
```

### API Route

```typescript
// src/app/api/ai/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/ai/chat';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check usage limits
  const { data: usage } = await supabase
    .from('ai_usage')
    .select('queries_count')
    .eq('user_id', user.id)
    .eq('month', new Date().toISOString().slice(0, 7))
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, query_limit')
    .eq('user_id', user.id)
    .single();

  const queryLimit = subscription?.query_limit || 500; // Starter default
  const currentUsage = usage?.queries_count || 0;

  if (currentUsage >= queryLimit) {
    return NextResponse.json({
      error: 'Monthly query limit reached',
      limit: queryLimit,
      usage: currentUsage,
    }, { status: 429 });
  }

  // Parse request
  const body = await request.json();
  const { message, conversationHistory } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    // Call AI
    const response = await chat({
      userId: user.id,
      message,
      conversationHistory,
    });

    // Update usage
    await supabase.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_month: new Date().toISOString().slice(0, 7),
    });

    return NextResponse.json({
      response: response.response,
      model: response.model,
      usage: {
        tokens: response.tokensUsed,
        cost: response.cost,
        queriesUsed: currentUsage + 1,
        queriesLimit: queryLimit,
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

---

## 💬 Example Queries & Responses

### Simple Query (Haiku)

**User:** "Dünkü satışım ne kadar?"

**Response:**
```
📊 Dünkü Performans (15 Ocak 2026)

💰 Toplam Satış: $2,456.78
📦 Siparişler: 45
📈 Birimler: 68
💵 Net Kâr: $890.12

vs Önceki gün: +12.5% 📈
```

### Complex Query (Opus)

**User:** "ACOS'um çok yüksek, nasıl düşürebilirim?"

**Response:**
```
# 📊 ACOS Analizi ve Optimizasyon Stratejisi

## Mevcut Durum
Şu anki ACOS'unuz **34.2%** olup, break-even ACOS'unuz olan **28%'in** üzerinde.
Bu, reklam harcamalarınızdan zarar ettiğiniz anlamına geliyor.

## Sorun Analizi
Verilerinize baktığımda şu sorunları tespit ettim:

1. **Yüksek ACOS'lu Kampanyalar**
   - "Main Product - Broad Match": 52.3% ACOS
   - "Competitor Keywords": 48.7% ACOS

2. **Düşük Dönüşümlü Keywords**
   - 15 keyword %0 conversion rate ile harcama yapıyor
   - Toplam boşa harcama: $234/hafta

## Önerilerim

### Acil Aksiyon (Bu Hafta)
1. **Pause these keywords** (0% conversion, 100+ clicks):
   - "yoga mat cheap"
   - "exercise mat generic"
   - "floor mat workout"

2. **Reduce bids by 30%** on these campaigns:
   - "Competitor Keywords" campaign
   - Broad match ad groups

### Orta Vadeli (2-4 Hafta)
3. **Negative keyword** ekleyin:
   - Arama terimi raporlarından düşük dönüşümlüleri negative yapın
   - Tahmini tasarruf: $150/hafta

4. **Kampanya yapısını optimize edin:**
   - Auto ve Manual kampanyaları ayırın
   - Exact match kampanyası oluşturun (en iyi keywordlar için)

### Beklenen Sonuç
Bu değişikliklerle ACOS'unuzu **34.2% → 24-26%** aralığına
çekebilirsiniz. Bu da aylık **~$450 ek kâr** demek.

---

Detaylı keyword listesi veya kampanya yapısı için bana sorun.
```

---

## 🗄️ Database Schema

```sql
-- AI Usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- '2026-01'
  queries_count INTEGER DEFAULT 0,
  haiku_tokens INTEGER DEFAULT 0,
  opus_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Chat history
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL,  -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model TEXT,  -- 'haiku' or 'opus'
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON ai_chat_history(user_id);
CREATE INDEX idx_chat_conversation ON ai_chat_history(conversation_id);
CREATE INDEX idx_chat_created ON ai_chat_history(created_at DESC);

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id UUID,
  p_month TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage (user_id, month, queries_count)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    queries_count = ai_usage.queries_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own usage" ON ai_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own chats" ON ai_chat_history FOR ALL USING (auth.uid() = user_id);
```

---

## 📊 Usage Limits by Plan

| Plan | Queries/Month | Token Limit | Model Access |
|------|---------------|-------------|--------------|
| **Starter** | 500 | 2.5M | Haiku + Opus |
| **Pro** | 2,500 | 12.5M | Haiku + Opus |
| **Business** | 10,000 | 50M | Haiku + Opus |
| **Enterprise** | 50,000 | 250M | Haiku + Opus |

---

## 🎨 UI Component

```typescript
// src/components/ai/ChatBot.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: 'haiku' | 'opus';
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          model: data.model,
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">SellerGenix AI</h3>
          <p className="text-xs text-gray-500">Ask me anything about your business</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.model && (
                <div className="mt-2 flex items-center gap-1 text-xs opacity-60">
                  <Sparkles className="w-3 h-3" />
                  {message.model === 'opus' ? 'Deep Analysis' : 'Quick Response'}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your sales, profits, or strategy..."
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔗 İlgili Kaynaklar

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Models](https://docs.anthropic.com/claude/docs/models-overview)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

---

**Son Güncelleme:** 17 Ocak 2026
**Faz:** 1 (Amazon ile birlikte)
