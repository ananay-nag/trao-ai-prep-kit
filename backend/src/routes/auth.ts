import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../db/models/User.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'trao_jwt_secret_dev_key';
const JWT_EXPIR_IN = process.env.EXPIR_IN || '7d' as any;

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For local evaluation or guests, allow anonymous ID fallback
    req.userId = 'guest_user';
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.userId = 'guest_user';
      return next();
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    next();
  });
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name: name ? name.trim() : undefined,
      email: email.toLowerCase().trim(),
      passwordHash
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIR_IN }
    );
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  let name = req.userName;
  if (!name && req.userId && req.userId !== 'guest_user') {
    try {
      const userDoc = await UserModel.findById(req.userId).select('name');
      if (userDoc?.name) name = userDoc.name;
    } catch (err: any) { return res.status(500).json({ error: "Something went wrong. Please try again." }); }
  }
  return res.json({ userId: req.userId, email: req.userEmail, name });
});
