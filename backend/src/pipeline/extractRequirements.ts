import { LLMClient } from '../llm/client.js';
import { getRequirementExtractionPrompt } from '../llm/prompts.js';
import { Role, RoleSchema } from '../types/kit.js';

/**
 * Extracts structured role details and discrete requirements with stable IDs.
 */
export async function extractRequirements(jdText: string, llm: LLMClient): Promise<Role> {
  const prompt = getRequirementExtractionPrompt(jdText);
  const rawRole = await llm.generateJson<any>(prompt, 'Requirement Extraction');

  // Enforce stable IDs and fallback values if necessary
  const sanitizedRequirements = (rawRole.requirements || []).map((req: any, index: number) => ({
    id: req.id && req.id.startsWith('r') ? req.id : `r${index + 1}`,
    text: String(req.text || '').trim(),
    kind: ['technical', 'behavioural', 'domain'].includes(req.kind) ? req.kind : 'technical',
    priority: ['must', 'nice'].includes(req.priority) ? req.priority : 'must'
  })).filter((req: any) => req.text.length > 0);

  // If JD was so minimal that zero requirements were extracted, generate a minimal honest requirement
  if (sanitizedRequirements.length === 0) {
    sanitizedRequirements.push({
      id: 'r1',
      text: jdText.slice(0, 100) || 'General software development expectations',
      kind: 'technical',
      priority: 'must'
    });
  }

  const role: Role = {
    title: String(rawRole.title || 'Software Professional').trim(),
    seniority: String(rawRole.seniority || 'Mid-Level').trim(),
    responsibilities: Array.isArray(rawRole.responsibilities) && rawRole.responsibilities.length > 0
      ? rawRole.responsibilities.map((r: any) => String(r).trim()).filter(Boolean)
      : ['Deliver high-quality software solutions and collaborate with teammates.'],
    requirements: sanitizedRequirements
  };

  return RoleSchema.parse(role);
}
