import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Loader2, ArrowRight } from 'lucide-react';

export function CitizenRegister() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      const response = await authApi.registerCitizen({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Store the token
      localStorage.setItem('token', response.token);

      // Refresh auth state
      await checkAuth();

      // Redirect to school
      navigate('/school');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
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

          <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-balance">
            Créer un compte
          </h1>
          <p className="text-sm font-light text-muted-foreground mb-8 max-w-[280px] text-pretty">
            Rejoignez la communauté Data Ring et accédez à nos parcours citoyens
            libres.
          </p>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                placeholder="citoyen@email.com"
              />
            </div>

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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                  placeholder="Répétez"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Adhérer
                  <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground tracking-[0.05em] mb-4">
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
    </div>
  );
}

export default CitizenRegister;
