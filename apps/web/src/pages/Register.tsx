import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Heart,
  Check
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';

type OrganizationType = 'work' | 'family' | null;

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  const [step, setStep] = useState<'type' | 'info' | 'organization'>('type');
  const [orgType, setOrgType] = useState<OrganizationType>(
    (searchParams.get('type') as OrganizationType) || null
  );

  // User info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Organization info
  const [orgName, setOrgName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si le type est déjà dans l'URL, passer directement à l'étape suivante
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'work' || typeParam === 'family') {
      setOrgType(typeParam);
      setStep('info');
    }
  }, [searchParams]);

  const handleTypeSelect = (type: OrganizationType) => {
    setOrgType(type);
    setStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setStep('organization');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Créer le compte et l'organisation en une seule requête
      await authApi.register({
        email,
        password,
        firstName,
        lastName,
        organizationType: orgType!,
        organizationName: orgName
      });

      // Sauvegarder les infos utilisateur dans le store
      // Le token est déjà sauvegardé par authApi.register
      // On force un refresh du store auth
      await login(email, password);

      // Rediriger vers le dashboard
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {['type', 'info', 'organization'].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s
                ? 'bg-primary text-white'
                : ['type', 'info', 'organization'].indexOf(step) > i
                ? 'bg-primary/20 text-primary'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {['type', 'info', 'organization'].indexOf(step) > i ? (
              <Check className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < 2 && (
            <div
              className={`w-12 h-0.5 ${
                ['type', 'info', 'organization'].indexOf(step) > i
                  ? 'bg-primary/20'
                  : 'bg-slate-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <img
            src="/assets/logo-dataring-black.png"
            alt="Data Ring"
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {renderStepIndicator()}

          {/* Step 1: Choose Type */}
          {step === 'type' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Bienvenue sur Data Ring
                </h1>
                <p className="text-slate-600">
                  Choisissez le type d'espace que vous souhaitez créer
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => handleTypeSelect('work')}
                  className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Data Ring <span className="text-primary">for Work</span>
                    </h3>
                    <p className="text-sm text-slate-500">
                      Pour les entreprises et professionnels. Créez vos propres
                      assistants IA et automatisations.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelect('family')}
                  className="flex items-start gap-4 p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <Heart className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Data Ring <span className="text-emerald-500">for Family</span>
                    </h3>
                    <p className="text-sm text-slate-500">
                      Pour les familles. Un environnement IA sécurisé avec
                      modèles open source et contrôle parental.
                    </p>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-slate-500">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: User Info */}
          {step === 'info' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Créez votre compte
                </h1>
                <p className="text-slate-600">
                  {orgType === 'work'
                    ? 'Vous créez un espace professionnel'
                    : 'Vous créez un espace famille'}
                </p>
              </div>

              <form onSubmit={handleInfoSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Minimum 8 caractères</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep('type')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button type="submit" className="flex-1 h-12">
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Organization Info */}
          {step === 'organization' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {orgType === 'work' ? 'Votre organisation' : 'Votre famille'}
                </h1>
                <p className="text-slate-600">
                  {orgType === 'work'
                    ? 'Donnez un nom à votre espace de travail'
                    : 'Donnez un nom à votre espace famille'}
                </p>
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orgName">
                    {orgType === 'work' ? "Nom de l'organisation" : 'Nom de la famille'}
                  </Label>
                  <Input
                    id="orgName"
                    placeholder={orgType === 'work' ? 'Mon Entreprise' : 'Famille Dupont'}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                {/* Résumé */}
                <div className="bg-slate-100 rounded-xl p-4 space-y-2">
                  <h4 className="font-medium text-slate-900 text-sm">Récapitulatif</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>
                      <span className="text-slate-400">Type :</span>{' '}
                      {orgType === 'work' ? 'Professionnel' : 'Famille'}
                    </p>
                    <p>
                      <span className="text-slate-400">Compte :</span> {email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep('info')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className={`flex-1 h-12 ${
                      orgType === 'family'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Création en cours...'
                    ) : (
                      <>
                        Créer mon espace
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
