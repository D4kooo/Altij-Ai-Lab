import { describe, it, expect } from 'vitest';
import {
  transformQuizQuestions,
  audienceLabels,
  isValidAudience,
  computeProgress,
  computeQuizScoreFromAnswers,
  isQuizPassed,
  type UIQuizQuestion,
} from './ModuleViewer.utils';

describe('transformQuizQuestions', () => {
  it('returns empty array when quiz is null/undefined', () => {
    expect(transformQuizQuestions(null as never)).toEqual([]);
    expect(transformQuizQuestions(undefined as never)).toEqual([]);
  });

  it('returns empty array when questions is missing', () => {
    expect(transformQuizQuestions({ id: 'q1' } as never)).toEqual([]);
  });

  it('maps questions and finds the correct index', () => {
    const quiz = {
      id: 'q1',
      questions: [
        {
          id: 'qa',
          question: 'What?',
          explanation: 'because',
          options: [
            { id: 'o1', text: 'A', isCorrect: false },
            { id: 'o2', text: 'B', isCorrect: true },
            { id: 'o3', text: 'C', isCorrect: false },
          ],
        },
      ],
    };
    const result = transformQuizQuestions(quiz as never);
    expect(result).toEqual([
      {
        question: 'What?',
        options: ['A', 'B', 'C'],
        correctIndex: 1,
        explanation: 'because',
        questionId: 'qa',
      },
    ]);
  });

  it('defaults correctIndex to 0 when no correct option', () => {
    const quiz = {
      id: 'q1',
      questions: [
        {
          id: 'qa',
          question: 'What?',
          explanation: '',
          options: [{ id: 'o1', text: 'A', isCorrect: false }],
        },
      ],
    };
    const result = transformQuizQuestions(quiz as never);
    expect(result[0].correctIndex).toBe(0);
    expect(result[0].explanation).toBe('');
  });
});

describe('audienceLabels', () => {
  it('maps audience keys to French labels', () => {
    expect(audienceLabels.juniors).toBe('Juniors');
    expect(audienceLabels.adultes).toBe('Adultes');
    expect(audienceLabels.seniors).toBe('Seniors');
    expect(audienceLabels.organisation).toBe('Formation');
  });
});

describe('isValidAudience', () => {
  it('returns true for valid audiences', () => {
    expect(isValidAudience('juniors')).toBe(true);
    expect(isValidAudience('adultes')).toBe(true);
    expect(isValidAudience('seniors')).toBe(true);
  });

  it('returns false for invalid or missing audience', () => {
    expect(isValidAudience('other')).toBe(false);
    expect(isValidAudience(undefined)).toBe(false);
    expect(isValidAudience('')).toBe(false);
  });
});

describe('computeProgress', () => {
  it('returns 100 when quiz is shown', () => {
    expect(computeProgress(0, 5, true, true)).toBe(100);
  });

  it('returns 0 when no sections', () => {
    expect(computeProgress(0, 0, false, false)).toBe(0);
  });

  it('scales to 80% cap when quiz exists', () => {
    expect(computeProgress(4, 5, false, true)).toBe(80);
    expect(computeProgress(0, 5, false, true)).toBe(16);
  });

  it('scales to 100% when no quiz', () => {
    expect(computeProgress(4, 5, false, false)).toBe(100);
    expect(computeProgress(0, 4, false, false)).toBe(25);
  });
});

describe('computeQuizScoreFromAnswers', () => {
  const questions: UIQuizQuestion[] = [
    { question: 'q1', options: ['a', 'b'], correctIndex: 1, explanation: '', questionId: '1' },
    { question: 'q2', options: ['a', 'b'], correctIndex: 0, explanation: '', questionId: '2' },
    { question: 'q3', options: ['a', 'b'], correctIndex: 1, explanation: '', questionId: '3' },
  ];

  it('returns 100 for all correct', () => {
    expect(computeQuizScoreFromAnswers(questions, [1, 0, 1])).toBe(100);
  });

  it('returns 0 for all wrong', () => {
    expect(computeQuizScoreFromAnswers(questions, [0, 1, 0])).toBe(0);
  });

  it('rounds partial scores', () => {
    expect(computeQuizScoreFromAnswers(questions, [1, 0, 0])).toBe(67);
  });

  it('treats nulls as incorrect', () => {
    expect(computeQuizScoreFromAnswers(questions, [null, null, 1])).toBe(33);
  });

  it('returns 0 for empty questions', () => {
    expect(computeQuizScoreFromAnswers([], [])).toBe(0);
  });
});

describe('isQuizPassed', () => {
  it('passes at 70 or above', () => {
    expect(isQuizPassed(70)).toBe(true);
    expect(isQuizPassed(100)).toBe(true);
  });

  it('fails below 70', () => {
    expect(isQuizPassed(69)).toBe(false);
    expect(isQuizPassed(0)).toBe(false);
  });
});
