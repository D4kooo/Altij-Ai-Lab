import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { coursesApi, type ModuleWithDetails } from '@/lib/api';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';

interface UIQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  questionId: string;
}

function transformQuizQuestions(quiz: ModuleWithDetails['quiz']): UIQuizQuestion[] {
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

// Lesson HTML styles are defined in index.css (.lesson-html class)

function LessonContent({ content }: { content: string }) {
  const isHtml = content.trimStart().startsWith('<');

  if (isHtml) {
    const sanitized = DOMPurify.sanitize(content);
    return (
      <div className="lesson-html" dangerouslySetInnerHTML={{ __html: sanitized }} />
    );
  }

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="font-heading font-bold text-2xl tracking-tighter mt-8 mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="font-heading font-bold text-xl tracking-tight mt-8 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="font-heading font-bold text-base tracking-tight mt-6 mb-2">{children}</h3>,
        p: ({ children }) => <p className="text-black/60 text-sm leading-relaxed mb-4">{children}</p>,
        strong: ({ children }) => <strong className="text-black font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="space-y-1.5 ml-4 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1.5 ml-4 mb-4 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-black/60 text-sm leading-relaxed flex gap-2"><span className="text-[#21B2AA]/50 shrink-0">—</span><span>{children}</span></li>,
        blockquote: ({ children }) => <blockquote className="border-l-[3px] border-[#21B2AA]/30 pl-4 py-1 my-4 text-black/50 text-sm italic">{children}</blockquote>,
        table: ({ children }) => <div className="overflow-x-auto my-6"><table className="w-full text-sm border-collapse border-2 border-black">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-black text-white">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-2.5 text-left font-mono text-[10px] tracking-[0.15em] uppercase">{children}</th>,
        td: ({ children }) => <td className="px-4 py-2.5 border-t border-black/10 text-black/60">{children}</td>,
        code: ({ children }) => <code className="bg-black/5 px-1.5 py-0.5 text-xs font-mono">{children}</code>,
        hr: () => <hr className="border-t-2 border-black/10 my-8" />,
      }}
    >
      {content}
    </Markdown>
  );
}

const audienceLabels: Record<string, string> = {
  juniors: 'Juniors',
  adultes: 'Adultes',
  seniors: 'Seniors',
  organisation: 'Formation',
};

