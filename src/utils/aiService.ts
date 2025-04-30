
import { AIModel, StoryCreationSettings, Story, Chapter } from '../types';

// Update this to point to your Python backend
const API_BASE_URL = 'http://localhost:8081';

export const aiService = {
  generateStory: async (settings: StoryCreationSettings): Promise<Story> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // The Python backend returns a different structure, so we adapt it here
      return data; // You might need to transform the data to match your Story type
    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  },
  
  generateCoverImage: async (synopsis: string, tags: string[]): Promise<string> => {
    try {
      // Since your current Python code doesn't have this endpoint,
      // we'll return a placeholder until you add it
      return '/placeholder.svg';
      
      /* Uncomment this when you add the endpoint to your Python backend
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
      */
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
