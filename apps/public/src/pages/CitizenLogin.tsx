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
    <div className="min-h-[100svh] bg-white text-black font-body selection:bg-[#21B2AA] selection:text-white flex items-center justify-center relative overflow-hidden px-6">

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-full opacity-0 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards]">

          <NavLink to="/" className="flex items-center gap-3 justify-center mb-12 group cursor-pointer">
            <img src="/assets/logo-dataring-black.png" alt="Dataring" className="h-10" />
          </NavLink>

          <div className="text-center mb-10">
            <h1 className="font-bold text-3xl tracking-tighter leading-[0.95] font-heading mb-2">
              Bon retour.
            </h1>
            <p className="text-sm text-black/50">
              Sécurisez vos données avec Data Ring.
            </p>
          </div>

          {authError && (
            <div className="mb-8 px-4 py-3 border-2 border-black bg-black/5 font-mono text-[10px] tracking-[0.1em] text-black text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5 w-full mb-10">
            <div>
              <label htmlFor="login-email" className="block font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase mb-2">
                Adresse Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black/15 bg-white text-sm focus:border-black focus:outline-none transition-colors duration-100 placeholder:text-black/25"
                placeholder="citoyen@email.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase mb-2">
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black/15 bg-white text-sm focus:border-black focus:outline-none transition-colors duration-100 placeholder:text-black/25"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase border-2 border-black hover:bg-white hover:text-black transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={14} strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          <p className="text-center font-mono text-[10px] tracking-[0.1em] text-black/40 mb-4">
            Nouveau parmi nous ?{' '}
            <NavLink
              to="/citizen/register"
              className="text-black border-b border-black/30 hover:border-black transition-colors duration-100"
            >
              Créer un compte
            </NavLink>
          </p>

          <div className="text-center">
            <a href={import.meta.env.VITE_APP_URL || '/app/'} className="font-mono text-[10px] tracking-[0.15em] text-black/25 hover:text-black/50 uppercase transition-colors duration-100">
              Accès Membre du Staff
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenLogin;
