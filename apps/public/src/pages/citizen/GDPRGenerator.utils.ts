export type RightType = 'access' | 'rectification' | 'erasure' | 'portability';

export interface GDPRFormData {
  companyName: string;
  companyEmail: string;
  userName: string;
  userEmail: string;
  additionalInfo: string;
}

export function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getLetterTemplate(right: RightType, additionalInfo: string): string {
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

${additionalInfo ? `Informations à rectifier :\n${additionalInfo}` : '[Précisez les informations à corriger]'}

Je vous demande également de notifier cette rectification à tout destinataire auquel ces données auraient été communiquées, conformément à l'article 19 du RGPD.

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,

    erasure: `Objet : Demande d'effacement de données personnelles (Article 17 RGPD)

Madame, Monsieur,

En application de l'article 17 du Règlement Général sur la Protection des Données (RGPD), relatif au droit à l'effacement (« droit à l'oubli »), je vous demande de supprimer l'ensemble des données personnelles me concernant.

Cette demande est fondée sur le(s) motif(s) suivant(s) :
- Les données ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées
- Je retire mon consentement au traitement
- Les données ont fait l'objet d'un traitement illicite

${additionalInfo ? `Précisions complémentaires :\n${additionalInfo}` : ''}

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

${additionalInfo ? `Précisions complémentaires :\n${additionalInfo}` : ''}

Conformément à la réglementation, je vous prie de me répondre dans un délai d'un mois à compter de la réception de cette demande.`,
  };
  return templates[right];
}

export function generateLetter(
  selectedRight: RightType | null,
  formData: GDPRFormData,
  date: Date = new Date()
): string {
  if (!selectedRight) return '';

  const body = getLetterTemplate(selectedRight, formData.additionalInfo);

  return `${formData.userName}
${formData.userEmail}

${formData.companyName}
${formData.companyEmail}

${formatFrenchDate(date)}

${body}

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${formData.userName}`;
}
