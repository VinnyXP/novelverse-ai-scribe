
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ChapterEditor from "@/components/ChapterEditor";
import { Loader2, Save, ChevronLeft } from "lucide-react";
import { Story, Volume, Chapter } from "@/types";

const StoryEditor = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (storyId && user) {
      fetchStory();
    }
  }, [storyId, user]);

  const fetchStory = async () => {
    setIsLoading(true);
    try {
      // Fetch story details
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user?.id)
        .single();

      if (storyError) throw storyError;

      setTitle(storyData.title);
      setSynopsis(storyData.synopsis || "");
      setCoverImage(storyData.cover_image || "");

      // Fetch volumes
      const { data: volumesData, error: volumesError } = await supabase
        .from('volumes')
        .select('*')
        .eq('story_id', storyId)
        .order('order_number');

      if (volumesError) throw volumesError;

      // Fetch chapters for each volume
      const enhancedVolumes = await Promise.all(
        volumesData.map(async (volume) => {
          const { data: chaptersData, error: chaptersError } = await supabase
            .from('chapters')
            .select('*')
            .eq('volume_id', volume.id)
            .order('order_number');

          if (chaptersError) throw chaptersError;

          const formattedChapters: Chapter[] = chaptersData.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content || "",
            order: chapter.order_number,
            volumeId: chapter.volume_id,
            createdAt: chapter.created_at,
            updatedAt: chapter.updated_at
          }));

          return {
            id: volume.id,
            title: volume.title,
            order: volume.order_number,
            chapters: formattedChapters,
            storyId: volume.story_id,
            createdAt: volume.created_at,
            updatedAt: volume.updated_at
          };
        })
      );

      setVolumes(enhancedVolumes);
      
      // Set active volume and chapter if available
      if (enhancedVolumes.length > 0) {
        setActiveVolumeId(enhancedVolumes[0].id);
        if (enhancedVolumes[0].chapters.length > 0) {
          setActiveChapterId(enhancedVolumes[0].chapters[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      toast({
        title: "Error",
        description: "Failed to load the story",
        variant: "destructive"
      });
      navigate("/profile");
    } finally {
      setIsLoading(false);
    }
  };

  const saveStoryDetails = async () => {
    if (!storyId || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stories')
        .update({
          title,
          synopsis,
          cover_image: coverImage
        })
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story details updated successfully"
      });
    } catch (error) {
      console.error("Error saving story details:", error);
      toast({
        title: "Error",
        description: "Failed to save story details",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveVolumeTitle = async (volumeId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('volumes')
        .update({ title: newTitle })
        .eq('id', volumeId);

      if (error) throw error;

      setVolumes(volumes.map(volume => 
        volume.id === volumeId ? { ...volume, title: newTitle } : volume
      ));

      toast({
        title: "Success",
        description: "Volume title updated"
      });
    } catch (error) {
      console.error("Error updating volume title:", error);
      toast({
        title: "Error",
        description: "Failed to update volume title",
        variant: "destructive"
      });
    }
  };

  const saveChapter = async (chapter: Chapter) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: chapter.title,
          content: chapter.content
        })
        .eq('id', chapter.id);

      if (error) throw error;

      // Update local state
      setVolumes(volumes.map(volume => {
        if (volume.id === chapter.volumeId) {
          return {
            ...volume,
            chapters: volume.chapters.map(ch => 
              ch.id === chapter.id ? chapter : ch
            )
          };
        }
        return volume;
      }));

      toast({
        title: "Success",
        description: "Chapter saved successfully"
      });
      
      return true;
    } catch (error) {
      console.error("Error saving chapter:", error);
      toast({
        title: "Error",
        description: "Failed to save chapter",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const findActiveChapter = (): Chapter | undefined => {
    if (!activeVolumeId || !activeChapterId) return undefined;
    
    const volume = volumes.find(v => v.id === activeVolumeId);
    if (!volume) return undefined;
    
    return volume.chapters.find(c => c.id === activeChapterId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="animate-spin h-12 w-12 text-novel-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="bg-muted/30 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
              <span onClick={() => navigate("/profile")}>
                <ChevronLeft size={16} />
                Back to My Stories
              </span>
            </Button>
            {activeTab === "details" && (
              <Button 
                onClick={saveStoryDetails}
                disabled={isSaving}
                size="sm"
                className="h-8 gap-1 bg-novel-600 hover:bg-novel-700"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-6 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">{title || "Untitled Story"}</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="details">Story Details</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter story title"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Synopsis</label>
                    <Textarea
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      placeholder="Enter a synopsis for your story..."
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-sm font-medium">Cover Image</label>
                  <div className="aspect-[2/3] border rounded-lg overflow-hidden bg-muted/30">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No cover image
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="cover-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("cover-upload")?.click()}
                    >
                      Upload Cover Image
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chapters" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
                {/* Volumes and Chapters sidebar */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="font-semibold mb-4">Table of Contents</h3>
                  {volumes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No volumes yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {volumes.map((volume) => (
                        <div key={volume.id} className="space-y-2">
                          <div 
                            className="font-medium cursor-pointer hover:text-novel-600 flex justify-between items-center"
                            onClick={() => setActiveVolumeId(volume.id !== activeVolumeId ? volume.id : null)}
                          >
                            <span>Volume {volume.order}: {volume.title}</span>
                          </div>
                          
                          {activeVolumeId === volume.id && (
                            <div className="pl-4 border-l space-y-1">
                              {volume.chapters.map((chapter) => (
                                <div 
                                  key={chapter.id}
                                  onClick={() => setActiveChapterId(chapter.id)}
                                  className={`cursor-pointer py-1 px-2 rounded text-sm ${
                                    activeChapterId === chapter.id 
                                      ? "bg-novel-100 text-novel-900 dark:bg-novel-900/20 dark:text-novel-100" 
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  Chapter {chapter.order}: {chapter.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Chapter editor */}
                <div>
                  {activeChapterId && findActiveChapter() ? (
                    <ChapterEditor 
                      chapter={findActiveChapter()!}
                      onSave={saveChapter}
                    />
                  ) : (
                    <div className="border rounded-lg p-8 text-center bg-muted/20">
                      <h3 className="font-semibold mb-2">No Chapter Selected</h3>
                      <p className="text-muted-foreground">
                        Please select a chapter from the table of contents to edit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StoryEditor;
