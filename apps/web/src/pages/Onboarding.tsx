import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Heart,
  Check,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type OrganizationType = 'work' | 'family' | null;

export function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setOrganization, fetchOrganization } = useOrganizationStore();

  const [step, setStep] = useState<'type' | 'details'>('type');
  const [orgType, setOrgType] = useState<OrganizationType>(null);
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (type: OrganizationType) => {
    setOrgType(type);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: orgName,
          type: orgType
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const data = await response.json();
      setOrganization(data.data);

      // Rafraîchir pour s'assurer que tout est synchronisé
      await fetchOrganization();

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Link to="/welcome" className="inline-flex items-center gap-2">
          <img
            src="/assets/logo-dataring-black.png"
            alt="Data Ring"
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Connecté en tant que {user?.firstName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['type', 'details'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s
                      ? orgType === 'family'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-primary text-white'
                      : ['type', 'details'].indexOf(step) > i
                      ? orgType === 'family'
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-primary/20 text-primary'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {['type', 'details'].indexOf(step) > i ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 1 && (
                  <div
                    className={`w-16 h-0.5 ${
                      ['type', 'details'].indexOf(step) > i
                        ? orgType === 'family'
                          ? 'bg-emerald-500/20'
                          : 'bg-primary/20'
                        : 'bg-slate-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Choose Type */}
          {step === 'type' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Bienvenue {user?.firstName} !
                </h1>
                <p className="text-slate-600">
                  Créez votre premier espace pour commencer à utiliser Data Ring
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
                      Pour votre entreprise ou activité professionnelle.
                      Créez des assistants IA et automatisations personnalisés.
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
                      Pour votre famille. Un environnement IA sécurisé avec
                      modèles open source et contrôle parental.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Organization Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    orgType === 'family' ? 'bg-emerald-500/10' : 'bg-primary/10'
                  }`}
                >
                  {orgType === 'family' ? (
                    <Heart className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <Briefcase className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {orgType === 'work' ? 'Votre organisation' : 'Votre famille'}
                </h1>
                <p className="text-slate-600">
                  {orgType === 'work'
                    ? 'Donnez un nom à votre espace de travail'
                    : 'Donnez un nom à votre espace famille'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoFocus
                    className="h-12"
                  />
                </div>

                {/* Info box selon le type */}
                <div
                  className={`rounded-xl p-4 ${
                    orgType === 'family' ? 'bg-emerald-50' : 'bg-primary/5'
                  }`}
                >
                  <h4
                    className={`font-medium text-sm mb-2 ${
                      orgType === 'family' ? 'text-emerald-700' : 'text-primary'
                    }`}
                  >
                    {orgType === 'work' ? 'Inclus dans Work' : 'Inclus dans Family'}
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {orgType === 'work' ? (
                      <>
                        <li>• Assistants IA personnalisables</li>
                        <li>• Automatisations (workflows n8n)</li>
                        <li>• Veille juridique & actualités</li>
                        <li>• Anonymiseur de documents</li>
                        <li>• Gestion d'équipe</li>
                      </>
                    ) : (
                      <>
                        <li>• Modèles 100% Open Source (Llama, Mistral, Gemma)</li>
                        <li>• Contrôle parental intégré</li>
                        <li>• Conversations sécurisées</li>
                        <li>• Données hébergées en Europe</li>
                        <li>• Interface adaptée aux enfants</li>
                      </>
                    )}
                  </ul>
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
                  <Button
                    type="submit"
                    className={`flex-1 h-12 ${
                      orgType === 'family' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                    }`}
                    disabled={isLoading || !orgName.trim()}
                  >
                    {isLoading ? (
                      'Création...'
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
