import puppeteer, { Browser } from 'puppeteer';
import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

// Load images as base64
function loadImageBase64(filename: string): string {
  const imagePath = join(import.meta.dir, '..', 'templates', 'images', filename);
  if (!existsSync(imagePath)) {
    console.warn(`Image not found: ${imagePath}`);
    return '';
  }
  const imageBuffer = readFileSync(imagePath);
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

Handlebars.registerHelper('formatNumber', (num: number) => {
  if (num === undefined || num === null) return '';
  return new Intl.NumberFormat('fr-FR').format(num);
});

Handlebars.registerHelper('formatCurrency', (num: number) => {
  if (num === undefined || num === null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
});

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('or', (...args: unknown[]) => {
  args.pop(); // Remove Handlebars options object
  return args.some((arg) => !!arg);
});
Handlebars.registerHelper('and', (...args: unknown[]) => {
  args.pop(); // Remove Handlebars options object
  return args.every((arg) => !!arg);
});

// Calculate TVA
Handlebars.registerHelper('calculateTVA', (montantHT: number, taux: number = 20) => {
  if (!montantHT) return '0,00';
  const tva = (montantHT * taux) / 100;
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(tva);
});

// Calculate TTC
Handlebars.registerHelper('calculateTTC', (montantHT: number, taux: number = 20) => {
  if (!montantHT) return '0,00';
  const ttc = montantHT * (1 + taux / 100);
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(ttc);
});

export interface LMTemplateData {
  // Mission type
  pole: string;
  mission_type: string;

  // Client info
  client_type: 'societe' | 'personne';

  // Société
  societe_nom?: string;
  societe_forme?: string;
  societe_capital?: number;
  societe_rcs_ville?: string;
  societe_rcs_numero?: string;

  // Personne physique
  personne_civilite?: string;
  personne_nom?: string;
  personne_date_naissance?: string;
  personne_lieu_naissance?: string;
  personne_activite?: string;
  personne_email?: string;

  // Address
  adresse_rue?: string;
  adresse_cp?: string;
  adresse_ville?: string;

  // Représentant (for société)
  representant_civilite?: string;
  representant_nom?: string;
  representant_fonction?: string;
  representant_email?: string;

  // Mission details
  adversaire_nom?: string;
  domaine_droit?: string;
  vacation_heures?: number;
  juridiction?: string;
  type_contrat?: string;
  cocontractant?: string;
  type_marque?: string;
  nom_marque?: string;

  // Honoraires
  honoraires_type: 'forfait' | 'temps';
  honoraires_montant_ht: number;
  taux_horaire?: number;
  provision_montant: number;

  // Validation
  date_lettre: string;
  avocat_signataire: string;
  commentaires?: string;
}

const MISSION_CONTENT_MAP: Record<string, string> = {
  mise_en_demeure: 'missions/mise-en-demeure.html',
  precontentieux: 'missions/precontentieux.html',
  contentieux: 'missions/contentieux.html',
  contrat: 'missions/contrat.html',
  marques: 'missions/marques.html',
};

const REMUNERATION_CONTENT_MAP: Record<string, string> = {
  mise_en_demeure: 'remunerations/mise-en-demeure.html',
  precontentieux: 'remunerations/generic.html',
  contentieux: 'remunerations/contentieux.html',
  contrat: 'remunerations/generic.html',
  marques: 'remunerations/marques.html',
};

const MISSION_TYPE_LABELS: Record<string, string> = {
  mise_en_demeure: 'Mise en Demeure',
  precontentieux: 'Précontentieux',
  contentieux: 'Contentieux',
  contrat: 'Contrat',
  marques: 'Marques',
};

const AVOCAT_INFO: Record<string, { nom: string; titre: string; email: string }> = {
  france_charruyer: {
    nom: 'France CHARRUYER',
    titre: 'Avocat Associé - Directrice du Pôle Propriété Intellectuelle',
    email: 'f.charruyer@altij.com',
  },
};

const DOMAINE_LABELS: Record<string, string> = {
  marques: 'Marques',
  brevets: 'Brevets',
  dessins_modeles: 'Dessins et Modèles',
  droits_auteur: "Droits d'Auteur",
  noms_domaine: 'Noms de Domaine',
  concurrence_deloyale: 'Concurrence Déloyale',
};

const JURIDICTION_LABELS: Record<string, string> = {
  tj: 'Tribunal Judiciaire',
  tc: 'Tribunal de Commerce',
  ca: "Cour d'Appel",
  inpi: 'INPI',
  euipo: 'EUIPO',
};

const TYPE_CONTRAT_LABELS: Record<string, string> = {
  cession_marque: 'Contrat de Cession de Marque',
  licence_marque: 'Contrat de Licence de Marque',
  cession_brevet: 'Contrat de Cession de Brevet',
  licence_brevet: 'Contrat de Licence de Brevet',
  cession_da: "Contrat de Cession de Droits d'Auteur",
  nda: 'Contrat de Confidentialité (NDA)',
};

const TYPE_MARQUE_LABELS: Record<string, string> = {
  depot_fr: 'Dépôt de marque française',
  depot_eu: 'Dépôt de marque européenne',
  depot_intl: 'Dépôt de marque internationale',
  opposition: "Opposition à l'enregistrement",
  renouvellement: 'Renouvellement',
  surveillance: 'Surveillance',
};

function loadPartialTemplate(relativePath: string): string {
  const templatePath = join(import.meta.dir, '..', 'templates', relativePath);
  if (!existsSync(templatePath)) {
    console.warn(`Partial template not found: ${templatePath}`);
    return '';
  }
  return readFileSync(templatePath, 'utf-8');
}

export function prepareTemplateData(data: LMTemplateData): Record<string, unknown> {
  const avocat = AVOCAT_INFO[data.avocat_signataire] || AVOCAT_INFO.france_charruyer;

  // Build client designation
  let clientDesignation = '';
  let clientSignataire = '';
  let clientEmail = '';

  if (data.client_type === 'societe') {
    clientDesignation = `${data.societe_nom}, ${data.societe_forme} au capital de ${new Intl.NumberFormat('fr-FR').format(data.societe_capital || 0)} euros, immatriculée au RCS de ${data.societe_rcs_ville} sous le numéro ${data.societe_rcs_numero}, dont le siège social est situé ${data.adresse_rue}, ${data.adresse_cp} ${data.adresse_ville}`;
    clientSignataire = `${data.representant_civilite} ${data.representant_nom}, ${data.representant_fonction}`;
    clientEmail = data.representant_email || '';
  } else {
    clientDesignation = `${data.personne_civilite} ${data.personne_nom}, né(e) le ${data.personne_date_naissance ? new Date(data.personne_date_naissance).toLocaleDateString('fr-FR') : ''} à ${data.personne_lieu_naissance}, demeurant ${data.adresse_rue}, ${data.adresse_cp} ${data.adresse_ville}`;
    if (data.personne_activite) {
      clientDesignation += `, exerçant la profession de ${data.personne_activite}`;
    }
    clientSignataire = `${data.personne_civilite} ${data.personne_nom}`;
    clientEmail = data.personne_email || '';
  }

  // Type marque booleans
  const typeMarque = data.type_marque || '';
  const typeContrat = data.type_contrat || '';

  return {
    ...data,
    // Images
    logo_base64: loadImageBase64('image1.png'),
    services_base64: loadImageBase64('image3.jpg'),
    signature_base64: loadImageBase64('image4.png'),
    // Formatted values
    client_designation: clientDesignation,
    client_signataire: clientSignataire,
    client_email: clientEmail,
    avocat_nom: avocat.nom,
    avocat_titre: avocat.titre,
    avocat_email: avocat.email,
    mission_type_label: MISSION_TYPE_LABELS[data.mission_type] || data.mission_type,
    domaine_label: data.domaine_droit ? DOMAINE_LABELS[data.domaine_droit] : data.domaine_droit,
    juridiction_label: data.juridiction ? JURIDICTION_LABELS[data.juridiction] : data.juridiction,
    type_contrat_label: typeContrat ? TYPE_CONTRAT_LABELS[typeContrat] : typeContrat,
    type_contrat_label_lower: typeContrat ? TYPE_CONTRAT_LABELS[typeContrat]?.toLowerCase() : '',
    type_contrat_action: typeContrat.includes('licence') ? 'licence' : 'cession',
    type_contrat_inscription: typeContrat.includes('licence') ? 'LICENCE' : 'CESSION',
    is_marque_contrat: typeContrat.includes('marque'),
    type_marque_label: typeMarque ? TYPE_MARQUE_LABELS[typeMarque] : typeMarque,
    type_marque_nature: typeMarque.includes('verbale') ? 'verbale' : 'semi-figurative',
    date_lettre_formatted: data.date_lettre
      ? new Date(data.date_lettre).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    personne_date_naissance_formatted: data.personne_date_naissance
      ? new Date(data.personne_date_naissance).toLocaleDateString('fr-FR')
      : '',
    // Mission title for remuneration section
    mission_title: getMissionTitle(data),
    // Calculated values
    honoraires_tva: ((data.honoraires_montant_ht || 0) * 0.2).toFixed(2),
    honoraires_ttc: ((data.honoraires_montant_ht || 0) * 1.2).toFixed(2),
    taux_horaire_ttc: ((data.taux_horaire || 0) * 1.2).toFixed(2),
    provision_tva: ((data.provision_montant || 0) * 0.2).toFixed(2),
    provision_ttc: ((data.provision_montant || 0) * 1.2).toFixed(2),
    // Booleans for conditional rendering
    is_societe: data.client_type === 'societe',
    is_personne: data.client_type === 'personne',
    is_forfait: data.honoraires_type === 'forfait',
    is_temps: data.honoraires_type === 'temps',
    // Type marque booleans
    is_depot_fr: typeMarque === 'depot_fr' || typeMarque === 'depot_fr_eu',
    is_depot_eu: typeMarque === 'depot_eu' || typeMarque === 'depot_fr_eu',
    is_depot_intl: typeMarque === 'depot_intl',
    is_opposition: typeMarque === 'opposition',
    is_renouvellement: typeMarque === 'renouvellement',
    is_surveillance: typeMarque === 'surveillance',
  };
}

function getMissionTitle(data: LMTemplateData): string {
  switch (data.mission_type) {
    case 'mise_en_demeure':
      return 'la mise en demeure';
    case 'precontentieux':
      return 'la phase précontentieuse';
    case 'contentieux':
      return 'la phase contentieuse';
    case 'contrat':
      return `la rédaction du ${TYPE_CONTRAT_LABELS[data.type_contrat || '']?.toLowerCase() || 'contrat'}`;
    case 'marques':
      return "l'opération de marque";
    default:
      return 'la mission';
  }
}

export async function generatePDF(
  missionType: string,
  data: LMTemplateData
): Promise<{ pdfBuffer: Buffer; html: string }> {
  // Load base template
  const baseTemplatePath = join(import.meta.dir, '..', 'templates', 'lm-base.html');
  if (!existsSync(baseTemplatePath)) {
    throw new Error(`Base template not found: ${baseTemplatePath}`);
  }

  // Load mission content partial
  const missionContentFile = MISSION_CONTENT_MAP[missionType];
  if (!missionContentFile) {
    throw new Error(`Unknown mission type: ${missionType}`);
  }
  const missionContent = loadPartialTemplate(missionContentFile);

  // Load remuneration content partial
  const remunerationContentFile = REMUNERATION_CONTENT_MAP[missionType];
  const remunerationContent = loadPartialTemplate(remunerationContentFile);

  // Prepare template data
  const templateData = prepareTemplateData(data);

  // Compile and render mission content
  const missionTemplate = Handlebars.compile(missionContent);
  const renderedMissionContent = missionTemplate(templateData);

  // Compile and render remuneration content
  const remunerationTemplate = Handlebars.compile(remunerationContent);
  const renderedRemunerationContent = remunerationTemplate(templateData);

  // Add rendered partials to template data
  const fullTemplateData = {
    ...templateData,
    mission_content: renderedMissionContent,
    remuneration_content: renderedRemunerationContent,
  };

  // Compile and render base template
  const baseTemplateSource = readFileSync(baseTemplatePath, 'utf-8');
  const baseTemplate = Handlebars.compile(baseTemplateSource);
  const html = baseTemplate(fullTemplateData);

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      top: '15mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8px; padding: 0 20mm; display: flex; justify-content: space-between; color: #666;">
        <span>Cabinet ALTIJ - Lettre de Mission</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  });

  await page.close();

  return { pdfBuffer: Buffer.from(pdfBuffer), html };
}

