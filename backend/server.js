import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleAuthHelper } from './tasks.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ORIGIN_ALLOWED = process.env.ORIGIN_ALLOWED || 'http://localhost:5173';
app.use(cors({
  origin: ORIGIN_ALLOWED,
  credentials: true
}));

// ✅ Frontend staat in dezelfde map als server.js (Azure fix)
const frontendDir = path.join(__dirname, 'frontend');
app.use(express.static(frontendDir));

// Auth helper
const google = new GoogleAuthHelper({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  tokenDir: path.join(__dirname, 'tokens')
});

// --- OAuth endpoints ---
app.get('/auth/start', async (req, res) => {
  const url = google.generateAuthUrl();
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  try {
    await google.exchangeCodeForToken(code);
    // Na inloggen terug naar home
    res.redirect('/');
  } catch (err) {
    // 🧪 Meer detail voor debuggen in logstream
    const detail = err?.response?.data || err?.message || err;
    console.error('OAuth callback error:', detail);
    res.status(500).send('OAuth error. Check server logs.');
  }
});

// --- API endpoints ---

// Ping
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Haal taken (actief + eventueel completed) op uit een lijst
app.get('/api/tasks', async (req, res) => {
  try {
    const showCompleted = req.query.completed === 'true';
    const tasks = await google.listTasks({ includeCompleted: showCompleted });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('No valid token')) {
      return res.status(401).json({ error: 'Not authorized. Please login at /auth/start' });
    }
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Toggle task status (completed <-> needsAction)
app.post('/api/tasks/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await google.toggleTask(id);
    res.json({ task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Fallback to frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
