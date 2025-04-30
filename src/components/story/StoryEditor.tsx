import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Story } from '@/types';

interface StoryEditorProps {
  story: Story;
  onSave: (story: Story) => void;
}

const StoryEditor = ({ story, onSave }: StoryEditorProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editedStory, setEditedStory] = useState<Story>(story);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stories')
        .update({
          title: editedStory.title,
          synopsis: editedStory.synopsis,
          is_published: editedStory.isPublished,
          published_at: editedStory.isPublished ? new Date().toISOString() : null
        })
        .eq('id', story.id);

      if (error) throw error;

      onSave(editedStory);
      toast({
        title: "Story Updated",
        description: "Your story has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your story.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Story Title</Label>
          <Input 
            id="title"
            value={editedStory.title}
            onChange={(e) => setEditedStory(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="synopsis">Synopsis</Label>
          <Textarea 
            id="synopsis"
            value={editedStory.synopsis}
            onChange={(e) => setEditedStory(prev => ({ ...prev, synopsis: e.target.value }))}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="publish-toggle"
            checked={editedStory.isPublished}
            onCheckedChange={(checked) => setEditedStory(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="publish-toggle">Publish story</Label>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Story Details</h3>
          <div className="space-y-4">
            <div className="flex">
              <div className="w-1/3 font-medium">Volumes:</div>
              <div className="w-2/3">{story.volumes.length}</div>
            </div>
            <div className="flex">
              <div className="w-1/3 font-medium">Total Chapters:</div>
              <div className="w-2/3">
                {story.volumes.reduce((acc, volume) => acc + volume.chapters.length, 0)}
              </div>
            </div>
            <div className="flex">
              <div className="w-1/3 font-medium">Status:</div>
              <div className="w-2/3">
                {editedStory.isPublished ? 'Published' : 'Draft'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-novel-600 hover:bg-novel-700"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default StoryEditor; 