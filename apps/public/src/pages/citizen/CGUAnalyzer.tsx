import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Loader2,
  Brain,
  Shield,
  Eye,
  Share2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AnalysisPoint {
  type: 'good' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  article?: string;
}

interface AnalysisResult {
  serviceName: string;
  score: number;
  summary: string;
  points: AnalysisPoint[];
  lastUpdated: string;
}

// Example pre-analyzed services
const preAnalyzedServices: Record<string, AnalysisResult> = {
  google: {
    serviceName: 'Google',
    score: 45,
    summary:
      "Google collecte une grande quantité de données pour la personnalisation publicitaire. Les CGU sont complexes mais offrent certains contrôles à l'utilisateur.",
    points: [
      {
        type: 'danger',
        title: 'Collecte extensive de données',
        description:
          "Google collecte vos recherches, localisation, historique YouTube, données vocales et bien plus pour créer un profil publicitaire détaillé.",
        article: 'Section "Données que nous collectons"',
      },
      {
        type: 'warning',
        title: 'Partage avec des tiers',
        description:
          "Vos données peuvent être partagées avec des partenaires publicitaires et des tiers pour la personnalisation des annonces.",
        article: 'Section "Partage de vos informations"',
      },
      {
        type: 'good',
        title: 'Contrôle utilisateur disponible',
        description:
          "Vous pouvez accéder à vos données, les télécharger et supprimer certaines informations via Google Dashboard.",
        article: 'Section "Vos choix"',
      },
      {
        type: 'info',
        title: 'Conservation longue durée',
        description:
          "Certaines données peuvent être conservées pendant plusieurs années, même après suppression du compte.",
        article: 'Section "Conservation des données"',
      },
    ],
    lastUpdated: '2024-01-15',
  },
  facebook: {
    serviceName: 'Facebook/Meta',
    score: 35,
    summary:
      "Les CGU de Meta sont particulièrement permissives concernant l'utilisation de vos données. La plateforme collecte massivement pour la publicité ciblée.",
    points: [
      {
        type: 'danger',
        title: 'Licence très large sur votre contenu',
        description:
          "En publiant du contenu, vous accordez à Meta une licence mondiale, non exclusive et libre de redevances pour utiliser votre contenu.",
        article: 'Section 3.3 "Autorisations"',
      },
      {
        type: 'danger',
        title: 'Suivi cross-platform',
        description:
          "Meta peut suivre votre activité sur les sites tiers via le pixel Facebook et les boutons de partage.",
        article: 'Section "Cookies et technologies similaires"',
      },
      {
        type: 'warning',
        title: 'Transfert international de données',
        description:
          "Vos données peuvent être transférées vers les États-Unis et d'autres pays avec des protections différentes.",
        article: 'Section "Transfert de données"',
      },
      {
        type: 'good',
        title: "Outils de téléchargement de données",
        description:
          "Vous pouvez télécharger une copie de vos données via les paramètres de confidentialité.",
      },
    ],
    lastUpdated: '2024-01-10',
  },
};

export function CGUAnalyzer() {
  const [mode, setMode] = useState<'search' | 'paste'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();

    // Check if we have a pre-analyzed result
    if (preAnalyzedServices[query]) {
      setResult(preAnalyzedServices[query]);
    } else if (query.includes('google')) {
      setResult(preAnalyzedServices['google']);
    } else if (query.includes('facebook') || query.includes('meta')) {
      setResult(preAnalyzedServices['facebook']);
    } else {
      // Simulate analysis for unknown services
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setResult({
          serviceName: searchQuery,
          score: 50,
          summary:
            "Nous n'avons pas encore analysé ce service. Vous pouvez coller les CGU pour une analyse personnalisée.",
          points: [],
          lastUpdated: new Date().toISOString().split('T')[0],
        });
      }, 1500);
    }
  };

  const handlePasteAnalysis = () => {
    if (!pastedText.trim()) return;

    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        serviceName: 'Document analysé',
        score: 55,
        summary:
          "Cette analyse est une démonstration. Pour une analyse complète par IA, cette fonctionnalité nécessiterait une connexion à un service d'analyse de texte.",
        points: [
          {
            type: 'info',
            title: 'Analyse en cours de développement',
            description:
              "L'analyse automatique par IA des CGU sera disponible prochainement. En attendant, consultez nos ressources éducatives.",
          },
        ],
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Préoccupant';
  };

  const getPointIcon = (type: AnalysisPoint['type']) => {
    switch (type) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Analyseur de CGU
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-xs">IA</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Comprenez les CGU
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Découvrez ce que cachent les conditions d'utilisation des services que
          vous utilisez. Résumé clair, points de vigilance, score de confiance.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setMode('search')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              mode === 'search'
                ? 'bg-[#57C5B6] text-white'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Rechercher un service
          </button>
          <button
            onClick={() => setMode('paste')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              mode === 'paste'
                ? 'bg-[#57C5B6] text-white'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Coller des CGU
          </button>
        </div>
      </div>

      {/* Search Mode */}
      {mode === 'search' && !result && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: Google, Facebook, Amazon..."
              className="bg-white border-gray-200 flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isAnalyzing}
              className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Analyser'
              )}
            </Button>
          </div>

          {/* Pre-analyzed services */}
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Services déjà analysés :</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(preAnalyzedServices).map(([key, service]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSearchQuery(service.serviceName);
                    setResult(service);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {service.serviceName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paste Mode */}
      {mode === 'paste' && !result && (
        <div className="space-y-4">
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Collez ici le texte des CGU/CGV que vous souhaitez analyser..."
            className="bg-white border-gray-200 min-h-[200px]"
          />
          <Button
            onClick={handlePasteAnalysis}
            disabled={!pastedText.trim() || isAnalyzing}
            className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyser avec l'IA
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Score */}
              <div className="text-center md:text-left">
                <div
                  className={cn(
                    'text-5xl font-bold',
                    getScoreColor(result.score)
                  )}
                >
                  {result.score}
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <p className={cn('text-sm font-medium', getScoreColor(result.score))}>
                  {getScoreLabel(result.score)}
                </p>
              </div>

              {/* Summary */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {result.serviceName}
                </h2>
                <p className="text-gray-500">{result.summary}</p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dernière mise à jour : {result.lastUpdated}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Points */}
          {result.points.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Points d'attention
              </h3>
              <div className="space-y-3">
                {result.points.map((point, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-xl border p-4',
                      point.type === 'danger' && 'border-red-200 bg-red-50',
                      point.type === 'warning' && 'border-amber-200 bg-amber-50',
                      point.type === 'good' && 'border-green-200 bg-green-50',
                      point.type === 'info' && 'border-blue-200 bg-blue-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getPointIcon(point.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{point.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {point.description}
                        </p>
                        {point.article && (
                          <p className="text-xs text-gray-400 mt-2">
                            Source : {point.article}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Légende</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Bon pour vous</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-gray-600">À surveiller</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">Préoccupant</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Information</span>
              </div>
            </div>
          </div>

          {/* New Analysis Button */}
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setSearchQuery('');
              setPastedText('');
            }}
            className="border-gray-200"
          >
            Nouvelle analyse
          </Button>
        </div>
      )}

      {/* Info Section */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Shield,
            title: 'Vie privée',
            description: 'Comment vos données sont collectées et utilisées.',
          },
          {
            icon: Share2,
            title: 'Partage',
            description: 'Avec qui vos informations sont partagées.',
          },
          {
            icon: Eye,
            title: 'Tracking',
            description: 'Comment votre activité est suivie.',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-gray-200 bg-white"
          >
            <item.icon className="h-5 w-5 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CGUAnalyzer;
