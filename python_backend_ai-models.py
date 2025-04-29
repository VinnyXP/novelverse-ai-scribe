
from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class StoryGenerationRequest(BaseModel):
    ai_model: str
    synopsis: str
    tags: list[str]
    volume_count: int
    chapters_per_volume: int

# Cover generation request
class CoverGenerationRequest(BaseModel):
    synopsis: str
    tags: list[str]

# Model selection logic
def get_llm_model(model_name: str):
    if model_name == "openai":
        return ChatOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    elif model_name == "claude":
        return ChatAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    elif model_name == "gemini":
        return ChatGoogleGenerativeAI(api_key=os.environ["GOOGLE_API_KEY"])
    else:
        raise HTTPException(status_code=400, detail=f"Model {model_name} not supported")

# LangGraph setup
def create_story_graph(model_name: str):
    llm = get_llm_model(model_name)
    
    graph = StateGraph(input_schema={"synopsis": str, "tags": list, "volume_count": int, "chapters_per_volume": int})
    
    # Improved chapter generation with actual LLM usage
    def generate_chapter(state):
        synopsis = state["synopsis"]
        tags = state["tags"]
        tags_str = ", ".join(tags)
        
        # Construct the prompt for chapter generation
        prompt = f"""
        Write an engaging chapter for a novel with the following synopsis:
        
        "{synopsis}"
        
        The story should incorporate the following themes or elements: {tags_str}
        
        Write a complete chapter with a beginning, middle, and end. Make it engaging 
        and descriptive, with dialogue and character development where appropriate.
        """
        
        try:
            # Use the LLM to generate chapter content
            messages = [{"role": "system", "content": "You are a creative fiction writer."}, 
                       {"role": "user", "content": prompt}]
            
            # Attempt to use the actual LLM for generation
            try:
                response = llm.invoke(messages)
                chapter_content = response.content
            except Exception as e:
                # Fallback to dummy content in case of LLM API issues
                print(f"LLM generation error: {e}")
                chapter_content = f"Generated chapter based on synopsis '{synopsis}' with tags {tags_str}.\n\n" + \
                                 f"This is placeholder text because the LLM API encountered an error: {str(e)}"
                
            return {"chapter": chapter_content}
        except Exception as e:
            print(f"Chapter generation error: {e}")
            return {"chapter": f"Error generating chapter: {str(e)}"}
    
    graph.add_node("generate_chapter", generate_chapter)
    graph.set_entry_point(START)
    graph.add_edge(START, "generate_chapter")
    graph.add_edge("generate_chapter", END)
    
    return graph.compile()

# API endpoints
@app.post("/generate-story")
async def generate_story(request: StoryGenerationRequest):
    story_graph = create_story_graph(request.ai_model)
    
    result = story_graph.invoke({
        "synopsis": request.synopsis,
        "tags": request.tags,
        "volume_count": request.volume_count,
        "chapters_per_volume": request.chapters_per_volume
    })
    
    return result

@app.post("/generate-cover")
async def generate_cover(request: CoverGenerationRequest):
    # Placeholder - implement actual image generation API call
    # For now, return a placeholder URL
    return {"imageUrl": "/placeholder.svg"}

# For testing
@app.get("/")
async def root():
    return {"message": "Story generation API is running"}

# Run the API - python ai-models.py
if __name__ == "__main__":
    uvicorn.run("ai-models:app", host="0.0.0.0", port=8081, reload=True)
