import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/utils/aiService';
import { Story, StoryCreationSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export function useAiGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);
  const { toast } = useToast();

  const generateStory = async (settings: StoryCreationSettings) => {
    setIsGenerating(true);
    try {
      // Call Supabase edge function instead of direct API call
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id || 'anonymous';

      if (user.user) {
        // Logged-in user flow - use the Supabase edge function
        const { data, error } = await supabase.functions.invoke('generate-story', {
          body: {
            aiModel: settings.aiModel,
            synopsis: settings.synopsis || "",
            tags: settings.tags || [],
            volumeCount: settings.volumeCount,
            chaptersPerVolume: settings.chaptersPerVolume,
            userId: userId
          }
        });

        if (error) throw error;
        
        if (data.success) {
          toast({
            title: "Success",
            description: "Story generated and saved to database!",
          });
          
          // Redirect to edit page for the new story
          return { id: data.storyId, redirect: true };
        } else {
          throw new Error(data.error || "Failed to generate story");
        }
      } else {
        // Guest user flow - use the local approach
        const response = await aiService.generateStory(settings);
        
        // Create a client-side story object
        const story: Story = {
          id: uuidv4(),
          title: settings.title || "Generated Story",
          synopsis: settings.synopsis || "",
          coverImage: settings.coverImage || "",
          authorId: "user",
          authorName: "AI Generator",
          tags: settings.tags.map(tag => ({ id: tag, name: tag })),
          volumes: Array(settings.volumeCount).fill(null).map((_, volumeIndex) => ({
            id: uuidv4(),
            title: `Volume ${volumeIndex + 1}`,
            order: volumeIndex + 1,
            storyId: "temp-id",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            chapters: Array(settings.chaptersPerVolume).fill(null).map((_, chapterIndex) => ({
              id: uuidv4(),
              title: `Chapter ${chapterIndex + 1}`,
              content: response.chapter || 
                `Chapter ${chapterIndex + 1} of Volume ${volumeIndex + 1}: Generated content based on synopsis '${settings.synopsis}' with selected tags.`,
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
      }
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
