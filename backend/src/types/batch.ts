import { z } from 'zod';
import { KitSchema } from './kit.js';

export const BatchInputCaseSchema = z.object({
  id: z.string(),
  jd: z.string(),
  company_url: z.string(),
  days: z.number().int().positive()
});
export type BatchInputCase = z.infer<typeof BatchInputCaseSchema>;

export const BatchInputSchema = z.array(BatchInputCaseSchema);
export type BatchInput = z.infer<typeof BatchInputSchema>;

export const BatchCaseErrorSchema = z.object({
  code: z.string(),
  message: z.string()
});
export type BatchCaseError = z.infer<typeof BatchCaseErrorSchema>;

export const BatchKitOutputItemSchema = z.object({
  id: z.string(),
  status: z.enum(['ok', 'failed']),
  kit: KitSchema.nullable(),
  error: BatchCaseErrorSchema.nullable()
});
export type BatchKitOutputItem = z.infer<typeof BatchKitOutputItemSchema>;

export const BatchOutputSchema = z.object({
  version: z.string(),
  generated_at: z.string(),
  kits: z.array(BatchKitOutputItemSchema)
});
export type BatchOutput = z.infer<typeof BatchOutputSchema>;
