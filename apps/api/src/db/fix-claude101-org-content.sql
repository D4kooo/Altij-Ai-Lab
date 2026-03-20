-- ============================================================================
-- FIX: Replace placeholder content in Claude 101 (organisation) lessons
-- Run this after the initial seed to populate full content
-- ============================================================================

-- Find the org course and update all its lessons with full content
DO $$
DECLARE
  org_course_id UUID;
  mod_record RECORD;
  lesson_record RECORD;
  adult_course_id UUID;
BEGIN

-- Find the organisation version
SELECT id INTO org_course_id FROM courses
WHERE name = 'Claude 101 : Maitriser l''IA en Entreprise' AND audience = 'organisation' AND is_active = true
LIMIT 1;

-- Find the adultes version
SELECT id INTO adult_course_id FROM courses
WHERE name = 'Claude 101 : Maitriser l''IA en Entreprise' AND audience = 'adultes' AND is_active = true
LIMIT 1;

IF org_course_id IS NULL OR adult_course_id IS NULL THEN
  RAISE NOTICE 'Courses not found, skipping';
  RETURN;
END IF;

-- For each module in the org course, copy content from corresponding adult module
FOR mod_record IN
  SELECT m_org.id as org_mod_id, m_org.title as org_title, m_org."order" as mod_order
  FROM modules m_org
  WHERE m_org.course_id = org_course_id
  ORDER BY m_org."order"
LOOP
  -- For each lesson in this org module, find matching adult lesson and copy content
  FOR lesson_record IN
    SELECT l_org.id as org_lesson_id, l_org.title as org_lesson_title, l_org."order" as lesson_order
    FROM lessons l_org
    WHERE l_org.module_id = mod_record.org_mod_id
    ORDER BY l_org."order"
  LOOP
    -- Update from matching adult lesson (same module order + lesson order)
    UPDATE lessons l_org
    SET content = (
      SELECT l_adult.content
      FROM lessons l_adult
      JOIN modules m_adult ON l_adult.module_id = m_adult.id
      WHERE m_adult.course_id = adult_course_id
        AND m_adult."order" = mod_record.mod_order
        AND l_adult."order" = lesson_record.lesson_order
      LIMIT 1
    )
    WHERE l_org.id = lesson_record.org_lesson_id;
  END LOOP;

  -- Also copy quiz questions if the org module has a quiz
  -- First check if org module has a quiz with no questions
  DECLARE
    org_quiz_id UUID;
    adult_quiz_id UUID;
  BEGIN
    SELECT q.id INTO org_quiz_id FROM quizzes q WHERE q.module_id = mod_record.org_mod_id LIMIT 1;

    IF org_quiz_id IS NOT NULL THEN
      -- Find matching adult quiz
      SELECT q.id INTO adult_quiz_id
      FROM quizzes q
      JOIN modules m ON q.module_id = m.id
      WHERE m.course_id = adult_course_id AND m."order" = mod_record.mod_order
      LIMIT 1;

      IF adult_quiz_id IS NOT NULL THEN
        -- Check if org quiz has no questions
        IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_id = org_quiz_id) THEN
          -- Copy questions from adult quiz
          INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
          SELECT org_quiz_id, question, question_type, options, explanation, "order"
          FROM quiz_questions WHERE quiz_id = adult_quiz_id;
        END IF;
      END IF;
    END IF;
  END;

END LOOP;

RAISE NOTICE 'Successfully copied content from adultes to organisation course';

END $$;
