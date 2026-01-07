import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware } from '../middleware/auth';
import { generatePDF, generatePreviewHTML, type LMTemplateData } from '../services/pdf-generator';
import { triggerWorkflow, buildCallbackUrl } from '../services/n8n';

const lettreMissionRoutes = new Hono<Env>();

// Validation schema for LM data - using coerce for numbers since form sends strings
const lmDataSchema = z.object({
  pole: z.string(),
  mission_type: z.enum(['mise_en_demeure', 'precontentieux', 'contentieux', 'contrat', 'marques']),
  client_type: z.enum(['societe', 'personne']),

  // Société fields
  societe_nom: z.string().optional(),
  societe_forme: z.string().optional(),
  societe_capital: z.coerce.number().optional(),
  societe_rcs_ville: z.string().optional(),
  societe_rcs_numero: z.string().optional(),

  // Personne fields
  personne_civilite: z.string().optional(),
  personne_nom: z.string().optional(),
  personne_date_naissance: z.string().optional(),
  personne_lieu_naissance: z.string().optional(),
  personne_activite: z.string().optional(),
  personne_email: z.string().email().optional().or(z.literal('')),

  // Address
  adresse_rue: z.string().optional(),
  adresse_cp: z.string().optional(),
  adresse_ville: z.string().optional(),

  // Représentant (for société)
  representant_civilite: z.string().optional(),
  representant_nom: z.string().optional(),
  representant_fonction: z.string().optional(),
  representant_email: z.string().email().optional().or(z.literal('')),

  // Mission details
  adversaire_nom: z.string().optional(),
  domaine_droit: z.string().optional(),
  vacation_heures: z.coerce.number().optional(),
  juridiction: z.string().optional(),
  type_contrat: z.string().optional(),
  cocontractant: z.string().optional(),
  type_marque: z.string().optional(),
  nom_marque: z.string().optional(),

  // Honoraires
  honoraires_type: z.enum(['forfait', 'temps']),
  honoraires_montant_ht: z.coerce.number(),
  taux_horaire: z.coerce.number().optional(),
  provision_montant: z.coerce.number(),

  // Validation
  date_lettre: z.string(),
  avocat_signataire: z.string(),
  commentaires: z.string().optional(),
});

// Apply auth middleware
lettreMissionRoutes.use('*', authMiddleware);

// Custom zod validator with better error messages
const zodValidatorWithErrors = (schema: typeof lmDataSchema) =>
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      console.error('Validation errors:', errors);
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: errors,
        },
        400
      );
    }
  });

// POST /api/lettre-mission/preview - Generate PDF preview
lettreMissionRoutes.post('/preview', zodValidatorWithErrors(lmDataSchema), async (c) => {
  try {
    const data = c.req.valid('json') as LMTemplateData;

    const { pdfBuffer, html } = await generatePDF(data.mission_type, data);

    // Return PDF as base64 for frontend preview
    return c.json({
      success: true,
      data: {
        pdf: pdfBuffer.toString('base64'),
        html,
        mimeType: 'application/pdf',
        filename: `LM_${data.mission_type}_${data.date_lettre}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      500
    );
  }
});

// POST /api/lettre-mission/preview-html - Generate HTML preview only (faster)
lettreMissionRoutes.post('/preview-html', zodValidatorWithErrors(lmDataSchema), async (c) => {
  try {
    const data = c.req.valid('json') as LMTemplateData;

    const html = await generatePreviewHTML(data.mission_type, data);

    return c.json({
      success: true,
      data: {
        html,
      },
    });
  } catch (error) {
    console.error('HTML preview error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      },
      500
    );
  }
});

// POST /api/lettre-mission/generate - Generate PDF and save it
lettreMissionRoutes.post('/generate', zodValidatorWithErrors(lmDataSchema), async (c) => {
  const user = c.get('user');

  try {
    const data = c.req.valid('json') as LMTemplateData;

    const { pdfBuffer } = await generatePDF(data.mission_type, data);

    // Generate a unique ID for this document
    const documentId = nanoid();
    const filename = `LM_${data.mission_type}_${documentId}.pdf`;

    // For now, return the PDF as base64
    // In production, you would save this to a storage service (S3, etc.)
    return c.json({
      success: true,
      data: {
        documentId,
        pdf: pdfBuffer.toString('base64'),
        mimeType: 'application/pdf',
        filename,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      500
    );
  }
});

// POST /api/lettre-mission/send-to-signature - Generate PDF and send to n8n for Yousign
lettreMissionRoutes.post(
  '/send-to-signature',
  zValidator(
    'json',
    z.object({
      automationId: z.string(),
      formData: lmDataSchema,
    })
  ),
  async (c) => {
    const user = c.get('user');

    try {
      const { automationId, formData } = c.req.valid('json');

      // Get the automation to find the webhook URL
      const [automation] = await db
        .select()
        .from(schema.automations)
        .where(and(eq(schema.automations.id, automationId), eq(schema.automations.isActive, true)))
        .limit(1);

      if (!automation) {
        return c.json({ success: false, error: 'Automation not found' }, 404);
      }

      // Generate PDF
      const { pdfBuffer } = await generatePDF(formData.mission_type, formData as LMTemplateData);

      // Create run record
      const runId = nanoid();
      const now = new Date();

      await db.insert(schema.automationRuns).values({
        id: runId,
        automationId,
        userId: user.id,
        status: 'pending',
        input: formData,
        startedAt: now,
      });

      // Prepare payload for n8n
      // The PDF is sent as base64 - n8n will handle the conversion for Yousign
      const payload = {
        automationRunId: runId,
        userId: user.id,
        inputs: {
          ...formData,
          // Include PDF as base64
          pdfBase64: pdfBuffer.toString('base64'),
          pdfFilename: `Lettre_Mission_${formData.mission_type}_${formData.date_lettre}.pdf`,
          // Client email for Yousign
          clientEmail:
            formData.client_type === 'societe'
              ? formData.representant_email
              : formData.personne_email,
          clientName:
            formData.client_type === 'societe'
              ? `${formData.representant_civilite} ${formData.representant_nom}`
              : `${formData.personne_civilite} ${formData.personne_nom}`,
        },
        callbackUrl: buildCallbackUrl(runId),
      };

      // Trigger n8n workflow
      await triggerWorkflow(automation.n8nWebhookUrl, payload);

      // Update status to running
      await db
        .update(schema.automationRuns)
        .set({ status: 'running' })
        .where(eq(schema.automationRuns.id, runId));

      return c.json({
        success: true,
        data: {
          runId,
          status: 'running',
          message: 'Lettre de mission envoyée pour signature',
        },
      });
    } catch (error) {
      console.error('Send to signature error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send for signature',
        },
        500
      );
    }
  }
);

// GET /api/lettre-mission/download/:documentId - Download a generated PDF
lettreMissionRoutes.get('/download/:documentId', async (c) => {
  const documentId = c.req.param('documentId');

  // In a real implementation, you would fetch the PDF from storage
  // For now, return a 404 as we're not persisting PDFs
  return c.json(
    {
      success: false,
      error: 'Document not found. PDF storage not yet implemented.',
    },
    404
  );
});

export { lettreMissionRoutes };
