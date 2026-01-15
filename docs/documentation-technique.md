# AltiJ AI Lab - Documentation Technique

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du Projet](#2-architecture-du-projet)
3. [Stack Technologique](#3-stack-technologique)
4. [Base de Données](#4-base-de-données)
5. [API Backend](#5-api-backend)
6. [Frontend](#6-frontend)
7. [Authentification & Sécurité](#7-authentification--sécurité)
8. [Intégrations Externes](#8-intégrations-externes)
9. [Système de Permissions](#9-système-de-permissions)
10. [Tâches Planifiées](#10-tâches-planifiées)
11. [Déploiement](#11-déploiement)
12. [Variables d'Environnement](#12-variables-denvironnement)
13. [Commandes de Développement](#13-commandes-de-développement)

---

## 1. Vue d'ensemble

**AltiJ AI Lab** est une plateforme interne d'assistants IA et d'automatisation destinée au cabinet d'avocats Altij. Elle permet aux collaborateurs de :

- **Converser avec des assistants IA** via OpenRouter (multi-modèles : Claude, GPT, Mistral, etc.)
- **Exécuter des workflows automatisés** via n8n
- **Gérer une veille documentaire** avec agrégation RSS
- **Recevoir des newsletters IA** générées automatiquement
- **Enrichir les assistants** avec des bases de connaissances documentaires (RAG)

### Fonctionnalités principales

| Module | Description |
|--------|-------------|
| **Assistants** | Chatbots IA spécialisés (juridique, rédaction, recherche) avec support RAG |
| **Automations** | Workflows n8n avec formulaires dynamiques |
| **Veille RSS** | Agrégation et lecture d'articles de flux RSS |
| **Veille IA** | Newsletters automatiques générées par IA (style Perplexity) |
| **Anonymiseur** | Outil d'anonymisation de documents |
| **Administration** | Gestion des utilisateurs, rôles et permissions |

---

## 2. Architecture du Projet

### Structure Monorepo

```
altij-ai-lab/
├── apps/
│   ├── web/                    # Frontend React
│   │   ├── src/
│   │   │   ├── components/     # Composants React
│   │   │   ├── pages/          # Pages de l'application
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/            # Utilitaires et API client
│   │   │   └── hooks/          # Custom React hooks
│   │   ├── public/             # Assets statiques
│   │   └── package.json
│   │
│   └── api/                    # Backend Hono
│       ├── src/
│       │   ├── routes/         # Routes API
│       │   ├── services/       # Services métier
│       │   ├── middleware/     # Middlewares
│       │   ├── db/             # Schema et migrations
│       │   └── index.ts        # Point d'entrée
│       └── package.json
│
├── packages/
│   └── shared/                 # Types et constantes partagés
│
├── docs/                       # Documentation
├── package.json                # Configuration monorepo
├── tsconfig.json               # Configuration TypeScript
└── vercel.json                 # Configuration Vercel
```

### Pattern d'Architecture

L'application suit une architecture **3-tiers** :

1. **Présentation** : React SPA avec routing client-side
2. **Logique métier** : API REST Hono avec services découplés
3. **Données** : PostgreSQL avec Drizzle ORM

---

## 3. Stack Technologique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3.0 | Framework UI |
| Vite | 6.0.0 | Build tool & dev server |
| TypeScript | 5.6.0 | Typage statique |
| Tailwind CSS | 3.4.0 | Styling utility-first |
| Zustand | 5.0.0 | State management |
| TanStack React Query | 5.60.0 | Data fetching & cache |
| React Router DOM | 6.28.0 | Routing |
| Radix UI | Latest | Composants accessibles |
| Lucide React | 0.460.0 | Icônes |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Hono | 4.6.0 | Framework HTTP léger |
| TypeScript | 5.6.0 | Typage statique |
| Drizzle ORM | 0.36.0 | ORM type-safe |
| postgres.js | 3.4.0 | Client PostgreSQL |
| Jose | 5.9.0 | JWT handling |
| Zod | 3.23.0 | Validation de schémas |
| node-cron | 4.2.1 | Tâches planifiées |
| OpenAI SDK | 4.70.0 | Embeddings & OpenRouter |
| Puppeteer | 24.34.0 | Web scraping |
| mammoth | 1.11.0 | Extraction texte Word |
| pgvector | - | Recherche vectorielle |

### Infrastructure

| Service | Usage |
|---------|-------|
| PostgreSQL (Supabase) | Base de données + pgvector |
| Vercel | Hébergement frontend |
| n8n | Workflow automation |
| OpenRouter | Gateway multi-modèles IA |
| OpenAI | Embeddings (text-embedding-3-small) |

---

## 4. Base de Données

### ORM : Drizzle

Drizzle est utilisé pour sa type-safety complète et ses performances. Le schéma est défini dans `apps/api/src/db/schema.ts`.

### Tables Principales

#### `users` - Utilisateurs
```typescript
{
  id: uuid,
  email: string (unique),
  passwordHash: string,
  firstName: string,
  lastName: string,
  role: 'admin' | 'user',
  department: enum,
  createdAt: timestamp
}
```

#### `assistants` - Assistants IA
```typescript
{
  id: uuid,
  name: string,
  description: string,
  specialty: string,
  type: 'openrouter' | 'webhook',
  // Configuration OpenRouter
  model: string | null,           // ex: 'anthropic/claude-sonnet-4'
  systemPrompt: text | null,
  temperature: float (0.7),
  maxTokens: integer (4096),
  // Configuration Webhook
  webhookUrl: string | null,
  // Métadonnées
  icon: string,
  color: string,
  suggestedPrompts: jsonb[],
  isPinned: boolean,
  pinOrder: integer,
  isActive: boolean
}
```

#### `conversations` - Conversations
```typescript
{
  id: uuid,
  userId: uuid (FK users),
  assistantId: uuid (FK assistants),
  title: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `messages` - Messages
```typescript
{
  id: uuid,
  conversationId: uuid (FK conversations),
  role: 'user' | 'assistant',
  content: text,
  attachments: jsonb,
  createdAt: timestamp
}
```

#### `automations` - Automatisations
```typescript
{
  id: uuid,
  name: string,
  description: string,
  n8nWorkflowId: string,
  n8nWebhookUrl: string,
  inputSchema: jsonb,
  outputType: 'file' | 'text' | 'json' | 'redirect',
  icon: string,
  color: string,
  isActive: boolean
}
```

#### `automationRuns` - Exécutions
```typescript
{
  id: uuid,
  automationId: uuid (FK automations),
  userId: uuid (FK users),
  status: 'pending' | 'running' | 'completed' | 'failed',
  input: jsonb,
  output: jsonb,
  startedAt: timestamp,
  completedAt: timestamp
}
```

#### `feeds` - Flux RSS
```typescript
{
  id: uuid,
  userId: uuid (FK users),
  title: string,
  url: string,
  type: 'rss' | 'web',
  favicon: string,
  lastFetchedAt: timestamp
}
```

#### `articles` - Articles
```typescript
{
  id: uuid,
  feedId: uuid (FK feeds),
  title: string,
  url: string,
  description: text,
  image: string,
  isRead: boolean,
  isFavorite: boolean,
  publishedAt: timestamp
}
```

#### `veillesIa` - Veilles IA
```typescript
{
  id: uuid,
  name: string,
  description: string,
  prompt: text,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  departments: jsonb[],
  isFavorite: boolean,            // Mis en avant sur dashboard
  isActive: boolean,
  createdBy: uuid (FK users),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `assistant_documents` - Documents RAG
```typescript
{
  id: uuid,
  assistantId: uuid (FK assistants),
  name: string,
  originalFilename: string,
  mimeType: string,               // 'application/pdf', 'text/plain', etc.
  fileSize: integer,
  status: 'processing' | 'ready' | 'error',
  errorMessage: text | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `document_chunks` - Chunks vectorisés
```typescript
{
  id: uuid,
  documentId: uuid (FK assistant_documents),
  content: text,
  chunkIndex: integer,
  tokensCount: integer,
  embedding: vector(1536),        // OpenAI text-embedding-3-small
  createdAt: timestamp
}
```

#### `roles` - Rôles
```typescript
{
  id: uuid,
  name: string (unique),
  description: string,
  color: string
}
```

### Relations

- `users` → `conversations` (1:N)
- `assistants` → `conversations` (1:N)
- `assistants` → `assistant_documents` (1:N)
- `assistant_documents` → `document_chunks` (1:N)
- `conversations` → `messages` (1:N)
- `automations` → `automationRuns` (1:N)
- `users` → `automationRuns` (1:N)
- `users` → `feeds` (1:N)
- `feeds` → `articles` (1:N)
- `roles` → `rolePermissions` (1:N)
- `users` → `userRoles` → `roles` (N:N)
- `veillesIa` → `veilleIaEditions` (1:N)
- `veilleIaEditions` → `veilleIaItems` (1:N)

### Commandes de Migration

```bash
# Générer une migration
bun run db:generate

# Appliquer les migrations
bun run db:migrate

# Push direct du schéma (dev only)
bun run db:push

# Ouvrir Drizzle Studio
bun run db:studio

# Seed initial
bun run db:seed
```

---

## 5. API Backend

### Framework : Hono

Hono est un framework HTTP ultra-léger et performant, idéal pour les edge functions et les APIs.

### Middlewares Globaux

```typescript
// apps/api/src/index.ts
app.use('*', logger())           // Logging des requêtes
app.use('*', prettyJSON())       // JSON formaté
app.use('*', secureHeaders())    // Headers de sécurité
app.use('*', cors({...}))        // CORS configuration
app.use('*', bodyLimit({
  maxSize: 10 * 1024 * 1024      // Limite 10MB
}))
```

### Structure des Routes

| Préfixe | Fichier | Description |
|---------|---------|-------------|
| `/api/auth` | `auth.ts` | Authentification |
| `/api/assistants` | `assistants.ts` | Gestion assistants |
| `/api/assistants/:id/documents` | `documents.ts` | Documents RAG (knowledge base) |
| `/api/chat` | `chat.ts` | Conversations & messages |
| `/api/automations` | `automations.ts` | Workflows n8n |
| `/api/veille` | `veille.ts` | Flux RSS & articles |
| `/api/veille-ia` | `veille-ia.ts` | Newsletters IA |
| `/api/users` | `users.ts` | Gestion utilisateurs |
| `/api/roles` | `roles.ts` | Gestion rôles |
| `/api/permissions` | `permissions.ts` | Gestion permissions |
| `/api/favorites` | `favorites.ts` | Favoris |
| `/api/dashboard` | `dashboard.ts` | Statistiques |
| `/api/anonymiseur` | `anonymiseur.ts` | Anonymisation documents |

### Endpoints Principaux

#### Authentification (`/api/auth`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/login` | Connexion | Non |
| POST | `/logout` | Déconnexion | Oui |
| GET | `/me` | Utilisateur courant | Oui |
| POST | `/refresh` | Rafraîchir token | Non |

#### Assistants (`/api/assistants`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/` | Liste des assistants | Oui |
| GET | `/:id` | Détail assistant | Oui |
| POST | `/` | Créer assistant | Admin |
| PUT | `/:id` | Modifier assistant | Admin |
| DELETE | `/:id` | Supprimer assistant | Admin |

#### Chat (`/api/chat`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/conversations` | Liste conversations | Oui |
| POST | `/conversations` | Nouvelle conversation | Oui |
| GET | `/conversations/:id` | Détail conversation | Oui |
| POST | `/conversations/:id/messages` | Envoyer message (SSE) | Oui |
| POST | `/conversations/:id/upload` | Upload fichier | Oui |

#### Automations (`/api/automations`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/` | Liste automations | Oui |
| GET | `/:id` | Détail automation | Oui |
| POST | `/` | Créer automation | Admin |
| PUT | `/:id` | Modifier automation | Admin |
| POST | `/:id/run` | Exécuter automation | Oui |
| GET | `/runs` | Liste exécutions | Oui |
| GET | `/runs/:id` | Détail exécution | Oui |
| POST | `/callback` | Callback n8n | Webhook |

#### Veille (`/api/veille`)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/feeds` | Liste flux RSS | Oui |
| POST | `/feeds` | Ajouter flux | Oui |
| DELETE | `/feeds/:id` | Supprimer flux | Oui |
| GET | `/articles` | Liste articles | Oui |
| POST | `/articles/:id/read` | Marquer lu | Oui |
| POST | `/articles/:id/favorite` | Toggle favori | Oui |

### Validation avec Zod

Toutes les entrées sont validées avec Zod :

```typescript
const createAssistantSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  specialty: z.string().min(1),
  type: z.enum(['openrouter', 'webhook']).default('openrouter'),
  // OpenRouter config
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(128000).default(4096),
  // Webhook config
  webhookUrl: z.string().url().optional(),
  // Metadata
  icon: z.string().default('Bot'),
  color: z.string().default('#6366f1'),
  suggestedPrompts: z.array(z.string()).optional()
})

app.post('/', zValidator('json', createAssistantSchema), async (c) => {
  const data = c.req.valid('json')
  // ...
})
```

### Gestion des Erreurs

```typescript
// Structure d'erreur standard
{
  error: string,
  message?: string,
  details?: any
}

// Codes HTTP utilisés
200 - OK
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
429 - Too Many Requests
500 - Internal Server Error
```

---

## 6. Frontend

### Structure des Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `Login.tsx` | Page de connexion |
| `/` | `Dashboard.tsx` | Tableau de bord |
| `/assistants` | `Assistants.tsx` | Liste des assistants |
| `/assistants/:id` | `AssistantDetail.tsx` | Chat avec assistant |
| `/automations` | `Automations.tsx` | Liste des automations |
| `/automations/:id` | `AutomationDetail.tsx` | Formulaire automation |
| `/automations/runs/:id` | `AutomationRun.tsx` | Suivi exécution |
| `/history` | `History.tsx` | Historique |
| `/veille` | `Veille.tsx` | Flux RSS |
| `/settings` | `Settings.tsx` | Paramètres |
| `/admin/permissions` | `AdminPermissions.tsx` | Gestion permissions |

### State Management avec Zustand

#### `authStore`

```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}
```

#### `chatStore`

```typescript
interface ChatState {
  activeConversationId: string | null
  streamingMessage: string
  isStreaming: boolean
  isThinking: boolean

  setActiveConversation: (id: string | null) => void
  appendToStreamingMessage: (text: string) => void
  setIsStreaming: (value: boolean) => void
  setIsThinking: (value: boolean) => void
  clearStreamingMessage: () => void
}
```

### API Client

Le client API est centralisé dans `apps/web/src/lib/api.ts` :

```typescript
// Wrapper fetch avec gestion automatique du token
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('accessToken')

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers
    }
  })

  if (response.status === 401) {
    // Tentative de refresh automatique
    const refreshed = await refreshToken()
    if (refreshed) {
      return fetchApi(endpoint, options)
    }
    // Redirection vers login
  }

  if (!response.ok) {
    throw new ApiError(response.status, await response.json())
  }

  return response.json()
}
```

### Composants UI

La bibliothèque de composants est basée sur **Radix UI** avec styling **Tailwind** :

```
components/ui/
├── button.tsx       # Boutons avec variants
├── card.tsx         # Cartes conteneur
├── dialog.tsx       # Modales
├── input.tsx        # Champs de saisie
├── select.tsx       # Sélecteurs dropdown
├── tabs.tsx         # Onglets
├── badge.tsx        # Badges/Tags
├── avatar.tsx       # Avatars
├── skeleton.tsx     # Loading placeholders
└── ...
```

### Data Fetching avec React Query

```typescript
// Exemple : Liste des assistants
const { data: assistants, isLoading } = useQuery({
  queryKey: ['assistants'],
  queryFn: () => assistantsApi.list(),
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Exemple : Mutation
const createConversation = useMutation({
  mutationFn: (assistantId: string) =>
    chatApi.createConversation(assistantId),
  onSuccess: (data) => {
    queryClient.invalidateQueries(['conversations'])
    navigate(`/assistants/${data.assistantId}`)
  }
})
```

---

## 7. Authentification & Sécurité

### Flux d'Authentification

1. **Login** : L'utilisateur soumet email/password
2. **Vérification** : Le serveur vérifie le hash bcrypt
3. **Génération JWT** : Token d'accès (7 jours) + refresh token
4. **Stockage** : Tokens stockés dans localStorage
5. **Requêtes** : Header `Authorization: Bearer {token}`
6. **Refresh** : Renouvellement automatique sur 401

### Configuration JWT

```typescript
// Durée de vie
JWT_EXPIRES_IN=7d

// Génération
const token = await new jose.SignJWT({
  userId: user.id,
  role: user.role
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(JWT_EXPIRES_IN)
  .sign(secret)
```

### Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/api/auth/login` | 5 requêtes | 15 minutes |
| `/api/*` (général) | 100 requêtes | 1 minute |

### Middleware d'Authentification

```typescript
// apps/api/src/middleware/auth.ts
export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jose.jwtVerify(token, secret)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

### Headers de Sécurité

```typescript
// Via hono/secure-headers
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': '...'
}
```

---

## 8. Intégrations Externes

### OpenRouter

**Service** : `apps/api/src/services/openrouter.ts`

**Fonctionnalités** :
- Accès multi-modèles (Claude, GPT, Mistral, Llama, etc.)
- Streaming des réponses (SSE)
- Support multimodal (images)
- Gestion du contexte conversationnel
- Injection de contexte RAG

**Exemple d'utilisation** :

```typescript
// Construire les messages avec historique et contexte RAG
const messages = buildMessagesWithHistory(
  assistant.systemPrompt,
  previousMessages,
  newMessage,
  attachments,
  ragContext  // Contexte issu de la recherche vectorielle
)

// Streamer la réponse
for await (const chunk of streamChatCompletion(model, messages, {
  temperature: 0.7,
  maxTokens: 4096
})) {
  // Envoi SSE au client
  stream.writeSSE({ data: JSON.stringify({ chunk }) })
}
```

### OpenAI Embeddings (RAG)

**Service** : `apps/api/src/services/embeddings.ts`

**Fonctionnalités** :
- Génération d'embeddings avec `text-embedding-3-small` (1536 dimensions)
- Chunking intelligent des documents
- Estimation du nombre de tokens

**Exemple d'utilisation** :

```typescript
// Générer un embedding pour une requête
const embedding = await generateEmbedding("Qu'est-ce que le RGPD ?")

// Chunker un document
const chunks = chunkText(documentText, 4000) // ~1000 tokens par chunk
```

### Service de Retrieval (RAG)

**Service** : `apps/api/src/services/retrieval.ts`

**Fonctionnalités** :
- Recherche sémantique via pgvector
- Filtrage par assistant
- Formatage du contexte pour le prompt

```typescript
// Récupérer le contexte pertinent
const result = await retrieveContext(query, assistantId, topK=5, threshold=0.7)

// Formater pour injection dans le prompt
const context = formatContextForPrompt(result.chunks)
```

### n8n Workflows

**Service** : `apps/api/src/services/n8n.ts`

**Flux d'exécution** :

1. Frontend soumet le formulaire
2. Backend crée un `automationRun` (status: pending)
3. Backend trigger le webhook n8n avec payload
4. n8n traite le workflow de manière asynchrone
5. n8n appelle `/api/automations/callback` avec le résultat
6. Backend met à jour le run (status: completed)

**Payload envoyé à n8n** :

```typescript
{
  runId: string,
  callbackUrl: string,
  inputs: Record<string, any>,
  files?: Array<{ name, url, type }>
}
```

### Feedsearch (RSS Discovery)

**API** : `https://feedsearch.dev/api/v1/search`

**Usage** : Découverte automatique des flux RSS d'un site web.

---

## 9. Système de Permissions

### Modèle RBAC

Le système utilise un modèle **Role-Based Access Control** avec support de permissions directes :

```
User ─┬─→ userRoles ─→ roles ─→ rolePermissions ─→ Resource
      └─→ userPermissions ────────────────────────→ Resource
```

### Service de Permissions

```typescript
// apps/api/src/services/permissions.ts

// Vérifier l'accès à une ressource
async function hasAccess(
  userId: string,
  userRole: string,
  resourceType: 'assistant' | 'automation',
  resourceId: string
): Promise<boolean>

// Obtenir les IDs accessibles
async function getAccessibleResourceIds(
  userId: string,
  userRole: string,
  resourceType: 'assistant' | 'automation'
): Promise<string[] | 'all'>
```

### Règles d'accès

1. **Admins** : Accès total à toutes les ressources
2. **Utilisateurs** : Accès selon permissions de rôle + directes
3. **Filtrage automatique** : Les listes sont filtrées selon les permissions

---

## 10. Tâches Planifiées

### Scheduler

**Service** : `apps/api/src/services/scheduler.ts`

### Jobs Configurés

| Job | Horaire | Description |
|-----|---------|-------------|
| RSS Refresh | 06:00 (Europe/Paris) | Mise à jour de tous les flux RSS |
| Veille IA | 07:00 (Europe/Paris) | Génération des newsletters IA |

### Cron Expressions

```typescript
// Quotidien à 6h
cron.schedule('0 6 * * *', refreshAllFeeds, {
  timezone: 'Europe/Paris'
})

// Quotidien à 7h
cron.schedule('0 7 * * *', generateScheduledVeilles, {
  timezone: 'Europe/Paris'
})
```

### Logique de génération Veille IA

```typescript
// Fréquences supportées
- daily: tous les jours
- weekly: chaque lundi
- biweekly: 1er et 15 du mois
- monthly: 1er de chaque mois

// Étapes de génération
1. Récupérer les veilles IA selon la fréquence
2. Collecter les sources (articles récents)
3. Construire le prompt avec contexte
4. Appeler OpenAI pour génération
5. Sauvegarder l'édition en base
```

---

## 11. Déploiement

### Configuration Vercel

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "bun install"
}
```

### Process de Build

```bash
# Frontend
cd apps/web && bun run build
# Output: apps/web/dist/

# Backend
cd apps/api && bun run build
# Output: apps/api/dist/
```

### Architecture de Production

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel CDN    │────▶│  React SPA      │
│   (Frontend)    │     │  apps/web/dist  │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   API Server    │────▶│  PostgreSQL     │
│   (Backend)     │     │  (Supabase)     │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   n8n Instance  │
│   (Workflows)   │
└─────────────────┘
```

---

## 12. Variables d'Environnement

### Backend (`apps/api/.env`)

```bash
# Application
NODE_ENV=development|production
PORT=3000
APP_URL=http://localhost:5173

# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentification
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# OpenRouter (chat avec assistants)
OPENROUTER_API_KEY=sk-or-...

# OpenAI (embeddings pour RAG)
OPENAI_API_KEY=sk-...

# n8n
N8N_BASE_URL=https://automation.devtotem.com
N8N_WEBHOOK_SECRET=your-webhook-secret

# Optionnel
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`apps/web/.env`)

```bash
VITE_API_URL=http://localhost:3000/api
```

---

## 13. Commandes de Développement

### Installation

```bash
# Clone et installation
git clone <repo>
cd altij-ai-lab
bun install
```

### Développement

```bash
# Démarrer tous les services
bun run dev

# Frontend uniquement
bun run dev:web

# Backend uniquement
bun run dev:api
```

### Base de données

```bash
# Générer migration
bun run db:generate

# Appliquer migrations
bun run db:migrate

# Push direct (dev)
bun run db:push

# Studio visuel
bun run db:studio

# Seed données
bun run db:seed
```

### Build

```bash
# Build complet
bun run build

# Build frontend
bun run build:web

# Build backend
bun run build:api
```

### Tests

```bash
# Lancer les tests
bun run test

# Tests avec couverture
bun run test:coverage
```

### Linting

```bash
# Lint complet
bun run lint

# Fix automatique
bun run lint:fix
```

---

## Annexes

### A. Codes HTTP de l'API

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

### B. Départements

```typescript
enum Department {
  AFFAIRES = 'affaires',
  FAMILY_OFFICE = 'family_office',
  MNA = 'mna',
  IT = 'it',
  IP = 'ip',
  DATA = 'data',
  SOCIAL = 'social',
  RH = 'rh'
}
```

### C. Types d'Output Automation

```typescript
enum OutputType {
  FILE = 'file',      // Fichier téléchargeable
  TEXT = 'text',      // Texte brut
  JSON = 'json',      // Données JSON
  REDIRECT = 'redirect' // Redirection URL
}
```

---

*Documentation mise à jour le 14/01/2026 - AltiJ AI Lab v1.1*
