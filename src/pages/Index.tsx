
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoryCard from "@/components/StoryCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, PenTool, Sparkles, Tag } from "lucide-react";
import { sampleStories, tags } from "@/utils/dummyData";

const Index = () => {
  const [tabValue, setTabValue] = useState("trending");
  const featuredStories = sampleStories.slice(0, 3);
  const trendingStories = [...sampleStories].sort((a, b) => b.views - a.views);
  const recentStories = [...sampleStories].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero section */}
        <section className="relative bg-gradient-to-b from-background to-secondary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                AI-Generated Web Novels <br />
                <span className="text-novel-600">Created By You</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Craft captivating stories with the help of AI. Customize your narrative, 
                choose your genre, and watch your imagination come to life.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="bg-novel-600 hover:bg-novel-700 text-white" size="lg" asChild>
                  <Link to="/create">Create Your Story</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/browse">Browse Stories</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="hidden md:block absolute top-1/2 left-16 -translate-y-1/2 opacity-20">
            <BookOpen size={120} className="text-novel-600" />
          </div>
          <div className="hidden md:block absolute top-1/4 right-16 -translate-y-1/2 opacity-20">
            <PenTool size={100} className="text-novel-600" />
          </div>
        </section>

        {/* Featured Stories */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/browse">View All Stories</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
              How It Works
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Creating your own AI-powered web novel is simple and fun
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-novel-100 w-12 h-12 flex items-center justify-center mb-4">
                    <Sparkles size={20} className="text-novel-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">1. Describe Your Vision</h3>
                  <p className="text-muted-foreground">
                    Provide a synopsis and select tags/motifs that will shape your story's world and characters.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-novel-100 w-12 h-12 flex items-center justify-center mb-4">
                    <PenTool size={20} className="text-novel-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">2. Structure Your Novel</h3>
                  <p className="text-muted-foreground">
                    Choose how many volumes and chapters your story will have, and select or generate a cover image.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-novel-100 w-12 h-12 flex items-center justify-center mb-4">
                    <BookOpen size={20} className="text-novel-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">3. Generate & Edit</h3>
                  <p className="text-muted-foreground">
                    Our AI creates your story based on your specifications. Review, edit, and publish when ready.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-10">
              <Button className="bg-novel-600 hover:bg-novel-700" asChild>
                <Link to="/create">Start Creating Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Browse Stories */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              Browse Stories
            </h2>

            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>

                <Link to="/browse" className="text-novel-600 hover:underline text-sm">
                  View All
                </Link>
              </div>

              <TabsContent value="trending" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingStories.slice(0, 4).map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentStories.slice(0, 4).map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Popular Tags */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Tag size={20} className="text-novel-600" />
              <h2 className="text-2xl md:text-3xl font-bold">Popular Tags</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/browse?tag=${tag.id}`}
                  className="px-4 py-2 bg-secondary rounded-full text-sm hover:bg-novel-600 hover:text-white transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
