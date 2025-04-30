from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from ai_models import AIModelService
import logging
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the AI service
ai_service = AIModelService()

class StoryRequest(BaseModel):
    title: str
    synopsis: str
    total_volumes: int
    chapters_per_volume: int
    model_name: str
    tags: List[str] = []

class ChapterResponse(BaseModel):
    volume: int
    chapter: int
    content: str

class StoryResponse(BaseModel):
    title: str
    synopsis: str
    volumes: Dict[str, List[ChapterResponse]]

class ModelInfo(BaseModel):
    name: str
    display_name: str
    is_available: bool

@app.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get available AI models."""
    try:
        available_models = ai_service.get_available_models()
        logger.info(f"Available models: {available_models}")
        
        # Define model display names
        model_display_names = {
            "openai": "OpenAI GPT-3.5 Turbo",
            "claude": "Anthropic Claude 3 Sonnet",
            "gemini": "Google Gemini Pro"
        }
        
        # Check all possible models
        model_info = []
        for model_name, display_name in model_display_names.items():
            is_available = model_name in available_models
            logger.info(f"Model {model_name} is available: {is_available}")
            model_info.append(ModelInfo(
                name=model_name,
                display_name=display_name,
                is_available=is_available
            ))
        
        return model_info
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-story", response_model=StoryResponse)
async def generate_story(request: StoryRequest):
    try:
        # Check if the requested model is available
        available_models = ai_service.get_available_models()
        if request.model_name not in available_models:
            raise HTTPException(
                status_code=400,
                detail=f"Model {request.model_name} is not available. Available models: {', '.join(available_models)}"
            )
        
        # Generate the entire story
        story_chapters = ai_service.generate_entire_story(
            model_name=request.model_name,
            synopsis=request.synopsis,
            total_volumes=request.total_volumes,
            chapters_per_volume=request.chapters_per_volume
        )
        
        # Organize chapters by volume
        volumes = {}
        for chapter in story_chapters:
            volume_num = chapter["volume"]
            if volume_num not in volumes:
                volumes[volume_num] = []
            volumes[volume_num].append(ChapterResponse(
                volume=chapter["volume"],
                chapter=chapter["chapter"],
                content=chapter["content"]
            ))
        
        # Sort volumes and chapters
        sorted_volumes = {
            f"Volume {vol_num}": sorted(chapters, key=lambda x: x.chapter)
            for vol_num, chapters in sorted(volumes.items())
        }
        
        return StoryResponse(
            title=request.title,
            synopsis=request.synopsis,
            volumes=sorted_volumes
        )
        
    except Exception as e:
        logger.error(f"Error generating story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)