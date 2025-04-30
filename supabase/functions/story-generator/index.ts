
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const serviceApiUrl = Deno.env.get("STORY_SERVICE_API_URL") || "http://localhost:54321/functions/v1/story-generator-service";

// Create Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyId, settings } = await req.json();

    if (!storyId || !settings) {
      return new Response(
        JSON.stringify({ error: "Missing storyId or settings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get story details from Supabase
    const { data: storyData, error: storyError } = await supabase
      .from("stories")
      .select(`id, title, synopsis, user_id, 
               volumes (id, title, order_number)`)
      .eq("id", storyId)
      .single();

    if (storyError || !storyData) {
      console.error("Error fetching story:", storyError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch story details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Call our TypeScript service to generate content instead of Python
    console.log("Calling story generator service for content...");
    const generationResponse = await fetch(`${serviceApiUrl}/generate-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ai_model: settings.aiModel,
        synopsis: settings.synopsis,
        tags: settings.tags,
        volume_count: settings.volumeCount,
        chapters_per_volume: settings.chaptersPerVolume,
      }),
    });

    if (!generationResponse.ok) {
      const errorData = await generationResponse.text();
      console.error("Story generator service error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate story content from AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generationResult = await generationResponse.json();
    console.log("Story generation successful");

    // 3. Update chapters in Supabase with generated content
    // For each volume, get all chapters and update them with generated content
    let chapterIndex = 0;
    
    // Process volumes in order
    const sortedVolumes = storyData.volumes.sort((a, b) => a.order_number - b.order_number);
    
    for (const volume of sortedVolumes) {
      // Get chapters for this volume
      const { data: chapters, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("volume_id", volume.id)
        .order("order_number");
      
      if (chaptersError) {
        console.error(`Error fetching chapters for volume ${volume.id}:`, chaptersError);
        continue;
      }
      
      // Update each chapter with generated content
      for (const chapter of chapters) {
        // If we've generated enough chapters, use them, otherwise use placeholder
        const chapterContent = generationResult.chapter || 
          `Generated chapter for "${settings.title}" - Volume ${volume.order_number}, Chapter ${chapter.order_number}`;
        
        const { error: updateError } = await supabase
          .from("chapters")
          .update({ content: chapterContent })
          .eq("id", chapter.id);
        
        if (updateError) {
          console.error(`Error updating chapter ${chapter.id}:`, updateError);
        } else {
          console.log(`Updated chapter ${chapter.id} with generated content`);
        }
        
        chapterIndex++;
      }
    }

    // 4. Set story as published
    const { error: publishError } = await supabase
      .from("stories")
      .update({ is_published: true })
      .eq("id", storyId);
    
    if (publishError) {
      console.error("Error marking story as published:", publishError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Story generation completed and saved to database",
        storyId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in story-generator function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
