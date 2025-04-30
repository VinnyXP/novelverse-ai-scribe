from typing import Dict, List, TypedDict, Annotated
import os
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StoryState(TypedDict):
    volume: int
    chapter: int
    content: str
    previous_chapters: List[Dict]
    synopsis: str
    total_volumes: int
    chapters_per_volume: int
    narrative_state: Dict
    memory: ConversationBufferMemory

class AIModelService:
    def __init__(self):
        self.models = {}
        self._initialize_models()

    def _initialize_models(self):
        try:
            if os.getenv("OPENAI_API_KEY"):
                self.models["openai"] = ChatOpenAI(temperature=0.7)
            if os.getenv("ANTHROPIC_API_KEY"):
                self.models["claude"] = ChatAnthropic(model="claude-3-7-sonnet-20250219")
            if os.getenv("GOOGLE_API_KEY"):
                self.models["gemini"] = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
            logger.info(f"Available models: {list(self.models.keys())}")
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            self.models = {}

    def _create_story_graph(self, model_name: str) -> StateGraph:
        """Create a LangGraph workflow for story generation with proper state management."""
        model = self.models[model_name]
        workflow = StateGraph(StoryState)

        def analyze_previous_chapters(state: StoryState) -> StoryState:
            """Analyze previous chapters to maintain narrative coherence."""
            if not state["previous_chapters"]:
                return state

            prompt = ChatPromptTemplate.from_messages([
                ("system", """Analyze the previous chapters and extract key narrative elements.
                Focus on: plot threads, character arcs, themes, and unresolved elements."""),
                ("human", "{previous_chapters}")
            ])

            response = model.invoke(prompt.format(
                previous_chapters=json.dumps(state["previous_chapters"][-3:])
            ))

            try:
                state["narrative_state"].update(json.loads(response.content))
            except:
                logger.error("Failed to parse narrative analysis")

            return state

        def generate_chapter(state: StoryState) -> StoryState:
            """Generate chapter content with strong narrative continuity."""
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are writing Chapter {chapter} of Volume {volume}.
                Use the narrative state and previous chapters to ensure strong continuity.
                Focus on:
                1. Advancing plot threads from previous chapters
                2. Developing character arcs consistently
                3. Building upon established themes
                4. Resolving some open questions while creating new ones
                5. Maintaining consistent world details and rules"""),
                ("human", """Story Context:
                {synopsis}
                
                Previous Chapters:
                {previous_chapters}
                
                Narrative State:
                {narrative_state}
                
                Write the next chapter:""")
            ])

            # Add chapter to conversation memory
            state["memory"].save_context(
                {"input": f"Generating Chapter {state['chapter']} of Volume {state['volume']}"},
                {"output": ""}
            )

            response = model.invoke(prompt.format(
                chapter=state["chapter"],
                volume=state["volume"],
                synopsis=state["synopsis"],
                previous_chapters=json.dumps(state["previous_chapters"][-3:]),
                narrative_state=json.dumps(state["narrative_state"])
            ))

            state["content"] = response.content
            return state

        def update_state(state: StoryState) -> StoryState:
            """Update state after chapter generation."""
            state["previous_chapters"].append({
                "volume": state["volume"],
                "chapter": state["chapter"],
                "content": state["content"]
            })

            state["chapter"] += 1
            if state["chapter"] > state["chapters_per_volume"]:
                state["volume"] += 1
                state["chapter"] = 1

            return state

        def should_continue(state: StoryState) -> str:
            """Determine if story generation should continue."""
            if state["volume"] > state["total_volumes"]:
                return "end"
            if state["volume"] == state["total_volumes"] and state["chapter"] > state["chapters_per_volume"]:
                return "end"
            return "continue"

        # Add nodes to the graph
        workflow.add_node("analyze", analyze_previous_chapters)
        workflow.add_node("generate", generate_chapter)
        workflow.add_node("update", update_state)
        workflow.add_node("end", lambda x: x)  # Add an end node that just returns the state

        # Define the edges
        workflow.add_edge("analyze", "generate")
        workflow.add_edge("generate", "update")
        
        # Add conditional edges for the main loop
        workflow.add_conditional_edges(
            "update",
            should_continue,
            {
                "continue": "analyze",
                "end": "end"  # Point to the end node instead of None
            }
        )

        workflow.set_entry_point("analyze")
        return workflow.compile()

    def generate_entire_story(self, model_name: str, synopsis: str, total_volumes: int, chapters_per_volume: int) -> List[Dict]:
        """Generate a story using LangGraph for narrative coherence."""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not available")

        initial_state: StoryState = {
            "volume": 1,
            "chapter": 1,
            "content": "",
            "previous_chapters": [],
            "synopsis": synopsis,
            "total_volumes": total_volumes,
            "chapters_per_volume": chapters_per_volume,
            "narrative_state": {
                "plot_threads": [],
                "character_arcs": {},
                "themes": [],
                "unresolved_elements": []
            },
            "memory": ConversationBufferMemory()
        }

        try:
            workflow = self._create_story_graph(model_name)
            final_state = workflow.invoke(initial_state)
            return final_state["previous_chapters"]
        except Exception as e:
            logger.error(f"Error in story generation: {str(e)}")
            raise

    def get_available_models(self) -> List[str]:
        return list(self.models.keys())
