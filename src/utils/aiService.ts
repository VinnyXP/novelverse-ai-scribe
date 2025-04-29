
import { AIModel, StoryCreationSettings, Story, Chapter } from '../types';

// API Base URL for the Python backend
const API_BASE_URL = 'http://localhost:8081';

export const aiService = {
  generateStory: async (settings: StoryCreationSettings): Promise<Story> => {
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

      // Transform the LangGraph response into our Story format
      const langGraphResponse = await response.json();
      
      // Process the response into our Story format
      // This transformation will depend on what your Python backend returns
      const story: Story = {
        id: crypto.randomUUID(),
        title: settings.title || "Generated Story",
        synopsis: settings.synopsis || "",
        coverImage: settings.coverImage || "",
        authorId: "user",
        authorName: "AI Generator",
        tags: settings.tags.map(tag => ({ id: tag, name: tag })),
        volumes: Array(settings.volumeCount).fill(null).map((_, volumeIndex) => ({
          id: crypto.randomUUID(),
          title: `Volume ${volumeIndex + 1}`,
          order: volumeIndex + 1,
          storyId: "temp-id",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          chapters: Array(settings.chaptersPerVolume).fill(null).map((_, chapterIndex) => ({
            id: crypto.randomUUID(),
            title: `Chapter ${chapterIndex + 1}`,
            content: langGraphResponse.chapter || "Generated content will appear here.",
            order: chapterIndex + 1,
            volumeId: "temp-volume-id",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        isPublished: false
      };

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
