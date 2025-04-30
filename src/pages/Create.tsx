import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StoryCreator from "@/components/story/StoryCreator";
import { Story } from "@/types";

const Create = () => {
  const navigate = useNavigate();

  const handleStoryCreated = (story: Story) => {
    // Navigate to profile page after story creation
    navigate('/profile');
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
