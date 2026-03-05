import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RefreshCw,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { coursesApi, type ModuleWithDetails } from '@/lib/api';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';

// Audience colors
const audienceConfig = {
  juniors: {
    color: 'amber',
    borderColor: 'border-amber-200 dark:border-amber-500/20',
    accentColor: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-100 dark:bg-amber-500/10',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    progressBg: 'bg-amber-500',
    backPath: '/school/juniors',
    title: 'Parcours Juniors',
  },
  adultes: {
    color: 'teal',
    borderColor: 'border-primary/20',
    accentColor: 'text-primary',
    accentBg: 'bg-primary/10',
    buttonBg: 'bg-primary hover:bg-primary/90',
    progressBg: 'bg-primary',
    backPath: '/school/adultes',
    title: 'Parcours Adultes',
  },
  seniors: {
    color: 'purple',
    borderColor: 'border-purple-200 dark:border-purple-500/20',
    accentColor: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-100 dark:bg-purple-500/10',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    progressBg: 'bg-purple-500',
    backPath: '/school/seniors',
    title: 'Parcours Seniors',
  },
};

// Transform API quiz questions to the format the UI expects
interface UIQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  questionId: string;
  selectedOptionId?: string;
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

export function ModuleViewer() {
  const { audience, moduleId } = useParams<{ audience: string; moduleId: string }>();
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

  // Validate audience
  const validAudience = audience as 'juniors' | 'adultes' | 'seniors';
  const isValidAudience = ['juniors', 'adultes', 'seniors'].includes(audience || '');
  const config = isValidAudience ? audienceConfig[validAudience] : audienceConfig.adultes;

  // Fetch module data from API
  useEffect(() => {
    if (!moduleId || !isValidAudience) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    coursesApi.getModule(moduleId).then((data) => {
      if (!cancelled) {
        setModuleData(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setFetchError(err instanceof Error ? err.message : 'Module non trouvé');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [moduleId, isValidAudience]);

  // Derived data from API response
  const lessons = moduleData?.lessons || [];
  const quizQuestions = moduleData ? transformQuizQuestions(moduleData.quiz) : [];
  const hasQuiz = quizQuestions.length > 0;
  const totalSections = lessons.length;

  // Initialize quiz answers when quiz data changes
  useEffect(() => {
    if (quizQuestions.length > 0) {
      setQuizAnswers(new Array(quizQuestions.length).fill(null));
    }
  }, [quizQuestions.length]);

  if (!isValidAudience) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Parcours non trouvé</p>
        <Button onClick={() => navigate('/school')} className="mt-4">
          Retour à la School
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError || !moduleData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{fetchError || 'Module non trouvé'}</p>
        <Button onClick={() => navigate(config.backPath)} className="mt-4">
          Retour au parcours
        </Button>
      </div>
    );
  }

  const isCompleted = isModuleCompleted(validAudience, moduleData.id);
  const previousScore = getQuizScore(validAudience, moduleData.id);
  const isLastSection = currentSection === totalSections - 1;

  const handleNext = () => {
    if (isLastSection) {
      if (hasQuiz) {
        setShowQuiz(true);
      } else {
        completeModule(validAudience, moduleData.id);
        coursesApi.completeModule(moduleData.id).catch(() => {});
        navigate(config.backPath);
      }
    } else {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!quizSubmitted) {
      setQuizAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[questionIndex] = answerIndex;
        return newAnswers;
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!moduleData.quiz || quizQuestions.length === 0) return;

    // Build answers for API submission
    const apiAnswers = quizQuestions.map((q, idx) => {
      const selectedIdx = quizAnswers[idx];
      const originalQuestion = moduleData.quiz!.questions![idx];
      const selectedOption = selectedIdx !== null ? originalQuestion.options[selectedIdx] : null;
      return {
        questionId: q.questionId,
        selectedOptionId: selectedOption?.id || '',
      };
    });

    try {
      const result = await coursesApi.submitQuiz(moduleData.quiz.id, apiAnswers);
      const score = Math.round((result.correctAnswers / result.totalQuestions) * 100);
      setQuizScore(score);
      setQuizSubmitted(true);
      saveQuizScore(validAudience, moduleData.id, score);

      if (result.passed) {
        completeModule(validAudience, moduleData.id);
      }
    } catch {
      // Fallback to local scoring if API fails
      const correctCount = quizQuestions.reduce((count, q, idx) => {
        return count + (quizAnswers[idx] === q.correctIndex ? 1 : 0);
      }, 0);
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

  const handleFinish = () => {
    navigate(config.backPath);
  };

  const currentLesson = lessons[currentSection];
  const progress = showQuiz
    ? 100
    : totalSections > 0 ? Math.round(((currentSection + 1) / totalSections) * (hasQuiz ? 80 : 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <NavLink
        to={config.backPath}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au {config.title}
      </NavLink>

      {/* Header */}
      <div className={cn(
        'rounded-2xl border p-6',
        config.borderColor,
        config.accentBg
      )}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground text-balance">{moduleData.title}</h1>
              {isCompleted && (
                <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Terminé
                </span>
              )}
              {moduleData.hasAudio && (
                <span className={cn('px-2 py-1 rounded text-sm flex items-center gap-1', config.accentBg, config.accentColor)}>
                  <Volume2 className="h-4 w-4" />
                  Audio
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{moduleData.description}</p>
            <p className="text-sm text-muted-foreground mt-2">Durée estimée : {moduleData.duration}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {showQuiz ? 'Quiz' : `Section ${currentSection + 1} sur ${totalSections}`}
            </span>
            <span className={cn('text-sm font-medium', config.accentColor)}>{progress}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.progressBg)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {!showQuiz ? (
        currentLesson ? (
          <div className="rounded-xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {currentLesson.title}
            </h2>

            {/* Main content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {(currentLesson.content || '').split('\n\n').map((paragraph, idx) => {
                if (paragraph.includes('\n- ')) {
                  const [intro, ...items] = paragraph.split('\n- ');
                  return (
                    <div key={idx} className="mb-4">
                      {intro && <p className="mb-2">{intro}</p>}
                      <ul className="list-disc pl-6 space-y-1">
                        {items.map((item, i) => (
                          <li key={i} className="text-foreground/70">{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                const formattedParagraph = paragraph
                  .split(/\*\*(.*?)\*\*/g)
                  .map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);

                return (
                  <p key={idx} className="mb-4 text-foreground/70 leading-relaxed">
                    {formattedParagraph}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Aucun contenu disponible</div>
        )
      ) : (
        /* Quiz */
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('p-3 rounded-xl', config.accentBg, config.accentColor)}>
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Quiz</h2>
              <p className="text-muted-foreground">Testez vos connaissances</p>
            </div>
          </div>

          {quizSubmitted && quizScore !== null && (
            <div className={cn(
              'mb-6 p-6 rounded-xl border text-center',
              quizScore >= 70
                ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5'
                : 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5'
            )}>
              <div className={cn(
                'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4',
                quizScore >= 70 ? 'bg-green-100 dark:bg-green-500/10' : 'bg-amber-100 dark:bg-amber-500/10'
              )}>
                {quizScore >= 70 ? (
                  <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <RefreshCw className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <h3 className={cn(
                'text-2xl font-bold mb-2',
                quizScore >= 70 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
              )}>
                {quizScore}%
              </h3>
              <p className={quizScore >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                {quizScore >= 70
                  ? 'Bravo ! Vous avez réussi le quiz !'
                  : 'Pas tout à fait... Réessayez pour obtenir au moins 70%'}
              </p>
              {previousScore !== null && previousScore !== quizScore && (
                <p className="text-sm text-muted-foreground mt-2">
                  Votre meilleur score : {Math.max(previousScore, quizScore)}%
                </p>
              )}
            </div>
          )}

          <div className="space-y-8">
            {quizQuestions.map((question, qIdx) => {
              const userAnswer = quizAnswers[qIdx];
              const isCorrect = userAnswer === question.correctIndex;

              return (
                <div key={qIdx} className="space-y-4">
                  <h3 className="font-medium text-foreground">
                    {qIdx + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, oIdx) => {
                      const isSelected = userAnswer === oIdx;
                      const isCorrectAnswer = question.correctIndex === oIdx;

                      let optionClass = 'border-border bg-card hover:bg-muted';
                      if (quizSubmitted) {
                        if (isCorrectAnswer) {
                          optionClass = 'border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5';
                        } else if (isSelected && !isCorrectAnswer) {
                          optionClass = 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5';
                        }
                      } else if (isSelected) {
                        optionClass = cn(config.borderColor, config.accentBg);
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleQuizAnswer(qIdx, oIdx)}
                          disabled={quizSubmitted}
                          className={cn(
                            'w-full text-left p-4 rounded-lg border transition-all',
                            optionClass,
                            !quizSubmitted && 'cursor-pointer'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium',
                              isSelected
                                ? cn(config.accentColor, 'border-current')
                                : 'border-border text-muted-foreground'
                            )}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-foreground/70">{option}</span>
                            {quizSubmitted && isCorrectAnswer && (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className={cn(
                      'p-4 rounded-lg text-sm',
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-500/5 text-green-700 dark:text-green-400'
                        : 'bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400'
                    )}>
                      <strong>{isCorrect ? 'Correct !' : 'Explication :'}</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizSubmitted && (
            <div className="mt-8">
              <Button
                onClick={handleSubmitQuiz}
                disabled={quizAnswers.some(a => a === null)}
                className={cn('w-full', config.buttonBg, 'text-white')}
              >
                Valider mes réponses
              </Button>
              {quizAnswers.some(a => a === null) && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Répondez à toutes les questions pour valider
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSection === 0 && !showQuiz}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {showQuiz ? (
          quizSubmitted ? (
            <div className="flex gap-3">
              {quizScore !== null && quizScore < 70 && (
                <Button variant="outline" onClick={handleRetryQuiz}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              )}
              <Button onClick={handleFinish} className={cn(config.buttonBg, 'text-white')}>
                Terminer
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : null
        ) : (
          <Button onClick={handleNext} className={cn(config.buttonBg, 'text-white')}>
            {isLastSection ? (hasQuiz ? 'Passer au quiz' : 'Terminer') : 'Suivant'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Section dots navigation */}
      {!showQuiz && totalSections > 1 && (
        <div className="flex items-center justify-center gap-2">
          {lessons.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                idx === currentSection
                  ? cn(config.buttonBg, 'w-4')
                  : 'bg-border hover:bg-muted-foreground'
              )}
            />
          ))}
          {hasQuiz && (
            <>
              <span className="text-border mx-1">|</span>
              <button
                onClick={() => setShowQuiz(true)}
                disabled={!isLastSection && currentSection < totalSections - 1}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  showQuiz ? cn(config.buttonBg, 'w-4') : 'bg-border'
                )}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleViewer;
