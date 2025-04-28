
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Story } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StoryCard from "@/components/StoryCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserStories();
  }, [user]);

  const fetchUserStories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          synopsis,
          cover_image,
          created_at,
          updated_at,
          user_id
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform to match our Story type
      const formattedStories: Story[] = data.map(story => ({
        id: story.id,
        title: story.title,
        synopsis: story.synopsis || '',
        coverImage: story.cover_image || '',
        authorId: story.user_id,
        authorName: user.email?.split('@')[0] || 'Anonymous', // Basic username from email
        tags: [],
        volumes: [],
        createdAt: story.created_at,
        updatedAt: story.updated_at,
        views: 0,
        likes: 0,
        isPublished: true
      }));
      
      setStories(formattedStories);
    } catch (error: any) {
      console.error('Error fetching user stories:', error);
      toast({
        title: "Error",
        description: "Failed to load your stories",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
      
      if (error) throw error;
      
      setStories(stories.filter(story => story.id !== storyId));
      toast({
        title: "Success",
        description: "Story deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Stories</h1>
            <Button 
              onClick={() => navigate('/create')} 
              className="flex items-center gap-2 bg-novel-600 hover:bg-novel-700"
            >
              <Plus size={18} /> Create New Story
            </Button>
          </div>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All Stories</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
              ) : stories.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
                  <p className="text-muted-foreground mb-6">Create your first story to get started</p>
                  <Button onClick={() => navigate('/create')} className="bg-novel-600 hover:bg-novel-700">
                    Start Creating
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <div key={story.id} className="relative group">
                      <StoryCard story={story} />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                          onClick={() => navigate(`/story/edit/${story.id}`)}
                        >
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Story</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{story.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteStory(story.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="pt-6">
              <div className="text-center py-12 bg-muted/30 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
                <p className="text-muted-foreground">Draft filtering will be available in a future update</p>
              </div>
            </TabsContent>

            <TabsContent value="published" className="pt-6">
              <div className="text-center py-12 bg-muted/30 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
                <p className="text-muted-foreground">Publication status will be available in a future update</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
