// Legal Data Sources Catalogue
// Maps ~50 legal data sources to 7 real API connectors

export type DataSourceCategory =
  | 'codes-francais'
  | 'jurisprudence'
  | 'entreprises'
  | 'europe-international'
  | 'donnees-publiques'
  | 'autres';

export type ConnectorType =
  | 'legifrance'
  | 'judilibre'
  | 'sirene'
  | 'bodacc'
  | 'gleif'
  | 'rna'
  | 'eurlex'
  | 'external';

export interface LegalDataSource {
  id: string;
  name: string;
  description: string;
  category: DataSourceCategory;
  connector: ConnectorType;
  connectorConfig?: Record<string, string>;
  access: 'free' | 'paid' | 'restricted';
  apiCost?: string;
  requiresConfig: boolean;
}

export const CATEGORY_LABELS: Record<DataSourceCategory, string> = {
  'codes-francais': 'Codes et lois fran\u00e7ais',
  'jurisprudence': 'Jurisprudence',
  'entreprises': 'Donn\u00e9es entreprises',
  'europe-international': 'Europe & International',
  'donnees-publiques': 'Donn\u00e9es publiques',
  'autres': 'Autres sources',
};

export const LEGAL_DATA_SOURCES: LegalDataSource[] = [
  // =====================================================
  // CODES FRANCAIS (connector: legifrance)
  // =====================================================
  {
    id: 'code-civil',
    name: 'Code civil',
    description: 'Droit des personnes, biens, obligations, contrats, successions',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070721' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-penal',
    name: 'Code p\u00e9nal',
    description: 'Infractions, peines, r\u00e9cidive, sursis',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070719' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-commerce',
    name: 'Code de commerce',
    description: 'Soci\u00e9t\u00e9s, proc\u00e9dures collectives, fonds de commerce',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000005634379' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-travail',
    name: 'Code du travail',
    description: 'Contrats de travail, licenciement, IRP, s\u00e9curit\u00e9',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006072050' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-procedure-civile',
    name: 'Code de proc\u00e9dure civile',
    description: 'R\u00e8gles de proc\u00e9dure devant les juridictions civiles',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070716' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-procedure-penale',
    name: 'Code de proc\u00e9dure p\u00e9nale',
    description: 'Enqu\u00eate, instruction, jugement, voies de recours',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006071154' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-propriete-intellectuelle',
    name: 'Code de la propri\u00e9t\u00e9 intellectuelle',
    description: 'Brevets, marques, droits d\'auteur, dessins et mod\u00e8les',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006069414' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-consommation',
    name: 'Code de la consommation',
    description: 'Protection des consommateurs, clauses abusives, cr\u00e9dit',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006069565' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-environnement',
    name: 'Code de l\'environnement',
    description: 'Pollution, d\u00e9chets, installations class\u00e9es, biodiversit\u00e9',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006074220' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-urbanisme',
    name: 'Code de l\'urbanisme',
    description: 'Permis de construire, PLU, am\u00e9nagement du territoire',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006074075' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-general-impots',
    name: 'Code g\u00e9n\u00e9ral des imp\u00f4ts',
    description: 'Imp\u00f4t sur le revenu, TVA, imp\u00f4t sur les soci\u00e9t\u00e9s',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006069577' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-securite-sociale',
    name: 'Code de la s\u00e9curit\u00e9 sociale',
    description: 'Assurance maladie, retraite, cotisations, prestations',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006073189' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-sante-publique',
    name: 'Code de la sant\u00e9 publique',
    description: 'Droits des patients, \u00e9tablissements de sant\u00e9, m\u00e9dicaments',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006072665' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-construction',
    name: 'Code de la construction et de l\'habitation',
    description: 'Construction, logement, copropri\u00e9t\u00e9, baux',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006074096' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-assurances',
    name: 'Code des assurances',
    description: 'Contrats d\'assurance, indemnisation, responsabilit\u00e9',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006073984' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-monetaire-financier',
    name: 'Code mon\u00e9taire et financier',
    description: 'Banque, march\u00e9s financiers, paiements, AMF',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006072026' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-justice-administrative',
    name: 'Code de justice administrative',
    description: 'Proc\u00e9dure devant les tribunaux administratifs',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070933' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-entree-sejour',
    name: 'Code de l\'entr\u00e9e et du s\u00e9jour des \u00e9trangers',
    description: 'Immigration, visas, asile, \u00e9loignement',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070158' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'code-electoral',
    name: 'Code \u00e9lectoral',
    description: '\u00c9lections, listes \u00e9lectorales, financement politique',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { codeId: 'LEGITEXT000006070239' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'legifrance-textes',
    name: 'L\u00e9gifrance \u2013 Textes consolid\u00e9s',
    description: 'Recherche libre dans tous les textes consolid\u00e9s (lois, d\u00e9crets, arr\u00eat\u00e9s)',
    category: 'codes-francais',
    connector: 'legifrance',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'service-public',
    name: 'Service-Public.fr',
    description: 'Fiches pratiques administratives et droits des citoyens',
    category: 'codes-francais',
    connector: 'legifrance',
    connectorConfig: { fond: 'SERVICE_PUBLIC' },
    access: 'free',
    requiresConfig: true,
  },

  // =====================================================
  // JURISPRUDENCE
  // =====================================================
  {
    id: 'judilibre',
    name: 'Judilibre \u2013 Cour de cassation',
    description: 'D\u00e9cisions de la Cour de cassation (toutes chambres)',
    category: 'jurisprudence',
    connector: 'judilibre',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'legifrance-jurisprudence',
    name: 'L\u00e9gifrance \u2013 Jurisprudence',
    description: 'D\u00e9cisions Conseil d\'\u00c9tat, cours d\'appel, tribunaux',
    category: 'jurisprudence',
    connector: 'legifrance',
    connectorConfig: { fond: 'JURI' },
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'legifrance-conseil-constitutionnel',
    name: 'Conseil constitutionnel',
    description: 'D\u00e9cisions QPC et contr\u00f4le de constitutionnalit\u00e9',
    category: 'jurisprudence',
    connector: 'legifrance',
    connectorConfig: { fond: 'CONSTIT' },
    access: 'free',
    requiresConfig: true,
  },

  // =====================================================
  // ENTREPRISES
  // =====================================================
  {
    id: 'api-sirene',
    name: 'R\u00e9pertoire SIRENE (INSEE)',
    description: 'Informations l\u00e9gales sur les entreprises fran\u00e7aises (SIREN/SIRET)',
    category: 'entreprises',
    connector: 'sirene',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'bodacc',
    name: 'BODACC',
    description: 'Annonces commerciales : cr\u00e9ations, modifications, radiations, proc\u00e9dures collectives',
    category: 'entreprises',
    connector: 'bodacc',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'gleif-lei',
    name: 'GLEIF \u2013 LEI',
    description: 'Identifiants d\'entit\u00e9s l\u00e9gales (LEI) et relations capitalistiques',
    category: 'entreprises',
    connector: 'gleif',
    access: 'free',
    requiresConfig: false,
  },

  // =====================================================
  // EUROPE & INTERNATIONAL
  // =====================================================
  {
    id: 'eurlex-legislation',
    name: 'EUR-Lex \u2013 L\u00e9gislation UE',
    description: 'R\u00e8glements, directives et d\u00e9cisions europ\u00e9ennes',
    category: 'europe-international',
    connector: 'eurlex',
    connectorConfig: { type: 'legislation' },
    access: 'free',
    requiresConfig: false,
  },
  {
    id: 'eurlex-jurisprudence',
    name: 'EUR-Lex \u2013 Jurisprudence CJUE',
    description: 'Arr\u00eats de la Cour de justice de l\'Union europ\u00e9enne',
    category: 'europe-international',
    connector: 'eurlex',
    connectorConfig: { type: 'case-law' },
    access: 'free',
    requiresConfig: false,
  },
  {
    id: 'eurlex-traites',
    name: 'EUR-Lex \u2013 Trait\u00e9s',
    description: 'Trait\u00e9s fondateurs de l\'UE (TUE, TFUE)',
    category: 'europe-international',
    connector: 'eurlex',
    connectorConfig: { type: 'treaty' },
    access: 'free',
    requiresConfig: false,
  },

  // =====================================================
  // DONNEES PUBLIQUES
  // =====================================================
  {
    id: 'rna',
    name: 'R\u00e9pertoire National des Associations',
    description: 'Recherche d\'associations fran\u00e7aises (RNA)',
    category: 'donnees-publiques',
    connector: 'rna',
    access: 'free',
    requiresConfig: false,
  },

  // =====================================================
  // AUTRES (no API, external config required)
  // =====================================================
  {
    id: 'openlegi',
    name: 'Openlegi',
    description: 'L\u00e9gislation fran\u00e7aise en open data',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
  {
    id: 'vlex',
    name: 'vLex',
    description: 'Base de donn\u00e9es juridique internationale avec IA',
    category: 'autres',
    connector: 'external',
    access: 'paid',
    apiCost: 'Abonnement requis',
    requiresConfig: true,
  },
  {
    id: 'goodlegal',
    name: 'GoodLegal',
    description: 'Plateforme d\'analyse juridique par IA',
    category: 'autres',
    connector: 'external',
    access: 'paid',
    apiCost: 'Abonnement requis',
    requiresConfig: true,
  },
  {
    id: 'fiben',
    name: 'FIBEN (Banque de France)',
    description: 'Cotation des entreprises et analyse financi\u00e8re',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
  {
    id: 'cnil-registre',
    name: 'Registre CNIL',
    description: 'D\u00e9lib\u00e9rations et sanctions de la CNIL',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
  {
    id: 'base-marques',
    name: 'Base marques INPI',
    description: 'Recherche de marques d\u00e9pos\u00e9es en France',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
  {
    id: 'base-brevets',
    name: 'Base brevets INPI',
    description: 'Recherche de brevets fran\u00e7ais et europ\u00e9ens',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
  {
    id: 'cuad-dataset',
    name: 'CUAD Dataset',
    description: 'Jeu de donn\u00e9es d\'analyse de contrats (Contract Understanding)',
    category: 'autres',
    connector: 'external',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'pile-of-law',
    name: 'Pile of Law',
    description: 'Corpus juridique pour l\'entra\u00eenement de mod\u00e8les IA',
    category: 'autres',
    connector: 'external',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'wipo-lex',
    name: 'WIPO Lex',
    description: 'Base de donn\u00e9es de l\u00e9gislation sur la propri\u00e9t\u00e9 intellectuelle (OMPI)',
    category: 'autres',
    connector: 'external',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'ssrn',
    name: 'SSRN',
    description: 'Articles de recherche juridique acad\u00e9mique',
    category: 'autres',
    connector: 'external',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'ecli-search',
    name: 'ECLI Search',
    description: 'Recherche de d\u00e9cisions par identifiant ECLI europ\u00e9en',
    category: 'autres',
    connector: 'external',
    access: 'free',
    requiresConfig: true,
  },
  {
    id: 'api-entreprise',
    name: 'API Entreprise',
    description: 'Donn\u00e9es entreprises pour administrations (acc\u00e8s restreint secteur public)',
    category: 'autres',
    connector: 'external',
    access: 'restricted',
    requiresConfig: true,
  },
];

// Helpers

const sourceMap = new Map(LEGAL_DATA_SOURCES.map((s) => [s.id, s]));

export function getLegalSourcesByIds(ids: string[]): LegalDataSource[] {
  return ids.map((id) => sourceMap.get(id)).filter((s): s is LegalDataSource => !!s);
}

export function getLegalSourcesByCategory(category: DataSourceCategory): LegalDataSource[] {
  return LEGAL_DATA_SOURCES.filter((s) => s.category === category);
}

export function getAllCategories(): DataSourceCategory[] {
  return Object.keys(CATEGORY_LABELS) as DataSourceCategory[];
}
