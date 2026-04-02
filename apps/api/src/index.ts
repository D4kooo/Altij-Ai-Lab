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
// Coming soon — disabled to remove Puppeteer/Chromium dependency
// import { anonymiseurRoutes } from './routes/anonymiseur';
// import { lettreMissionRoutes } from './routes/lettre-mission';
import { rolesRoutes } from './routes/roles';
import { permissionsRoutes } from './routes/permissions';
import { documentsRoutes } from './routes/documents';
import { organizationsRouter } from './routes/organizations';
import { coursesRoutes } from './routes/courses';
import { campaignsRoutes } from './routes/campaigns';
import { templatesRoutes } from './routes/templates';
import { segaRoutes } from './routes/sega';
import { supervisionRoutes } from './routes/supervision';
import { cguAnalyzerRoutes } from './routes/cgu-analyzer';
import { breachCheckRoutes } from './routes/breach-check';
import mcpServersRoutes from './routes/mcp-servers';
import skillsRoutes from './routes/skills';
import { initScheduler } from './services/scheduler';

const app = new Hono();

// Initialize scheduler for automatic tasks (RSS refresh, Veilles IA generation)
initScheduler();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
// Skip security/cors middleware for static assets (Safari video compatibility)
const isStaticAsset = (path: string) => /\.(mp4|webm|png|jpg|svg|js|css|ico|woff2?)$/i.test(path);
app.use('*', async (c, next) => {
  if (isStaticAsset(c.req.path)) return next();
  return secureHeaders()(c, next);
});
app.use('*', async (c, next) => {
  if (isStaticAsset(c.req.path)) return next();
  return corsMiddleware(c, next);
});
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
// Coming soon
// app.route('/api/anonymiseur', anonymiseurRoutes);
// app.route('/api/lettre-mission', lettreMissionRoutes);
app.route('/api/roles', rolesRoutes);
app.route('/api/permissions', permissionsRoutes);
app.route('/api/organizations', organizationsRouter);
app.route('/api/assistants', documentsRoutes); // Documents routes nested under /api/assistants/:id/documents
app.route('/api/courses', coursesRoutes);
app.route('/api/campaigns', campaignsRoutes);
app.route('/api/templates', templatesRoutes);
app.route('/api/sega', segaRoutes);
app.route('/api/admin/supervision', supervisionRoutes);
app.route('/api/cgu-analyze', cguAnalyzerRoutes);
app.route('/api/breach-check', breachCheckRoutes);
app.route('/api/mcp-servers', mcpServersRoutes);
app.route('/api/skills', skillsRoutes);

// Proxy for fuites-infos.fr data (CORS restricted to their domain)
app.get('/api/fuites-infos', async (c) => {
  const res = await fetch('https://christopheboutry.com/data/fuites-infos.json');
  if (!res.ok) return c.json({ error: 'Upstream error' }, 502);
  const data = await res.json();
  return c.json(data);
});

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

  // Video/media files: serve with Range request support (Safari requires this)
  app.get('/assets/:filename{.+\\.mp4$}', async (c) => {
    const filename = c.req.param('filename');
    const filePath = staticBase + '/public/assets/' + filename;
    const file = Bun.file(filePath);
    if (!(await file.exists())) return c.notFound();

    const size = file.size;
    const range = c.req.header('range');

    // Common headers — strip restrictive security headers for media
    const common = {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'same-site',
    };

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1]);
        const end = match[2] ? parseInt(match[2]) : size - 1;
        return new Response(file.slice(start, end + 1), {
          status: 206,
          headers: {
            ...common,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': String(end - start + 1),
          },
        });
      }
    }

    return new Response(file, {
      headers: {
        ...common,
        'Content-Length': String(size),
      },
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
