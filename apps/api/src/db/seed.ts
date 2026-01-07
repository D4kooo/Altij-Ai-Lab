import { db, schema } from './index';

async function seed() {
  console.log('Seeding database...');

  // Create admin user with bcrypt hashed password
  const adminPassword = await Bun.password.hash('admin123', {
    algorithm: 'bcrypt',
    cost: 12,
  });

  try {
    await db.insert(schema.users).values({
      email: 'admin@altij.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Altij',
      role: 'admin',
    });
    console.log('✅ Created admin user: admin@altij.com / admin123');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.code === '23505') {
      console.log('ℹ️ Admin user already exists');
    } else {
      console.error('Error creating admin:', e.message);
    }
  }

  // Create sample assistants
  const assistants = [
    {
      openaiAssistantId: 'asst_placeholder_1',
      name: 'Expert Droit Social',
      description:
        'Assistant spécialisé en droit du travail et droit social. Il peut vous aider sur les contrats de travail, licenciements, relations collectives, et plus encore.',
      specialty: 'Droit social',
      icon: 'Users',
      color: '#3b82f6',
      suggestedPrompts: [
        'Quelles sont les conditions de validité d\'un licenciement économique ?',
        'Comment rédiger une clause de non-concurrence valide ?',
        'Quels sont les délais de préavis en cas de démission ?',
      ],
      isActive: true,
    },
    {
      openaiAssistantId: 'asst_placeholder_2',
      name: 'Expert RGPD',
      description:
        'Assistant spécialisé en protection des données personnelles et conformité RGPD. Il vous accompagne dans la mise en conformité et la gestion des données.',
      specialty: 'RGPD / Protection des données',
      icon: 'Shield',
      color: '#22c55e',
      suggestedPrompts: [
        'Quelles sont les bases légales du traitement des données ?',
        'Comment répondre à une demande de droit d\'accès ?',
        'Quand faut-il désigner un DPO ?',
      ],
      isActive: true,
    },
    {
      openaiAssistantId: 'asst_placeholder_3',
      name: 'Expert Propriété Intellectuelle',
      description:
        'Assistant spécialisé en propriété intellectuelle : marques, brevets, droits d\'auteur, dessins et modèles.',
      specialty: 'Propriété intellectuelle',
      icon: 'Sparkles',
      color: '#8b5cf6',
      suggestedPrompts: [
        'Comment protéger une marque à l\'international ?',
        'Quelle est la durée de protection d\'un brevet ?',
        'Quelles sont les conditions de protection du droit d\'auteur ?',
      ],
      isActive: true,
    },
  ];

  for (const assistant of assistants) {
    try {
      await db.insert(schema.assistants).values(assistant);
      console.log(`✅ Created assistant: ${assistant.name}`);
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        console.log(`ℹ️ Assistant "${assistant.name}" already exists`);
      } else {
        console.error(`Error creating assistant:`, e.message);
      }
    }
  }

  // Create sample automations
  const automations = [
    // ===== LETTRE DE MISSION - PROPRIÉTÉ INTELLECTUELLE =====
    {
      n8nWorkflowId: 'lm_ip_workflow',
      n8nWebhookUrl: 'https://n8n.altij.com/webhook/lettre-mission-ip',
      name: 'Lettre de Mission',
      description:
        'Génération automatique de lettres de mission pour le pôle Propriété Intellectuelle. Sélectionnez le type de mission et remplissez les informations client pour générer une LM prête à signer.',
      category: 'Propriété Intellectuelle',
      icon: 'FileSignature',
      color: '#8b5cf6',
      inputSchema: [
        // ===== SECTION 1: Pôle et Type de Mission =====
        {
          name: 'pole',
          label: 'Pôle',
          type: 'select' as const,
          required: true,
          section: 'mission_type',
          sectionTitle: 'Type de Mission',
          sectionDescription: 'Sélectionnez le pôle et le type de lettre de mission',
          options: [
            { label: 'Propriété Intellectuelle', value: 'ip' },
            { label: 'Droit des Affaires', value: 'business' },
            { label: 'IT / DATA', value: 'it_data' },
          ],
          width: 'half' as const,
        },
        {
          name: 'mission_type',
          label: 'Type de Lettre de Mission',
          type: 'select' as const,
          required: true,
          section: 'mission_type',
          showWhen: [{ field: 'pole', operator: 'equals' as const, value: 'ip' }],
          options: [
            { label: 'Mise en demeure', value: 'mise_en_demeure' },
            { label: 'Pré-contentieux', value: 'precontentieux' },
            { label: 'Contentieux', value: 'contentieux' },
            { label: 'Contrat (Cession, Licence...)', value: 'contrat' },
            { label: 'Marques (Dépôt, Opposition...)', value: 'marques' },
          ],
          width: 'half' as const,
        },

        // ===== SECTION 2: Type de Client =====
        {
          name: 'client_type',
          label: 'Type de client',
          type: 'select' as const,
          required: true,
          section: 'client_info',
          sectionTitle: 'Informations Client',
          sectionDescription: 'Renseignez les coordonnées complètes du client',
          options: [
            { label: 'Société', value: 'societe' },
            { label: 'Personne physique', value: 'personne' },
          ],
          width: 'full' as const,
        },

        // ===== Champs Société =====
        {
          name: 'societe_nom',
          label: 'Nom de la société',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: 'Ex: ACME SAS',
          width: 'full' as const,
        },
        {
          name: 'societe_forme',
          label: 'Forme juridique',
          type: 'select' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          options: [
            { label: 'SAS', value: 'SAS' },
            { label: 'SARL', value: 'SARL' },
            { label: 'SA', value: 'SA' },
            { label: 'SCI', value: 'SCI' },
            { label: 'EURL', value: 'EURL' },
            { label: 'Auto-entrepreneur', value: 'AE' },
          ],
          width: 'half' as const,
        },
        {
          name: 'societe_capital',
          label: 'Capital social (€)',
          type: 'number' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: '10000',
          width: 'half' as const,
        },
        {
          name: 'societe_rcs_ville',
          label: 'Ville du RCS',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: 'Toulouse',
          width: 'half' as const,
        },
        {
          name: 'societe_rcs_numero',
          label: 'Numéro RCS',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: '123 456 789',
          width: 'half' as const,
        },

        // ===== Champs Personne Physique =====
        {
          name: 'personne_civilite',
          label: 'Civilité',
          type: 'select' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          options: [
            { label: 'Monsieur', value: 'Monsieur' },
            { label: 'Madame', value: 'Madame' },
          ],
          width: 'half' as const,
        },
        {
          name: 'personne_nom',
          label: 'Nom complet',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          placeholder: 'Jean DUPONT',
          width: 'half' as const,
        },
        {
          name: 'personne_date_naissance',
          label: 'Date de naissance',
          type: 'date' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          width: 'half' as const,
        },
        {
          name: 'personne_lieu_naissance',
          label: 'Lieu de naissance',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          placeholder: 'Toulouse (31)',
          width: 'half' as const,
        },
        {
          name: 'personne_activite',
          label: 'Activité professionnelle',
          type: 'text' as const,
          required: false,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          placeholder: 'Consultant indépendant',
          width: 'full' as const,
        },

        // ===== Adresse (commune) =====
        {
          name: 'adresse_rue',
          label: 'Adresse',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          placeholder: '10 rue de la République',
          width: 'full' as const,
        },
        {
          name: 'adresse_cp',
          label: 'Code postal',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          placeholder: '31000',
          width: 'half' as const,
        },
        {
          name: 'adresse_ville',
          label: 'Ville',
          type: 'text' as const,
          required: true,
          section: 'client_info',
          placeholder: 'Toulouse',
          width: 'half' as const,
        },

        // ===== SECTION 3: Représentant (pour sociétés) =====
        {
          name: 'representant_civilite',
          label: 'Civilité du représentant',
          type: 'select' as const,
          required: true,
          section: 'representant',
          sectionTitle: 'Représentant Légal',
          sectionDescription: 'Informations sur le signataire de la lettre de mission',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          options: [
            { label: 'Monsieur', value: 'Monsieur' },
            { label: 'Madame', value: 'Madame' },
          ],
          width: 'half' as const,
        },
        {
          name: 'representant_nom',
          label: 'Nom complet',
          type: 'text' as const,
          required: true,
          section: 'representant',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: 'Jean MARTIN',
          width: 'half' as const,
        },
        {
          name: 'representant_fonction',
          label: 'Fonction',
          type: 'select' as const,
          required: true,
          section: 'representant',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          options: [
            { label: 'Président', value: 'Président' },
            { label: 'Directeur Général', value: 'Directeur Général' },
            { label: 'Gérant', value: 'Gérant' },
            { label: 'Directeur Juridique', value: 'Directeur Juridique' },
            { label: 'Autre', value: 'Autre' },
          ],
          width: 'half' as const,
        },
        {
          name: 'representant_email',
          label: 'Email du signataire',
          type: 'email' as const,
          required: true,
          section: 'representant',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'societe' }],
          placeholder: 'jean.martin@acme.com',
          helpText: 'Email pour l\'envoi de la lettre de mission à signer',
          width: 'half' as const,
        },

        // Email pour personne physique
        {
          name: 'personne_email',
          label: 'Email',
          type: 'email' as const,
          required: true,
          section: 'client_info',
          showWhen: [{ field: 'client_type', operator: 'equals' as const, value: 'personne' }],
          placeholder: 'jean.dupont@email.com',
          helpText: 'Email pour l\'envoi de la lettre de mission à signer',
          width: 'full' as const,
        },

        // ===== SECTION 4: Détails de la Mission =====
        {
          name: 'domaine_droit',
          label: 'Domaine du droit concerné',
          type: 'select' as const,
          required: true,
          section: 'mission_details',
          sectionTitle: 'Détails de la Mission',
          sectionDescription: 'Précisez les éléments spécifiques de la mission',
          options: [
            { label: 'Marques', value: 'marques' },
            { label: 'Brevets', value: 'brevets' },
            { label: 'Dessins et modèles', value: 'dessins_modeles' },
            { label: 'Droits d\'auteur', value: 'droits_auteur' },
            { label: 'Noms de domaine', value: 'noms_domaine' },
            { label: 'Concurrence déloyale', value: 'concurrence_deloyale' },
          ],
          width: 'half' as const,
        },
        {
          name: 'adversaire_nom',
          label: 'Partie adverse',
          type: 'text' as const,
          required: true,
          section: 'mission_details',
          showWhen: [
            { field: 'mission_type', operator: 'in' as const, value: ['mise_en_demeure', 'precontentieux', 'contentieux'] }
          ],
          placeholder: 'Société XYZ ou M. Untel',
          width: 'full' as const,
        },
        {
          name: 'vacation_heures',
          label: 'Vacation prévisionnelle (heures)',
          type: 'number' as const,
          required: true,
          section: 'mission_details',
          placeholder: '10',
          width: 'half' as const,
        },

        // Champs spécifiques Contentieux
        {
          name: 'juridiction',
          label: 'Juridiction',
          type: 'select' as const,
          required: true,
          section: 'mission_details',
          showWhen: [{ field: 'mission_type', operator: 'equals' as const, value: 'contentieux' }],
          options: [
            { label: 'Tribunal Judiciaire', value: 'tj' },
            { label: 'Tribunal de Commerce', value: 'tc' },
            { label: 'Cour d\'Appel', value: 'ca' },
            { label: 'INPI', value: 'inpi' },
            { label: 'EUIPO', value: 'euipo' },
          ],
          width: 'full' as const,
        },

        // Champs spécifiques Contrat
        {
          name: 'type_contrat',
          label: 'Type de contrat',
          type: 'select' as const,
          required: true,
          section: 'mission_details',
          showWhen: [{ field: 'mission_type', operator: 'equals' as const, value: 'contrat' }],
          options: [
            { label: 'Cession de marque', value: 'cession_marque' },
            { label: 'Licence de marque', value: 'licence_marque' },
            { label: 'Cession de brevet', value: 'cession_brevet' },
            { label: 'Licence de brevet', value: 'licence_brevet' },
            { label: 'Cession de droits d\'auteur', value: 'cession_da' },
            { label: 'Contrat de confidentialité (NDA)', value: 'nda' },
          ],
          width: 'half' as const,
        },
        {
          name: 'cocontractant',
          label: 'Co-contractant',
          type: 'text' as const,
          required: true,
          section: 'mission_details',
          showWhen: [{ field: 'mission_type', operator: 'equals' as const, value: 'contrat' }],
          placeholder: 'Nom de l\'autre partie au contrat',
          width: 'half' as const,
        },

        // Champs spécifiques Marques
        {
          name: 'type_marque',
          label: 'Type d\'opération',
          type: 'select' as const,
          required: true,
          section: 'mission_details',
          showWhen: [{ field: 'mission_type', operator: 'equals' as const, value: 'marques' }],
          options: [
            { label: 'Dépôt de marque française', value: 'depot_fr' },
            { label: 'Dépôt de marque européenne', value: 'depot_eu' },
            { label: 'Dépôt de marque internationale', value: 'depot_intl' },
            { label: 'Opposition à l\'enregistrement', value: 'opposition' },
            { label: 'Renouvellement', value: 'renouvellement' },
            { label: 'Surveillance', value: 'surveillance' },
          ],
          width: 'half' as const,
        },
        {
          name: 'nom_marque',
          label: 'Nom de la marque',
          type: 'text' as const,
          required: true,
          section: 'mission_details',
          showWhen: [{ field: 'mission_type', operator: 'equals' as const, value: 'marques' }],
          placeholder: 'ACME™',
          width: 'half' as const,
        },

        // ===== SECTION 5: Honoraires =====
        {
          name: 'honoraires_type',
          label: 'Type d\'honoraires',
          type: 'select' as const,
          required: true,
          section: 'honoraires',
          sectionTitle: 'Honoraires',
          sectionDescription: 'Définissez les conditions financières de la mission',
          options: [
            { label: 'Forfaitaires', value: 'forfait' },
            { label: 'Au temps passé', value: 'temps' },
          ],
          width: 'full' as const,
        },
        {
          name: 'honoraires_montant_ht',
          label: 'Montant HT (€)',
          type: 'number' as const,
          required: true,
          section: 'honoraires',
          placeholder: '2000',
          width: 'half' as const,
        },
        {
          name: 'taux_horaire',
          label: 'Taux horaire HT (€)',
          type: 'number' as const,
          required: false,
          section: 'honoraires',
          showWhen: [{ field: 'honoraires_type', operator: 'equals' as const, value: 'temps' }],
          placeholder: '200',
          helpText: 'Laissez vide pour utiliser le barème standard',
          width: 'half' as const,
        },
        {
          name: 'provision_montant',
          label: 'Provision demandée (€ HT)',
          type: 'number' as const,
          required: true,
          section: 'honoraires',
          placeholder: '1000',
          helpText: 'Montant de la provision à régler avant le début de la mission',
          width: 'half' as const,
        },

        // ===== SECTION 6: Validation =====
        {
          name: 'date_lettre',
          label: 'Date de la lettre',
          type: 'date' as const,
          required: true,
          section: 'validation',
          sectionTitle: 'Validation',
          sectionDescription: 'Vérifiez les informations et validez la génération',
          width: 'half' as const,
        },
        {
          name: 'avocat_signataire',
          label: 'Avocat signataire',
          type: 'select' as const,
          required: true,
          section: 'validation',
          options: [
            { label: 'Maître France CHARRUYER', value: 'france_charruyer' },
          ],
          width: 'half' as const,
        },
        {
          name: 'commentaires',
          label: 'Commentaires internes',
          type: 'textarea' as const,
          required: false,
          section: 'validation',
          placeholder: 'Notes internes (ne seront pas incluses dans la LM)',
          width: 'full' as const,
        },
      ],
      outputType: 'redirect' as const,
      estimatedDuration: 60,
      isActive: true,
    },

    // ===== AUTRES AUTOMATISATIONS EXISTANTES =====
    {
      n8nWorkflowId: 'workflow_1',
      n8nWebhookUrl: 'https://n8n.altij.com/webhook/analyse-contrat',
      name: 'Analyse de Contrat',
      description:
        'Analyse automatique d\'un contrat pour identifier les clauses clés, risques potentiels et points d\'attention.',
      category: 'Analyse',
      icon: 'FileSearch',
      color: '#f59e0b',
      inputSchema: [
        {
          name: 'contractFile',
          label: 'Fichier du contrat',
          type: 'file' as const,
          required: true,
          accept: '.pdf,.docx,.doc',
          helpText: 'Formats acceptés : PDF, Word',
        },
        {
          name: 'contractType',
          label: 'Type de contrat',
          type: 'select' as const,
          required: true,
          options: [
            { label: 'Contrat de travail', value: 'work' },
            { label: 'Contrat commercial', value: 'commercial' },
            { label: 'Bail', value: 'lease' },
            { label: 'Autre', value: 'other' },
          ],
        },
        {
          name: 'focusAreas',
          label: 'Points d\'attention particuliers',
          type: 'textarea' as const,
          required: false,
          placeholder: 'Ex: clause de non-concurrence, conditions de résiliation...',
        },
      ],
      outputType: 'file' as const,
      estimatedDuration: 120,
      isActive: true,
    },
    {
      n8nWorkflowId: 'workflow_2',
      n8nWebhookUrl: 'https://n8n.altij.com/webhook/resume-juridique',
      name: 'Résumé Juridique',
      description:
        'Génère un résumé concis d\'un document juridique long (décision de justice, rapport, etc.).',
      category: 'Résumé',
      icon: 'FileText',
      color: '#06b6d4',
      inputSchema: [
        {
          name: 'document',
          label: 'Document à résumer',
          type: 'file' as const,
          required: true,
          accept: '.pdf,.docx,.doc,.txt',
        },
        {
          name: 'maxLength',
          label: 'Longueur maximale du résumé',
          type: 'select' as const,
          required: true,
          options: [
            { label: 'Court (1 page)', value: 'short' },
            { label: 'Moyen (2-3 pages)', value: 'medium' },
            { label: 'Détaillé (5+ pages)', value: 'detailed' },
          ],
        },
      ],
      outputType: 'file' as const,
      estimatedDuration: 90,
      isActive: true,
    },
    {
      n8nWorkflowId: 'workflow_3',
      n8nWebhookUrl: 'https://n8n.altij.com/webhook/veille-juridique',
      name: 'Veille Juridique',
      description:
        'Recherche et compile les dernières actualités juridiques sur un thème donné.',
      category: 'Veille',
      icon: 'Search',
      color: '#ec4899',
      inputSchema: [
        {
          name: 'topic',
          label: 'Thème de la veille',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: réforme du droit des contrats',
        },
        {
          name: 'period',
          label: 'Période',
          type: 'select' as const,
          required: true,
          options: [
            { label: 'Dernière semaine', value: '7d' },
            { label: 'Dernier mois', value: '30d' },
            { label: 'Derniers 3 mois', value: '90d' },
          ],
        },
        {
          name: 'sources',
          label: 'Sources préférées',
          type: 'textarea' as const,
          required: false,
          placeholder: 'Ex: Légifrance, Dalloz, Lexis...',
        },
      ],
      outputType: 'file' as const,
      estimatedDuration: 180,
      isActive: true,
    },
  ];

  for (const automation of automations) {
    try {
      await db.insert(schema.automations).values(automation);
      console.log(`✅ Created automation: ${automation.name}`);
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        console.log(`ℹ️ Automation "${automation.name}" already exists`);
      } else {
        console.error(`Error creating automation:`, e.message);
      }
    }
  }

  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
