-- ============================================================
-- QUIZ SYSTEM V2 — Run in Neon SQL Editor
-- ============================================================

-- Drop old tables if they exist (clean slate)
DROP TABLE IF EXISTS attempt_answers CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS question_bank_items CASCADE;
DROP TABLE IF EXISTS question_banks CASCADE;

-- Recreate quizzes table with full settings
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  cooldown_minutes INTEGER DEFAULT 0,
  grading_method TEXT DEFAULT 'highest' CHECK (grading_method IN ('highest','latest','average','first')),
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  show_correct_answers TEXT DEFAULT 'immediately' CHECK (show_correct_answers IN ('never','immediately','after_close')),
  show_explanations BOOLEAN DEFAULT true,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  require_previous_lesson BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  grade_item_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (supports all 7 types)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  bank_id UUID,
  type TEXT NOT NULL CHECK (type IN ('mcq','multi_select','true_false','short_answer','essay','matching','ordering','file_upload')),
  text TEXT NOT NULL,
  points NUMERIC(6,2) DEFAULT 1,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  hint_text TEXT,
  hint_penalty NUMERIC(4,2) DEFAULT 0,
  explanation TEXT,
  topic_tags TEXT[],
  word_limit INTEGER,
  accepted_files TEXT[],
  case_sensitive BOOLEAN DEFAULT false,
  partial_credit BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  requires_manual_grading BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answer options (MCQ, multi-select, matching, ordering, true/false)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  match_text TEXT,
  position INTEGER DEFAULT 0
);

-- Question bank (standalone reusable questions)
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Question Bank',
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attempt tracking
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  auto_score NUMERIC(6,2),
  manual_score NUMERIC(6,2),
  final_score NUMERIC(6,2),
  passed BOOLEAN,
  time_taken_seconds INTEGER,
  tab_switch_count INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-question grading (for manual grading queue)
CREATE TABLE IF NOT EXISTS attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer JSONB,
  is_correct BOOLEAN,
  auto_score NUMERIC(6,2),
  manual_score NUMERIC(6,2),
  instructor_feedback TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(attempt_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);

SELECT 'Quiz V2 schema created ✓' as result;
