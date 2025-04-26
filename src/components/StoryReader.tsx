
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chapter, Story, Volume } from '@/types';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

interface StoryReaderProps {
  story: Story;
}

const StoryReader = ({ story }: StoryReaderProps) => {
  const [activeVolume, setActiveVolume] = useState<Volume | null>(
    story.volumes && story.volumes.length > 0 ? story.volumes[0] : null
  );
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(
    activeVolume && activeVolume.chapters && activeVolume.chapters.length > 0 
      ? activeVolume.chapters[0] 
      : null
  );
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  const handleVolumeChange = (volumeId: string) => {
    const volume = story.volumes.find(v => v.id === volumeId) || null;
    setActiveVolume(volume);
    if (volume && volume.chapters.length > 0) {
      setActiveChapter(volume.chapters[0]);
    } else {
      setActiveChapter(null);
    }
  };

  const handleChapterChange = (chapterId: string) => {
    if (!activeVolume) return;
    const chapter = activeVolume.chapters.find(c => c.id === chapterId) || null;
    setActiveChapter(chapter);
    setShowTableOfContents(false);
  };

  const navigateToChapter = (direction: 'prev' | 'next') => {
    if (!activeVolume || !activeChapter) return;
    
    const currentIndex = activeVolume.chapters.findIndex(c => c.id === activeChapter.id);
    if (currentIndex === -1) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      // Previous chapter in same volume
      setActiveChapter(activeVolume.chapters[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < activeVolume.chapters.length - 1) {
      // Next chapter in same volume
      setActiveChapter(activeVolume.chapters[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex === 0) {
      // Try to go to last chapter of previous volume
      const volumeIndex = story.volumes.findIndex(v => v.id === activeVolume.id);
      if (volumeIndex > 0) {
        const prevVolume = story.volumes[volumeIndex - 1];
        setActiveVolume(prevVolume);
        if (prevVolume.chapters.length > 0) {
          setActiveChapter(prevVolume.chapters[prevVolume.chapters.length - 1]);
        }
      }
    } else if (direction === 'next' && currentIndex === activeVolume.chapters.length - 1) {
      // Try to go to first chapter of next volume
      const volumeIndex = story.volumes.findIndex(v => v.id === activeVolume.id);
      if (volumeIndex < story.volumes.length - 1) {
        const nextVolume = story.volumes[volumeIndex + 1];
        setActiveVolume(nextVolume);
        if (nextVolume.chapters.length > 0) {
          setActiveChapter(nextVolume.chapters[0]);
        }
      }
    }
  };

  const TableOfContents = () => (
    <div className="space-y-4 p-4">
      <h3 className="font-bold text-lg">Table of Contents</h3>
      {story.volumes.map((volume) => (
        <div key={volume.id} className="space-y-2">
          <h4 className="font-semibold text-md">{volume.title}</h4>
          <ul className="space-y-1 ml-4">
            {volume.chapters.map((chapter) => (
              <li 
                key={chapter.id}
                className={`cursor-pointer hover:text-novel-600 ${
                  activeChapter?.id === chapter.id ? 'font-semibold text-novel-600' : ''
                }`}
                onClick={() => {
                  setActiveVolume(volume);
                  handleChapterChange(chapter.id);
                }}
              >
                {chapter.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  if (!activeVolume || !activeChapter) {
    return <div className="text-center py-10">No content available for this story yet.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile Table of Contents Drawer */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="icon" variant="secondary">
              <Menu size={18} />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="max-h-[80vh] overflow-y-auto">
              <TableOfContents />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      
      {/* Reader Header */}
      <div className="sticky top-16 z-10 bg-background border-b border-border py-3 px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold truncate">{story.title}</h1>
        <div className="flex space-x-2">
          <Select value={activeVolume.id} onValueChange={handleVolumeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select volume" />
            </SelectTrigger>
            <SelectContent>
              {story.volumes.map((volume) => (
                <SelectItem key={volume.id} value={volume.id}>
                  {volume.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Table of Contents */}
        <div className="hidden md:block w-64 border-r border-border p-4 sticky top-[116px] h-[calc(100vh-116px)] overflow-y-auto">
          <TableOfContents />
        </div>

        {/* Chapter Content */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{activeChapter.title}</h2>
            <div className="text-sm text-muted-foreground">
              Volume: {activeVolume.title} • Chapter {activeChapter.order} of {activeVolume.chapters.length}
            </div>
          </div>

          <div className="reading-container prose prose-stone dark:prose-invert">
            {activeChapter.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="flex justify-between mt-8 pb-8">
            <Button 
              variant="outline" 
              onClick={() => navigateToChapter('prev')}
              disabled={
                activeVolume.chapters.indexOf(activeChapter) === 0 && 
                story.volumes.indexOf(activeVolume) === 0
              }
              className="flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous Chapter
            </Button>
            <Button 
              onClick={() => navigateToChapter('next')}
              disabled={
                activeVolume.chapters.indexOf(activeChapter) === activeVolume.chapters.length - 1 && 
                story.volumes.indexOf(activeVolume) === story.volumes.length - 1
              }
              className="flex items-center bg-novel-600 hover:bg-novel-700"
            >
              Next Chapter
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;
