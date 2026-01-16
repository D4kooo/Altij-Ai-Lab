import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import type { Env } from '../types';
import { db, schema } from '../db';
import { authMiddleware, staffMiddleware } from '../middleware/auth';

const coursesRoutes = new Hono<Env>();

// =====================================================
// SCHEMAS DE VALIDATION
// =====================================================

const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  audience: z.enum(['juniors', 'adultes', 'seniors']),
  icon: z.string().optional().default('BookOpen'),
  color: z.string().optional().default('#57C5B6'),
  isPublished: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

const moduleSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional().default('FileText'),
  duration: z.string().optional().default('15 min'),
  difficulty: z.enum(['facile', 'moyen', 'expert']).optional().default('facile'),
  category: z.string().optional(),
  hasAudio: z.boolean().optional().default(false),
  audioUrl: z.string().url().optional(),
  isLocked: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

const lessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional(),
  contentType: z.enum(['text', 'video', 'image', 'audio']).optional().default('text'),
  mediaUrl: z.string().url().optional(),
  duration: z.string().optional(),
  order: z.number().optional().default(0),
});

const quizSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional().default(70),
});

const quizQuestionSchema = z.object({
  quizId: z.string().uuid(),
  question: z.string().min(1),
  questionType: z.enum(['multiple_choice', 'true_false']).optional().default('multiple_choice'),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).min(2),
  explanation: z.string().optional(),
  order: z.number().optional().default(0),
});

const submitQuizSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string(),
  })),
});

// Apply auth middleware to all routes
coursesRoutes.use('*', authMiddleware);

// =====================================================
// ROUTES COURS (PUBLIC pour citoyens, CRUD pour staff)
// =====================================================

// GET /api/courses - Liste des cours publiés (citoyens) ou tous (staff)
coursesRoutes.get('/', async (c) => {
  const user = c.get('user')!;
  const audience = c.req.query('audience');

  // Staff voit tous les cours, citoyens seulement les publiés
  const baseCondition = user.isStaff
    ? eq(schema.courses.isActive, true)
    : and(eq(schema.courses.isActive, true), eq(schema.courses.isPublished, true));

  let courses;
  if (audience && ['juniors', 'adultes', 'seniors'].includes(audience)) {
    courses = await db
      .select()
      .from(schema.courses)
      .where(and(baseCondition, eq(schema.courses.audience, audience as 'juniors' | 'adultes' | 'seniors')))
      .orderBy(asc(schema.courses.order), asc(schema.courses.name));
  } else {
    courses = await db
      .select()
      .from(schema.courses)
      .where(baseCondition)
      .orderBy(asc(schema.courses.order), asc(schema.courses.name));
  }

  // Pour chaque cours, récupérer le nombre de modules
  const coursesWithModuleCount = await Promise.all(
    courses.map(async (course) => {
      const moduleCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.modules)
        .where(eq(schema.modules.courseId, course.id));

      return {
        ...course,
        moduleCount: Number(moduleCount[0]?.count || 0),
      };
    })
  );

  return c.json({ success: true, data: coursesWithModuleCount });
});

// GET /api/courses/:id - Détail d'un cours avec modules
coursesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, id))
    .limit(1);

  if (!course || (!course.isActive) || (!user.isStaff && !course.isPublished)) {
    return c.json({ success: false, error: 'Course not found' }, 404);
  }

  // Récupérer les modules du cours
  const modules = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.courseId, id))
    .orderBy(asc(schema.modules.order));

  // Récupérer la progression de l'utilisateur
  const progress = await db
    .select()
    .from(schema.userProgress)
    .where(eq(schema.userProgress.userId, user.id));

  const progressMap = new Map(progress.map(p => [p.moduleId, p]));

  const modulesWithProgress = modules.map(m => ({
    ...m,
    progress: progressMap.get(m.id) || null,
  }));

  return c.json({
    success: true,
    data: {
      ...course,
      modules: modulesWithProgress,
    }
  });
});

// POST /api/courses - Créer un cours (staff only)
coursesRoutes.post('/', staffMiddleware, zValidator('json', courseSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user')!;
  const now = new Date();

  const [course] = await db.insert(schema.courses).values({
    organizationId: user.organizationId || null,
    createdBy: user.id,
    name: data.name,
    description: data.description || null,
    audience: data.audience,
    icon: data.icon || 'BookOpen',
    color: data.color || '#57C5B6',
    isPublished: data.isPublished || false,
    isActive: true,
    order: data.order || 0,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: course }, 201);
});

