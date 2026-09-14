import { z } from 'zod';
import { KitSchema } from './kit.js';

export const QuestionEditOriginSchema = z.enum(['generated', 'user_edited', 'user_created']);
export type QuestionEditOrigin = z.infer<typeof QuestionEditOriginSchema>;

export const RegenerateSectionTypeSchema = z.enum([
  'company_brief',
  'technical',
  'behavioural',
  'system-design',
  'company-fit',
  'flashcards',
  'schedule'
]);
export type RegenerateSectionType = z.infer<typeof RegenerateSectionTypeSchema>;

export const RegenerateSectionRequestSchema = z.object({
  section: RegenerateSectionTypeSchema,
  currentKit: KitSchema
});
export type RegenerateSectionRequest = z.infer<typeof RegenerateSectionRequestSchema>;
