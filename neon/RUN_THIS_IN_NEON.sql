-- ============================================================
-- BloomyLMS — Run ALL of this in Neon SQL Editor at once
-- ============================================================

-- Quiz question types
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'multiple_choice';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS correct_answers JSONB;

-- Quiz settings
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Lesson file columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Cohort students (NEEDED FOR COHORTS TO WORK)
CREATE TABLE IF NOT EXISTS cohort_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, student_id)
);

-- Grade items (NEEDED FOR GRADEBOOK)
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

-- Add columns to grade_items if table already exists
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grade_item_id UUID REFERENCES grade_items(id) ON DELETE SET NULL;

-- Attendance (NEEDED FOR ATTENDANCE TO WORK)
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

-- If old attendance table had session_title instead of title:
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS title TEXT;

-- Surveys (NEEDED FOR SURVEYS TO WORK)
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'feedback',
  is_anonymous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT true,
  position INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id),
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions (NEEDED FOR ASSIGNMENT UPLOAD)
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  grade NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

-- Demo student reset (clean slate)
-- Uncomment if needed:
-- DELETE FROM enrollments WHERE student_id = (SELECT id FROM users WHERE email = 'demo.student@bloomy360.com');
-- DELETE FROM users WHERE email = 'demo.student@bloomy360.com';
-- INSERT INTO users (email, full_name, password_hash, role, is_active, email_verified)
-- VALUES ('demo.student@bloomy360.com', 'Demo Student',
--   '$2b$10$yWOHovxeuffxKXFhCxi3aOmok3Qj4JU9etEU0GLSRQXFTFZbG9czy', 'student', true, true);
