import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StoryReader from "@/components/story/StoryReader";
import { Button } from "@/components/ui/button";
import { Story } from "@/types";
import { ChevronLeft } from "lucide-react";
import { sampleStories } from "@/utils/dummyData";

const Read = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, this would be an API call
    setLoading(true);
    setTimeout(() => {
      const foundStory = sampleStories.find(s => s.id === storyId) || null;
      setStory(foundStory);
      setLoading(false);
    }, 500);
  }, [storyId]);

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
              We couldn't find the story you're looking for.
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
