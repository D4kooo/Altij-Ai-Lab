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

    if (preAnalyzedServices[query]) {
      setResult(preAnalyzedServices[query]);
    } else if (query.includes('google')) {
      setResult(preAnalyzedServices['google']);
    } else if (query.includes('facebook') || query.includes('meta')) {
      setResult(preAnalyzedServices['facebook']);
    } else {
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
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Préoccupant';
  };

  const getPointIcon = (type: AnalysisPoint['type']) => {
    switch (type) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back link */}
      <NavLink
        to="/outils"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux outils
      </NavLink>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-500/5 text-purple-600 dark:text-purple-400 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Analyseur de CGU
          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/10 text-xs">IA</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          Comprenez les CGU
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
          Découvrez ce que cachent les conditions d'utilisation des services que
          vous utilisez. Résumé clair, points de vigilance, score de confiance.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted">
          <button
            onClick={() => setMode('search')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              mode === 'search'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
              className="bg-card border-border flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isAnalyzing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <p className="text-sm text-muted-foreground">Services déjà analysés :</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(preAnalyzedServices).map(([key, service]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSearchQuery(service.serviceName);
                    setResult(service);
                  }}
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
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
            className="bg-card border-border min-h-[200px]"
          />
          <Button
            onClick={handlePasteAnalysis}
            disabled={!pastedText.trim() || isAnalyzing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <div className="rounded-2xl border border-border bg-card p-6">
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
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <p className={cn('text-sm font-medium', getScoreColor(result.score))}>
                  {getScoreLabel(result.score)}
                </p>
              </div>

              {/* Summary */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {result.serviceName}
                </h2>
                <p className="text-muted-foreground text-pretty">{result.summary}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dernière mise à jour : {result.lastUpdated}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Points */}
          {result.points.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Points d'attention
              </h3>
              <div className="space-y-3">
                {result.points.map((point, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-xl border p-4',
                      point.type === 'danger' && 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5',
                      point.type === 'warning' && 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5',
                      point.type === 'good' && 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5',
                      point.type === 'info' && 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getPointIcon(point.type)}
                      <div>
                        <h4 className="font-medium text-foreground">{point.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 text-pretty">
                          {point.description}
                        </p>
                        {point.article && (
                          <p className="text-xs text-muted-foreground mt-2">
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
          <div className="rounded-xl border border-border bg-muted p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Légende</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">Bon pour vous</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-muted-foreground">À surveiller</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-muted-foreground">Préoccupant</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-muted-foreground">Information</span>
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
            className="border-border"
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
            className="p-4 rounded-xl border border-border bg-card"
          >
            <item.icon className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 text-pretty">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CGUAnalyzer;
