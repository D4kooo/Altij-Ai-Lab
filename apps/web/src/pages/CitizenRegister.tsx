import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Check } from 'lucide-react';

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

  const benefits = [
    'Accès aux parcours éducatifs personnalisés',
    'Outils RGPD et protection de vos données',
    'Participation aux actions collectives',
    'Newsletter et alertes sécurité',
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <NavLink to="/welcome" className="block mb-8">
            <img
              src="/assets/logo-dataring-black.png"
              alt="Data Ring"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.src = '/assets/logo-dataring.png';
              }}
            />
          </NavLink>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-500 mb-8">
            Rejoignez la communauté Data Ring et accédez à tous nos outils
            gratuits.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700">
                  Prénom
                </Label>
                <Input
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
                  className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700">
                  Nom
                </Label>
                <Input
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
                  className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
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
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
                placeholder="8 caractères minimum"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirmer le mot de passe
              </Label>
              <Input
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
                className="mt-1.5 border-gray-200 focus:border-[#57C5B6] focus:ring-[#57C5B6]"
                placeholder="Confirmez votre mot de passe"
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
                  Créer mon compte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <NavLink
              to="/citizen/login"
              className="text-[#57C5B6] hover:underline font-medium"
            >
              Se connecter
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

      {/* Right side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gray-50 items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Ce que vous obtenez
          </h2>
          <ul className="space-y-4">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#57C5B6]/10 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-[#57C5B6]" />
                </div>
                <span className="text-gray-600">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 p-6 bg-white rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">100% gratuit</p>
            <p className="text-gray-900">
              Data Ring est une association d'intérêt général. Nous ne vendons
              pas vos données.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenRegister;
