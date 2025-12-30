# Quick Start Guide

## Prerequisites
- Node.js (v14+) installed
- MongoDB running locally or MongoDB Atlas connection string
- Google Gemini API key (Free - get it at https://makersuite.google.com/app/apikey)

## Installation Steps

### 1. Backend Setup
```bash
cd backend
npm install
# Copy env.example to .env and add your MongoDB URI and your Gemini API key
# On Windows: copy env.example .env
# On Mac/Linux: cp env.example .env
```

Edit `.env` file:
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

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

**Important:** Add GLB avatar models to `frontend/public/models/`:
- `male-avatar.glb`
- `female-avatar.glb`

You can download free models from:
- https://sketchfab.com/
- https://www.mixamo.com/
- https://readyplayer.me/

Start frontend:
```bash
npm start
```
Frontend runs on http://localhost:3000

### 3. Admin Dashboard Setup
```bash
cd admin
npm install
npm start
```
Admin dashboard runs on http://localhost:3001 (or next available port)

## Usage

1. **Frontend**: Open http://localhost:3000
   - Enter a learning topic
   - Select avatar (male/female)
   - Click "Generate Content"
   - Click "Start Reading" to begin text-to-speech narration
   - Navigate chapters and track progress

2. **Admin Dashboard**: Open http://localhost:3001
   - View all user sessions
   - Monitor progress, restart counts, and back counts
   - Table auto-refreshes every 30 seconds

## Troubleshooting

- **MongoDB Connection Error**: Make sure MongoDB is running locally or update MONGODB_URI in .env
- **API Error**: Verify your Gemini API key is correct and the model is available
- **3D Avatar Not Showing**: Make sure GLB files are in `frontend/public/models/` directory
- **Speech Not Working**: Ensure you're using a modern browser (Chrome, Edge, Safari) with Web Speech API support

