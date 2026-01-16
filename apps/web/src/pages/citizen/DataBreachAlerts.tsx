import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Mail,
  Search,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Database,
  Key,
  CreditCard,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Breach {
  name: string;
  domain: string;
  date: string;
  dataClasses: string[];
  description: string;
  pwnCount: number;
}

// Example breaches for demo purposes
const exampleBreaches: Breach[] = [
  {
    name: 'LinkedIn',
    domain: 'linkedin.com',
    date: '2021-06-22',
    dataClasses: ['Adresses email', 'Noms', 'Numéros de téléphone', 'Emplois'],
    description: 'Données de 700 millions d\'utilisateurs exposées suite à un scraping.',
    pwnCount: 700000000,
  },
  {
    name: 'Facebook',
    domain: 'facebook.com',
    date: '2019-04-01',
    dataClasses: ['Adresses email', 'Noms', 'Numéros de téléphone', 'Dates de naissance'],
    description: 'Fuite de données touchant 533 millions de comptes dans 106 pays.',
    pwnCount: 533000000,
  },
  {
    name: 'Adobe',
    domain: 'adobe.com',
    date: '2013-10-04',
    dataClasses: ['Adresses email', 'Mots de passe', 'Indices de mot de passe'],
    description: 'Fuite massive incluant des mots de passe faiblement chiffrés.',
    pwnCount: 153000000,
  },
];

const securityTips = [
  {
    icon: Key,
    title: 'Changez vos mots de passe',
    description: 'Utilisez un mot de passe unique pour chaque service compromis.',
  },
  {
    icon: Lock,
    title: 'Activez la 2FA',
    description: "L'authentification à deux facteurs protège même si votre mot de passe fuite.",
  },
  {
    icon: CreditCard,
    title: 'Surveillez vos comptes',
    description: 'Vérifiez régulièrement vos relevés bancaires pour détecter des fraudes.',
  },
  {
    icon: Mail,
    title: 'Méfiez-vous du phishing',
    description: 'Les données volées sont souvent utilisées pour des attaques ciblées.',
  },
];

export function DataBreachAlerts() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [breaches, setBreaches] = useState<Breach[]>([]);

  const handleSearch = () => {
    if (!email.trim()) return;

    setIsSearching(true);
    setHasSearched(false);

    // Simulate API call - in production, this would call Have I Been Pwned API
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);

      // Demo: show some breaches for any email containing common domains
      if (email.includes('@gmail') || email.includes('@hotmail') || email.includes('@yahoo')) {
        setBreaches(exampleBreaches.slice(0, 2));
      } else if (email.includes('@')) {
        setBreaches(exampleBreaches.slice(0, 1));
      } else {
        setBreaches([]);
      }
    }, 2000);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} Mrd`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} K`;
    return num.toString();
  };

  const getDataClassIcon = (dataClass: string) => {
    if (dataClass.toLowerCase().includes('email')) return Mail;
    if (dataClass.toLowerCase().includes('mot de passe') || dataClass.toLowerCase().includes('password')) return Key;
    if (dataClass.toLowerCase().includes('téléphone') || dataClass.toLowerCase().includes('phone')) return Mail;
    return Database;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back link */}
      <NavLink
        to="/outils"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux outils
      </NavLink>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          Alertes Violations
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Vos données ont-elles fuité ?
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Vérifiez si votre adresse email apparaît dans des fuites de données
          connues. Basé sur la base de données Have I Been Pwned.
        </p>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre adresse email"
              className="bg-gray-50 border-gray-200 pl-10 h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!email.trim() || isSearching}
            className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-6"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Recherche...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Vérifier
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Votre email n'est pas stocké ni partagé. La vérification est anonyme.
        </p>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Status */}
          {breaches.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Bonne nouvelle !
              </h2>
              <p className="text-gray-600">
                Aucune fuite de données connue n'a été trouvée pour cette
                adresse email. Restez vigilant et continuez à utiliser des mots
                de passe uniques.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="h-10 w-10 text-red-600 shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Attention : {breaches.length} fuite(s) détectée(s)
                    </h2>
                    <p className="text-gray-600">
                      Votre adresse email a été trouvée dans {breaches.length}{' '}
                      violation(s) de données. Nous vous recommandons de changer
                      vos mots de passe et d'activer l'authentification à deux
                      facteurs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Breach List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détail des fuites
                </h3>
                {breaches.map((breach, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {breach.name}
                        </h4>
                        <p className="text-sm text-gray-400">{breach.domain}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(breach.date).toLocaleDateString('fr-FR')}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatNumber(breach.pwnCount)} comptes touchés
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {breach.description}
                    </p>

                    <div>
                      <p className="text-xs text-gray-400 mb-2">
                        Données compromises :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {breach.dataClasses.map((dataClass, i) => {
                          const Icon = getDataClassIcon(dataClass);
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs"
                            >
                              <Icon className="h-3 w-3" />
                              {dataClass}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Security Tips */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Conseils de sécurité
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {securityTips.map((tip, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <tip.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{tip.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About HIBP */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-[#57C5B6] shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              À propos de cette vérification
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Cette fonctionnalité utilise la base de données Have I Been Pwned
              (HIBP), une ressource gratuite créée par l'expert en sécurité Troy
              Hunt. Elle agrège des données provenant de fuites de données
              publiquement connues.
            </p>
            <a
              href="https://haveibeenpwned.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#57C5B6] hover:underline"
            >
              En savoir plus sur HIBP
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        Note : Cette démonstration simule une vérification. En production, le
        service utiliserait l'API officielle Have I Been Pwned pour des
        résultats réels.
      </p>
    </div>
  );
}

export default DataBreachAlerts;
