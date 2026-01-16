import { db, schema } from './index';

async function seed() {
  console.log('Seeding database...');

  // Create default organization (Data Ring)
  let organizationId: string | undefined;
  try {
    const [org] = await db.insert(schema.organizations).values({
      name: 'Data Ring',
      type: 'work',
      settings: {
        theme: { primaryColor: '#57C5B6' },
        features: { voiceEnabled: true },
      },
    }).returning();
    organizationId = org.id;
    console.log('✅ Created organization: Data Ring');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.code === '23505') {
      console.log('ℹ️ Organization already exists');
      // Try to get existing organization
      const [existingOrg] = await db.select().from(schema.organizations).limit(1);
      organizationId = existingOrg?.id;
    } else {
      console.error('Error creating organization:', e.message);
    }
  }

  // Create admin user with bcrypt hashed password
  const adminPassword = await Bun.password.hash('admin123', {
    algorithm: 'bcrypt',
    cost: 12,
  });

  try {
    await db.insert(schema.users).values({
      email: 'admin@data-ring.net',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Data Ring',
      role: 'admin',
      isStaff: true,
      organizationId,
      isOnboarded: true,
    });
    console.log('✅ Created admin user: admin@data-ring.net / admin123');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.code === '23505') {
      console.log('ℹ️ Admin user already exists');
    } else {
      console.error('Error creating admin:', e.message);
    }
  }

  // Create a test citizen user (non-staff)
  const citizenPassword = await Bun.password.hash('citizen123', {
    algorithm: 'bcrypt',
    cost: 12,
  });

  try {
    await db.insert(schema.users).values({
      email: 'citoyen@test.com',
      passwordHash: citizenPassword,
      firstName: 'Jean',
      lastName: 'Citoyen',
      role: 'user',
      isStaff: false,
      isOnboarded: true,
    });
    console.log('✅ Created citizen user: citoyen@test.com / citizen123');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.code === '23505') {
      console.log('ℹ️ Citizen user already exists');
    } else {
      console.error('Error creating citizen user:', e.message);
    }
  }

  // Create sample assistants (OpenRouter type)
  const assistants = [
    {
      organizationId,
      type: 'openrouter' as const,
      model: 'anthropic/claude-sonnet-4',
      systemPrompt: `Tu es un expert en droit social français. Tu aides les avocats et juristes sur les questions de droit du travail, contrats de travail, licenciements, relations collectives, etc.

Réponds de manière précise et cite les articles de loi pertinents quand c'est possible. Si tu n'es pas sûr, dis-le clairement.`,
      temperature: 0.7,
      maxTokens: 4096,
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
      isPinned: true,
      pinOrder: 1,
      isActive: true,
    },
    {
      organizationId,
      type: 'openrouter' as const,
      model: 'anthropic/claude-sonnet-4',
      systemPrompt: `Tu es un expert en protection des données personnelles et conformité RGPD. Tu accompagnes les entreprises dans leur mise en conformité.

Sois précis sur les obligations légales et les sanctions potentielles. Cite le RGPD et les guidelines de la CNIL quand pertinent.`,
      temperature: 0.7,
      maxTokens: 4096,
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
      isPinned: true,
      pinOrder: 2,
      isActive: true,
    },
    {
      organizationId,
      type: 'openrouter' as const,
      model: 'anthropic/claude-sonnet-4',
      systemPrompt: `Tu es un expert en propriété intellectuelle : marques, brevets, droits d'auteur, dessins et modèles.

Aide les clients à protéger leurs créations et à comprendre leurs droits. Mentionne les procédures INPI/EUIPO quand pertinent.`,
      temperature: 0.7,
      maxTokens: 4096,
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
      isPinned: false,
      pinOrder: 0,
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
    {
      organizationId,
      n8nWorkflowId: 'workflow_analyse_contrat',
      n8nWebhookUrl: 'https://automation.data-ring.net/webhook/analyse-contrat',
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
      ],
      outputType: 'file' as const,
      estimatedDuration: 120,
      isActive: true,
    },
    {
      organizationId,
      n8nWorkflowId: 'workflow_resume',
      n8nWebhookUrl: 'https://automation.data-ring.net/webhook/resume-juridique',
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

  // Create sample campaigns for citizen section
  const campaigns = [
    {
      organizationId,
      title: 'Droit à l\'effacement Google',
      description: 'Action collective pour faire respecter le droit à l\'oubli auprès de Google. Rejoignez-nous pour demander la suppression de vos données personnelles des résultats de recherche.',
      target: 'Google LLC',
      category: 'RGPD',
      status: 'active' as const,
      participantGoal: 1000,
      isActive: true,
    },
    {
      organizationId,
      title: 'Transparence publicitaire Meta',
      description: 'Demander à Meta (Facebook, Instagram) plus de transparence sur l\'utilisation de nos données pour la publicité ciblée.',
      target: 'Meta Platforms Inc.',
      category: 'Publicité',
      status: 'active' as const,
      participantGoal: 500,
      isActive: true,
    },
  ];

  for (const campaign of campaigns) {
    try {
      await db.insert(schema.campaigns).values(campaign);
      console.log(`✅ Created campaign: ${campaign.title}`);
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        console.log(`ℹ️ Campaign "${campaign.title}" already exists`);
      } else {
        console.error(`Error creating campaign:`, e.message);
      }
    }
  }

  // Create sample document templates
  const templates = [
    {
      organizationId,
      title: 'Lettre de demande d\'accès aux données (Article 15 RGPD)',
      description: 'Modèle de lettre pour exercer votre droit d\'accès aux données personnelles auprès d\'un responsable de traitement.',
      category: 'RGPD' as const,
      content: `Objet : Demande d'accès aux données personnelles (Article 15 du RGPD)

Madame, Monsieur,

En application de l'article 15 du Règlement Général sur la Protection des Données (RGPD), je vous prie de bien vouloir me communiquer l'ensemble des données personnelles me concernant que vous détenez.

Je souhaite également obtenir les informations suivantes :
- Les finalités du traitement
- Les catégories de données concernées
- Les destinataires des données
- La durée de conservation
- L'existence du droit de rectification ou d'effacement

Conformément à la réglementation, vous disposez d'un délai d'un mois pour répondre à ma demande.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Signature]`,
      isActive: true,
    },
    {
      organizationId,
      title: 'Lettre de demande d\'effacement (Article 17 RGPD)',
      description: 'Modèle de lettre pour demander la suppression de vos données personnelles (droit à l\'oubli).',
      category: 'RGPD' as const,
      content: `Objet : Demande d'effacement des données personnelles (Article 17 du RGPD)

Madame, Monsieur,

En application de l'article 17 du Règlement Général sur la Protection des Données (RGPD), je vous demande de procéder à l'effacement de l'ensemble des données personnelles me concernant que vous détenez.

Cette demande est fondée sur [choisir le motif] :
- Les données ne sont plus nécessaires au regard des finalités
- Je retire mon consentement
- Je m'oppose au traitement
- Les données ont fait l'objet d'un traitement illicite

Conformément à la réglementation, vous disposez d'un délai d'un mois pour procéder à cet effacement et m'en informer.

Dans l'attente de votre confirmation, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Signature]`,
      isActive: true,
    },
  ];

  for (const template of templates) {
    try {
      await db.insert(schema.documentTemplates).values(template);
      console.log(`✅ Created template: ${template.title}`);
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        console.log(`ℹ️ Template "${template.title}" already exists`);
      } else {
        console.error(`Error creating template:`, e.message);
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