export function ModuleViewer() {
  const { audience, moduleId, courseId } = useParams<{ audience?: string; moduleId: string; courseId?: string }>();
  const navigate = useNavigate();
  const { isModuleCompleted, completeModule, getQuizScore, saveQuizScore } = useSchoolProgress();

  const [moduleData, setModuleData] = useState<ModuleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Org context: route is /org/formation/:courseId/module/:moduleId (no audience param)
  const isOrgContext = !!courseId && !audience;
  const validAudience = isOrgContext ? 'organisation' : (audience as 'juniors' | 'adultes' | 'seniors');
  const isValidContext = isOrgContext || ['juniors', 'adultes', 'seniors'].includes(audience || '');
  const backPath = isOrgContext ? `/org/formation/${courseId}` : audience ? `/school/${audience}` : '/school';

  useEffect(() => {
    if (!moduleId || !isValidContext) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    coursesApi.getModule(moduleId).then((data) => {
      if (!cancelled) { setModuleData(data); setLoading(false); }
    }).catch((err) => {
      if (!cancelled) { setFetchError(err instanceof Error ? err.message : 'Module non trouvé'); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [moduleId, isValidContext]);

  const lessons = moduleData?.lessons || [];
  const quizQuestions = moduleData ? transformQuizQuestions(moduleData.quiz) : [];
  const hasQuiz = quizQuestions.length > 0;
  const totalSections = lessons.length;

  useEffect(() => {
    if (quizQuestions.length > 0) {
      setQuizAnswers(new Array(quizQuestions.length).fill(null));
    }
  }, [quizQuestions.length]);

  if (!isValidContext) {
    return (
      <div className="text-center py-12">
        <p className="text-black/50">Parcours non trouvé</p>
        <button onClick={() => navigate('/school')} className="mt-4 px-6 py-2 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100">
          Retour
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-black/30" />
      </div>
    );
  }

  if (fetchError || !moduleData) {
    return (
      <div className="text-center py-12">
        <p className="text-black/50">{fetchError || 'Module non trouvé'}</p>
        <button onClick={() => navigate(backPath)} className="mt-4 px-6 py-2 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100">
          Retour
        </button>
      </div>
    );
  }

  const isCompleted = isModuleCompleted(validAudience, moduleData.id);
  const previousScore = getQuizScore(validAudience, moduleData.id);
  const isLastSection = currentSection === totalSections - 1;
  const progress = showQuiz ? 100 : totalSections > 0 ? Math.round(((currentSection + 1) / totalSections) * (hasQuiz ? 80 : 100)) : 0;
  const currentLesson = lessons[currentSection];

  const handleNext = () => {
    if (isLastSection) {
      if (hasQuiz) {
        setShowQuiz(true);
      } else {
        completeModule(validAudience, moduleData.id);
        coursesApi.completeModule(moduleData.id).catch(() => {});
        navigate(backPath);
      }
    } else {
      setCurrentSection((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!quizSubmitted) {
      setQuizAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[questionIndex] = answerIndex;
        return newAnswers;
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!moduleData.quiz || quizQuestions.length === 0) return;

    const apiAnswers = quizQuestions.map((q, idx) => {
      const selectedIdx = quizAnswers[idx];
      const originalQuestion = moduleData.quiz!.questions![idx];
      const selectedOption = selectedIdx !== null ? originalQuestion.options[selectedIdx] : null;
      return { questionId: q.questionId, selectedOptionId: selectedOption?.id || '' };
    });

    try {
      const result = await coursesApi.submitQuiz(moduleData.quiz.id, apiAnswers);
      const score = Math.round((result.correctAnswers / result.totalQuestions) * 100);
      setQuizScore(score);
      setQuizSubmitted(true);
      saveQuizScore(validAudience, moduleData.id, score);
      if (result.passed) completeModule(validAudience, moduleData.id);
    } catch {
      const correctCount = quizQuestions.reduce((count, q, idx) => count + (quizAnswers[idx] === q.correctIndex ? 1 : 0), 0);
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      setQuizScore(score);
      setQuizSubmitted(true);
      saveQuizScore(validAudience, moduleData.id, score);
      if (score >= 70) {
        completeModule(validAudience, moduleData.id);
        coursesApi.completeModule(moduleData.id).catch(() => {});
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers(new Array(quizQuestions.length).fill(null));
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-6 lg:px-10 py-8 lg:py-10">
      {/* Back */}
      <NavLink to={backPath} className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-100">
        <ArrowLeft size={14} strokeWidth={1.5} /> {audienceLabels[validAudience] || 'Parcours'}
      </NavLink>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase">
            {audienceLabels[validAudience]}
          </span>
          {isCompleted && (
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#21B2AA] uppercase border border-[#21B2AA]/30 px-2 py-0.5 flex items-center gap-1">
              <Check size={10} strokeWidth={2} /> Terminé
            </span>
          )}
          {moduleData.hasAudio && (
            <span className="font-mono text-[9px] tracking-[0.15em] text-[#21B2AA]/50 uppercase flex items-center gap-1">
              <Volume2 size={12} strokeWidth={1.5} /> Audio
            </span>
          )}
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter leading-[0.95]">
          {moduleData.title}
        </h1>
        {moduleData.description && (
          <p className="mt-3 text-black/50 text-sm leading-relaxed">{moduleData.description}</p>
        )}

        {/* Progress */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-[3px] bg-black/10">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.1em] text-black/40">
            {showQuiz ? 'Quiz' : `${currentSection + 1}/${totalSections}`}
          </span>
        </div>
      </div>

      {/* Content */}
      {!showQuiz ? (
        currentLesson ? (
          <div className="border-t-[2px] border-black pt-8">
            <h2 className="font-heading font-bold text-xl tracking-tight mb-6">
              {currentLesson.title}
            </h2>

            <LessonContent content={currentLesson.content || ''} />
          </div>
        ) : (
          <div className="text-center py-8 text-black/30 font-mono text-[10px] tracking-[0.15em] uppercase">
            Aucun contenu disponible
          </div>
        )
      ) : (
        /* Quiz */
        <div className="border-t-[2px] border-black pt-8">
          <div className="mb-8">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-2">Quiz</span>
            <p className="text-black/50 text-sm">Testez vos connaissances</p>
          </div>

          {quizSubmitted && quizScore !== null && (
            <div className="border-2 border-black p-6 sm:p-8 text-center mb-8">
              <span className="text-4xl font-bold tracking-tighter block">
                {quizScore}%
              </span>
              <p className={`text-sm mt-2 ${quizScore >= 70 ? 'text-[#21B2AA]' : 'text-black/50'}`}>
                {quizScore >= 70
                  ? 'Bravo ! Vous avez réussi le quiz !'
                  : 'Pas tout à fait... Réessayez pour obtenir au moins 70%'}
              </p>
              {previousScore !== null && previousScore !== quizScore && (
                <p className="font-mono text-[9px] tracking-[0.1em] text-black/25 uppercase mt-3">
                  Meilleur score : {Math.max(previousScore, quizScore)}%
                </p>
              )}
            </div>
          )}

          <div className="space-y-10">
            {quizQuestions.map((question, qIdx) => {
              const userAnswer = quizAnswers[qIdx];
              const isCorrect = userAnswer === question.correctIndex;

              return (
                <div key={qIdx} className="space-y-4">
                  <h3 className="font-heading font-bold text-sm tracking-tight">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/50 mr-3">
                      {String(qIdx + 1).padStart(2, '0')}.
                    </span>
                    {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, oIdx) => {
                      const isSelected = userAnswer === oIdx;
                      const isCorrectAnswer = question.correctIndex === oIdx;

                      let borderClass = 'border-black/10 hover:border-black/30';
                      if (quizSubmitted) {
                        if (isCorrectAnswer) borderClass = 'border-[#21B2AA] bg-[#21B2AA]/5';
                        else if (isSelected && !isCorrectAnswer) borderClass = 'border-black bg-black/5';
                      } else if (isSelected) {
                        borderClass = 'border-black';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleQuizAnswer(qIdx, oIdx)}
                          disabled={quizSubmitted}
                          className={`w-full text-left px-4 py-3 border-2 transition-colors duration-100 ${borderClass} ${
                            !quizSubmitted ? 'cursor-pointer' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-[10px] tracking-[0.1em] w-6 h-6 flex items-center justify-center border ${
                              isSelected ? 'border-black text-black' : 'border-black/20 text-black/30'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-sm text-black/70">{option}</span>
                            {quizSubmitted && isCorrectAnswer && (
                              <Check size={16} strokeWidth={2} className="text-[#21B2AA] ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && question.explanation && (
                    <div className="border-l-[3px] border-[#21B2AA]/30 pl-4 py-1">
                      <p className="text-sm text-black/50 leading-relaxed">
                        <strong className="text-black">{isCorrect ? 'Correct' : 'Explication'} :</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizSubmitted && (
            <div className="mt-8">
              <button
                onClick={handleSubmitQuiz}
                disabled={quizAnswers.some((a) => a === null)}
                className="w-full px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
              >
                Valider mes réponses
              </button>
              {quizAnswers.some((a) => a === null) && (
                <p className="font-mono text-[9px] tracking-[0.1em] text-black/25 uppercase text-center mt-3">
                  Répondez à toutes les questions
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t-[2px] border-black pt-6">
        <button
          onClick={handlePrevious}
          disabled={currentSection === 0 && !showQuiz}
          className="inline-flex items-center gap-2 px-5 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-black"
        >
          <ChevronLeft size={14} strokeWidth={1.5} /> Précédent
        </button>

        {/* Section dots */}
        {!showQuiz && totalSections > 1 && (
          <div className="flex items-center gap-2">
            {lessons.map((lesson, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSection(idx)}
                aria-label={`Section ${idx + 1}: ${lesson.title}`}
                aria-current={idx === currentSection ? 'step' : undefined}
                className={`w-2 h-2 transition-all ${
                  idx === currentSection ? 'bg-black w-4' : 'bg-black/15 hover:bg-black/30'
                }`}
              />
            ))}
          </div>
        )}

        {showQuiz ? (
          quizSubmitted ? (
            <div className="flex gap-3">
              {quizScore !== null && quizScore < 70 && (
                <button
                  onClick={handleRetryQuiz}
                  className="px-5 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
                >
                  Réessayer
                </button>
              )}
              <button
                onClick={() => navigate(backPath)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100"
              >
                Terminer <Check size={14} strokeWidth={1.5} />
              </button>
            </div>
          ) : <div />
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100"
          >
            {isLastSection ? (hasQuiz ? 'Quiz' : 'Terminer') : 'Suivant'}
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ModuleViewer;
