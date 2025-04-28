
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chapter } from "@/types";
import { Loader2, Save } from "lucide-react";

interface ChapterEditorProps {
  chapter: Chapter;
  onSave: (chapter: Chapter) => Promise<boolean>;
}

const ChapterEditor = ({ chapter, onSave }: ChapterEditorProps) => {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isDirty) return;
    
    setIsSaving(true);
    try {
      const updatedChapter: Chapter = {
        ...chapter,
        title,
        content
      };
      
      const success = await onSave(updatedChapter);
      if (success) {
        setIsDirty(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Chapter {chapter.order}: Editing
        </h3>
        <Button 
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="gap-2 bg-novel-600 hover:bg-novel-700"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
          Save Chapter
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="chapter-title" className="text-sm font-medium">
            Chapter Title
          </label>
          <Input
            id="chapter-title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter chapter title"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="chapter-content" className="text-sm font-medium">
            Chapter Content
          </label>
          <Textarea
            id="chapter-content"
            value={content}
            onChange={handleContentChange}
            placeholder="Write your chapter content here..."
            className="min-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
};

export default ChapterEditor;
