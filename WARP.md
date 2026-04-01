# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

IntelliChat is an AI-powered conversational platform with multi-provider support (Groq, Gemini). It's a full-stack application with separate frontend and backend services.

**Tech Stack:**
- Frontend: React 19, Vite, Tailwind CSS 4
- Backend: Node.js, Express 5, MongoDB, Mongoose
- Authentication: JWT with access/refresh token pattern
- AI Providers: Groq SDK, Google Generative AI SDK

## Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm install                    # Install dependencies
npm run dev                    # Start with nodemon (auto-reload)
npm start                      # Start production server
```

### Frontend (React/Vite)
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run preview                # Preview production build
```

## Architecture

### Backend Structure

The backend follows a layered MVC architecture with clear separation of concerns:

**Request Flow:**
```
Request → Routes → Middleware (auth) → Controllers → Services → Models → Database
```

**Key Layers:**

1. **Routes** (`src/routes/`): Define API endpoints and attach middleware
   - `user.routes.js`: Authentication endpoints (login, register, logout)
   - `ai.routes.js`: AI provider interactions (message, stream, test)
   - `chat.routes.js`: Conversation management and message history

2. **Controllers** (`src/controllers/`): Handle HTTP request/response logic
   - Validate request data
   - Call service layer functions
   - Format responses with consistent structure

3. **Services** (`src/services/`): Business logic layer
   - `aiService.js`: Multi-provider AI abstraction layer
     - Uses Factory pattern to instantiate provider clients
     - Implements `AIProvider` base class extended by `GroqProvider` and `GeminiProvider`
     - Handles both standard and streaming responses
     - Provider instances are cached for reuse

4. **Models** (`src/models/`): MongoDB schemas with Mongoose
   - `user.models.js`: User authentication, JWT token generation methods
   - `conversation.models.js`: Chat sessions with AI provider tracking
   - `message.models.js`: Individual messages in conversations
   - `apikey.models.js`: API key management

5. **Middleware** (`src/middleware/`):
   - `auth.middleware.js`: JWT verification (access & refresh tokens)
   - `multer.middleware.js`: File upload handling

6. **Utils** (`src/utils/`):
   - `asyncHandler.js`: Wraps async route handlers for error catching
   - `ApiError.js`: Custom error class with statusCode
   - `cloudinary.js`: Image upload service

### Authentication Pattern

- Access tokens (short-lived, 15m) stored in cookies and Authorization header
- Refresh tokens (long-lived, 7d) for token renewal
- Password hashing with bcrypt (pre-save hook in User model)
- All AI and chat routes protected by `verifyJWT` middleware

### AI Provider Architecture

The AI service uses a **Provider Pattern** with these key concepts:

1. **Base Interface**: `AIProvider` class defines contract (`sendMessage`, `streamMessage`, `getAvailableModels`)
2. **Concrete Providers**: Each AI service (Groq, Gemini) extends base class
3. **Factory**: `AIProviderFactory` creates and caches provider instances
4. **Message Format**: OpenAI-compatible format with role/content structure
5. **Streaming**: Both providers support async generator streaming

**Adding New Providers:**
- Extend `AIProvider` class
- Implement required methods
- Add to factory switch case
- Add API key to `.env` and `getApiKeyForProvider()`

### Frontend Structure

The frontend uses React with Vite for fast development. Currently scaffolded with minimal setup - most components are in `src/components/`, with Redux Toolkit planned for state management (`src/redux/`).

### Database Schema Relationships

```
User (1) ──< (N) Conversation ──< (N) Message
```

- Users have many conversations
- Conversations have many messages
- Conversations track `lastMessage` and `messageCount` for efficient queries
- Indexes: userId, conversationId, timestamps for query optimization

## Environment Configuration

### Backend `.env` Required Variables:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017  # or MongoDB Atlas URI

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# AI Provider API Keys
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key

# Server
PORT=3001
```

### Frontend `.env`:
Currently empty - will need API URL configuration when connecting to backend.

## API Design Patterns

1. **Consistent Response Format:**
   ```javascript
   {
     success: boolean,
     message: string,
     data: object
   }
   ```

2. **Error Handling:**
   - All async route handlers wrapped in `asyncHandler`
   - Throws `ApiError` with statusCode for controlled error responses

3. **Streaming Responses:**
   - Supports both SSE (Server-Sent Events) and NDJSON formats
   - Query param `?format=sse` or `?format=json`
   - Chunks sent progressively with completion signal

## Development Workflow

1. **Adding New AI Provider:**
   - Create provider class in `aiService.js` extending `AIProvider`
   - Update factory's `getProvider()` switch case
   - Add API key env var and update `getApiKeyForProvider()`
   - Add to `getAIProviders()` controller response

2. **Creating New Routes:**
   - Define route in appropriate router file
   - Create controller with `asyncHandler` wrapper
   - Add authentication middleware if needed
   - Validate inputs and throw `ApiError` for invalid data

3. **Database Changes:**
   - Modify schema in `models/`
   - Add indexes for query optimization
   - Create instance/static methods for common operations
   - Use pre/post hooks for side effects (e.g., password hashing)

## Current AI Models

**Groq:**
- llama-3.1-8b-instant (default for non-streaming)
- llama-3.1-70b-versatile (default for streaming)
- llama-3.2-11b-text-preview, llama-3.2-3b-preview
- gemma2-9b-it, mixtral-8x7b-32768

**Gemini:**
- gemini-2.5-flash (default)
- gemini-1.5-pro
- gemini-1.0-pro
