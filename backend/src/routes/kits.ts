import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, authenticateToken } from './auth.js';
import { KitModel } from '../db/models/Kit.js';
import { generatePrepKit } from '../pipeline/orchestrator.js';
import { regenerateSectionWithStatePreservation } from '../state/mergeEngine.js';
import { KitSchema } from '../types/kit.js';
import { RegenerateSectionTypeSchema } from '../types/state.js';
import { LLMClient } from '../llm/client.js';

export const kitsRouter = Router();

// Helper to verify if the requesting user has permission to access the kit
function checkKitAccess(kitDoc: { userId?: string }, reqUserId?: string): boolean {
  // If the kit is created by a guest or has no userId, allow access
  if (!kitDoc.userId || kitDoc.userId === 'guest_user') {
    return true;
  }
  // If the kit belongs to a registered user, require matching userId
  return Boolean(reqUserId && kitDoc.userId === reqUserId);
}

// POST /api/kits/generate
kitsRouter.post('/generate', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { jd, companyUrl, days } = req.body;

    if (!jd || typeof jd !== 'string' || jd.trim().length === 0) {
      return res.status(400).json({ error: 'Job description is required' });
    }
    if (!companyUrl || typeof companyUrl !== 'string') {
      return res.status(400).json({ error: 'Company URL is required' });
    }

    const safeDays = Math.max(1, parseInt(String(days || 3), 10));

    // Check if client requested SSE stream for live progress
    const isStream = req.headers['accept'] === 'text/event-stream';
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Connection', 'keep-alive');

      const kit = await generatePrepKit({
        jd,
        companyUrl,
        days: safeDays,
        onProgress: (status) => {
          res.write(`data: ${JSON.stringify({ type: 'progress', data: status })}\n\n`);
        }
      });

      const savedKit = await KitModel.create({
        userId: req.userId || 'guest_user',
        data: kit,
        title: `${kit.role.title} at ${kit.source.company}`,
        company: kit.source.company
      });

      res.write(`data: ${JSON.stringify({ type: 'completed', data: { kitId: savedKit._id, kit } })}\n\n`);
      return res.end();
    }

    // Standard JSON response
    const kit = await generatePrepKit({
      jd,
      companyUrl,
      days: safeDays
    });

    const savedKit = await KitModel.create({
      userId: req.userId || 'guest_user',
      data: kit,
      title: `${kit.role.title} at ${kit.source.company}`,
      company: kit.source.company
    });

    return res.json({
      id: savedKit._id,
      kit
    });
  } catch (err: any) {
    console.error('Error in /api/kits/generate:', err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

// GET /api/kits (list kits for authenticated user or guests)
kitsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const isAuth = req.userId && req.userId !== 'guest_user';
    // If authenticated, return user's kits. If guest, return only guest kits.
    const query = isAuth ? { userId: req.userId } : { userId: 'guest_user' };
    const kits = await KitModel.find(query).sort({ createdAt: -1 });
    return res.json(kits.map((k) => ({
      id: k._id,
      title: k.title,
      company: k.company,
      createdAt: k.createdAt,
      data: k.data
    })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/kits/:id (fetch single kit with access control)
kitsRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const kitDoc = isValidId ? await KitModel.findById(id) : null;
    if (!kitDoc) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    if (!checkKitAccess(kitDoc, req.userId)) {
      return res.status(403).json({
        error: 'Access denied. This kit is private. Please log in with the account that created it.'
      });
    }

    return res.json({
      id: kitDoc._id,
      title: kitDoc.title,
      company: kitDoc.company,
      kit: kitDoc.data
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/kits/:id (update entire kit with inline edits)
kitsRouter.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const parsedKit = KitSchema.safeParse(req.body.kit);
    if (!parsedKit.success) {
      return res.status(400).json({ error: 'Invalid kit schema', details: parsedKit.error.format() });
    }

    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const kitDoc = isValidId ? await KitModel.findById(id) : null;
    if (!kitDoc) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    if (!checkKitAccess(kitDoc, req.userId)) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to edit this kit.'
      });
    }

    kitDoc.data = parsedKit.data;
    kitDoc.title = `${parsedKit.data.role.title} at ${parsedKit.data.source.company}`;
    kitDoc.company = parsedKit.data.source.company;
    await kitDoc.save();

    return res.json({ id: kitDoc._id, kit: kitDoc.data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/kits/:id/regenerate-section (Preserves user edits and pins)
kitsRouter.post('/:id/regenerate-section', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const id = String(req.params.id);
    const { section, currentKit } = req.body;
    const parsedSection = RegenerateSectionTypeSchema.safeParse(section);
    if (!parsedSection.success) {
      return res.status(400).json({ error: 'Invalid section identifier' });
    }

    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const existingKit = isValidId ? await KitModel.findById(id) : null;
    if (isValidId && !existingKit) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    if (existingKit && !checkKitAccess(existingKit, req.userId)) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to modify this kit.'
      });
    }

    const kitToRegen = currentKit || (existingKit ? existingKit.data : null);
    if (!kitToRegen) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    const updatedKit = await regenerateSectionWithStatePreservation(parsedSection.data, kitToRegen);

    if (existingKit) {
      existingKit.data = updatedKit;
      await existingKit.save();
    }

    return res.status(200).json({ kit: updatedKit, _t: Date.now() });
  } catch (err: any) {
    console.error('Section regeneration failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/kits/:id/flashcards/feedback (Practice mode confidence scoring)
kitsRouter.post('/:id/flashcards/feedback', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const { flashcardId, confidence } = req.body;
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const kitDoc = isValidId ? await KitModel.findById(id) : null;
    if (!kitDoc) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    if (!checkKitAccess(kitDoc, req.userId)) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to modify this kit.'
      });
    }

    const kit = kitDoc.data;
    const card = kit.flashcards?.find((f: any) => f.id === flashcardId);
    if (card) {
      (card as any)._confidence = confidence;
      (card as any)._lastReviewedAt = new Date().toISOString();
      await KitModel.findByIdAndUpdate(kitDoc._id, { data: kit });
    }

    return res.json({ success: true, flashcards: kit.flashcards });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

import { matchResumeToKit } from '../pipeline/resumeMatcher.js';

// POST /api/kits/:id/resume-match (Feature 1: Resume-to-JD Match & Gap Analysis)
kitsRouter.post('/:id/resume-match', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required for analysis' });
    }

    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const kitDoc = isValidId ? await KitModel.findById(id) : null;
    if (!kitDoc) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    if (!checkKitAccess(kitDoc, req.userId)) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to run resume match on this kit.'
      });
    }

    const kit = kitDoc.data;
    const result = await matchResumeToKit(resumeText, kit);

    // Persist resume match result on the kit document
    kit.resume_match = result;
    await KitModel.findByIdAndUpdate(kitDoc._id, { data: kit });

    return res.json({ success: true, resume_match: result });
  } catch (err: any) {
    console.error('Error in /api/kits/:id/resume-match:', err);
    return res.status(500).json({ error: err.message || 'Resume matching failed' });
  }
});

import { getMockInterviewEvaluationPrompt } from '../llm/prompts.js';

// POST /api/kits/:id/mock-interview/evaluate (Creative Feature)
kitsRouter.post('/:id/mock-interview/evaluate', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { questionPrompt, expectedAnswerOutline, candidateAnswer } = req.body;
    if (!questionPrompt || !candidateAnswer) {
      return res.status(400).json({ error: 'Missing prompt or candidate answer' });
    }

    const id = String(req.params.id);
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (isValidId) {
      const kitDoc = await KitModel.findById(id);
      if (kitDoc && !checkKitAccess(kitDoc, req.userId)) {
        return res.status(403).json({
          error: 'Access denied. You do not have permission to access this kit.'
        });
      }
    }

    const llm = new LLMClient();
    const prompt = getMockInterviewEvaluationPrompt(
      String(questionPrompt),
      String(expectedAnswerOutline || ''),
      String(candidateAnswer)
    );

    const feedback = await llm.generateJson<any>(prompt, 'Mock Interview Evaluation');
    return res.json(feedback);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});



