import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { corsMiddleware } from './middleware/cors';
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

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', corsMiddleware);

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

console.log(`🚀 AltiJ AI Lab API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
