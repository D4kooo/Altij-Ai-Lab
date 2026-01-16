import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getModule } from '@/data/schoolContent';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';

// Audience colors
const audienceConfig = {
  juniors: {
    color: 'amber',
    bgGradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-100',
    buttonBg: 'bg-amber-500 hover:bg-amber-600',
    progressBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    backPath: '/school/juniors',
    title: 'Parcours Juniors',
  },
  adultes: {
    color: 'teal',
    bgGradient: 'from-[#57C5B6]/10 to-teal-50',
    borderColor: 'border-[#57C5B6]/20',
    accentColor: 'text-[#57C5B6]',
    accentBg: 'bg-[#57C5B6]/10',
    buttonBg: 'bg-[#57C5B6] hover:bg-[#4AB0A2]',
    progressBg: 'bg-gradient-to-r from-[#57C5B6] to-teal-400',
    backPath: '/school/adultes',
    title: 'Parcours Adultes',
  },
  seniors: {
    color: 'purple',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    accentColor: 'text-purple-600',
    accentBg: 'bg-purple-100',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    progressBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    backPath: '/school/seniors',
    title: 'Parcours Seniors',
  },
};

export function ModuleViewer() {
  const { audience, moduleId } = useParams<{ audience: string; moduleId: string }>();
  const navigate = useNavigate();
  const { isModuleCompleted, completeModule, getQuizScore, saveQuizScore } = useSchoolProgress();

  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Validate audience
  const validAudience = audience as 'juniors' | 'adultes' | 'seniors';
  if (!['juniors', 'adultes', 'seniors'].includes(audience || '')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Parcours non trouvé</p>
        <Button onClick={() => navigate('/school')} className="mt-4">
          Retour à la School
        </Button>
      </div>
    );
  }

  const module = getModule(validAudience, moduleId || '');
  const config = audienceConfig[validAudience];

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Module non trouvé</p>
        <Button onClick={() => navigate(config.backPath)} className="mt-4">
          Retour au parcours
        </Button>
      </div>
    );
  }

  const isCompleted = isModuleCompleted(validAudience, module.id);
  const previousScore = getQuizScore(validAudience, module.id);
  const totalSections = module.sections.length;
  const hasQuiz = module.quiz && module.quiz.length > 0;
  const isLastSection = currentSection === totalSections - 1;

  // Initialize quiz answers
  useEffect(() => {
    if (module.quiz) {
      setQuizAnswers(new Array(module.quiz.length).fill(null));
    }
  }, [module.quiz]);

  const handleNext = () => {
    if (isLastSection) {
      if (hasQuiz) {
        setShowQuiz(true);
      } else {
        // Mark as complete and go back
        completeModule(validAudience, module.id);
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

  const handleSubmitQuiz = () => {
    if (!module.quiz) return;

    const correctCount = module.quiz.reduce((count, q, idx) => {
      return count + (quizAnswers[idx] === q.correctIndex ? 1 : 0);
    }, 0);

    const score = Math.round((correctCount / module.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    saveQuizScore(validAudience, module.id, score);

    if (score >= 70) {
      completeModule(validAudience, module.id);
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers(new Array(module.quiz?.length || 0).fill(null));
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleFinish = () => {
    navigate(config.backPath);
  };

  const currentSectionData = module.sections[currentSection];
  const progress = showQuiz
    ? 100
    : Math.round(((currentSection + 1) / totalSections) * (hasQuiz ? 80 : 100));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <NavLink
        to={config.backPath}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au {config.title}
      </NavLink>

      {/* Header */}
      <div className={cn(
        'rounded-2xl border p-6',
        config.borderColor,
        `bg-gradient-to-br ${config.bgGradient}`
      )}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
              {isCompleted && (
                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Terminé
                </span>
              )}
              {module.hasAudio && (
                <span className={cn('px-2 py-1 rounded text-sm flex items-center gap-1', config.accentBg, config.accentColor)}>
                  <Volume2 className="h-4 w-4" />
                  Audio
                </span>
              )}
            </div>
            <p className="text-gray-600">{module.description}</p>
            <p className="text-sm text-gray-500 mt-2">Durée estimée : {module.duration}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {showQuiz ? 'Quiz' : `Section ${currentSection + 1} sur ${totalSections}`}
            </span>
            <span className={cn('text-sm font-medium', config.accentColor)}>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.progressBg)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {!showQuiz ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentSectionData.title}
          </h2>

          {/* Main content - render markdown-like content */}
          <div className="prose prose-gray max-w-none">
            {currentSectionData.content.split('\n\n').map((paragraph, idx) => {
              // Check for lists
              if (paragraph.includes('\n- ')) {
                const [intro, ...items] = paragraph.split('\n- ');
                return (
                  <div key={idx} className="mb-4">
                    {intro && <p className="mb-2">{intro}</p>}
                    <ul className="list-disc pl-6 space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              }

              // Check for bold text and render
              const formattedParagraph = paragraph
                .split(/\*\*(.*?)\*\*/g)
                .map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);

              return (
                <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                  {formattedParagraph}
                </p>
              );
            })}
          </div>

          {/* Tip box */}
          {currentSectionData.tip && (
            <div className={cn('mt-6 rounded-xl border p-4 flex items-start gap-3', config.borderColor, config.accentBg)}>
              <div className={cn('p-2 rounded-lg bg-white', config.accentColor)}>
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className={cn('font-medium mb-1', config.accentColor)}>Le saviez-vous ?</p>
                <p className="text-gray-600">{currentSectionData.tip}</p>
              </div>
            </div>
          )}

          {/* Warning box */}
          {currentSectionData.warning && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-red-700 mb-1">Attention !</p>
                <p className="text-gray-600">{currentSectionData.warning}</p>
              </div>
            </div>
          )}

          {/* Example box */}
          {currentSectionData.example && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white text-blue-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-blue-700 mb-1">Exemple</p>
                <p className="text-gray-600">{currentSectionData.example}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz */
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn('p-3 rounded-xl', config.accentBg, config.accentColor)}>
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quiz</h2>
              <p className="text-gray-500">Testez vos connaissances</p>
            </div>
          </div>

          {quizSubmitted && quizScore !== null && (
            <div className={cn(
              'mb-6 p-6 rounded-xl border text-center',
              quizScore >= 70
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            )}>
              <div className={cn(
                'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4',
                quizScore >= 70 ? 'bg-green-100' : 'bg-amber-100'
              )}>
                {quizScore >= 70 ? (
                  <Trophy className="h-8 w-8 text-green-600" />
                ) : (
                  <RefreshCw className="h-8 w-8 text-amber-600" />
                )}
              </div>
              <h3 className={cn(
                'text-2xl font-bold mb-2',
                quizScore >= 70 ? 'text-green-700' : 'text-amber-700'
              )}>
                {quizScore}%
              </h3>
              <p className={quizScore >= 70 ? 'text-green-600' : 'text-amber-600'}>
                {quizScore >= 70
                  ? 'Bravo ! Vous avez réussi le quiz !'
                  : 'Pas tout à fait... Réessayez pour obtenir au moins 70%'}
              </p>
              {previousScore !== null && previousScore !== quizScore && (
                <p className="text-sm text-gray-500 mt-2">
                  Votre meilleur score : {Math.max(previousScore, quizScore)}%
                </p>
              )}
            </div>
          )}

          <div className="space-y-8">
            {module.quiz?.map((question, qIdx) => {
              const userAnswer = quizAnswers[qIdx];
              const isCorrect = userAnswer === question.correctIndex;

              return (
                <div key={qIdx} className="space-y-4">
                  <h3 className="font-medium text-gray-900">
                    {qIdx + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, oIdx) => {
                      const isSelected = userAnswer === oIdx;
                      const isCorrectAnswer = question.correctIndex === oIdx;

                      let optionClass = 'border-gray-200 bg-white hover:bg-gray-50';
                      if (quizSubmitted) {
                        if (isCorrectAnswer) {
                          optionClass = 'border-green-300 bg-green-50';
                        } else if (isSelected && !isCorrectAnswer) {
                          optionClass = 'border-red-300 bg-red-50';
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
                                : 'border-gray-300 text-gray-400'
                            )}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span className="text-gray-700">{option}</span>
                            {quizSubmitted && isCorrectAnswer && (
                              <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className={cn(
                      'p-4 rounded-lg text-sm',
                      isCorrect ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
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
                <p className="text-sm text-gray-500 text-center mt-2">
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
          {module.sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                idx === currentSection
                  ? cn(config.buttonBg, 'w-4')
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
          {hasQuiz && (
            <>
              <span className="text-gray-300 mx-1">|</span>
              <button
                onClick={() => setShowQuiz(true)}
                disabled={!isLastSection && currentSection < totalSections - 1}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  showQuiz ? cn(config.buttonBg, 'w-4') : 'bg-gray-300'
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
