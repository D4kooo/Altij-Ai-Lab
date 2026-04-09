import type { ModuleWithDetails } from '@/lib/api';

export interface UIQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  questionId: string;
}

export function transformQuizQuestions(
  quiz: ModuleWithDetails['quiz']
): UIQuizQuestion[] {
  if (!quiz?.questions) return [];
  return quiz.questions.map((q) => {
    const correctIdx = q.options.findIndex((o) => o.isCorrect);
    return {
      question: q.question,
      options: q.options.map((o) => o.text),
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q.explanation || '',
      questionId: q.id,
    };
  });
}

export const audienceLabels: Record<string, string> = {
  juniors: 'Juniors',
  adultes: 'Adultes',
  seniors: 'Seniors',
  organisation: 'Formation',
};

export function isValidAudience(audience: string | undefined): boolean {
  return ['juniors', 'adultes', 'seniors'].includes(audience || '');
}

export function computeProgress(
  currentSection: number,
  totalSections: number,
  showQuiz: boolean,
  hasQuiz: boolean
): number {
  if (showQuiz) return 100;
  if (totalSections <= 0) return 0;
  return Math.round(((currentSection + 1) / totalSections) * (hasQuiz ? 80 : 100));
}

export function computeQuizScoreFromAnswers(
  questions: UIQuizQuestion[],
  answers: (number | null)[]
): number {
  if (questions.length === 0) return 0;
  const correct = questions.reduce(
    (count, q, idx) => count + (answers[idx] === q.correctIndex ? 1 : 0),
    0
  );
  return Math.round((correct / questions.length) * 100);
}

export function isQuizPassed(score: number): boolean {
  return score >= 70;
}
