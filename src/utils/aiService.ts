
import { AIModel, StoryCreationSettings, Story, Chapter } from '../types';
import { supabase } from '../integrations/supabase/client';

// Replace this with your actual Python backend URL
const API_BASE_URL = 'https://your-python-backend-url.com';

export const aiService = {
  generateStory: async (settings: StoryCreationSettings): Promise<Story> => {
    try {
      // Call our Supabase edge function instead of directly calling Python service
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: settings.userId, // Make sure userId is passed in settings
          title: settings.title,
          synopsis: settings.synopsis,
          cover_image: settings.coverImage,
          is_published: false // Start as unpublished until generation completes
        })
        .select('id')
        .single();

      if (storyError) throw storyError;
      const storyId = storyData.id;

      // Create volumes and chapters structure
      for (let i = 0; i < settings.volumeCount; i++) {
        const { data: volumeData, error: volumeError } = await supabase
          .from('volumes')
          .insert({
            story_id: storyId,
            title: `Volume ${i + 1}`,
            order_number: i + 1
          })
          .select('id')
          .single();

        if (volumeError) throw volumeError;

        const chapters = [];
        for (let j = 0; j < settings.chaptersPerVolume; j++) {
          chapters.push({
            volume_id: volumeData.id,
            title: `Chapter ${j + 1}`,
            content: 'Generating content...',
            order_number: j + 1
          });
        }
        
        const { error: chaptersError } = await supabase
          .from('chapters')
          .insert(chapters);

        if (chaptersError) throw chaptersError;
      }

      // Call the edge function to generate content
      const { data: generationData, error: generationError } = await supabase.functions.invoke(
        'story-generator',
        {
          body: {
            storyId,
            settings: {
              ...settings,
              title: settings.title // Pass title for better context
            }
          }
        }
      );

      if (generationError) {
        console.error("Error calling story generator:", generationError);
        // We don't throw here to allow the function to continue
      } else {
        console.log("Story generation started:", generationData);
      }

      // Return the story with its structure
      const { data: fullStory, error: fetchError } = await supabase
        .from('stories')
        .select(`
          id, title, synopsis, cover_image, created_at, updated_at, user_id,
          volumes (
            id, title, order_number, created_at, updated_at,
            chapters (
              id, title, content, order_number, created_at, updated_at
            )
          )
        `)
        .eq('id', storyId)
        .single();

      if (fetchError) throw fetchError;
      
      // Format as Story type
      const story: Story = {
        id: fullStory.id,
        title: fullStory.title,
        synopsis: fullStory.synopsis || '',
        coverImage: fullStory.cover_image || '',
        authorId: fullStory.user_id,
        authorName: 'Author', // This would need to be fetched separately
        tags: settings.tags.map(tagId => ({
          id: tagId,
          name: tagId
        })),
        volumes: fullStory.volumes.map((volume: any) => ({
          id: volume.id,
          title: volume.title,
          order: volume.order_number,
          storyId: fullStory.id,
          createdAt: volume.created_at,
          updatedAt: volume.updated_at,
          chapters: volume.chapters.map((chapter: any) => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content || 'Content is being generated...',
            order: chapter.order_number,
            volumeId: volume.id,
            createdAt: chapter.created_at,
            updatedAt: chapter.updated_at
          }))
        })),
        createdAt: fullStory.created_at,
        updatedAt: fullStory.updated_at,
        views: 0,
        likes: 0,
        isPublished: true
      };
      
      return story;
    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  },
  
  generateCoverImage: async (synopsis: string, tags: string[]): Promise<string> => {
    try {
      // Call our edge function or Python backend for image generation
      const { data, error } = await supabase.functions.invoke('story-generator', {
        body: { 
          action: 'generate-cover',
          payload: { synopsis, tags }
        }
      });

      if (error) throw error;
      return data.imageUrl || '/placeholder.svg';
    } catch (error) {
      console.error('Error generating cover image:', error);
      return '/placeholder.svg'; // Fallback to placeholder
    }
  },
  
  updateChapter: async (chapterId: string, newContent: string): Promise<Chapter> => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .update({ content: newContent })
        .eq('id', chapterId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        order: data.order_number,
        volumeId: data.volume_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  }
};
