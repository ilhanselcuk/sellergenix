'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Paperclip, X, FileSpreadsheet, Loader2, ChevronUp, ChevronDown, Bot, User } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface AIChatBarProps {
  onCommand?: (command: string, data?: any) => void
}

// Sample AI responses for common commands
const AI_RESPONSES: { [key: string]: string } = {
  'cogs': 'I\'ve updated the COGS for that product. You can verify the changes in Product Settings.',
  'excel': 'Please upload your Excel file with columns: ASIN, COGS, Custom Tax, Warehouse Cost, Logistics. I\'ll process it right away.',
  'help': `Here are some things I can help you with:

• **Set COGS**: "Set COGS $5.50 for B08XYZ123"
• **Bulk Upload**: Upload an Excel file with COGS data
• **Parent Products**: "Apply COGS to all children of B08ABC456"
• **View Costs**: "Show me costs for B08XYZ123"
• **Export**: "Export all products to CSV"

Just type your request or upload a file!`,
  'default': 'I understand you want to update product costs. Could you please provide the ASIN and the cost value? For example: "Set COGS $5.50 for B08XYZ123"'
}

export default function AIChatBar({ onCommand }: AIChatBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage COGS and product costs. Try saying "help" to see what I can do!',
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom()
    }
  }, [messages, isExpanded])

  const parseCommand = (input: string): { type: string; data?: any } => {
    const lower = input.toLowerCase()

    // Help command
    if (lower.includes('help')) {
      return { type: 'help' }
    }

    // Set COGS command: "Set COGS $5.50 for B08XYZ123"
    const cogsMatch = lower.match(/set\s+cogs?\s+\$?([\d.]+)\s+(?:for\s+)?([a-z0-9]+)/i)
    if (cogsMatch) {
      return {
        type: 'cogs',
        data: { amount: parseFloat(cogsMatch[1]), asin: cogsMatch[2].toUpperCase() }
      }
    }

    // Apply to children: "Apply COGS to all children of B08ABC456"
    const childrenMatch = lower.match(/apply\s+(?:cogs?\s+)?(?:to\s+)?(?:all\s+)?children\s+(?:of\s+)?([a-z0-9]+)/i)
    if (childrenMatch) {
      return {
        type: 'apply_children',
        data: { parentAsin: childrenMatch[1].toUpperCase() }
      }
    }

    // Show costs: "Show me costs for B08XYZ123"
    const showMatch = lower.match(/(?:show|view|get)\s+(?:me\s+)?costs?\s+(?:for\s+)?([a-z0-9]+)/i)
    if (showMatch) {
      return {
        type: 'show_costs',
        data: { asin: showMatch[1].toUpperCase() }
      }
    }

    // Export command
    if (lower.includes('export')) {
      return { type: 'export' }
    }

    // Excel/upload mention
    if (lower.includes('excel') || lower.includes('upload') || lower.includes('bulk')) {
      return { type: 'excel' }
    }

    return { type: 'default' }
  }

  const handleSend = async () => {
    if (!inputValue.trim() && !uploadedFile) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: uploadedFile ? `Uploading: ${uploadedFile.name}` : inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Parse command
    const command = parseCommand(inputValue)

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000))

    let response = AI_RESPONSES[command.type] || AI_RESPONSES['default']

    // Custom responses based on command
    if (command.type === 'cogs' && command.data) {
      response = `✅ Updated COGS for **${command.data.asin}** to **$${command.data.amount.toFixed(2)}**. The new cost will be reflected in your profit calculations.`
      onCommand?.('set_cogs', command.data)
    } else if (command.type === 'apply_children' && command.data) {
      response = `✅ Applied COGS to all child variations of **${command.data.parentAsin}**. All children now have the same cost structure.`
      onCommand?.('apply_children', command.data)
    } else if (command.type === 'show_costs' && command.data) {
      response = `📦 **${command.data.asin}** Costs:\n• COGS: $5.50\n• Custom Tax: $0.45\n• Warehouse: $0.30\n• Logistics: $1.20\n• **Total: $7.45/unit**`
    } else if (command.type === 'export') {
      response = '📊 Starting export... Your CSV file will download shortly.'
      onCommand?.('export', {})
    }

    // Handle file upload
    if (uploadedFile) {
      response = `📁 Processing **${uploadedFile.name}**...\n\nI found 47 products in your file. Updating COGS for all of them now.\n\n✅ Successfully updated 47 products!`
      setUploadedFile(null)
      onCommand?.('bulk_upload', { file: uploadedFile })
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date()
    }

    setIsTyping(false)
    setMessages(prev => [...prev, assistantMessage])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setIsExpanded(true)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div className="shadow-2xl" style={{ backgroundColor: STARBUCKS.white, borderTop: `1px solid ${STARBUCKS.lightGreen}` }}>
          <div className="max-w-4xl mx-auto">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)` }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>SellerGenix AI</h4>
                  <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>Your intelligent assistant</p>
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
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: message.type === 'user'
                        ? STARBUCKS.lightGreen
                        : `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                    }}
                  >
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" style={{ color: STARBUCKS.darkGreen }} />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-2xl"
                    style={{
                      background: message.type === 'user'
                        ? `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                        : STARBUCKS.cream,
                      color: message.type === 'user' ? STARBUCKS.white : STARBUCKS.darkGreen,
                      borderTopRightRadius: message.type === 'user' ? 0 : undefined,
                      borderTopLeftRadius: message.type === 'user' ? undefined : 0,
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: message.type === 'user' ? 'rgba(255,255,255,0.6)' : STARBUCKS.primaryGreen }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)` }}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none" style={{ backgroundColor: STARBUCKS.cream }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: STARBUCKS.primaryGreen, animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: STARBUCKS.primaryGreen, animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: STARBUCKS.primaryGreen, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="shadow-lg" style={{ backgroundColor: STARBUCKS.white, borderTop: `1px solid ${STARBUCKS.lightGreen}` }}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Expand Toggle (when collapsed) */}
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
              {uploadedFile && (
                <div
                  className="absolute -top-12 left-0 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: STARBUCKS.lightGreen, border: `1px solid ${STARBUCKS.primaryGreen}30` }}
                >
                  <FileSpreadsheet className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
                  <span className="text-sm" style={{ color: STARBUCKS.darkGreen }}>{uploadedFile.name}</span>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-0.5"
                    style={{ color: STARBUCKS.primaryGreen }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsExpanded(true)}
                placeholder='Ask anything... Try "Set COGS $5.50 for B08XYZ123" or "help"'
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 pr-24"
                style={{
                  backgroundColor: STARBUCKS.cream,
                  border: `1px solid ${STARBUCKS.lightGreen}`,
                  color: STARBUCKS.darkGreen,
                }}
                onFocusCapture={(e) => e.currentTarget.style.borderColor = STARBUCKS.primaryGreen}
                onBlur={(e) => e.currentTarget.style.borderColor = STARBUCKS.lightGreen}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: STARBUCKS.primaryGreen }}
                  title="Upload Excel/CSV"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() && !uploadedFile}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    background: inputValue.trim() || uploadedFile
                      ? `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                      : STARBUCKS.lightGreen,
                    color: inputValue.trim() || uploadedFile ? STARBUCKS.white : STARBUCKS.primaryGreen,
                    cursor: inputValue.trim() || uploadedFile ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!isExpanded && (
            <div className="flex items-center gap-2 mt-2 ml-14">
              <button
                onClick={() => {
                  setInputValue('Set COGS $ for ')
                  setIsExpanded(true)
                }}
                className="px-3 py-1 text-xs font-medium rounded-full transition-colors"
                style={{ backgroundColor: STARBUCKS.lightGreen, color: STARBUCKS.darkGreen }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.primaryGreen + '30'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
              >
                Set COGS
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 text-xs font-medium rounded-full transition-colors"
                style={{ backgroundColor: STARBUCKS.lightGreen, color: STARBUCKS.darkGreen }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.primaryGreen + '30'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
              >
                Upload Excel
              </button>
              <button
                onClick={() => {
                  setInputValue('help')
                  handleSend()
                  setIsExpanded(true)
                }}
                className="px-3 py-1 text-xs font-medium rounded-full transition-colors"
                style={{ backgroundColor: STARBUCKS.lightGreen, color: STARBUCKS.darkGreen }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.primaryGreen + '30'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
              >
                Help
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
