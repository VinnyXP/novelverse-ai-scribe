import { StoryCreationSettings } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Chapter {
  volume: number;
  chapter: number;
  content: string;
}

export interface AIModel {
  name: string;
  displayName: string;
}

class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateStory(settings: StoryCreationSettings): Promise<Chapter[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: settings.title,
          synopsis: settings.synopsis,
          total_volumes: settings.volumeCount,
          chapters_per_volume: settings.chaptersPerVolume,
          model_name: settings.aiModel,
          tags: settings.tags
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      // Transform the response into the expected Chapter format
      const chapters: Chapter[] = [];
      
      // Handle the volumes object from the backend
      Object.entries(data.volumes).forEach(([volumeKey, chaptersInVolume]: [string, any]) => {
        // Extract volume number from the key (e.g., "Volume 1" -> 1)
        const volumeNumber = parseInt(volumeKey.split(' ')[1]);
        
        // Add each chapter to our array
        chaptersInVolume.forEach((chapter: any) => {
          chapters.push({
            volume: volumeNumber,
            chapter: chapter.chapter,
            content: chapter.content
          });
        });
      });
      
      return chapters;
    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  }

  async generateCoverImage(synopsis: string, tags: string[]): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          synopsis,
          tags
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover image');
      }

      const data = await response.json();
      return data.image_url;
    } catch (error) {
      console.error('Error generating cover image:', error);
      throw error;
    }
  }
}

export const aiService = AIService.getInstance(); 