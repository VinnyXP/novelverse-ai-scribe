
import { AIModel, StoryCreationSettings, Story, Chapter } from '../types';

// Replace this with your actual Python backend URL
const API_BASE_URL = 'https://your-python-backend-url.com';

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

      const story: Story = await response.json();
      return story;
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
