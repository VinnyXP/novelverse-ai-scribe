
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Story, Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import StoryCard from "@/components/StoryCard";
import { supabase } from "@/integrations/supabase/client";

const Browse = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([
    { id: "fantasy", name: "Fantasy" },
    { id: "romance", name: "Romance" },
    { id: "adventure", name: "Adventure" },
    { id: "science-fiction", name: "Science Fiction" },
    { id: "mystery", name: "Mystery" },
    { id: "thriller", name: "Thriller" },
    { id: "horror", name: "Horror" },
  ]);

  useEffect(() => {
    fetchPublishedStories();
  }, []);

  const fetchPublishedStories = async () => {
    setIsLoading(true);
    try {
      // Fetch from sample stories first
      const { sampleStories } = await import('@/utils/dummyData');
      
      // Fetch from Supabase
      const { data: supabaseStories, error } = await supabase
        .from('stories')
        .select(`
          id, title, synopsis, cover_image, user_id, created_at, updated_at, is_published
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch from localStorage for AI-generated stories
      const savedStoriesJson = localStorage.getItem('ai-generated-stories');
      let aiPublishedStories: Story[] = [];
      if (savedStoriesJson) {
        const allAiStories: Story[] = JSON.parse(savedStoriesJson);
        aiPublishedStories = allAiStories.filter(story => story.isPublished);
      }
      
      // Transform Supabase data to match our Story type
      const formattedSupabaseStories: Story[] = supabaseStories.map(story => ({
        id: story.id,
        title: story.title,
        synopsis: story.synopsis || '',
        coverImage: story.cover_image || '',
        authorId: story.user_id,
        authorName: 'Author', // We could fetch author name from profiles
        tags: [],
        volumes: [],
        createdAt: story.created_at,
        updatedAt: story.updated_at,
        views: 0,
        likes: 0,
        isPublished: story.is_published
      }));
      
      // Combine all sources
      const allStories = [...sampleStories, ...formattedSupabaseStories, ...aiPublishedStories];
      setStories(allStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      searchQuery === "" ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.synopsis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        story.tags.some((storyTag) => storyTag.id === tag)
      );

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-8 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Browse Stories</h1>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="md:w-2/3">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search by title or synopsis..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            
            <div className="md:w-1/3 flex flex-wrap items-center gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-t-novel-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-md">
              <h3 className="text-xl font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                setSelectedTags([]);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  onClick={() => navigate(`/read/${story.id}`)} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
