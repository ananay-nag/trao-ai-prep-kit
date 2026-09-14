import { z } from 'zod';

export const MatchingSkillSchema = z.object({
  skill: z.string(),
  evidence: z.string(),
  requirement_id: z.string().optional()
});
export type MatchingSkill = z.infer<typeof MatchingSkillSchema>;

export const SkillGapSchema = z.object({
  skill: z.string(),
  impact: z.string(),
  requirement_id: z.string().optional()
});
export type SkillGap = z.infer<typeof SkillGapSchema>;

export const VulnerabilitySchema = z.object({
  area: z.string(),
  risk_level: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  predicted_question: z.string()
});
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;

export const BridgingStarAnswerSchema = z.object({
  requirement_text: z.string(),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string()
});
export type BridgingStarAnswer = z.infer<typeof BridgingStarAnswerSchema>;

export const ResumeMatchResultSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  seniority_alignment: z.string(),
  summary: z.string(),
  matching_skills: z.array(MatchingSkillSchema),
  gaps: z.array(SkillGapSchema),
  vulnerabilities: z.array(VulnerabilitySchema),
  bridging_star_answers: z.array(BridgingStarAnswerSchema)
});
export type ResumeMatchResult = z.infer<typeof ResumeMatchResultSchema>;
