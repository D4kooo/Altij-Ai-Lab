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
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'rectification',
    title: 'Droit de rectification',
    description: "Corriger des informations inexactes ou incomplètes vous concernant.",
    icon: FileText,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    id: 'erasure',
    title: "Droit à l'effacement",
    description: "Demander la suppression de vos données personnelles (droit à l'oubli).",
    icon: Trash2,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    id: 'portability',
    title: 'Droit à la portabilité',
    description: "Récupérer vos données dans un format structuré et réutilisable.",
    icon: Download,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
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
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux outils
      </NavLink>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
          <Scale className="h-4 w-4" />
          Générateur RGPD
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Exercez vos droits RGPD
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
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
                  ? 'bg-[#57C5B6] text-white'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {s}
            </div>
            <span
              className={cn(
                'text-sm hidden sm:block',
                step >= s ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {s === 1 && 'Choisir le droit'}
              {s === 2 && 'Informations'}
              {s === 3 && 'Lettre générée'}
            </span>
            {s < 3 && (
              <ChevronRight className="h-4 w-4 text-gray-300 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Right */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
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
                  'p-5 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-md',
                  right.color
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/50">
                    <right.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{right.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
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
          <h2 className="text-xl font-semibold text-gray-900">
            Vos informations
          </h2>

          {/* Popular companies */}
          <div className="space-y-3">
            <Label className="text-gray-500">Entreprises courantes</Label>
            <div className="flex flex-wrap gap-2">
              {popularCompanies.map((company) => (
                <button
                  key={company.name}
                  onClick={() => handleCompanySelect(company)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-all',
                    formData.companyName === company.name
                      ? 'bg-[#57C5B6] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div className="flex items-center gap-2 text-gray-600">
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
                    className="bg-white border-gray-200"
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
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
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
                    className="bg-white border-gray-200"
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
                    className="bg-white border-gray-200"
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
                className="bg-white border-gray-200 min-h-[100px]"
              />
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-gray-200"
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
              className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
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
            <h2 className="text-xl font-semibold text-gray-900">
              Votre lettre est prête
            </h2>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-gray-200"
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

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {generateLetter()}
            </pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700">Prochaine étape</p>
                <p className="text-gray-600 mt-1">
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
              className="border-gray-200"
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
