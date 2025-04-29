
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoryReader from "@/components/StoryReader";
import { Button } from "@/components/ui/button";
import { Story } from "@/types";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Read = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        // Try to fetch from local storage first (for AI-generated stories)
        const savedStoriesJson = localStorage.getItem('ai-generated-stories');
        if (savedStoriesJson) {
          const allStories: Story[] = JSON.parse(savedStoriesJson);
          const foundStory = allStories.find(s => s.id === storyId && s.isPublished);
          if (foundStory) {
            setStory(foundStory);
            setLoading(false);
            return;
          }
        }
        
        // Try to fetch from Supabase next
        const { data, error } = await supabase
          .from('stories')
          .select(`
            id, title, synopsis, cover_image, user_id, created_at, updated_at, is_published,
            volumes (
              id, title, order_number, created_at, updated_at,
              chapters (
                id, title, content, order_number, created_at, updated_at
              )
            )
          `)
          .eq('id', storyId)
          .eq('is_published', true)
          .single();

        if (error) {
          // If no published story found in Supabase, fall back to sample stories
          const { sampleStories } = await import('@/utils/dummyData');
          const foundStory = sampleStories.find(s => s.id === storyId);
          setStory(foundStory || null);
          return;
        }
        
        // Transform the response to match our Story type
        const formattedStory: Story = {
          id: data.id,
          title: data.title,
          synopsis: data.synopsis || '',
          coverImage: data.cover_image || '',
          authorId: data.user_id,
          authorName: 'Author', // We could fetch author name from profiles if we had that table
          tags: [],
          volumes: data.volumes.map((volume: any) => ({
            id: volume.id,
            title: volume.title,
            order: volume.order_number,
            storyId: data.id,
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
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          views: 0,
          likes: 0,
          isPublished: data.is_published || false
        };
        
        setStory(formattedStory);
      } catch (error) {
        console.error('Error fetching story:', error);
        toast({
          title: "Error",
          description: "Failed to load the story.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (storyId) {
      fetchStory();
    }
  }, [storyId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading story...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the story you're looking for. It may not exist or it hasn't been published.
            </p>
            <Button asChild>
              <Link to="/browse">Browse Stories</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="bg-muted/30 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
              <Link to="/browse">
                <ChevronLeft size={16} />
                Back to Browse
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-4 bg-background">
        <StoryReader story={story} />
      </main>

      <Footer />
    </div>
  );
};

export default Read;