export async function generatePreviewHTML(
  missionType: string,
  data: LMTemplateData
): Promise<string> {
  // Load base template
  const baseTemplatePath = join(import.meta.dir, '..', 'templates', 'lm-base.html');
  if (!existsSync(baseTemplatePath)) {
    throw new Error(`Base template not found: ${baseTemplatePath}`);
  }

  // Load mission content partial
  const missionContentFile = MISSION_CONTENT_MAP[missionType];
  if (!missionContentFile) {
    throw new Error(`Unknown mission type: ${missionType}`);
  }
  const missionContent = loadPartialTemplate(missionContentFile);

  // Load remuneration content partial
  const remunerationContentFile = REMUNERATION_CONTENT_MAP[missionType];
  const remunerationContent = loadPartialTemplate(remunerationContentFile);

  // Prepare template data
  const templateData = prepareTemplateData(data);

  // Compile and render mission content
  const missionTemplate = Handlebars.compile(missionContent);
  const renderedMissionContent = missionTemplate(templateData);

  // Compile and render remuneration content
  const remunerationTemplate = Handlebars.compile(remunerationContent);
  const renderedRemunerationContent = remunerationTemplate(templateData);

  // Add rendered partials to template data
  const fullTemplateData = {
    ...templateData,
    mission_content: renderedMissionContent,
    remuneration_content: renderedRemunerationContent,
  };

  // Compile and render base template
  const baseTemplateSource = readFileSync(baseTemplatePath, 'utf-8');
  const baseTemplate = Handlebars.compile(baseTemplateSource);
  return baseTemplate(fullTemplateData);
}

// Cleanup on process exit
process.on('exit', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
});
