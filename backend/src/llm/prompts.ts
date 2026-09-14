import { Requirement, Kit } from '../types/kit.js';

export const SYSTEM_PROMPT = `You are a Principal Technical Recruiter and Staff Engineering Hiring Specialist.
Your task is to analyze job postings, company research data, and generate precision interview kits.
Strictly adhere to the requested JSON format. Output ONLY valid JSON matching the requested schema. Do not enclose in markdown code blocks if possible, or use standard \`\`\`json.`;

export function getCompanyBriefPrompt(companyUrl: string, crawledContent: string, jdText: string): string {
  return `Analyze the following company website crawl data and job posting to create an accurate company overview.
If the website data is missing, empty, or 404, report honestly based ONLY on what is discoverable in the job posting. Do NOT hallucinate products or facts.

Company URL: ${companyUrl}
Crawled Website Content:
${crawledContent || '[No crawled content available / Unreachable URL]'}

Job Description Excerpt:
${jdText.slice(0, 2000)}

Return JSON adhering to this exact schema:
{
  "company_name": "string (e.g. Acme Corp)",
  "location": "string (e.g. Remote, San Francisco, CA)",
  "summary": "string (1-2 sentences summarizing the company)",
  "what_they_do": "string (Clear description of their product, service, or business model)"
}`;
}

export function getRequirementExtractionPrompt(jdText: string): string {
  return `Extract structured role details and discrete requirements from this Job Description.

RULES:
1. ONLY extract requirements that are explicitly mentioned or clearly implied in the text. DO NOT invent or assume skills not mentioned.
2. If the JD is a brief 2-line stub, extract only what is stated.
3. Categorize each requirement kind as strictly: "technical", "behavioural", or "domain".
4. Set priority strictly as:
   - "must": for mandatory/required skills (e.g., "5+ years React", "Must have Python", "Required: SQL").
   - "nice": for optional, preferred, or bonus skills (e.g., "Bonus points for Kubernetes", "Nice to have GraphQL", "Plus if you know AWS").
5. Assign stable IDs: r1, r2, r3, ...

Job Description:
${jdText}

Return JSON with this schema:
{
  "title": "string (Job Title)",
  "seniority": "string (e.g. Junior, Mid, Senior, Staff, Lead)",
  "responsibilities": ["string", ...],
  "requirements": [
    {
      "id": "r1",
      "text": "string (exact requirement description)",
      "kind": "technical | behavioural | domain",
      "priority": "must | nice"
    }
  ]
}`;
}

export function getCategorizedQuestionsPrompt(
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit',
  roleTitle: string,
  requirements: Requirement[],
  companySummary: string,
  startIdIndex: number = 1
): string {
  const relevantReqs = requirements.map((r) => `[${r.id}] (${r.kind}, ${r.priority}): ${r.text}`).join('\n');

  return `Generate interview questions specifically for the category: "${category}".
Target Role: ${roleTitle}
Company Context: ${companySummary}

Candidate Requirements to map to:
${relevantReqs}

RULES:
1. Every generated question MUST reference 1 or more relevant requirement IDs from above (e.g. ["r1"] or ["r1", "r2"]).
2. Category must strictly be "${category}".
3. Difficulty must be an integer: 1 (Junior/Fundamental), 2 (Mid-level/Applied), or 3 (Senior/Architectural/Edge-cases).
4. Provide a clear, actionable "prompt" (the interviewer question) and an "answer_outline" (key concepts, trade-offs, or STAR-method points expected in a strong answer).
5. Generate between 2 to 4 high-quality questions for this category.
6. IDs must start from q${startIdIndex}, q${startIdIndex + 1}, ...

Return JSON:
{
  "questions": [
    {
      "id": "q${startIdIndex}",
      "requirement_ids": ["r1"],
      "category": "${category}",
      "prompt": "string",
      "answer_outline": "string",
      "difficulty": 2
    }
  ]
}`;
}

export function getTargetedGapQuestionsPrompt(
  uncoveredRequirements: Requirement[],
  roleTitle: string,
  startIdIndex: number
): string {
  const reqList = uncoveredRequirements.map((r) => `[${r.id}] (${r.kind}, ${r.priority}): ${r.text}`).join('\n');

  return `You are performing a Second Pass Coverage Check.
The following MUST-HAVE requirements currently have NO interview questions covering them:
${reqList}

Generate targeted interview questions specifically to cover EACH of these missing requirement IDs.
Target Role: ${roleTitle}

RULES:
1. Every question must list the missing requirement ID in requirement_ids.
2. Category should match the requirement type: "technical" for technical skills, "behavioural" for soft/leadership skills, "system-design" for architecture, or "company-fit".
3. Difficulty must be 1, 2, or 3.
4. Number question IDs starting from q${startIdIndex}.

Return JSON:
{
  "questions": [
    {
      "id": "q${startIdIndex}",
      "requirement_ids": ["${uncoveredRequirements[0]?.id || 'r1'}"],
      "category": "technical",
      "prompt": "string",
      "answer_outline": "string",
      "difficulty": 2
    }
  ]
}`;
}

