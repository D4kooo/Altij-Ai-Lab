import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <NavLink to="/welcome" className="block mb-8">
          <img
            src="/assets/logo-dataring-black.png"
            alt="Data Ring"
            className="h-10 w-auto mx-auto"
            onError={(e) => {
              e.currentTarget.src = '/assets/logo-dataring.png';
            }}
          />
        </NavLink>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="text-gray-500">
            Accédez à votre espace Data Ring
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
              placeholder="jean.dupont@email.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
              placeholder="Votre mot de passe"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#57C5B6] hover:bg-[#4AB0A2] text-white h-11"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <NavLink
            to="/citizen/register"
            className="text-[#57C5B6] hover:underline font-medium"
          >
            Créer un compte
          </NavLink>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          Membre Data Ring ?{' '}
          <NavLink to="/login" className="hover:underline">
            Espace Staff
          </NavLink>
        </p>
      </div>
    </div>
  );
}

export default CitizenLogin;
