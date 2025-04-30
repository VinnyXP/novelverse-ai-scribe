import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Upload } from 'lucide-react';
import { tags } from '@/utils/dummyData';
import type { AIModel, StoryCreationSettings, Story } from '@/types';
import { aiService } from '@/services/ai/aiService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StoryCreatorProps {
  onStoryCreated?: (story: Story) => void;
}

const StoryCreator = ({ onStoryCreated }: StoryCreatorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoryCreationSettings>({
    title: '',
    synopsis: '',
    tags: [],
    volumeCount: 3,
    chaptersPerVolume: 10,
    aiModel: 'openai',
    isPublished: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCoverImage, setGeneratedCoverImage] = useState<string | null>(null);
  const [uploadedCoverImage, setUploadedCoverImage] = useState<string | null>(null);
  
  const updateSettings = (update: Partial<StoryCreationSettings>) => {
    setSettings(prev => ({ ...prev, ...update }));
  };

  const handleTagToggle = (tagId: string) => {
    setSettings(prev => {
      if (prev.tags.includes(tagId)) {
        return { ...prev, tags: prev.tags.filter(t => t !== tagId) };
      } else {
        return { ...prev, tags: [...prev.tags, tagId] };
      }
    });
  };

  const handleGenerateCover = async () => {
    if (!settings.synopsis || settings.tags.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a synopsis and select at least one tag to generate a cover image.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await aiService.generateCoverImage(settings.synopsis, settings.tags);
      setGeneratedCoverImage(imageUrl);
      updateSettings({ coverImage: imageUrl });
    } catch (error) {
      toast({
        title: "Cover Generation Failed",
        description: "There was an error generating your cover image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedCoverImage(result);
        updateSettings({ coverImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to create a story",
        variant: "destructive"
      });
      return;
    }

    if (!settings.title || !settings.synopsis || settings.tags.length === 0 || !settings.coverImage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before creating your story.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // First create the story structure in Supabase
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: settings.title,
          synopsis: settings.synopsis,
          cover_image: settings.coverImage
        })
        .select('id')
        .single();

      if (storyError) throw storyError;

      // Create volumes and empty chapters
      const volumeIds = [];
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
        volumeIds.push(volumeData.id);

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

      // Generate story content using AI
      const generatedChapters = await aiService.generateStory(settings);

      // Update chapters with generated content in sequence
      for (let volumeIndex = 0; volumeIndex < settings.volumeCount; volumeIndex++) {
        const volumeChapters = generatedChapters.filter(
          chapter => chapter.volume === volumeIndex + 1
        ).sort((a, b) => a.chapter - b.chapter);

        for (const chapter of volumeChapters) {
          const { error: updateError } = await supabase
            .from('chapters')
            .update({
              title: `Chapter ${chapter.chapter}`,
              content: chapter.content
            })
            .eq('volume_id', volumeIds[volumeIndex])
            .eq('order_number', chapter.chapter);

          if (updateError) throw updateError;
          
          // Add a small delay between updates to ensure order is maintained
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Fetch the complete story with all relationships
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
      
      // Transform the database response into our Story type
      const story: Story = {
        id: fullStory.id,
        title: fullStory.title,
        synopsis: fullStory.synopsis || '',
        coverImage: fullStory.cover_image || '',
        authorId: user.id,
        authorName: user.email?.split('@')[0] || 'Anonymous',
        tags: settings.tags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag || { id: tagId, name: tagId };
        }),
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
        isPublished: settings.isPublished
      };
      
      if (onStoryCreated) {
        onStoryCreated(story);
      }

      toast({
        title: "Story Created!",
        description: "Your story has been created successfully."
      });

      // Redirect to the story page
      navigate(`/stories/${story.id}`);

    } catch (error: any) {
      console.error('Error creating story:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      toast({
        title: "Creation Failed",
        description: error.message || "There was an error creating your story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create Your AI Novel</h2>
        <p className="text-muted-foreground">
          Fill in the details below to generate your story with AI assistance.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input 
                id="title"
                placeholder="Enter a captivating title for your story"
                value={settings.title}
                onChange={(e) => updateSettings({ title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea 
                id="synopsis"
                placeholder="Describe your story in a few sentences..."
                className="min-h-[120px]"
                value={settings.synopsis}
                onChange={(e) => updateSettings({ synopsis: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags/Motifs (Select multiple)</Label>
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Switch 
                      id={`tag-${tag.id}`}
                      checked={settings.tags.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <Tabs defaultValue="generate">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generate" className="space-y-4">
                  <Button 
                    onClick={handleGenerateCover} 
                    disabled={isGenerating}
                    className="w-full bg-novel-600 hover:bg-novel-700"
                  >
                    {isGenerating ? "Generating..." : "Generate Cover Image"}
                  </Button>
                  
                  {generatedCoverImage && (
                    <div className="aspect-[2/3] max-w-xs mx-auto border rounded-md overflow-hidden">
                      <img 
                        src={generatedCoverImage} 
                        alt="Generated cover" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload a cover image</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Recommended size: 600×900 pixels
                      </p>
                      <input
                        type="file"
                        id="cover-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('cover-upload')?.click()}
                      >
                        Select Image
                      </Button>
                    </div>
                  </div>
                  
                  {uploadedCoverImage && (
                    <div className="aspect-[2/3] max-w-xs mx-auto border rounded-md overflow-hidden">
                      <img 
                        src={uploadedCoverImage} 
                        alt="Uploaded cover" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="volume-count">Number of Volumes: {settings.volumeCount}</Label>
                </div>
                <Slider 
                  id="volume-count" 
                  min={1} 
                  max={10} 
                  step={1} 
                  value={[settings.volumeCount]}
                  onValueChange={(value) => updateSettings({ volumeCount: value[0] })}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="chapter-count">Chapters per Volume: {settings.chaptersPerVolume}</Label>
                </div>
                <Slider 
                  id="chapter-count" 
                  min={1} 
                  max={30} 
                  step={1} 
                  value={[settings.chaptersPerVolume]}
                  onValueChange={(value) => updateSettings({ chaptersPerVolume: value[0] })}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <span>30</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-medium mb-4">Select AI Model</Label>
              <RadioGroup
                value={settings.aiModel}
                onValueChange={(value) => updateSettings({ aiModel: value })}
                className="space-y-3"
              >
                <div 
                  className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors
                    ${settings.aiModel === 'openai' ? 'bg-gray-100' : ''}`}
                >
                  <RadioGroupItem 
                    value="openai" 
                    id="model-openai"
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor="model-openai"
                    className="text-lg font-medium cursor-pointer"
                  >
                    OpenAI GPT-4
                  </Label>
                </div>

                <div 
                  className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors
                    ${settings.aiModel === 'claude' ? 'bg-gray-100' : ''}`}
                >
                  <RadioGroupItem 
                    value="claude" 
                    id="model-claude"
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor="model-claude"
                    className="text-lg font-medium cursor-pointer"
                  >
                    Anthropic Claude
                  </Label>
                </div>

                <div 
                  className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors
                    ${settings.aiModel === 'gemini' ? 'bg-gray-100' : ''}`}
                >
                  <RadioGroupItem 
                    value="gemini" 
                    id="model-gemini"
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor="model-gemini"
                    className="text-lg font-medium cursor-pointer"
                  >
                    Google Gemini Pro
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="publish-toggle"
                checked={settings.isPublished}
                onCheckedChange={(checked) => updateSettings({ isPublished: checked })}
              />
              <Label htmlFor="publish-toggle">Publish story immediately</Label>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Story Structure Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Volumes</p>
                <p className="font-medium text-2xl">{settings.volumeCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chapters per Volume</p>
                <p className="font-medium text-2xl">{settings.chaptersPerVolume}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Chapters</p>
                <p className="font-medium text-2xl">{settings.volumeCount * settings.chaptersPerVolume}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Pages</p>
                <p className="font-medium text-2xl">{settings.volumeCount * settings.chaptersPerVolume * 15}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isGenerating}
            className="bg-novel-600 hover:bg-novel-700"
          >
            {isGenerating ? "Creating Story..." : "Create My Story"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
