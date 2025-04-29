import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Globe, Check } from "lucide-react";
import { Story } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      // Fetch from Supabase for logged-in user's stories
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
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Also fetch from localStorage for AI-generated stories
      const savedStoriesJson = localStorage.getItem('ai-generated-stories');
      let aiStories: Story[] = [];
      if (savedStoriesJson) {
        aiStories = JSON.parse(savedStoriesJson);
      }
      
      // Transform Supabase data to match our Story type
      const formattedStories: Story[] = (data || []).map(story => ({
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
        isPublished: true // Assume all database stories are published for now
      }));
      
      // Combine both sources
      const combinedStories = [...formattedStories, ...aiStories];
      setStories(combinedStories);
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
      // Check if it's a Supabase story first
      const isSupabaseStory = stories.find(s => s.id === storyId && s.authorId === user?.id);
      
      if (isSupabaseStory) {
        const { error } = await supabase
          .from('stories')
          .delete()
          .eq('id', storyId);
        
        if (error) throw error;
      } else {
        // Handle localStorage story deletion
        const savedStoriesJson = localStorage.getItem('ai-generated-stories');
        if (savedStoriesJson) {
          const savedStories: Story[] = JSON.parse(savedStoriesJson);
          const updatedStories = savedStories.filter(s => s.id !== storyId);
          localStorage.setItem('ai-generated-stories', JSON.stringify(updatedStories));
        }
      }
      
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

  const handleTogglePublish = async (story: Story) => {
    try {
      const updatedPublishState = !story.isPublished;
      
      // Handle AI-generated stories in localStorage
      if (story.authorId === 'user') {
        const savedStoriesJson = localStorage.getItem('ai-generated-stories');
        if (savedStoriesJson) {
          const savedStories: Story[] = JSON.parse(savedStoriesJson);
          const updatedStories = savedStories.map(s => 
            s.id === story.id 
              ? { ...s, isPublished: updatedPublishState } 
              : s
          );
          localStorage.setItem('ai-generated-stories', JSON.stringify(updatedStories));
        }
      }
      // Note: We can't update is_published in the database yet because it doesn't exist
      
      // Update local state
      setStories(stories.map(s => 
        s.id === story.id 
          ? { ...s, isPublished: updatedPublishState } 
          : s
      ));
      
      toast({
        title: "Success",
        description: updatedPublishState 
          ? "Story published successfully" 
          : "Story unpublished"
      });
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update story publish status",
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
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
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
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/story/edit/${story.id}`)}
                      >
                        <div className="overflow-hidden rounded-t-lg aspect-[2/3]">
                          <img
                            src={story.coverImage || '/placeholder.svg'}
                            alt={story.title}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4 border border-t-0 rounded-b-lg">
                          <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {story.synopsis}
                          </p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Last updated: {new Date(story.updatedAt).toLocaleDateString()}</span>
                            {story.isPublished && (
                              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Globe size={12} /> Published
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublish(story);
                          }}
                          title={story.isPublished ? "Unpublish" : "Publish"}
                        >
                          <Globe size={16} className={story.isPublished ? "text-green-500" : ""} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                              onClick={(e) => e.stopPropagation()}
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

            <TabsContent value="published" className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
              ) : stories.filter(story => story.isPublished).length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">No published stories</h3>
                  <p className="text-muted-foreground mb-6">Publish a story to make it visible to readers</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories
                    .filter(story => story.isPublished)
                    .map((story) => (
                      <div key={story.id} className="relative group">
                        <div 
                          className="cursor-pointer"
                          onClick={() => navigate(`/story/edit/${story.id}`)}
                        >
                          {/* Card content - same as in "all" tab */}
                          <div className="overflow-hidden rounded-t-lg aspect-[2/3]">
                            <img
                              src={story.coverImage || '/placeholder.svg'}
                              alt={story.title}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4 border border-t-0 rounded-b-lg">
                            <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {story.synopsis}
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Last updated: {new Date(story.updatedAt).toLocaleDateString()}</span>
                              <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Globe size={12} /> Published
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Action buttons - same as in "all" tab */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(story);
                            }}
                            title="Unpublish"
                          >
                            <Globe size={16} className="text-green-500" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                                onClick={(e) => e.stopPropagation()}
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
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
              ) : stories.filter(story => !story.isPublished).length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">No drafts</h3>
                  <p className="text-muted-foreground mb-6">All your stories are published</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories
                    .filter(story => !story.isPublished)
                    .map((story) => (
                      <div key={story.id} className="relative group">
                        <div 
                          className="cursor-pointer"
                          onClick={() => navigate(`/story/edit/${story.id}`)}
                        >
                          {/* Card content - same as in "all" tab */}
                          <div className="overflow-hidden rounded-t-lg aspect-[2/3]">
                            <img
                              src={story.coverImage || '/placeholder.svg'}
                              alt={story.title}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4 border border-t-0 rounded-b-lg">
                            <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {story.synopsis}
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Last updated: {new Date(story.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {/* Action buttons - same as in "all" tab */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(story);
                            }}
                            title="Publish"
                          >
                            <Globe size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive"
                                onClick={(e) => e.stopPropagation()}
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
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
