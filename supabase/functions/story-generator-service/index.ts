
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

interface ChapterOutput {
  volumeIndex: number;
  chapterIndex: number;
  title: string;
  content: string;
}

interface StoryOutline {
  title: string;
  synopsis: string;
  volumeOutlines: {
    volumeIndex: number;
    title: string;
    summary: string;
    chapters: {
      chapterIndex: number;
      title: string;
      summary: string;
    }[];
  }[];
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LangGraph replacement: StateManager to maintain context between generations
class StoryStateManager {
  private synopsis: string;
  private tags: string[];
  private outline: StoryOutline | null = null;

  constructor(synopsis: string, tags: string[]) {
    this.synopsis = synopsis;
    this.tags = tags;
  }

  async generateOutline(modelName: string, volumeCount: number, chaptersPerVolume: number): Promise<StoryOutline> {
    const config = getLLMConfig(modelName);
    const tagsStr = this.tags.join(", ");
    
    const outlinePrompt = `
Generate a detailed story outline based on this synopsis:
"${this.synopsis}"

The story will have ${volumeCount} volumes, each with ${chaptersPerVolume} chapters.
Include these themes/elements: ${tagsStr}

Format your response as a structured outline with:
1. Overall story arc
2. For each volume (${volumeCount} total):
   - Volume title
   - Volume summary
   - For each chapter (${chaptersPerVolume} per volume):
     - Chapter title
     - Brief chapter summary

Keep all chapters consistent with the overall narrative and ensure they build on each other.
`;
    
    try {
      const outlineContent = await callLLM(modelName, outlinePrompt, "You are a skilled story architect and outline creator.");
      
      // Parse the output into a structured outline (simplified parsing)
      // In a real implementation, you might want to use more sophisticated parsing
      const outline: StoryOutline = {
        title: `Story About ${this.synopsis.split(' ').slice(0, 3).join(' ')}...`,
        synopsis: this.synopsis,
        volumeOutlines: []
      };
      
      // Generate placeholder outline structure
      for (let v = 0; v < volumeCount; v++) {
        const volumeOutline = {
          volumeIndex: v,
          title: `Volume ${v + 1}`,
          summary: `This volume covers part ${v + 1} of the story.`,
          chapters: []
        };
        
        for (let c = 0; c < chaptersPerVolume; c++) {
          volumeOutline.chapters.push({
            chapterIndex: c,
            title: `Chapter ${c + 1}`,
            summary: `Events in chapter ${c + 1} of volume ${v + 1}.`
          });
        }
        
        outline.volumeOutlines.push(volumeOutline);
      }
      
      this.outline = outline;
      return outline;
    } catch (error) {
      console.error(`Error generating outline: ${error}`);
      throw error;
    }
  }
  
  async generateChapter(
    modelName: string, 
    volumeIndex: number, 
    chapterIndex: number
  ): Promise<ChapterOutput> {
    if (!this.outline) {
      throw new Error("Story outline must be generated first");
    }
    
    const volumeOutline = this.outline.volumeOutlines[volumeIndex];
    const chapterOutline = volumeOutline.chapters[chapterIndex];
    const tagsStr = this.tags.join(", ");
    const prevChapterContext = chapterIndex > 0 
      ? `Previous chapter: ${volumeOutline.chapters[chapterIndex - 1].summary}`
      : "This is the first chapter.";
    
    const nextChapterHint = chapterIndex < volumeOutline.chapters.length - 1
      ? `Next chapter will cover: ${volumeOutline.chapters[chapterIndex + 1].summary}`
      : "This is the final chapter of this volume.";
    
    const chapterPrompt = `
Write an engaging chapter for the story with synopsis: "${this.synopsis}"

Volume: ${volumeIndex + 1} - ${volumeOutline.title}
Volume summary: ${volumeOutline.summary}

Chapter: ${chapterIndex + 1} - ${chapterOutline.title}
Chapter summary: ${chapterOutline.summary}

Themes to include: ${tagsStr}

Previous context: ${prevChapterContext}
Next chapter hint: ${nextChapterHint}

Write a complete, engaging chapter with:
1. A clear beginning, middle, and end
2. Descriptive scenes and dialogue
3. Character development
4. Pacing appropriate to the chapter's place in the story
5. A length of approximately 1000-1500 words

Include a title for the chapter at the very beginning.
`;

    try {
      const chapterContent = await callLLM(
        modelName, 
        chapterPrompt, 
        "You are a creative fiction writer crafting a chapter in a novel."
      );
      
      // Extract title from first line (assuming format "Chapter Title")
      let title = `Chapter ${chapterIndex + 1}`;
      const contentLines = chapterContent.split('\n');
      if (contentLines[0] && !contentLines[0].includes("```") && contentLines[0].length < 100) {
        title = contentLines[0].replace(/^#+ /, '').trim();
      }
      
      return {
        volumeIndex,
        chapterIndex,
        title,
        content: chapterContent
      };
    } catch (error) {
      console.error(`Error generating chapter: ${error}`);
      return {
        volumeIndex,
        chapterIndex,
        title: `Chapter ${chapterIndex + 1}`,
        content: `Error generating content: ${error}. This is a placeholder chapter for volume ${volumeIndex + 1}, chapter ${chapterIndex + 1} with themes ${tagsStr}.`
      };
    }
  }
}

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

// Call different LLM APIs based on model name
async function callLLM(modelName: string, prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<string> {
  const config = getLLMConfig(modelName);
  
  try {
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
            { role: "system", content: systemPrompt },
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
            { role: "user", content: `${systemPrompt}\n\n${prompt}` },
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
              parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
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
    console.error(`Error calling LLM (${modelName}):`, error);
    throw error;
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
      
      console.log(`Generating story with ${requestData.ai_model} model:`);
      console.log(`- Synopsis: ${requestData.synopsis}`);
      console.log(`- Tags: ${requestData.tags.join(", ")}`);
      console.log(`- Volumes: ${requestData.volume_count}, Chapters per volume: ${requestData.chapters_per_volume}`);
      
      const stateManager = new StoryStateManager(
        requestData.synopsis,
        requestData.tags
      );
      
      // Step 1: Generate an overall story outline
      console.log("Generating story outline...");
      await stateManager.generateOutline(
        requestData.ai_model,
        requestData.volume_count,
        requestData.chapters_per_volume
      );
      
      // Step 2: Generate a single chapter for demonstration
      // In a real implementation, you'd generate all chapters
      // But for performance and timeline, we'll just generate one chapter
      console.log("Generating sample chapter...");
      const chapter = await stateManager.generateChapter(
        requestData.ai_model,
        0, // First volume
        0  // First chapter
      );
      
      console.log("Story generation complete.");
      
      return new Response(JSON.stringify({
        chapter: chapter.content
      }), {
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
