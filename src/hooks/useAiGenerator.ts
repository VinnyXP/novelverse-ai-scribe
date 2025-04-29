
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/utils/aiService';
import { Story, StoryCreationSettings } from '@/types';

export function useAiGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);
  const { toast } = useToast();

  const generateStory = async (settings: StoryCreationSettings) => {
    setIsGenerating(true);
    try {
      const story = await aiService.generateStory(settings);
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
