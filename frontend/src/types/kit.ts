export type RequirementKind = 'technical' | 'behavioural' | 'domain';
export type RequirementPriority = 'must' | 'nice';

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
}

export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';

export interface Question {
  id: string;
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  _origin?: 'generated' | 'user_edited' | 'user_created';
  _isPinned?: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  _confidence?: 1 | 2 | 3;
  _lastReviewedAt?: string;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Schedule {
  days_available: number;
  days: ScheduleDay[];
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

export interface Source {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string;
  pages_used: string[];
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
}

export interface Role {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
}

export interface MatchingSkill {
  skill: string;
  evidence: string;
  requirement_id?: string;
}

export interface SkillGap {
  skill: string;
  impact: string;
  requirement_id?: string;
}

export interface Vulnerability {
  area: string;
  risk_level: 'high' | 'medium' | 'low';
  reasoning: string;
  predicted_question: string;
}

export interface BridgingStarAnswer {
  requirement_text: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface ResumeMatchResult {
  match_score: number;
  seniority_alignment: string;
  summary: string;
  matching_skills: MatchingSkill[];
  gaps: SkillGap[];
  vulnerabilities: Vulnerability[];
  bridging_star_answers: BridgingStarAnswer[];
}

export interface Kit {
  source: Source;
  company_brief: CompanyBrief;
  role: Role;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: Schedule;
  coverage: Coverage;
  resume_match?: ResumeMatchResult;
}

export type RegenerateSectionType =
  | 'company_brief'
  | 'technical'
  | 'behavioural'
  | 'system-design'
  | 'company-fit'
  | 'flashcards'
  | 'schedule';

