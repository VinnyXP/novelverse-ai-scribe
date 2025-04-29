
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Story } from "@/types";
import { aiService } from "@/utils/aiService";
import { Plus, Book, Pencil, Eye } from "lucide-react";

const StoryManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // For demo purposes, we'll store the stories in localStorage
  useEffect(() => {
    const loadStories = () => {
      try {
        const savedStories = localStorage.getItem('ai-generated-stories');
        if (savedStories) {
          setStories(JSON.parse(savedStories));
        }
      } catch (error) {
        console.error("Failed to load stories:", error);
        toast({
          title: "Error",
          description: "Failed to load your stories.",
          variant: "destructive"
        });
      }
    };
    
    loadStories();
  }, [toast]);

  // Save stories to localStorage whenever the stories state changes
  useEffect(() => {
    if (stories.length > 0) {
      localStorage.setItem('ai-generated-stories', JSON.stringify(stories));
    }
  }, [stories]);

  const handleCreateStory = () => {
    navigate("/create");
  };

  const handleViewStory = (storyId: string) => {
    navigate(`/read/${storyId}`);
  };

  const handleEditStory = (storyId: string) => {
    navigate(`/story/edit/${storyId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stories...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My AI Generated Stories</h1>
            <Button onClick={handleCreateStory} className="bg-novel-600 hover:bg-novel-700">
              <Plus className="mr-2 h-4 w-4" /> Create New Story
            </Button>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <Book className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Stories Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't created any AI-generated stories yet. Click the button below to get started!
              </p>
              <Button onClick={handleCreateStory} className="bg-novel-600 hover:bg-novel-700">
                Create Your First Story
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-[3/2] relative overflow-hidden bg-muted">
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage} 
                        alt={story.title} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Cover Image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{story.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{story.synopsis}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex gap-1 flex-wrap">
                      {story.tags.map((tag) => (
                        <span 
                          key={tag.id} 
                          className="px-2 py-1 bg-muted text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => handleViewStory(story.id)} className="flex-1">
                      <Eye className="mr-2 h-4 w-4" /> Read
                    </Button>
                    <Button onClick={() => handleEditStory(story.id)} className="flex-1 bg-novel-600 hover:bg-novel-700">
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StoryManagement;
