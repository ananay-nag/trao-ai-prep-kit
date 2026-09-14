import './config.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/client.js';
import { authRouter } from './routes/auth.js';
import { kitsRouter } from './routes/kits.js';


const app = express();

const PORT = process.env.PORT || 5000;

// Permissive and robust CORS setup for local and deployed setups
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Origin'
  ],
  exposedHeaders: ['Cache-Control', 'Pragma', 'Expires']
}));

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Trao Interview Prep Kit Backend', timestamp: new Date().toISOString() });
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/kits', kitsRouter);

// Global Error Handler to always return JSON with CORS headers
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Trao Interview Prep Backend running at http://localhost:${PORT}`);
  });
}

// Only start listening if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
