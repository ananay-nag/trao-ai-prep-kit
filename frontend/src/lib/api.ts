import { Kit, RegenerateSectionType } from '../types/kit';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trao_auth_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trao_auth_token', token);
    window.dispatchEvent(new Event('trao-auth-change'));
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('trao_auth_token');
    window.dispatchEvent(new Event('trao-auth-change'));
  }
}

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  };
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Auth API Methods
export async function registerUser(email: string, password: string, name?: string): Promise<{ token: string; user: { id: string; email: string; name?: string } }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name?: string } }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function getMe(): Promise<{ userId?: string; email?: string; name?: string } | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchUserKits(): Promise<Array<{ id: string; title: string; company: string; createdAt: string; data: Kit }>> {
  const res = await fetch(`${API_BASE}/kits?_t=${Date.now()}`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to load kits');
  }
  return res.json();
}

export async function generateKit(
  jd: string,
  companyUrl: string,
  days: number,
  onProgress?: (progress: { step: string; percent: number; details?: string }) => void
): Promise<{ id: string; kit: Kit }> {
  // Try Server-Sent Events stream if supported
  if (typeof EventSource !== 'undefined' && onProgress) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`${API_BASE}/kits/generate?_t=${Date.now()}`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            Accept: 'text/event-stream'
          },
          body: JSON.stringify({ jd, companyUrl, days })
        });

        if (!response.ok) {
          const err = await response.json();
          return reject(new Error(err.error || 'Generation failed'));
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (!reader) {
          return reject(new Error('ReadableStream not supported in response'));
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            const trimmed = block.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const event = JSON.parse(trimmed.slice(6));
                if (event.type === 'progress') {
                  onProgress(event.data);
                } else if (event.type === 'completed') {
                  return resolve({ id: event.data.kitId, kit: event.data.kit });
                }
              } catch (e) {
                // Ignore parse errors on chunks
              }
            }
          }
        }
      } catch (err: any) {
        reject(err);
      }
    });
  }

  // Fallback to standard fetch
  const res = await fetch(`${API_BASE}/kits/generate?_t=${Date.now()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ jd, companyUrl, days })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate kit');
  }

  return res.json();
}

export async function fetchKit(id: string): Promise<{ id: string; title: string; company: string; kit: Kit }> {
  const res = await fetch(`${API_BASE}/kits/${id}?_t=${Date.now()}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to load kit');
  }

  return res.json();
}

export async function updateKit(id: string, kit: Kit): Promise<{ id: string; kit: Kit }> {
  const res = await fetch(`${API_BASE}/kits/${id}?_t=${Date.now()}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ kit })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save kit updates');
  }

  return res.json();
}

export async function regenerateSection(id: string, section: RegenerateSectionType, currentKit: Kit): Promise<{ kit: Kit }> {
  const epochTime = Date.now();
  const res = await fetch(`${API_BASE}/kits/${id}/regenerate-section?_t=${epochTime}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ section, currentKit })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Section regeneration failed');
  }

  return res.json();
}

export async function submitFlashcardFeedback(kitId: string, flashcardId: string, confidence: 1 | 2 | 3): Promise<void> {
  await fetch(`${API_BASE}/kits/${kitId}/flashcards/feedback?_t=${Date.now()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ flashcardId, confidence })
  });
}

export async function evaluateMockAnswer(
  kitId: string,
  questionPrompt: string,
  expectedAnswerOutline: string,
  candidateAnswer: string
): Promise<{ score: number; strengths: string[]; blind_spots: string[]; feedback_summary: string }> {
  const res = await fetch(`${API_BASE}/kits/${kitId}/mock-interview/evaluate?_t=${Date.now()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ questionPrompt, expectedAnswerOutline, candidateAnswer })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Evaluation failed');
  }

  return res.json();
}

export async function analyzeResume(
  kitId: string,
  resumeText: string
): Promise<{ success: boolean; resume_match: any }> {
  const res = await fetch(`${API_BASE}/kits/${kitId}/resume-match?_t=${Date.now()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ resumeText })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Resume analysis failed');
  }

  return res.json();
}

