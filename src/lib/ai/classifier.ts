// Query Classification for Haiku vs Opus routing
// Haiku: Simple queries (~90%) - $0.002/query
// Opus: Complex analysis (~10%) - $0.10/query

export interface ClassificationResult {
  model: 'haiku' | 'opus';
  confidence: number;
  reason: string;
}

// Keywords that trigger Opus (complex queries requiring deep analysis)
const OPUS_TRIGGERS = [
  // Strategy keywords (English)
  'strategy', 'optimize', 'optimization', 'improve', 'increase',
  'reduce', 'decrease', 'recommend', 'advice', 'suggest',
  'plan', 'roadmap', 'forecast', 'predict',
  'analyze', 'analysis', 'compare', 'comparison',
  'evaluate', 'assess', 'diagnose', 'troubleshoot',
  'why', 'reason', 'cause', 'problem', 'issue', 'solve', 'fix',

  // Strategy keywords (Turkish)
  'strateji', 'optimizasyon', 'optimize', 'artır', 'artırırım',
  'düşür', 'düşürürüm', 'azalt', 'öneri', 'tavsiye',
  'plan', 'yol haritası', 'tahmin',
  'analiz', 'karşılaştır', 'kıyasla',
  'değerlendir', 'teşhis', 'sorun', 'problem', 'çöz', 'düzelt',
  'neden', 'sebep', 'nasıl yapabilirim', 'ne yapmalıyım',
];

// Patterns that stay with Haiku (simple data lookups)
const HAIKU_PATTERNS = [
  // Time-based lookups (English)
  /^(today|yesterday|this week|this month|last month)/i,
  /^(what|how much|how many|total|show|list|display)/i,

  // Time-based lookups (Turkish)
  /^(bugün|dün|bu hafta|bu ay|geçen ay)/i,
  /^(bugünkü|dünkü|bu haftaki|bu ayki|geçen ayki)/i,
  /^(kaç|ne kadar|toplam|göster|listele)/i,

  // Simple metric lookups
  /(sales|revenue|profit|orders|units|margin)/i,
  /(satış|gelir|kâr|kar|sipariş|birim|marj)/i,

  // Yes/No questions
  /\?$/,
];

export function classifyQuery(query: string): ClassificationResult {
  const lowerQuery = query.toLowerCase();

  // Check for Opus triggers (complex queries)
  for (const trigger of OPUS_TRIGGERS) {
    if (lowerQuery.includes(trigger)) {
      return {
        model: 'opus',
        confidence: 0.9,
        reason: `Complex query: contains "${trigger}"`,
      };
    }
  }

  // Check query length - long queries often need more reasoning
  if (query.length > 200) {
    return {
      model: 'opus',
      confidence: 0.7,
      reason: 'Long query requiring detailed analysis',
    };
  }

  // Check for Haiku patterns (simple lookups)
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
