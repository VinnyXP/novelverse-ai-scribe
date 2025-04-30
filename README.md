# NovelVerse AI Scribe

A web application that uses AI to generate complete novels with consistent story progression, multiple AI model support, and automatic cover image generation.

## Features

- Multiple AI model support (OpenAI GPT-4, Anthropic Claude, Google Gemini Pro)
- LangGraph-based story progression system
- Automatic cover image generation using DALL-E 3
- Supabase database integration
- Modern React frontend with TypeScript

## Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account
- API keys for:
  - OpenAI
  - Anthropic
  - Google AI
  - Supabase

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

## Frontend Setup

1. Navigate to the project root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Sign up or log in to the application
2. Click "Create New Story"
3. Fill in the story details:
   - Title
   - Synopsis
   - Tags
   - Number of volumes and chapters
4. Generate or upload a cover image
5. Select your preferred AI model
6. Click "Create My Story"

The application will:
1. Create the story structure in Supabase
2. Generate the cover image using DALL-E 3
3. Generate the story content using your chosen AI model
4. Store all content in the database
5. Redirect you to the story page

## Architecture

### Backend
- FastAPI server
- LangGraph for story progression
- Multiple AI model integration

### Frontend
- React with TypeScript
- Shadcn UI components
- Supabase client integration
- AI service abstraction

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
