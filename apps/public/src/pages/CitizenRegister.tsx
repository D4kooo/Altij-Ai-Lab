import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Loader2, ArrowRight, ArrowLeft, User, Building2, Check } from 'lucide-react';

type AccountType = 'particulier' | 'organisation' | null;

const PARTICULIER_INTERESTS = [
  'Droits RGPD & données personnelles',
  'Sécurité numérique',
  "Comprendre l'IA",
  'Protection des mineurs',
  'Actions collectives',
] as const;

const ORGANISATION_GOALS = [
  "Former nos équipes à l'IA",
  'Conformité AI Act / RGPD',
  "Gouvernance de l'IA",
  'Sensibilisation des managers',
] as const;

export function CitizenRegister() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [accountType, setAccountType] = useState<AccountType>(null);

  // Step 2
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    role: '',
  });

  // Step 3
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const totalSteps = 4;

  const goTo = (nextStep: number) => {
    setDirection(nextStep > step ? 'forward' : 'backward');
    setStep(nextStep);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  const handleRegister = async () => {
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.registerCitizen({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        accountType: accountType || undefined,
        ...(accountType === 'organisation'
          ? {
              organizationName: formData.organizationName,
              organizationRole: formData.role,
            }
          : {}),
      });

      await checkAuth();

      // Store onboarding data in localStorage
      localStorage.setItem(
        'citizen_onboarding',
        JSON.stringify({
          accountType,
          ...(accountType === 'particulier'
            ? { interests: selectedInterests }
            : {
                goals: selectedGoals,
                organizationName: formData.organizationName,
                role: formData.role,
              }),
        })
      );

      goTo(4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    goTo(3);
  };

  const handleStep3Submit = () => {
    handleRegister();
  };

  // Step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === step;
        const isDone = stepNum < step;
        return (
          <div key={stepNum} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-6 h-[1px] transition-colors duration-500 ${
                  isDone ? 'bg-foreground' : 'bg-border'
                }`}
              />
            )}
            <span
              className={`text-[11px] font-medium tracking-[0.15em] transition-all duration-500 ${
                isActive
                  ? 'text-foreground'
                  : isDone
                    ? 'text-foreground/60'
                    : 'text-muted-foreground/40'
              }`}
            >
              {stepNum}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Step 1 — Account type
  const renderStep1 = () => (
    <div
      key="step1"
      className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}
    >
      <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-balance">
        Type de compte
      </h1>
      <p className="text-sm font-light text-muted-foreground mb-10 max-w-[320px] text-pretty">
        Choisissez le profil qui vous correspond.
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setAccountType('particulier');
            goTo(2);
          }}
          className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
            accountType === 'particulier'
              ? 'border-foreground bg-foreground/5'
              : 'border-border hover:border-foreground/30 bg-muted'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/30 transition-colors duration-300">
              <User className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
            </div>
            <div>
              <span className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase block mb-1">
                Particulier
              </span>
              <span className="text-sm font-light text-foreground/80">
                Citoyen souhaitant s'informer sur ses droits numériques.
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType('organisation');
            goTo(2);
          }}
          className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
            accountType === 'organisation'
              ? 'border-foreground bg-foreground/5'
              : 'border-border hover:border-foreground/30 bg-muted'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/30 transition-colors duration-300">
              <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
            </div>
            <div>
              <span className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase block mb-1">
                Organisation
              </span>
              <span className="text-sm font-light text-foreground/80">
                Entreprise ou cabinet souhaitant former ses équipes.
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Step 2 — Personal info
  const renderStep2 = () => (
    <div
      key="step2"
      className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}
    >
      <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-balance">
        Informations
      </h1>
      <p className="text-sm font-light text-muted-foreground mb-8 max-w-[280px] text-pretty">
        Créez votre accès à l'espace citoyen Data Ring.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleStep2Submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
              placeholder="Jean"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
              placeholder="Dupont"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
            Adresse Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
            placeholder="citoyen@email.com"
          />
        </div>

        {accountType === 'organisation' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="organizationName" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
                Organisation
              </label>
              <input
                id="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
                className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
                Poste
              </label>
              <input
                id="role"
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                placeholder="DPO, Manager..."
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
              SÉCURITÉ D'ACCÈS
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
              placeholder="8 caractères min."
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
              CONFIRMATION
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
              placeholder="Répétez"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => goTo(1)}
            className="h-12 w-12 shrink-0 rounded-full border border-border hover:border-foreground/30 flex items-center justify-center transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 flex items-center justify-center group"
          >
            Continuer
            <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );

  // Step 3 — Interests (Particulier) or Goals (Organisation)
  const renderStep3 = () => {
    const isParticulier = accountType === 'particulier';
    const items = isParticulier ? PARTICULIER_INTERESTS : ORGANISATION_GOALS;
    const selected = isParticulier ? selectedInterests : selectedGoals;
    const toggle = isParticulier ? toggleInterest : toggleGoal;

    return (
      <div
        key="step3"
        className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}
      >
        <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-balance">
          {isParticulier ? "Centres d'intérêt" : 'Objectifs'}
        </h1>
        <p className="text-sm font-light text-muted-foreground mb-8 max-w-[300px] text-pretty">
          {isParticulier
            ? 'Sélectionnez les sujets qui vous intéressent.'
            : 'Quels sont vos objectifs principaux ?'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-left">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {items.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                  isSelected
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border hover:border-foreground/20 bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isSelected
                      ? 'border-foreground bg-foreground'
                      : 'border-border'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-background" />}
                </div>
                <span className="text-sm font-light text-foreground/80">
                  {item}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => goTo(2)}
            className="h-12 w-12 shrink-0 rounded-full border border-border hover:border-foreground/30 flex items-center justify-center transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <button
            type="button"
            onClick={handleStep3Submit}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Créer mon compte
                <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Step 4 — Welcome
  const renderStep4 = () => (
    <div
      key="step4"
      className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center mb-8">
          <Check className="w-6 h-6 text-background" />
        </div>

        <h1 className="text-3xl font-light tracking-tight text-foreground mb-3 text-balance">
          Bienvenue, {formData.firstName}.
        </h1>
        <p className="text-sm font-light text-muted-foreground mb-10 max-w-[280px] text-pretty">
          Votre compte est créé. Découvrez nos parcours éducatifs et outils citoyens.
        </p>

        <button
          type="button"
          onClick={() => navigate(accountType === 'organisation' ? '/org' : '/school')}
          className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 flex items-center justify-center group"
        >
          Commencer
          <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex overflow-hidden">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-md relative animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
          <NavLink to="/" className="flex items-center gap-3 justify-start mb-12 group cursor-pointer w-fit">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/90 group-hover:bg-primary transition-colors duration-700"></div>
            <span className="font-medium tracking-[0.35em] text-[10px] sm:text-[11px] uppercase text-foreground/80 group-hover:text-foreground transition-colors duration-700">
              Data Ring
            </span>
          </NavLink>

          {renderStepIndicator()}
          {renderCurrentStep()}

          {step < 4 && (
            <div className="mt-8">
              <p className="text-center text-[11px] text-muted-foreground tracking-[0.05em] mb-4">
                Déjà inscrit ?{' '}
                <NavLink
                  to="/citizen/login"
                  className="text-primary hover:text-foreground transition-colors duration-300"
                >
                  Me connecter
                </NavLink>
              </p>

              <div className="text-center">
                <a href={import.meta.env.VITE_APP_URL || '/app/'} className="text-[10px] tracking-[0.15em] font-medium text-muted-foreground/50 hover:text-muted-foreground uppercase transition-colors duration-300">
                  Espace Staff
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-card items-center justify-center p-12 border-l border-border">
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
          <div className="relative z-20 max-w-sm ml-auto mr-12 mt-12 text-right">
            <div className="inline-flex items-center gap-3 justify-end mb-6 opacity-60">
              <span className="w-6 h-[1px] bg-primary/80"></span>
              <span className="text-primary text-[9px] font-medium tracking-[0.3em] uppercase">
                Résistance Citoyenne
              </span>
            </div>

            <h2 className="text-3xl font-light text-foreground tracking-tight mb-8 leading-[1.1] text-balance">
              Prenez part à la<br />
              souveraineté numérique.
            </h2>

            <div className="space-y-6 text-muted-foreground font-light text-sm">
              <div className="flex flex-col gap-1 items-end group">
                <span className="text-[10px] text-primary/80 tracking-[0.2em] uppercase font-medium">01</span>
                <span className="group-hover:text-foreground transition-colors duration-300">Exploration éducative ciblée.</span>
              </div>
              <div className="flex flex-col gap-1 items-end group">
                <span className="text-[10px] text-primary/80 tracking-[0.2em] uppercase font-medium">02</span>
                <span className="group-hover:text-foreground transition-colors duration-300">Accès aux outils RGPD automatisés.</span>
              </div>
              <div className="flex flex-col gap-1 items-end group">
                <span className="text-[10px] text-primary/80 tracking-[0.2em] uppercase font-medium">03</span>
                <span className="group-hover:text-foreground transition-colors duration-300">Soutien des actions collectives.</span>
              </div>
              <div className="flex flex-col gap-1 items-end group">
                <span className="text-[10px] text-primary/80 tracking-[0.2em] uppercase font-medium">04</span>
                <span className="group-hover:text-foreground transition-colors duration-300">Alertes sur les failles de sécurité.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step transition styles */}
      <style>{`
        .step-content {
          animation-duration: 0.4s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: forwards;
        }
        .step-enter-forward {
          animation-name: step-slide-in-right;
        }
        .step-enter-backward {
          animation-name: step-slide-in-left;
        }
        @keyframes step-slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes step-slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default CitizenRegister;
