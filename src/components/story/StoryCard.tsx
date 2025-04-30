import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Story } from '@/types';
import { Eye, Heart, Pencil } from 'lucide-react';
import { useState } from 'react';
import StoryEditor from './StoryEditor';

interface StoryCardProps {
  story: Story;
  onStoryUpdated?: (story: Story) => void;
}

const StoryCard = ({ story, onStoryUpdated }: StoryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStoryUpdate = (updatedStory: Story) => {
    if (onStoryUpdated) {
      onStoryUpdated(updatedStory);
    }
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[2/3]">
        <Link to={`/read/${story.id}`}>
          <img
            src={story.coverImage}
            alt={story.title}
            className="object-cover w-full h-full"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-white font-bold text-lg line-clamp-2">{story.title}</h3>
            <p className="text-white/80 text-sm">by {story.authorName}</p>
          </div>
        </Link>
        <div className="absolute top-2 right-2">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button size="icon" variant="secondary" className="bg-background/80 backdrop-blur-sm">
                <Pencil size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <StoryEditor story={story} onSave={handleStoryUpdate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="p-4 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
          {story.synopsis}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {story.tags.slice(0, 3).map(tag => (
            <Badge key={tag.id} variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              {tag.name}
            </Badge>
          ))}
          {story.tags.length > 3 && (
            <Badge variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              +{story.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center text-muted-foreground text-xs">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye size={14} className="mr-1" />
              {story.views}
            </span>
            <span className="flex items-center">
              <Heart size={14} className="mr-1" />
              {story.likes}
            </span>
          </div>
          <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default StoryCard;
