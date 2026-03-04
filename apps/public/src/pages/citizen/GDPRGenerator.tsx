import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Eye,
  FileText,
  Trash2,
  Download,
  Copy,
  Check,
  ChevronRight,
  Building2,
  Mail,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type RightType = 'access' | 'rectification' | 'erasure' | 'portability';

interface RightOption {
  id: RightType;
  title: string;
  description: string;
  icon: typeof Eye;
  color: string;
}

const rights: RightOption[] = [
  {
    id: 'access',
    title: "Droit d'accès",
    description: "Obtenir une copie de toutes les données qu'une entreprise détient sur vous.",
    icon: Eye,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20',
  },
  {
    id: 'rectification',
    title: 'Droit de rectification',
    description: "Corriger des informations inexactes ou incomplètes vous concernant.",
    icon: FileText,
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20',
  },
  {
    id: 'erasure',
    title: "Droit à l'effacement",
    description: "Demander la suppression de vos données personnelles (droit à l'oubli).",
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20',
  },
  {
    id: 'portability',
    title: 'Droit à la portabilité',
    description: "Récupérer vos données dans un format structuré et réutilisable.",
    icon: Download,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/20',
  },
];

const popularCompanies = [
  { name: 'Google', email: 'support-fr@google.com' },
  { name: 'Facebook/Meta', email: 'dataprivacy@support.facebook.com' },
  { name: 'Amazon', email: 'privacy@amazon.fr' },
  { name: 'Apple', email: 'dpo@apple.com' },
  { name: 'Microsoft', email: 'dpo@microsoft.com' },
  { name: 'LinkedIn', email: 'dpo@linkedin.com' },
];