// PUT /api/courses/:id - Modifier un cours (staff only)
coursesRoutes.put('/:id', staffMiddleware, zValidator('json', courseSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Course not found' }, 404);
  }

  const [course] = await db
    .update(schema.courses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.courses.id, id))
    .returning();

  return c.json({ success: true, data: course });
});

// DELETE /api/courses/:id - Supprimer un cours (staff only, soft delete)
coursesRoutes.delete('/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Course not found' }, 404);
  }

  await db
    .update(schema.courses)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.courses.id, id));

  return c.json({ success: true });
});

// =====================================================
// ROUTES MODULES
// =====================================================

// GET /api/courses/modules/:id - Détail d'un module avec leçons
coursesRoutes.get('/modules/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [module] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, id))
    .limit(1);

  if (!module) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  // Récupérer les leçons
  const lessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.moduleId, id))
    .orderBy(asc(schema.lessons.order));

  // Récupérer le quiz s'il existe
  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.moduleId, id))
    .limit(1);

  let quizWithQuestions = null;
  if (quiz) {
    const questions = await db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, quiz.id))
      .orderBy(asc(schema.quizQuestions.order));

    quizWithQuestions = { ...quiz, questions };
  }

  // Récupérer la progression
  const [progress] = await db
    .select()
    .from(schema.userProgress)
    .where(and(
      eq(schema.userProgress.userId, user.id),
      eq(schema.userProgress.moduleId, id)
    ))
    .limit(1);

  return c.json({
    success: true,
    data: {
      ...module,
      lessons,
      quiz: quizWithQuestions,
      progress: progress || null,
    }
  });
});

// POST /api/courses/modules - Créer un module (staff only)
coursesRoutes.post('/modules', staffMiddleware, zValidator('json', moduleSchema), async (c) => {
  const data = c.req.valid('json');
  const now = new Date();

  // Vérifier que le cours existe
  const [course] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, data.courseId))
    .limit(1);

  if (!course) {
    return c.json({ success: false, error: 'Course not found' }, 404);
  }

  const [module] = await db.insert(schema.modules).values({
    courseId: data.courseId,
    title: data.title,
    description: data.description || null,
    icon: data.icon || 'FileText',
    duration: data.duration || '15 min',
    difficulty: data.difficulty || 'facile',
    category: data.category || null,
    hasAudio: data.hasAudio || false,
    audioUrl: data.audioUrl || null,
    isLocked: data.isLocked || false,
    order: data.order || 0,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: module }, 201);
});

// PUT /api/courses/modules/:id - Modifier un module (staff only)
coursesRoutes.put('/modules/:id', staffMiddleware, zValidator('json', moduleSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  const [module] = await db
    .update(schema.modules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.modules.id, id))
    .returning();

  return c.json({ success: true, data: module });
});

// DELETE /api/courses/modules/:id - Supprimer un module (staff only)
coursesRoutes.delete('/modules/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  await db.delete(schema.modules).where(eq(schema.modules.id, id));

  return c.json({ success: true });
});

// POST /api/courses/modules/reorder - Réordonner les modules (staff only)
coursesRoutes.post('/modules/reorder', staffMiddleware, zValidator('json', z.object({
  courseId: z.string().uuid(),
  moduleIds: z.array(z.string().uuid()),
})), async (c) => {
  const { courseId, moduleIds } = c.req.valid('json');

  // Mettre à jour l'ordre de chaque module
  await Promise.all(
    moduleIds.map((moduleId, index) =>
      db
        .update(schema.modules)
        .set({ order: index, updatedAt: new Date() })
        .where(and(
          eq(schema.modules.id, moduleId),
          eq(schema.modules.courseId, courseId)
        ))
    )
  );

  return c.json({ success: true });
});

// =====================================================
// ROUTES LECONS
// =====================================================

// POST /api/courses/lessons - Créer une leçon (staff only)
coursesRoutes.post('/lessons', staffMiddleware, zValidator('json', lessonSchema), async (c) => {
  const data = c.req.valid('json');
  const now = new Date();

  // Vérifier que le module existe
  const [module] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, data.moduleId))
    .limit(1);

  if (!module) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  const [lesson] = await db.insert(schema.lessons).values({
    moduleId: data.moduleId,
    title: data.title,
    content: data.content || null,
    contentType: data.contentType || 'text',
    mediaUrl: data.mediaUrl || null,
    duration: data.duration || null,
    order: data.order || 0,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: lesson }, 201);
});

