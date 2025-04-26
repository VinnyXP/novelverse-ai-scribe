
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { sampleStories, tags as allTags } from "@/utils/dummyData";
import { Story } from "@/types";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTagFilter = searchParams.get("tag");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTagFilter ? [initialTagFilter] : []
  );
  
  // Filter stories based on search query and selected tags
  const filteredStories = sampleStories.filter((story) => {
    // Filter by search query
    const matchesQuery = searchQuery === "" || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tagId => story.tags.some(tag => tag.id === tagId));
    
    return matchesQuery && matchesTags;
  });
  
  // Sort stories
  const sortedStories = [...filteredStories].sort((a, b) => {
    switch(sortBy) {
      case "popularity":
        return b.views - a.views;
      case "recent":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "likes":
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Browse Stories</h1>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <div className="bg-card rounded-lg border p-4 space-y-4">
                <h2 className="font-semibold text-lg">Filters</h2>
                
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="block mb-2">Tags</Label>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {allTags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <Label 
                          htmlFor={`tag-${tag.id}`}
                          className="cursor-pointer text-sm"
                        >
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            
            {/* Story grid */}
            <div className="flex-1">
              {/* Active filters */}
              {(selectedTags.length > 0 || searchQuery) && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  
                  {searchQuery && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: {searchQuery}
                      <X 
                        size={14} 
                        className="cursor-pointer ml-1" 
                        onClick={() => setSearchQuery("")}
                      />
                    </Badge>
                  )}
                  
                  {selectedTags.map(tagId => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                        {tag.name}
                        <X 
                          size={14} 
                          className="cursor-pointer ml-1" 
                          onClick={() => handleTagToggle(tagId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                  
                  <Button 
                    variant="ghost" 
                    className="text-xs h-7 ml-2"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {sortedStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedStories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground">No stories found matching your criteria.</p>
                  <Button 
                    variant="link" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Clear filters and try again
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