export function GDPRGenerator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRight, setSelectedRight] = useState<RightType | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    additionalInfo: '',
  });
  const [copied, setCopied] = useState(false);

  const generateLetter = (): string => {
    if (!selectedRight) return '';
    const right = rights.find((r) => r.id === selectedRight);
    if (!right) return '';

    const date = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const templates: Record<RightType, string> = {
      access: `Objet : Demande d'accès aux données personnelles (Article 15 RGPD)

Madame, Monsieur,

En application de l'article 15 du Règlement Général sur la Protection des Données (RGPD), je vous demande de bien vouloir me communiquer :

1. La confirmation que des données personnelles me concernant sont ou ne sont pas traitées par votre organisme ;
2. Le cas échéant, l'accès à l'ensemble de ces données personnelles ;
3. Les informations suivantes :
   - Les finalités du traitement
   - Les catégories de données concernées
   - Les destinataires ou catégories de destinataires
   - La durée de conservation envisagée
   - L'existence du droit de rectification, d'effacement, de limitation ou d'opposition
   - Le droit d'introduire une réclamation auprès de la CNIL
   - L'origine des données (si elles n'ont pas été collectées directement auprès de moi)
   - L'existence éventuelle d'une prise de décision automatisée

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,

      rectification: `Objet : Demande de rectification de données personnelles (Article 16 RGPD)

Madame, Monsieur,

En application de l'article 16 du Règlement Général sur la Protection des Données (RGPD), je vous demande de bien vouloir rectifier les données personnelles me concernant qui sont inexactes ou incomplètes.

${formData.additionalInfo ? `Informations à rectifier :\n${formData.additionalInfo}` : '[Précisez les informations à corriger]'}

Je vous demande également de notifier cette rectification à tout destinataire auquel ces données auraient été communiquées, conformément à l'article 19 du RGPD.

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,

      erasure: `Objet : Demande d'effacement de données personnelles (Article 17 RGPD)

Madame, Monsieur,

En application de l'article 17 du Règlement Général sur la Protection des Données (RGPD), relatif au droit à l'effacement (« droit à l'oubli »), je vous demande de supprimer l'ensemble des données personnelles me concernant.

Cette demande est fondée sur le(s) motif(s) suivant(s) :
- Les données ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées
- Je retire mon consentement au traitement
- Les données ont fait l'objet d'un traitement illicite

${formData.additionalInfo ? `Précisions complémentaires :\n${formData.additionalInfo}` : ''}

Je vous demande également de notifier cette suppression à tout destinataire auquel ces données auraient été communiquées, conformément à l'article 19 du RGPD.

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,

      portability: `Objet : Demande de portabilité des données personnelles (Article 20 RGPD)

Madame, Monsieur,

En application de l'article 20 du Règlement Général sur la Protection des Données (RGPD), je vous demande de me transmettre, dans un format structuré, couramment utilisé et lisible par machine, l'ensemble des données personnelles me concernant que je vous ai fournies.

Ces données incluent notamment :
- Les données de compte et de profil
- L'historique d'utilisation du service
- Les contenus que j'ai créés ou téléchargés
- Mes préférences et paramètres

${formData.additionalInfo ? `Précisions complémentaires :\n${formData.additionalInfo}` : ''}

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,
    };

    return `${formData.userName}
${formData.userEmail}

${formData.companyName}
${formData.companyEmail}

${date}

${templates[selectedRight]}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${formData.userName}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateLetter());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompanySelect = (company: { name: string; email: string }) => {
    setFormData((prev) => ({
      ...prev,
      companyName: company.name,
      companyEmail: company.email,
    }));
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 text-sm font-medium">
          <Scale className="h-4 w-4" />
          Générateur RGPD
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          Exercez vos droits RGPD
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
          Générez une lettre personnalisée pour demander l'accès, la
          rectification, la suppression ou la portabilité de vos données.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s}
            </div>
            <span
              className={cn(
                'text-sm hidden sm:block',
                step >= s ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {s === 1 && 'Choisir le droit'}
              {s === 2 && 'Informations'}
              {s === 3 && 'Lettre générée'}
            </span>
            {s < 3 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Right */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground text-center">
            Quel droit souhaitez-vous exercer ?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {rights.map((right) => (
              <button
                key={right.id}
                onClick={() => {
                  setSelectedRight(right.id);
                  setStep(2);
                }}
                className={cn(
                  'p-5 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm',
                  right.color
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-card">
                    <right.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{right.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-pretty">
                      {right.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            Vos informations
          </h2>

          {/* Popular companies */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">Entreprises courantes</Label>
            <div className="flex flex-wrap gap-2">
              {popularCompanies.map((company) => (
                <button
                  key={company.name}
                  onClick={() => handleCompanySelect(company)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-all',
                    formData.companyName === company.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Entreprise destinataire</span>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Ex: Google, Amazon..."
                    className="bg-card border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email DPO / Contact</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyEmail: e.target.value,
                      }))
                    }
                    placeholder="dpo@entreprise.com"
                    className="bg-card border-border"
                  />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">Vos informations</span>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="userName">Votre nom complet</Label>
                  <Input
                    id="userName"
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        userName: e.target.value,
                      }))
                    }
                    placeholder="Jean Dupont"
                    className="bg-card border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">Votre email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        userEmail: e.target.value,
                      }))
                    }
                    placeholder="jean.dupont@email.com"
                    className="bg-card border-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(selectedRight === 'rectification' || selectedRight === 'erasure' || selectedRight === 'portability') && (
            <div>
              <Label htmlFor="additionalInfo">
                Informations complémentaires (optionnel)
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    additionalInfo: e.target.value,
                  }))
                }
                placeholder={
                  selectedRight === 'rectification'
                    ? 'Précisez les informations à corriger...'
                    : 'Précisez votre demande si nécessaire...'
                }
                className="bg-card border-border min-h-[100px]"
              />
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-border"
            >
              Retour
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={
                !formData.companyName ||
                !formData.companyEmail ||
                !formData.userName ||
                !formData.userEmail
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Générer la lettre
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Letter */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Votre lettre est prête
            </h2>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-border"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <pre className="whitespace-pre-wrap text-sm text-foreground/70 font-mono">
              {generateLetter()}
            </pre>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">Prochaine étape</p>
                <p className="text-muted-foreground mt-1 text-pretty">
                  Envoyez cette lettre à <strong>{formData.companyEmail}</strong>{' '}
                  depuis votre boîte email ({formData.userEmail}). L'entreprise a
                  légalement un mois pour vous répondre.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedRight(null);
                setFormData({
                  companyName: '',
                  companyEmail: '',
                  userName: '',
                  userEmail: '',
                  additionalInfo: '',
                });
              }}
              className="border-border"
            >
              Nouvelle demande
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GDPRGenerator;
