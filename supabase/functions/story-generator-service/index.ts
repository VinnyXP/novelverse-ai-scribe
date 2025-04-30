
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAIStream } from "https://esm.sh/ai";

// Define types similar to the Python Pydantic models
interface StoryGenerationRequest {
  ai_model: "openai" | "claude" | "gemini";
  synopsis: string;
  tags: string[];
  volume_count: number;
  chapters_per_volume: number;
}

interface CoverGenerationRequest {
  synopsis: string;
  tags: string[];
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model selection logic
function getLLMConfig(modelName: string) {
  switch (modelName) {
    case "openai":
      return {
        apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        model: "gpt-4o-mini",
      };
    case "claude":
      return {
        apiKey: Deno.env.get("ANTHROPIC_API_KEY") || "",
        model: "claude-3-haiku-20240307",
      };
    case "gemini":
      return {
        apiKey: Deno.env.get("GOOGLE_API_KEY") || "",
        model: "gemini-1.0-pro",
      };
    default:
      throw new Error(`Model ${modelName} not supported`);
  }
}

// Generate a chapter using the selected LLM model
async function generateChapter(modelName: string, synopsis: string, tags: string[]) {
  const config = getLLMConfig(modelName);
  const tagsStr = tags.join(", ");
  
  // Construct the prompt for chapter generation
  const prompt = `
Write an engaging chapter for a novel with the following synopsis:

"${synopsis}"

The story should incorporate the following themes or elements: ${tagsStr}

Write a complete chapter with a beginning, middle, and end. Make it engaging 
and descriptive, with dialogue and character development where appropriate.
`;

  try {
    // Use the appropriate LLM API based on the model name
    if (modelName === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You are a creative fiction writer." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } 
    else if (modelName === "claude") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "user", content: prompt },
          ],
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } 
    else if (modelName === "gemini") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error(`Model ${modelName} implementation not found`);
  } catch (error) {
    console.error(`Error generating content with ${modelName}:`, error);
    return `Generated chapter based on synopsis '${synopsis}' with tags ${tagsStr}.\n\nThis is placeholder text because the LLM API encountered an error: ${error.message}`;
  }
}

// Create a story graph to mimic LangGraph functionality
async function createStoryGraph(modelName: string, synopsis: string, tags: string[], volumeCount: number, chaptersPerVolume: number) {
  try {
    // Generate a single chapter (this would be expanded to generate all chapters in a real implementation)
    const chapterContent = await generateChapter(modelName, synopsis, tags);
    
    return {
      chapter: chapterContent,
    };
  } catch (error) {
    console.error("Error in story graph:", error);
    return { 
      chapter: `Error generating chapter: ${error.message}` 
    };
  }
}

// Main handler for Deno Deploy
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the path from the request URL
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Route handling
    if (path === "/generate-story" && req.method === "POST") {
      const requestData = await req.json() as StoryGenerationRequest;
      
      const result = await createStoryGraph(
        requestData.ai_model,
        requestData.synopsis,
        requestData.tags,
        requestData.volume_count,
        requestData.chapters_per_volume
      );
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } 
    else if (path === "/generate-cover" && req.method === "POST") {
      const requestData = await req.json() as CoverGenerationRequest;
      
      // Placeholder - implement actual image generation API call
      return new Response(JSON.stringify({ imageUrl: "/placeholder.svg" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } 
    else if (path === "/" && req.method === "GET") {
      return new Response(JSON.stringify({ message: "Story generation API is running" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } 
    else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
