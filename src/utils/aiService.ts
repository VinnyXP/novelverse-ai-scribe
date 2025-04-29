
import { AIModel, StoryCreationSettings, Story, Chapter } from '../types';

// API Base URL for the Python backend
const API_BASE_URL = 'http://localhost:8081';

export const aiService = {
  generateStory: async (settings: StoryCreationSettings): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_model: settings.aiModel,
          synopsis: settings.synopsis || "",
          tags: settings.tags || [],
          volume_count: settings.volumeCount,
          chapters_per_volume: settings.chaptersPerVolume
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Return the raw response from LangGraph
      return await response.json();
    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  },
  
  generateCoverImage: async (synopsis: string, tags: string[]): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ synopsis, tags }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error generating cover image:', error);
      throw error;
    }
  },
  
  updateChapter: async (chapterId: string, newContent: string): Promise<Chapter> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const chapter: Chapter = await response.json();
      return chapter;
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  }
};
