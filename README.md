# AI 3D Learning Platform

A full-stack MERN application that provides an interactive 3D learning experience with AI-generated content, text-to-speech capabilities, and session tracking.

## Features

### Frontend
- **React App** with modern UI
- **Topic Input** - Enter any learning topic
- **Chapter-wise Content Display** - AI-generated educational content
- **3D Avatar** - Interactive 3D human avatar using Three.js and react-three-fiber
- **Avatar Selection** - Choose between Male and Female avatars (GLB models)
- **Web Speech API** - Continuous chapter-wise text-to-speech reading
- **Progress Tracking** - Restart from chapter 1 if user exits and reopens
- **User Progress Display** - Shows progress, restart count, and back count

### Backend
- **Node.js + Express** API server
- **Google Gemini AI Integration** - Generate chapter-wise educational content (Free API)
- **Session Tracking** - Track user progress, restart count, and back count
- **MongoDB** - Store session data and content

### Admin Dashboard
- **Session Monitoring** - View all user sessions
- **Statistics Table** - Display topic, progress, restart count, back count
- **Real-time Updates** - Auto-refresh every 30 seconds

## Project Structure

```
ai-3d-learning-platform/
├── backend/
│   ├── models/
│   │   └── Session.js          # MongoDB session model
│   ├── routes/
│   │   ├── content.js          # Content generation routes
│   │   └── session.js          # Session tracking routes
│   ├── server.js               # Express server
│   ├── package.json
│   └── env.example
├── frontend/
│   ├── public/
│   │   ├── models/             # Place GLB avatar models here
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopicInput.js
│   │   │   ├── ContentDisplay.js
│   │   │   ├── Avatar3D.js
│   │   │   └── ProgressTracker.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── admin/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── SessionTable.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key (Free - get it at https://makersuite.google.com/app/apikey)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# On Windows:
copy env.example .env
# On Mac/Linux:
cp env.example .env
```

4. Update `.env` with your credentials:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-learning
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your free Gemini API key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and paste it in your `.env` file

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Add GLB avatar models to `public/models/`:
   - `male-avatar.glb`
   - `female-avatar.glb`
   
   Note: You can download free GLB models from:
   - [Sketchfab](https://sketchfab.com/)
   - [Mixamo](https://www.mixamo.com/)
   - [Ready Player Me](https://readyplayer.me/)

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Admin Dashboard Setup

1. Navigate to admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The admin dashboard will run on `http://localhost:3001` (or next available port)

## Usage

### Frontend Application

1. Enter a learning topic (e.g., "Introduction to Machine Learning")
2. Click "Generate Content" to create AI-generated chapters
3. Select Male or Female avatar
4. Click "Start Reading" to begin text-to-speech narration
5. Navigate between chapters using Previous/Next buttons
6. Progress, restart count, and back count are tracked automatically
7. If you exit and return, the session resumes from the last chapter

### Admin Dashboard

1. View all active sessions
2. Monitor user progress, restart counts, and back counts
3. Table auto-refreshes every 30 seconds
4. Click "Refresh" to manually update

## API Endpoints

### Content Routes
- `POST /api/content/generate` - Generate chapter-wise content
- `GET /api/content/:sessionId` - Get content for a session

### Session Routes
- `GET /api/session` - Get all sessions (admin)
- `GET /api/session/:sessionId` - Get specific session
- `PUT /api/session/:sessionId/progress` - Update session progress

## Technologies Used

- **Frontend**: React, Three.js, @react-three/fiber, @react-three/drei, Web Speech API
- **Backend**: Node.js, Express, MongoDB, Mongoose, Google Gemini API
- **Admin**: React, Axios

## Notes

- Make sure MongoDB is running before starting the backend
- Web Speech API requires a modern browser (Chrome, Edge, Safari)
- GLB models need to be added to `frontend/public/models/` directory
- Google Gemini API key is required for content generation

## License

MIT

