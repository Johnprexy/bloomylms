// ============================================================
// BloomyLMS - Global TypeScript Types
// ============================================================

export type UserRole = 'student' | 'instructor' | 'admin'
export type CourseStatus = 'draft' | 'published' | 'archived'
export type EnrollmentStatus = 'active' | 'completed' | 'suspended' | 'refunded'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type LessonType = 'video' | 'text' | 'quiz' | 'assignment' | 'live'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  phone?: string
  bio?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  is_active: boolean
  email_verified: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  short_description?: string
  thumbnail_url?: string
  trailer_url?: string
  category_id?: string
  category?: Category
  instructor_id: string
  instructor?: Profile
  price: number
  currency: string
  duration_weeks: number
  difficulty: DifficultyLevel
  status: CourseStatus
  is_featured: boolean
  total_lessons: number
  total_students: number
  average_rating: number
  total_reviews: number
  requirements?: string[]
  what_you_learn?: string[]
  tags?: string[]
  certificate_enabled: boolean
  cohort_based: boolean
  created_at: string
  updated_at: string
}

export interface Cohort {
  id: string
  course_id: string
  name: string
  start_date: string
  end_date?: string
  max_students: number
  enrolled_count: number
  is_open: boolean
}

export interface Module {
  id: string
  course_id: string
  title: string
  description?: string
  position: number
  is_published: boolean
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  type: LessonType
  content?: string
  video_url?: string
  video_duration?: number
  position: number
  is_published: boolean
  is_preview: boolean
  resources?: Resource[]
  progress?: LessonProgress
}

export interface Resource {
  id: string
  lesson_id: string
  name: string
  type: string
  url: string
  size_bytes?: number
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  cohort_id?: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at?: string
  progress_percent: number
  last_accessed_at?: string
  course?: Course
  student?: Profile
}

export interface LessonProgress {
  id: string
  student_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  watch_time_seconds: number
  completed_at?: string
}

export interface Quiz {
  id: string
  lesson_id: string
  title: string
  description?: string
  passing_score: number
  time_limit_minutes?: number
  attempts_allowed: number
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  type: string
  options?: { label: string; value: string }[]
  correct_answer: string
  explanation?: string
  points: number
  position: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  answers: Record<string, string>
  score: number
  passed: boolean
  started_at: string
  completed_at?: string
}

export interface Assignment {
  id: string
  lesson_id: string
  course_id: string
  title: string
  description: string
  due_date?: string
  max_score: number
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
  score?: number
  feedback?: string
  status: 'submitted' | 'graded' | 'returned'
  submitted_at: string
  graded_at?: string
  student?: Profile
  assignment?: Assignment
}

export interface Payment {
  id: string
  student_id: string
  course_id: string
  amount: number
  currency: string
  gateway: 'paystack' | 'stripe' | 'manual'
  gateway_ref?: string
  status: PaymentStatus
  promo_code?: string
  discount_amount: number
  created_at: string
  course?: Course
  student?: Profile
}

export interface Certificate {
  id: string
  enrollment_id: string
  student_id: string
  course_id: string
  certificate_number: string
  pdf_url?: string
  issued_at: string
  status: 'pending' | 'issued' | 'revoked'
  student?: Profile
  course?: Course
}

export interface LiveSession {
  id: string
  course_id: string
  instructor_id: string
  title: string
  description?: string
  meeting_url?: string
  starts_at: string
  ends_at?: string
  is_recorded: boolean
  recording_url?: string
  course?: Course
}

export interface Announcement {
  id: string
  course_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  author?: Profile
}

export interface Discussion {
  id: string
  course_id: string
  lesson_id?: string
  author_id: string
  parent_id?: string
  content: string
  upvotes: number
  is_pinned: boolean
  created_at: string
  author?: Profile
  replies?: Discussion[]
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  link?: string
  read: boolean
  created_at: string
}

export interface Review {
  id: string
  course_id: string
  student_id: string
  rating: number
  comment?: string
  created_at: string
  student?: Profile
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Dashboard stats
export interface StudentStats {
  enrolled_courses: number
  completed_courses: number
  certificates_earned: number
  hours_learned: number
  average_progress: number
}

export interface InstructorStats {
  total_courses: number
  total_students: number
  total_revenue: number
  average_rating: number
  pending_submissions: number
}

export interface AdminStats {
  total_students: number
  total_instructors: number
  total_courses: number
  total_revenue: number
  active_enrollments: number
  monthly_revenue: { month: string; revenue: number }[]
  enrollments_by_course: { course: string; count: number }[]
}
