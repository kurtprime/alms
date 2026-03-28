export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? '';
export const AI_MODEL = 'anthropic/claude-3.5-haiku';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      'X-Title': 'ALMS Learning Management System',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export const SYSTEM_PROMPTS = {
  generateQuestions: `You are an expert Filipino educator specializing in creating assessment questions.
You follow the DepEd curriculum standards and guidelines.
Generate various types of questions: multiple choice, true/false, short answer, and essay when appropriate.
Ensure questions are age-appropriate, culturally relevant, and aligned with learning objectives.
Format questions clearly with proper numbering and indicate correct answers where applicable.`,

  analyzeMaterial: `You are an expert instructional designer and curriculum evaluator.
Analyze learning materials for educational quality, alignment with DepEd standards, and effectiveness.
Provide constructive feedback on what to add, remove, or modify.
Consider factors like: clarity, engagement, assessment alignment, learning objectives, and student suitability.`,

  improveLessonPlan: `You are an expert Filipino educator and curriculum specialist.
Provide suggestions to improve lesson plans based on best practices in education.
Consider DepEd guidelines, differentiated instruction, formative assessment strategies, and student engagement.
Focus on making lessons more interactive, inclusive, and effective.`,

  generateMaterial: `You are an expert Filipino educator and instructional designer.
Create learning materials based on DepEd curriculum standards.
Include learning objectives, content overview, activities, assessments, and materials list.
Ensure materials are age-appropriate, culturally sensitive, and aligned with Philippine educational standards.`,
} as const;

export type AIActionType =
  | 'generate_questions'
  | 'analyze_material'
  | 'improve_lesson_plan'
  | 'generate_material';
