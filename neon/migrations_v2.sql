-- ============================================================
-- MIGRATION V2: Quiz types, auto-gradebook, attendance-by-cohort
-- Run ALL of these in Neon SQL Editor
-- ============================================================

-- 1. Enhanced quiz_questions
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'multiple_choice';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS correct_answers JSONB;

-- 2. Enhanced quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grade_item_id UUID REFERENCES grade_items(id) ON DELETE SET NULL;

-- 3. Grade items enhancements
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS source_id UUID;

-- 4. Lessons new columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- 5. Attendance fix
ALTER TABLE attendance RENAME COLUMN session_title TO title;

-- 6. Cohort students table
CREATE TABLE IF NOT EXISTS cohort_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, student_id)
);

-- 7. Grade items and grades (if not exist)
CREATE TABLE IF NOT EXISTS grade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'assignment',
  max_score NUMERIC(6,2) DEFAULT 100,
  weight_percent NUMERIC(5,2) DEFAULT 0,
  due_date DATE,
  position INT DEFAULT 0,
  source_type TEXT DEFAULT 'manual',
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_item_id UUID NOT NULL REFERENCES grade_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(6,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grade_item_id, student_id)
);

-- 8. Attendance tables (if not exist)  
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  title TEXT,
  session_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present','absent','late','excused')),
  notes TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attendance_id, student_id)
);

-- 9. Survey tables
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  type TEXT DEFAULT 'feedback', is_anonymous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true, created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL, type TEXT NOT NULL, options JSONB,
  required BOOLEAN DEFAULT true, position INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id),
  answers JSONB NOT NULL, submitted_at TIMESTAMPTZ DEFAULT NOW()
);
