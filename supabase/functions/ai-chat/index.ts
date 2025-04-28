
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Simple in-memory store for the edge function
// In production, you would use a database
const sessionStore = new Map<string, Array<{ role: string, content: string }>>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, systemPrompt } = await req.json();
    
    // Initialize or get session
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, [
        { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' }
      ]);
    }
    
    const messages = sessionStore.get(sessionId) || [];
    
    // Add the user message
    messages.push({ role: 'user', content: message });
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500
      }),
    });

    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Unknown error calling OpenAI API');
    }

    const assistantMessage = data.choices[0].message.content;
    
    // Add the assistant response to memory
    messages.push({ role: 'assistant', content: assistantMessage });
    sessionStore.set(sessionId, messages);

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversation: messages.filter(m => m.role !== 'system') // Don't send system prompt back to client
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in AI chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
