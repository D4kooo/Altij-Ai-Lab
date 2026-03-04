import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, ArrowRight } from 'lucide-react';

export function CitizenLogin() {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/school');
    } catch {
      // Error is handled by the store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex items-center justify-center relative overflow-hidden px-4">

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Animated Float up content */}
        <div className="w-full opacity-0 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards]">

          <NavLink to="/" className="flex items-center gap-3 justify-center mb-12 group cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground/90 group-hover:bg-primary transition-colors duration-700"></div>
            <span className="font-medium tracking-[0.35em] text-[10px] sm:text-[11px] uppercase text-foreground/80 group-hover:text-foreground transition-colors duration-700">
              Data Ring
            </span>
          </NavLink>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-balance">
              Bon retour.
            </h1>
            <p className="text-sm font-light text-muted-foreground text-pretty">
              Sécurisez vos données avec Data Ring.
            </p>
          </div>

          {authError && (
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6 w-full mb-10">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
                Adresse Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                placeholder="citoyen@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase ml-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-muted border border-border hover:border-foreground/20 focus:border-primary/50 focus:bg-muted/80 rounded-2xl outline-none text-foreground text-sm transition-all duration-300 placeholder:text-muted-foreground/50"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase rounded-full h-12 transition-all duration-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground tracking-[0.05em] mb-4">
            Nouveau parmi nous ?{' '}
            <NavLink
              to="/citizen/register"
              className="text-primary hover:text-foreground transition-colors duration-300"
            >
              Créer un compte
            </NavLink>
          </p>

          <div className="text-center">
            <a href={import.meta.env.VITE_APP_URL || '/app/'} className="text-[10px] tracking-[0.15em] font-medium text-muted-foreground/50 hover:text-muted-foreground uppercase transition-colors duration-300">
              Accès Membre du Staff
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenLogin;
