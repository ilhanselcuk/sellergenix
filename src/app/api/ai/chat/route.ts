// AI Chat API Route
// POST /api/ai/chat

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { chat } from '@/lib/ai/chat';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get userId from query params or body
    const { searchParams } = new URL(request.url);
    const body = await request.json();

    const userId = searchParams.get('userId') || body.userId;
    const message = body.message;
    const conversationHistory = body.conversationHistory || [];

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Verify user exists and has Amazon connection
    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'No Amazon connection found for this user' },
        { status: 404 }
      );
    }

    // Call AI chat service
    const response = await chat({
      userId,
      message: message.trim(),
      conversationHistory,
    });

    // Log usage to database (optional - for analytics)
    try {
      await supabase.from('ai_chat_history').insert({
        user_id: userId,
        conversation_id: body.conversationId || crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        model: null,
        tokens_input: 0,
        tokens_output: 0,
        cost: 0,
      });

      await supabase.from('ai_chat_history').insert({
        user_id: userId,
        conversation_id: body.conversationId || crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        model: response.model,
        tokens_input: response.tokensUsed.input,
        tokens_output: response.tokensUsed.output,
        cost: response.cost,
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Failed to log AI chat history:', logError);
    }

    return NextResponse.json({
      success: true,
      response: response.response,
      model: response.model,
      usage: {
        inputTokens: response.tokensUsed.input,
        outputTokens: response.tokensUsed.output,
        totalTokens: response.tokensUsed.input + response.tokensUsed.output,
        cost: response.cost,
      },
      classification: response.classification,
    });
  } catch (error) {
    console.error('AI Chat API error:', error);

    // Handle specific Anthropic errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API configuration' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
