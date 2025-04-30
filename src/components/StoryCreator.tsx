import { useState } from 'react';
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
import { Info, Check, Upload } from 'lucide-react';
import { tags } from '@/utils/dummyData';
import { AIModel, StoryCreationSettings, Story } from '@/types';
import { aiService } from '@/utils/aiService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StoryCreatorProps {
  onStoryCreated?: (story: Story) => void;
}

const StoryCreator = ({ onStoryCreated }: StoryCreatorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCoverImage, setGeneratedCoverImage] = useState<string | null>(null);
  const [uploadedCoverImage, setUploadedCoverImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoryCreationSettings>({
    title: '',
    synopsis: '',
    tags: [],
    volumeCount: 3,
    chaptersPerVolume: 10,
    aiModel: 'openai'
  });
  
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

  const handleNext = () => {
    if (activeStep === 1) {
      if (!settings.title || !settings.synopsis || settings.tags.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please provide a title, synopsis, and select at least one tag before continuing.",
          variant: "destructive"
        });
        return;
      }
    } else if (activeStep === 2) {
      if (!settings.coverImage) {
        toast({
          title: "Cover Image Required",
          description: "Please generate or upload a cover image before continuing.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
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

    setIsGenerating(true);
    try {
      // We've modified the aiService instead of directly using supabase here
      // This will create the story structure and trigger AI content generation
      const story = await aiService.generateStory({
        title: settings.title,
        synopsis: settings.synopsis,
        tags: settings.tags,
        volumeCount: settings.volumeCount,
        chaptersPerVolume: settings.chaptersPerVolume,
        coverImage: settings.coverImage,
        aiModel: settings.aiModel,
        userId: user.id // Pass the user ID for database operations
      });

      toast({
        title: "Story Created!",
        description: "Your story has been created and content is being generated."
      });
      
      if (onStoryCreated) {
        onStoryCreated(story);
      }
    } catch (error: any) {
      console.error('Error creating story:', error);
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
          Craft your perfect story with AI assistance. Complete each step to generate your novel.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border 
                ${activeStep >= step
                  ? 'bg-novel-600 text-white border-novel-600'
                  : 'bg-muted text-muted-foreground border-muted-foreground/50'}`}
            >
              {activeStep > step ? <Check size={18} /> : step}
            </div>
          ))}
        </div>
        <div className="w-full bg-muted h-2 rounded-full">
          <div 
            className="bg-novel-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(activeStep - 1) * 33.33}%` }} 
          />
        </div>
      </div>

      {activeStep === 1 && (
        <div className="space-y-6 animate-fade-in">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleNext} className="bg-novel-600 hover:bg-novel-700">
              Next Step
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate Cover</TabsTrigger>
              <TabsTrigger value="upload">Upload Cover</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-4">
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>AI Cover Generation</AlertTitle>
                <AlertDescription>
                  Our AI will generate a cover based on your synopsis and selected tags.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleGenerateCover} 
                disabled={isGenerating}
                className="w-full bg-novel-600 hover:bg-novel-700"
              >
                {isGenerating ? "Generating..." : "Generate Cover Image"}
              </Button>
              
              {generatedCoverImage && (
                <div className="mt-4">
                  <div className="aspect-[2/3] max-w-xs mx-auto border rounded-md overflow-hidden">
                    <img 
                      src={generatedCoverImage} 
                      alt="Generated cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
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
                <div className="mt-4">
                  <div className="aspect-[2/3] max-w-xs mx-auto border rounded-md overflow-hidden">
                    <img 
                      src={uploadedCoverImage} 
                      alt="Uploaded cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext} className="bg-novel-600 hover:bg-novel-700">
              Next Step
            </Button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="space-y-6 animate-fade-in">
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
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold">Story Structure Summary</p>
              </div>
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
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext} className="bg-novel-600 hover:bg-novel-700">
              Next Step
            </Button>
          </div>
        </div>
      )}

      {activeStep === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select AI Model</h3>
            <RadioGroup 
              value={settings.aiModel} 
              onValueChange={(value) => updateSettings({ aiModel: value as AIModel })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="model-openai" />
                <Label htmlFor="model-openai">OpenAI GPT-4</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="claude" id="model-claude" />
                <Label htmlFor="model-claude">Anthropic Claude</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="model-gemini" />
                <Label htmlFor="model-gemini">Google Gemini Pro</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Story Details</h3>
              <div className="space-y-4">
                <div className="flex">
                  <div className="w-1/3 font-medium">Title:</div>
                  <div className="w-2/3">{settings.title}</div>
                </div>
                <div className="flex">
                  <div className="w-1/3 font-medium">Synopsis:</div>
                  <div className="w-2/3">{settings.synopsis}</div>
                </div>
                <div className="flex">
                  <div className="w-1/3 font-medium">Tags:</div>
                  <div className="w-2/3">
                    {settings.tags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? tag.name + ', ' : '';
                    })}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/3 font-medium">Structure:</div>
                  <div className="w-2/3">
                    {settings.volumeCount} volumes, {settings.chaptersPerVolume} chapters each
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/3 font-medium">AI Model:</div>
                  <div className="w-2/3">
                    {settings.aiModel === 'openai' ? 'OpenAI GPT-4' : 
                     settings.aiModel === 'claude' ? 'Anthropic Claude' : 'Google Gemini Pro'}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/3 font-medium">Cover:</div>
                  <div className="w-2/3">
                    <div className="w-24 h-36 overflow-hidden rounded border">
                      {settings.coverImage && (
                        <img 
                          src={settings.coverImage} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertTitle>Ready to create</AlertTitle>
            <AlertDescription>
              Your story will be created based on the settings above.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isGenerating}
              className="bg-novel-600 hover:bg-novel-700"
            >
              {isGenerating ? "Creating Story..." : "Create My Story"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;