export function getFlashcardsPrompt(
  roleTitle: string,
  requirements: Requirement[],
  questionsSummary: string
): string {
  const reqList = requirements.map((r) => `[${r.id}]: ${r.text}`).join('\n');

  return `Generate concise study flashcards for quick revision before the interview.
Role: ${roleTitle}

Key Requirements:
${reqList}

Questions Context:
${questionsSummary.slice(0, 2000)}

RULES:
1. Create 4 to 8 high-impact flashcards.
2. "front": A sharp interview question, concept check, or technical definition prompt.
3. "back": Concise, high-density key takeaway, cheat-sheet bullet points, or core architectural answer.
4. "requirement_ids": Array of requirement IDs it reinforces (e.g. ["r1"]).
5. Number IDs: f1, f2, f3, ...

Return JSON:
{
  "flashcards": [
    {
      "id": "f1",
      "front": "string",
      "back": "string",
      "requirement_ids": ["r1"]
    }
  ]
}`;
}

export function getResumeMatchPrompt(resumeText: string, kit: Kit): string {
  const reqListStr = kit.role.requirements
    .map((r) => `- [${r.id}] (${r.priority.toUpperCase()} - ${r.kind}): ${r.text}`)
    .join('\n');

  return `You are an expert technical recruiter and hiring bar-raiser for ${kit.source.company || 'the target company'}.
You are evaluating a candidate's resume against the requirements for the role of "${kit.role.title}" (${kit.role.seniority || 'Senior'}).

--- COMPANY CONTEXT ---
Company: ${kit.source.company}
About: ${kit.company_brief.what_they_do || kit.company_brief.summary}

--- JOB REQUIREMENTS ---
${reqListStr}

--- CANDIDATE RESUME ---
${resumeText.trim()}

--- TASK ---
Evaluate the candidate's alignment with the role and produce a comprehensive, structured gap analysis.
1. Calculate a realistic "match_score" integer between 0 and 100 based strictly on verified requirements.
2. Provide a "seniority_alignment" assessment (e.g., "Junior candidate applying for Senior role", "Exact match for Staff Level", etc.).
3. Provide a concise executive "summary" highlighting strengths and primary concerns.
4. Identify "matching_skills" with direct evidence cited from the resume and linked requirement_id if applicable.
5. Identify "gaps" (skills missing or insufficiently demonstrated) and their impact on the interview.
6. Identify "vulnerabilities" - specific technical or behavioural topics where interviewers will scrutinize or challenge the candidate based on resume holes, including a predicted interview question and risk level ("high", "medium", or "low").
7. Generate "bridging_star_answers" - tailored STAR (Situation, Task, Action, Result) talking points that teach the candidate how to frame their actual past experience to address their top 2-3 gaps or high-stakes requirements.

Return ONLY valid JSON matching this schema:
{
  "match_score": 78,
  "seniority_alignment": "Senior / Lead Engineer Match",
  "summary": "Strong core backend and architecture background. Solid distributed systems experience, but lacks direct mention of Kubernetes production administration.",
  "matching_skills": [
    {
      "skill": "TypeScript / Node.js Distributed Services",
      "evidence": "Engineered microservices handling 50k req/s at previous role.",
      "requirement_id": "req-1"
    }
  ],
  "gaps": [
    {
      "skill": "Production Kubernetes & Service Mesh",
      "impact": "Must-have requirement. Resume lists Docker but no cluster orchestration.",
      "requirement_id": "req-2"
    }
  ],
  "vulnerabilities": [
    {
      "area": "Distributed Consensus & Raft/Paxos",
      "risk_level": "high",
      "reasoning": "Role requires high availability storage systems, but resume indicates mostly relational DB experience.",
      "predicted_question": "How would you handle split-brain scenarios and leader election timeouts in our distributed store?"
    }
  ],
  "bridging_star_answers": [
    {
      "requirement_text": "Production Kubernetes & Orchestration",
      "situation": "Our team used Docker Compose and AWS ECS for containerized deployments before a full K8s cluster rollout.",
      "task": "Ensure zero-downtime rolling deployments and automated rollbacks.",
      "action": "Defined health checks, graceful shutdown signals, and canary traffic splitting via API Gateway.",
      "result": "Maintained 99.99% uptime during deployments and seamlessly adapted to container orchestration best practices."
    }
  ]
}`;
}

export function getMockInterviewEvaluationPrompt(
  questionPrompt: string,
  expectedAnswerOutline: string,
  candidateAnswer: string
): string {
  return `Evaluate the candidate's interview answer.
Question Asked: "${questionPrompt}"
Ideal Key Points / Answer Outline: "${expectedAnswerOutline}"
Candidate Answer: "${candidateAnswer}"

Analyze clarity, technical accuracy, trade-offs mentioned, and missing blind spots.
Return JSON:
{
  "score": 8, // Integer 1-10
  "strengths": ["string", ...],
  "blind_spots": ["string", ...],
  "feedback_summary": "string"
}`;
}
