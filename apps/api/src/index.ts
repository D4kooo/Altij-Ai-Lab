import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from 'hono/bun';
import { corsMiddleware } from './middleware/cors';
import { defaultBodyLimit } from './middleware/bodyLimit';
import { apiRateLimit } from './middleware/rateLimit';
import { authRoutes } from './routes/auth';
import { assistantsRoutes } from './routes/assistants';
import { chatRoutes } from './routes/chat';
import { automationsRoutes } from './routes/automations';
import { favoritesRoutes } from './routes/favorites';
import { usersRoutes } from './routes/users';
import { dashboardRoutes } from './routes/dashboard';
import { veilleRoutes } from './routes/veille';
import { veilleIaRoutes } from './routes/veille-ia';
import { anonymiseurRoutes } from './routes/anonymiseur';
import { lettreMissionRoutes } from './routes/lettre-mission';
import { rolesRoutes } from './routes/roles';
import { permissionsRoutes } from './routes/permissions';
import { documentsRoutes } from './routes/documents';
import { organizationsRouter } from './routes/organizations';
import { coursesRoutes } from './routes/courses';
import { campaignsRoutes } from './routes/campaigns';
import { templatesRoutes } from './routes/templates';
import { segaRoutes } from './routes/sega';
import { supervisionRoutes } from './routes/supervision';
import { initScheduler } from './services/scheduler';

const app = new Hono();

// Initialize scheduler for automatic tasks (RSS refresh, Veilles IA generation)
initScheduler();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', corsMiddleware);
app.use('*', defaultBodyLimit); // 10MB max body size
app.use('/api/*', apiRateLimit); // 100 req/min for API endpoints

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/assistants', assistantsRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/automations', automationsRoutes);
app.route('/api/favorites', favoritesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/veille', veilleRoutes);
app.route('/api/veille-ia', veilleIaRoutes);
app.route('/api/anonymiseur', anonymiseurRoutes);
app.route('/api/lettre-mission', lettreMissionRoutes);
app.route('/api/roles', rolesRoutes);
app.route('/api/permissions', permissionsRoutes);
app.route('/api/organizations', organizationsRouter);
app.route('/api/assistants', documentsRoutes); // Documents routes nested under /api/assistants/:id/documents
app.route('/api/courses', coursesRoutes);
app.route('/api/campaigns', campaignsRoutes);
app.route('/api/templates', templatesRoutes);
app.route('/api/sega', segaRoutes);
app.route('/api/admin/supervision', supervisionRoutes);

// Production: serve SPAs as static files
if (process.env.NODE_ENV === 'production') {
  const staticBase = import.meta.dir + '/../static';

  // Staff app: static assets then SPA fallback
  app.use('/app/*', serveStatic({
    root: staticBase + '/app',
    rewriteRequestPath: (path) => path.replace(/^\/app/, ''),
  }));
  app.get('/app/*', (c) => {
    return new Response(Bun.file(staticBase + '/app/index.html'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });

  // Public site: static assets then SPA fallback
  app.use('*', serveStatic({ root: staticBase + '/public' }));
  app.get('*', (c) => {
    return new Response(Bun.file(staticBase + '/public/index.html'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });
}

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
});

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Data Ring API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