// PUT /api/courses/lessons/:id - Modifier une leçon (staff only)
coursesRoutes.put('/lessons/:id', staffMiddleware, zValidator('json', lessonSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Lesson not found' }, 404);
  }

  const [lesson] = await db
    .update(schema.lessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.lessons.id, id))
    .returning();

  return c.json({ success: true, data: lesson });
});

// DELETE /api/courses/lessons/:id - Supprimer une leçon (staff only)
coursesRoutes.delete('/lessons/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Lesson not found' }, 404);
  }

  await db.delete(schema.lessons).where(eq(schema.lessons.id, id));

  return c.json({ success: true });
});

// =====================================================
// ROUTES QUIZ
// =====================================================

// POST /api/courses/quizzes - Créer un quiz (staff only)
coursesRoutes.post('/quizzes', staffMiddleware, zValidator('json', quizSchema), async (c) => {
  const data = c.req.valid('json');
  const now = new Date();

  // Vérifier que le module existe et n'a pas déjà de quiz
  const [module] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, data.moduleId))
    .limit(1);

  if (!module) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  const [existingQuiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.moduleId, data.moduleId))
    .limit(1);

  if (existingQuiz) {
    return c.json({ success: false, error: 'Module already has a quiz' }, 400);
  }

  const [quiz] = await db.insert(schema.quizzes).values({
    moduleId: data.moduleId,
    title: data.title,
    description: data.description || null,
    passingScore: data.passingScore || 70,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return c.json({ success: true, data: quiz }, 201);
});

// PUT /api/courses/quizzes/:id - Modifier un quiz (staff only)
coursesRoutes.put('/quizzes/:id', staffMiddleware, zValidator('json', quizSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Quiz not found' }, 404);
  }

  const [quiz] = await db
    .update(schema.quizzes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.quizzes.id, id))
    .returning();

  return c.json({ success: true, data: quiz });
});

// DELETE /api/courses/quizzes/:id - Supprimer un quiz (staff only)
coursesRoutes.delete('/quizzes/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Quiz not found' }, 404);
  }

  await db.delete(schema.quizzes).where(eq(schema.quizzes.id, id));

  return c.json({ success: true });
});

// POST /api/courses/quizzes/:id/questions - Ajouter une question (staff only)
coursesRoutes.post('/quizzes/:id/questions', staffMiddleware, zValidator('json', quizQuestionSchema.omit({ quizId: true })), async (c) => {
  const quizId = c.req.param('id');
  const data = c.req.valid('json');
  const now = new Date();

  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, quizId))
    .limit(1);

  if (!quiz) {
    return c.json({ success: false, error: 'Quiz not found' }, 404);
  }

  const [question] = await db.insert(schema.quizQuestions).values({
    quizId,
    question: data.question,
    questionType: data.questionType || 'multiple_choice',
    options: data.options,
    explanation: data.explanation || null,
    order: data.order || 0,
    createdAt: now,
  }).returning();

  return c.json({ success: true, data: question }, 201);
});

// PUT /api/courses/questions/:id - Modifier une question (staff only)
coursesRoutes.put('/questions/:id', staffMiddleware, zValidator('json', quizQuestionSchema.omit({ quizId: true }).partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [existing] = await db
    .select()
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Question not found' }, 404);
  }

  const [question] = await db
    .update(schema.quizQuestions)
    .set(data)
    .where(eq(schema.quizQuestions.id, id))
    .returning();

  return c.json({ success: true, data: question });
});

// DELETE /api/courses/questions/:id - Supprimer une question (staff only)
coursesRoutes.delete('/questions/:id', staffMiddleware, async (c) => {
  const id = c.req.param('id');

  const [existing] = await db
    .select()
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'Question not found' }, 404);
  }

  await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.id, id));

  return c.json({ success: true });
});

