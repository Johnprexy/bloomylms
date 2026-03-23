import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { HelpCircle, CheckCircle, Clock, Trophy, ArrowRight, BookOpen } from 'lucide-react'
export const dynamic = 'force-dynamic'
export default async function MyQuizzesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const quizzes = await sql`
    SELECT l.id as lesson_id, l.title as lesson_title, m.title as module_title,
      c.title as course_title, c.slug as course_slug, c.id as course_id,
      q.id as quiz_id, q.passing_score, q.max_attempts, q.time_limit_minutes,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
      (SELECT qa.final_score FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ${userId} ORDER BY qa.final_score DESC NULLS LAST LIMIT 1) as best_score,
      (SELECT qa.passed FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ${userId} ORDER BY qa.final_score DESC NULLS LAST LIMIT 1) as passed,
      (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ${userId} AND qa.status != 'abandoned') as attempts_taken
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = ${userId}
    LEFT JOIN quizzes q ON q.lesson_id = l.id
    WHERE l.type = 'quiz' AND l.is_published = true AND q.status = 'published'
    ORDER BY c.title, m.position, l.position`
  const total = quizzes.length
  const completed = quizzes.filter((q: any) => q.passed).length
  const pending = quizzes.filter((q: any) => !q.attempts_taken || q.attempts_taken === '0').length
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1><p className="text-sm text-gray-500 mt-0.5">All quizzes across your enrolled courses</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label:'Total', value: total, icon: HelpCircle, color:'bg-purple-50 text-purple-600' }, { label:'Passed', value: completed, icon: Trophy, color:'bg-green-50 text-green-600' }, { label:'Pending', value: pending, icon: Clock, color:'bg-orange-50 text-orange-600' }].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="font-medium text-gray-600">No quizzes yet</p></div>
      ) : (
        <div className="space-y-3">
          {Array.from(new Set(quizzes.map((q: any) => q.course_id))).map(courseId => {
            const cq = quizzes.filter((q: any) => q.course_id === courseId)
            const first = cq[0] as any
            return (
              <div key={courseId as string} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                  <BookOpen className="w-4 h-4 text-bloomy-500" /><p className="font-semibold text-sm text-gray-900">{first.course_title}</p>
                  <span className="ml-auto text-xs text-gray-400">{cq.filter((q: any) => q.passed).length}/{cq.length} passed</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cq.map((quiz: any) => (
                    <Link key={quiz.lesson_id} href={`/learn/${quiz.course_slug}?lesson=${quiz.lesson_id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${quiz.passed ? 'bg-green-100' : quiz.attempts_taken > 0 ? 'bg-orange-100' : 'bg-purple-50'}`}>
                        {quiz.passed ? <Trophy className="w-5 h-5 text-green-600" /> : quiz.attempts_taken > 0 ? <Clock className="w-5 h-5 text-orange-500" /> : <HelpCircle className="w-5 h-5 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 group-hover:text-bloomy-700 truncate">{quiz.lesson_title}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-400">{quiz.question_count} questions</span>
                          {quiz.time_limit_minutes && <span className="text-xs text-gray-400"><Clock className="w-3 h-3 inline mr-0.5" />{quiz.time_limit_minutes}m</span>}
                          <span className="text-xs text-gray-400">Pass: {quiz.passing_score}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {quiz.passed ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">✓ Passed {Math.round(quiz.best_score)}%</span>
                          : quiz.attempts_taken > 0 ? <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">Best: {Math.round(quiz.best_score || 0)}%</span>
                          : <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">Not started</span>}
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-bloomy-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
