
import { supabase } from '@/integrations/supabase/client';
import { Story, Chapter, Volume, StoryCreationSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Service for interacting with story-related data in the backend
 */
export const storyService = {
  /**
   * Fetch all stories for the current user
   */
  async getUserStories(): Promise<Story[]> {
    const { data: stories, error } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
    
    // Map the database response to our Story type
    return stories.map((story: any): Story => ({
      id: story.id,
      title: story.title,
      synopsis: story.synopsis || '',
      coverImage: story.cover_image || '',
      authorId: story.user_id,
      authorName: '', // We'll need to fetch this separately or join with profiles
      tags: [], // Tags would need a separate join/fetch
      volumes: story.volumes.map((volume: any) => ({
        id: volume.id,
        title: volume.title,
        order: volume.order_number,
        storyId: story.id,
        createdAt: volume.created_at,
        updatedAt: volume.updated_at,
        chapters: volume.chapters.map((chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order_number,
          volumeId: volume.id,
          createdAt: chapter.created_at,
          updatedAt: chapter.updated_at
        }))
      })),
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      views: 0, // These would need separate analytics tables
      likes: 0,
      isPublished: true // This would need an additional column
    }));
  },
  
  /**
   * Fetch a single story by ID
   */
  async getStory(storyId: string): Promise<Story> {
    const { data: story, error } = await supabase
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
    
    if (error) {
      console.error(`Error fetching story ${storyId}:`, error);
      throw error;
    }
    
    return {
      id: story.id,
      title: story.title,
      synopsis: story.synopsis || '',
      coverImage: story.cover_image || '',
      authorId: story.user_id,
      authorName: '', // Would need profile join
      tags: [],
      volumes: story.volumes.map((volume: any) => ({
        id: volume.id,
        title: volume.title,
        order: volume.order_number,
        storyId: story.id,
        createdAt: volume.created_at,
        updatedAt: volume.updated_at,
        chapters: volume.chapters.map((chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content || '',
          order: chapter.order_number,
          volumeId: volume.id,
          createdAt: chapter.created_at,
          updatedAt: chapter.updated_at
        }))
      })),
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      views: 0,
      likes: 0,
      isPublished: true
    };
  },
  
  /**
   * Update a chapter
   */
  async updateChapter(chapter: Chapter): Promise<boolean> {
    const { error } = await supabase
      .from('chapters')
      .update({
        title: chapter.title,
        content: chapter.content
      })
      .eq('id', chapter.id);
    
    if (error) {
      console.error(`Error updating chapter ${chapter.id}:`, error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Create a new story with the given settings
   */
  async createStory(settings: StoryCreationSettings, userId: string): Promise<Story | null> {
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          title: settings.title,
          synopsis: settings.synopsis,
          cover_image: settings.coverImage
        })
        .select('id')
        .single();

      if (storyError) throw storyError;

      for (let i = 0; i < settings.volumeCount; i++) {
        const { data: volumeData, error: volumeError } = await supabase
          .from('volumes')
          .insert({
            story_id: storyData.id,
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
            content: '',
            order_number: j + 1
          });
        }
        
        const { error: chaptersError } = await supabase
          .from('chapters')
          .insert(chapters);

        if (chaptersError) throw chaptersError;
      }

      const { data: fullStory, error: fetchError } = await supabase
        .from('stories')
        .select(`
          id, title, synopsis, cover_image, created_at, updated_at,
          volumes (
            id, title, order_number, created_at, updated_at,
            chapters (
              id, title, content, order_number, created_at, updated_at
            )
          )
        `)
        .eq('id', storyData.id)
        .single();

      if (fetchError) throw fetchError;
      
      return {
        id: fullStory.id,
        title: fullStory.title,
        synopsis: fullStory.synopsis || '',
        coverImage: fullStory.cover_image || '',
        authorId: userId,
        authorName: 'Anonymous', // Would need profile data
        tags: settings.tags.map(tagId => ({ id: tagId, name: tagId })),
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
            content: chapter.content || '',
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
    } catch (error: any) {
      console.error('Error creating story:', error);
      return null;
    }
  }
};