// POST /api/courses/quizzes/:id/submit - Soumettre les réponses d'un quiz
coursesRoutes.post('/quizzes/:id/submit', zValidator('json', submitQuizSchema), async (c) => {
  const quizId = c.req.param('id');
  const user = c.get('user')!;
  const { answers } = c.req.valid('json');

  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, quizId))
    .limit(1);

  if (!quiz) {
    return c.json({ success: false, error: 'Quiz not found' }, 404);
  }

  // Récupérer les questions du quiz
  const questions = await db
    .select()
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.quizId, quizId));

  // Calculer le score
  let correctAnswers = 0;
  const results = answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return { questionId: answer.questionId, correct: false };

    const options = question.options as { id: string; text: string; isCorrect: boolean }[];
    const selectedOption = options.find(o => o.id === answer.selectedOptionId);
    const isCorrect = selectedOption?.isCorrect || false;

    if (isCorrect) correctAnswers++;

    return {
      questionId: answer.questionId,
      correct: isCorrect,
      correctOptionId: options.find(o => o.isCorrect)?.id,
      explanation: question.explanation,
    };
  });

  const score = Math.round((correctAnswers / questions.length) * 100);
  const passed = score >= (quiz.passingScore || 70);

  // Mettre à jour ou créer la progression
  const [existingProgress] = await db
    .select()
    .from(schema.userProgress)
    .where(and(
      eq(schema.userProgress.userId, user.id),
      eq(schema.userProgress.moduleId, quiz.moduleId)
    ))
    .limit(1);

  const now = new Date();
  if (existingProgress) {
    await db
      .update(schema.userProgress)
      .set({
        quizScore: score,
        quizAttempts: (existingProgress.quizAttempts || 0) + 1,
        completed: passed || existingProgress.completed,
        completedAt: passed ? now : existingProgress.completedAt,
        updatedAt: now,
      })
      .where(eq(schema.userProgress.id, existingProgress.id));
  } else {
    await db.insert(schema.userProgress).values({
      userId: user.id,
      moduleId: quiz.moduleId,
      quizScore: score,
      quizAttempts: 1,
      completed: passed,
      completedAt: passed ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    success: true,
    data: {
      score,
      passed,
      passingScore: quiz.passingScore,
      correctAnswers,
      totalQuestions: questions.length,
      results,
    }
  });
});

// =====================================================
// ROUTES PROGRESSION
// =====================================================

// GET /api/courses/progress - Ma progression globale
coursesRoutes.get('/progress/me', async (c) => {
  const user = c.get('user')!;

  const progress = await db
    .select({
      progress: schema.userProgress,
      module: schema.modules,
      course: schema.courses,
    })
    .from(schema.userProgress)
    .innerJoin(schema.modules, eq(schema.userProgress.moduleId, schema.modules.id))
    .innerJoin(schema.courses, eq(schema.modules.courseId, schema.courses.id))
    .where(eq(schema.userProgress.userId, user.id));

  // Grouper par cours
  const courseProgress = new Map<string, {
    course: typeof schema.courses.$inferSelect;
    completedModules: number;
    totalModules: number;
    modules: (typeof schema.userProgress.$inferSelect)[];
  }>();

  for (const p of progress) {
    if (!courseProgress.has(p.course.id)) {
      // Compter le total de modules du cours
      const totalModules = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.modules)
        .where(eq(schema.modules.courseId, p.course.id));

      courseProgress.set(p.course.id, {
        course: p.course,
        completedModules: 0,
        totalModules: Number(totalModules[0]?.count || 0),
        modules: [],
      });
    }

    const cp = courseProgress.get(p.course.id)!;
    cp.modules.push(p.progress);
    if (p.progress.completed) {
      cp.completedModules++;
    }
  }

  return c.json({
    success: true,
    data: Array.from(courseProgress.values()).map(cp => ({
      course: {
        id: cp.course.id,
        name: cp.course.name,
        audience: cp.course.audience,
        icon: cp.course.icon,
        color: cp.course.color,
      },
      completedModules: cp.completedModules,
      totalModules: cp.totalModules,
      progress: Math.round((cp.completedModules / cp.totalModules) * 100) || 0,
    })),
  });
});

// POST /api/courses/progress/:moduleId/complete - Marquer un module comme complété
coursesRoutes.post('/progress/:moduleId/complete', async (c) => {
  const moduleId = c.req.param('moduleId');
  const user = c.get('user')!;

  const [module] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, moduleId))
    .limit(1);

  if (!module) {
    return c.json({ success: false, error: 'Module not found' }, 404);
  }

  const now = new Date();

  // Vérifier si le module a un quiz
  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.moduleId, moduleId))
    .limit(1);

  // Si le module a un quiz, on ne peut pas le marquer comme complété directement
  if (quiz) {
    return c.json({
      success: false,
      error: 'Module has a quiz. Complete the quiz to mark the module as completed.'
    }, 400);
  }

  // Mettre à jour ou créer la progression
  const [existingProgress] = await db
    .select()
    .from(schema.userProgress)
    .where(and(
      eq(schema.userProgress.userId, user.id),
      eq(schema.userProgress.moduleId, moduleId)
    ))
    .limit(1);

  if (existingProgress) {
    await db
      .update(schema.userProgress)
      .set({
        completed: true,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.userProgress.id, existingProgress.id));
  } else {
    await db.insert(schema.userProgress).values({
      userId: user.id,
      moduleId,
      completed: true,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({ success: true });
});

export { coursesRoutes };
