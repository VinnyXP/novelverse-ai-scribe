import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for conversation memory entries
 */
export interface MemoryEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Service for managing AI conversation memory
 */
export const aiMemoryService = {
  /**
   * In-memory storage for conversation history
   * In a production app, this would be stored in a database
   */
  sessionMemory: new Map<string, MemoryEntry[]>(),
  
  /**
   * Initialize a new conversation session
   */
  initSession(sessionId: string, systemPrompt: string = 'You are a helpful AI assistant.'): void {
    const initialMemory: MemoryEntry[] = [{
      role: 'system',
      content: systemPrompt,
      timestamp: new Date()
    }];
    
    this.sessionMemory.set(sessionId, initialMemory);
  },
  
  /**
   * Add a user message to the conversation history
   */
  addUserMessage(sessionId: string, message: string): void {
    const session = this.getOrCreateSession(sessionId);
    session.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    this.sessionMemory.set(sessionId, session);
  },
  
  /**
   * Add an AI response to the conversation history
   */
  addAssistantMessage(sessionId: string, message: string): void {
    const session = this.getOrCreateSession(sessionId);
    session.push({
      role: 'assistant',
      content: message,
      timestamp: new Date()
    });
    this.sessionMemory.set(sessionId, session);
  },
  
  /**
   * Get the full conversation history for a session
   */
  getSessionMemory(sessionId: string): MemoryEntry[] {
    return this.getOrCreateSession(sessionId);
  },
  
  /**
   * Get conversation history in the format needed for OpenAI API
   */
  getOpenAIMessages(sessionId: string): { role: string, content: string }[] {
    const session = this.getOrCreateSession(sessionId);
    return session.map(entry => ({
      role: entry.role,
      content: entry.content
    }));
  },
  
  /**
   * Helper to get or create a session
   */
  getOrCreateSession(sessionId: string): MemoryEntry[] {
    if (!this.sessionMemory.has(sessionId)) {
      this.initSession(sessionId);
    }
    return this.sessionMemory.get(sessionId) || [];
  },
  
  /**
   * Clear a conversation session
   */
  clearSession(sessionId: string): void {
    this.sessionMemory.delete(sessionId);
  }
};
