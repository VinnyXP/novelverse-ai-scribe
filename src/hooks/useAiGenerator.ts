import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/services/ai/aiService';
import { Story, StoryCreationSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useAiGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);
  const { toast } = useToast();

  const generateStory = async (settings: StoryCreationSettings) => {
    setIsGenerating(true);
    try {
      const chapters = await aiService.generateStory(settings);
      
      // Transform chapters into a Story object
      const story: Story = {
        id: uuidv4(),
        title: settings.title,
        synopsis: settings.synopsis,
        coverImage: settings.coverImage || '',
        authorId: '', // This will be set by the parent component
        authorName: '', // This will be set by the parent component
        tags: settings.tags.map(tagId => ({ id: tagId, name: tagId })), // Basic tag mapping
        volumes: Array.from({ length: settings.volumeCount }, (_, i) => ({
          id: uuidv4(),
          title: `Volume ${i + 1}`,
          order: i + 1,
          storyId: '', // Will be set when saved to database
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          chapters: chapters
            .filter(chapter => chapter.volume === i + 1)
            .map((chapter, j) => ({
              id: uuidv4(),
              title: `Chapter ${j + 1}`,
              content: chapter.content,
              order: j + 1,
              volumeId: '', // Will be set when saved to database
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        isPublished: settings.isPublished
      };

      setGeneratedStory(story);
      
      // Save to localStorage
      const savedStoriesJson = localStorage.getItem('ai-generated-stories');
      const savedStories: Story[] = savedStoriesJson ? JSON.parse(savedStoriesJson) : [];
      savedStories.push(story);
      localStorage.setItem('ai-generated-stories', JSON.stringify(savedStories));
      
      toast({
        title: "Success",
        description: "Story generated successfully!",
      });
      
      return story;
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverImage = async (synopsis: string, tags: string[]) => {
    try {
      const imageUrl = await aiService.generateCoverImage(synopsis, tags);
      return imageUrl;
    } catch (error) {
      console.error('Error generating cover image:', error);
      toast({
        title: "Error",
        description: "Failed to generate cover image. Using placeholder instead.",
        variant: "destructive"
      });
      return '/placeholder.svg';
    }
  };

  return {
    isGenerating,
    generatedStory,
    generateStory,
    generateCoverImage
  };
}
