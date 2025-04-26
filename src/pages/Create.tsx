
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoryCreator from "@/components/StoryCreator";
import { Story } from "@/types";

const Create = () => {
  const navigate = useNavigate();

  const handleStoryCreated = (story: Story) => {
    // In a real app, this would navigate to the edit or view page for the created story
    navigate(`/read/${story.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8 bg-background">
        <div className="container mx-auto px-4">
          <StoryCreator onStoryCreated={handleStoryCreated} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Create;
