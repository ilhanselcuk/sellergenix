'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronUp, ChevronDown, Loader2, MessageCircle } from 'lucide-react';

// Starbucks Color Palette (matching the app theme)
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: 'haiku' | 'opus';
  timestamp: Date;
}

interface ChatBotProps {
  userId: string;
}

export function ChatBot({ userId }: ChatBotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your SellerGenix AI assistant. Ask me anything about your sales, profits, or strategy - in English or Turkish! 🚀",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/ai/chat?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          model: data.model,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action suggestions
  const quickActions = [
    { label: "Today's sales", query: "What are my sales today?" },
    { label: "This month", query: "Show me this month's performance" },
    { label: "Top products", query: "What are my best selling products?" },
    { label: "Bugün", query: "Bugünkü satışım ne kadar?" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div
          className="shadow-2xl"
          style={{
            backgroundColor: STARBUCKS.white,
            borderTop: `1px solid ${STARBUCKS.lightGreen}`
          }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Chat Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)` }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>
                    SellerGenix AI
                  </h4>
                  <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>
                    Ask about your business • TR & EN supported
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: STARBUCKS.primaryGreen }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: message.role === 'user'
                        ? STARBUCKS.lightGreen
                        : `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                    }}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" style={{ color: STARBUCKS.darkGreen }} />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl"
                    style={{
                      background: message.role === 'user'
                        ? `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                        : STARBUCKS.cream,
                      color: message.role === 'user' ? STARBUCKS.white : STARBUCKS.darkGreen,
                      borderTopRightRadius: message.role === 'user' ? 0 : undefined,
                      borderTopLeftRadius: message.role === 'user' ? undefined : 0,
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className="text-xs"
                        style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.6)' : STARBUCKS.primaryGreen }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.model && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: message.model === 'opus' ? STARBUCKS.gold : STARBUCKS.lightGreen,
                            color: message.model === 'opus' ? STARBUCKS.white : STARBUCKS.darkGreen
                          }}
                        >
                          {message.model === 'opus' ? '✨ Deep Analysis' : '⚡ Quick'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)` }}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none" style={{ backgroundColor: STARBUCKS.cream }}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: STARBUCKS.primaryGreen }} />
                      <span className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Input Bar - Full Width Bottom */}
      <div
        className="shadow-lg"
        style={{
          backgroundColor: STARBUCKS.white,
          borderTop: `1px solid ${STARBUCKS.lightGreen}`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Expand Toggle */}
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: STARBUCKS.primaryGreen }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            )}

            {/* AI Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)` }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            {/* Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={(e) => {
                  setIsExpanded(true);
                  e.currentTarget.style.borderColor = STARBUCKS.primaryGreen;
                }}
                placeholder="Ask about sales, profits, or strategy... (TR & EN)"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 pr-14"
                style={{
                  backgroundColor: STARBUCKS.cream,
                  border: `1px solid ${STARBUCKS.lightGreen}`,
                  color: STARBUCKS.darkGreen,
                }}
                onBlur={(e) => e.currentTarget.style.borderColor = STARBUCKS.lightGreen}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
                style={{
                  background: input.trim() && !isLoading
                    ? `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                    : STARBUCKS.lightGreen,
                  color: input.trim() && !isLoading ? STARBUCKS.white : STARBUCKS.primaryGreen,
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions (when collapsed) */}
          {!isExpanded && (
            <div className="flex items-center gap-2 mt-2 ml-14 overflow-x-auto pb-1">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(action.query);
                    setIsExpanded(true);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
                  style={{ backgroundColor: STARBUCKS.lightGreen, color: STARBUCKS.darkGreen }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.primaryGreen + '30'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
