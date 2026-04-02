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
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
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
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
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

  const inputClass = 'w-full px-4 py-3 border-2 border-black/15 bg-white text-sm focus:border-black focus:outline-none transition-colors duration-100 placeholder:text-black/25';
  const labelClass = 'block font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase mb-2';

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
              <div className={`w-6 h-[2px] transition-colors duration-300 ${isDone ? 'bg-black' : 'bg-black/10'}`} />
            )}
            <span
              className={`font-mono text-[11px] tracking-[0.15em] w-7 h-7 flex items-center justify-center border-2 transition-all duration-300 ${
                isActive
                  ? 'border-black text-black'
                  : isDone
                    ? 'border-black text-black'
                    : 'border-black/15 text-black/25'
              }`}
            >
              {isDone ? <Check size={12} strokeWidth={2.5} /> : stepNum}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Step 1 — Account type
  const renderStep1 = () => (
    <div key="step1" className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}>
      <h1 className="font-bold text-3xl tracking-tighter leading-[0.95] font-heading mb-2">
        Type de compte
      </h1>
      <p className="text-sm text-black/50 mb-10 max-w-[320px]">
        Choisissez le profil qui vous correspond.
      </p>

      <div className="space-y-0 border-t-[2px] border-black">
        <button
          type="button"
          onClick={() => { setAccountType('particulier'); goTo(2); }}
          className="w-full text-left flex items-center gap-4 py-6 border-b border-black/10 hover:border-black transition-colors duration-100 group"
        >
          <div className="w-10 h-10 border-2 border-black/15 flex items-center justify-center shrink-0 group-hover:border-black group-hover:bg-black group-hover:text-white transition-colors duration-100">
            <User size={18} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <span className="font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase block mb-1">Particulier</span>
            <span className="text-sm text-black/70">Citoyen souhaitant s'informer sur ses droits numériques.</span>
          </div>
          <ArrowRight size={14} strokeWidth={1.5} className="text-black/20 group-hover:text-black group-hover:translate-x-1 transition-all duration-100 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => { setAccountType('organisation'); goTo(2); }}
          className="w-full text-left flex items-center gap-4 py-6 border-b-[2px] border-black transition-colors duration-100 group"
        >
          <div className="w-10 h-10 border-2 border-black/15 flex items-center justify-center shrink-0 group-hover:border-black group-hover:bg-black group-hover:text-white transition-colors duration-100">
            <Building2 size={18} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <span className="font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase block mb-1">Organisation</span>
            <span className="text-sm text-black/70">Entreprise ou cabinet souhaitant former ses équipes.</span>
          </div>
          <ArrowRight size={14} strokeWidth={1.5} className="text-black/20 group-hover:text-black group-hover:translate-x-1 transition-all duration-100 shrink-0" />
        </button>
      </div>
    </div>
  );

  // Step 2 — Personal info
  const renderStep2 = () => (
    <div key="step2" className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}>
      <h1 className="font-bold text-3xl tracking-tighter leading-[0.95] font-heading mb-2">
        Informations
      </h1>
      <p className="text-sm text-black/50 mb-8 max-w-[280px]">
        Créez votre accès à l'espace citoyen Data Ring.
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 border-2 border-black bg-black/5 font-mono text-[10px] tracking-[0.1em] text-black">
          {error}
        </div>
      )}

      <form onSubmit={handleStep2Submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-firstName" className={labelClass}>Prénom</label>
            <input id="reg-firstName" type="text" required value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} className={inputClass} placeholder="Jean" />
          </div>
          <div>
            <label htmlFor="reg-lastName" className={labelClass}>Nom</label>
            <input id="reg-lastName" type="text" required value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} className={inputClass} placeholder="Dupont" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className={labelClass}>Adresse Email</label>
          <input id="reg-email" type="email" required value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} placeholder="citoyen@email.com" />
        </div>

        {accountType === 'organisation' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-orgName" className={labelClass}>Organisation</label>
              <input id="reg-orgName" type="text" required value={formData.organizationName} onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))} className={inputClass} placeholder="Nom de l'entreprise" />
            </div>
            <div>
              <label htmlFor="reg-role" className={labelClass}>Poste</label>
              <input id="reg-role" type="text" required value={formData.role} onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))} className={inputClass} placeholder="DPO, Manager..." />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-password" className={labelClass}>Mot de passe</label>
            <input id="reg-password" type="password" required value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} className={inputClass} placeholder="8 caractères min." />
          </div>
          <div>
            <label htmlFor="reg-confirmPassword" className={labelClass}>Confirmation</label>
            <input id="reg-confirmPassword" type="password" required value={formData.confirmPassword} onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))} className={inputClass} placeholder="Répétez" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => goTo(1)}
            className="px-5 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 flex items-center justify-center gap-3"
          >
            Continuer
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </div>
  );

  // Step 3 — Interests / Goals
  const renderStep3 = () => {
    const isParticulier = accountType === 'particulier';
    const items = isParticulier ? PARTICULIER_INTERESTS : ORGANISATION_GOALS;
    const selected = isParticulier ? selectedInterests : selectedGoals;
    const toggle = isParticulier ? toggleInterest : toggleGoal;

    return (
      <div key="step3" className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}>
        <h1 className="font-bold text-3xl tracking-tighter leading-[0.95] font-heading mb-2">
          {isParticulier ? "Centres d'intérêt" : 'Objectifs'}
        </h1>
        <p className="text-sm text-black/50 mb-8 max-w-[300px]">
          {isParticulier
            ? 'Sélectionnez les sujets qui vous intéressent.'
            : 'Quels sont vos objectifs principaux ?'}
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 border-2 border-black bg-black/5 font-mono text-[10px] tracking-[0.1em] text-black">
            {error}
          </div>
        )}

        <div className="space-y-0 border-t-[2px] border-black mb-8">
          {items.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={`w-full text-left flex items-center gap-4 px-4 py-4 border-b border-black/10 transition-colors duration-100 ${
                  isSelected ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'
                }`}
              >
                <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-all duration-100 ${
                  isSelected ? 'border-black bg-black' : 'border-black/20'
                }`}>
                  {isSelected && <Check size={12} strokeWidth={2.5} className="text-white" />}
                </div>
                <span className="text-sm text-black/70">{item}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => goTo(2)}
            className="px-5 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => handleRegister()}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Créer mon compte
                <ArrowRight size={14} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Step 4 — Welcome
  const renderStep4 = () => (
    <div key="step4" className={`step-content ${direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-black text-white flex items-center justify-center mb-8">
          <Check size={24} strokeWidth={2} />
        </div>

        <h1 className="font-bold text-3xl tracking-tighter leading-[0.95] font-heading mb-3">
          Bienvenue, {formData.firstName}.
        </h1>
        <p className="text-sm text-black/50 mb-10 max-w-[280px]">
          Votre compte est créé. Découvrez nos parcours éducatifs et outils citoyens.
        </p>

        <button
          type="button"
          onClick={() => navigate(accountType === 'organisation' ? '/org' : '/school')}
          className="px-8 py-3 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 inline-flex items-center gap-3"
        >
          Commencer
          <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="min-h-[100svh] bg-white text-black font-body selection:bg-[#21B2AA] selection:text-white flex overflow-hidden">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-10 py-12 relative z-10 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-md relative opacity-0 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <NavLink to="/" className="flex items-center gap-3 justify-start mb-12 group cursor-pointer w-fit">
            <img src="/assets/logo-dataring-black.png" alt="Dataring" className="h-10" />
          </NavLink>

          {renderStepIndicator()}
          {renderCurrentStep()}

          {step < 4 && (
            <div className="mt-8">
              <p className="text-center font-mono text-[10px] tracking-[0.1em] text-black/40 mb-4">
                Déjà inscrit ?{' '}
                <NavLink to="/citizen/login" className="text-black border-b border-black/30 hover:border-black transition-colors duration-100">
                  Me connecter
                </NavLink>
              </p>
              <div className="text-center">
                <a href={import.meta.env.VITE_APP_URL || '/app/'} className="font-mono text-[10px] tracking-[0.15em] text-black/25 hover:text-black/50 uppercase transition-colors duration-100">
                  Espace Staff
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-12 border-l-[4px] border-black">
        <div className="relative z-20 max-w-sm ml-auto mr-12 mt-12 text-right">
          <div className="inline-flex items-center gap-3 justify-end mb-6">
            <span className="w-12 h-[2px] bg-[#21B2AA]/50" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase">
              Résistance Citoyenne
            </span>
          </div>

          <h2 className="font-bold text-3xl text-white tracking-tighter leading-[0.95] mb-8 font-heading">
            Prenez part à la<br />
            <span className="italic font-normal">souveraineté numérique.</span>
          </h2>

          <div className="space-y-6 text-white/50 text-sm">
            {[
              'Exploration éducative ciblée.',
              'Accès aux outils RGPD automatisés.',
              'Soutien des actions collectives.',
              'Alertes sur les failles de sécurité.',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 justify-end">
                <span>{text}</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/40">{String(i + 1).padStart(2, '0')}.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenRegister;
