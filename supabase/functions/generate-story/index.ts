
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const pythonBackendUrl = "http://localhost:8081"; // In production, use a proper URL

// Headers for CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the request body
    const { aiModel, synopsis, tags, volumeCount, chaptersPerVolume, userId } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Forward request to Python backend
    const pythonResponse = await fetch(`${pythonBackendUrl}/generate-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ai_model: aiModel,
        synopsis: synopsis,
        tags: tags,
        volume_count: volumeCount,
        chapters_per_volume: chaptersPerVolume,
      }),
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python backend returned status ${pythonResponse.status}`);
    }

    const generatedContent = await pythonResponse.json();

    // Create a new story in Supabase
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        title: `Story about ${synopsis.substring(0, 30)}...`,
        synopsis: synopsis,
        user_id: userId,
        cover_image: "/placeholder.svg",
      })
      .select("id")
      .single();

    if (storyError) {
      throw storyError;
    }

    // Create volumes and chapters
    for (let v = 0; v < volumeCount; v++) {
      // Create a volume
      const { data: volume, error: volumeError } = await supabase
        .from("volumes")
        .insert({
          title: `Volume ${v + 1}`,
          order_number: v + 1,
          story_id: story.id,
        })
        .select("id")
        .single();

      if (volumeError) {
        throw volumeError;
      }

      // Create chapters for this volume
      const chapters = Array.from({ length: chaptersPerVolume }, (_, c) => ({
        title: `Chapter ${c + 1}`,
        content: v === 0 && c === 0 ? generatedContent.chapter : `Chapter ${c + 1} content will be generated...`,
        order_number: c + 1,
        volume_id: volume.id,
      }));

      const { error: chapterError } = await supabase.from("chapters").insert(chapters);
      if (chapterError) {
        throw chapterError;
      }
    }

    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        storyId: story.id,
        message: "Story generated and saved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
