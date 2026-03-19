'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react'
import { timeAgo, getInitials } from '@/lib/utils'

interface Props {
  courseId: string
  lessonId?: string
  userId: string
  userName: string
}

interface Discussion {
  id: string
  content: string
  upvotes: number
  is_pinned: boolean
  created_at: string
  parent_id: string | null
  author: { full_name: string; avatar_url?: string }
  replies?: Discussion[]
}

export default function Discussions({ courseId, lessonId, userId, userName }: Props) {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => { fetchDiscussions() }, [courseId, lessonId])

  async function fetchDiscussions() {
    const supabase = createClient()
    const query = supabase
      .from('discussions')
      .select('*, author:profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .is('parent_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (lessonId) {
      query.eq('lesson_id', lessonId)
    }

    const { data } = await query
    if (!data) { setLoading(false); return }

    // Fetch replies for each discussion
    const withReplies = await Promise.all(
      data.map(async d => {
        const { data: replies } = await supabase
          .from('discussions')
          .select('*, author:profiles(full_name, avatar_url)')
          .eq('parent_id', d.id)
          .order('created_at', { ascending: true })
        return { ...d, replies: replies || [] }
      })
    )

    setDiscussions(withReplies)
    setLoading(false)
  }

  async function postDiscussion() {
    if (!newPost.trim()) return
    setPosting(true)
    const supabase = createClient()
    await supabase.from('discussions').insert({
      course_id: courseId,
      lesson_id: lessonId || null,
      author_id: userId,
      content: newPost.trim(),
    })
    setNewPost('')
    await fetchDiscussions()
    setPosting(false)
  }

  async function postReply(parentId: string) {
    if (!replyText.trim()) return
    setPosting(true)
    const supabase = createClient()
    await supabase.from('discussions').insert({
      course_id: courseId,
      lesson_id: lessonId || null,
      author_id: userId,
      content: replyText.trim(),
      parent_id: parentId,
    })
    setReplyText('')
    setReplyTo(null)
    await fetchDiscussions()
    setPosting(false)
  }

  async function upvote(discussionId: string, currentUpvotes: number) {
    const supabase = createClient()
    await supabase.from('discussions').update({ upvotes: currentUpvotes + 1 }).eq('id', discussionId)
    setDiscussions(prev => prev.map(d => d.id === discussionId ? { ...d, upvotes: d.upvotes + 1 } : d))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-200 text-sm">{discussions.length} Discussion{discussions.length !== 1 ? 's' : ''}</h3>
      </div>

      {/* New post */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
          {getInitials(userName)}
        </div>
        <div className="flex-1">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Ask a question or share something..."
            rows={2}
            className="w-full bg-gray-700 text-gray-200 text-sm rounded-xl px-4 py-3 border border-gray-600 focus:outline-none focus:border-bloomy-500 resize-none placeholder:text-gray-500"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={postDiscussion}
              disabled={posting || !newPost.trim()}
              className="flex items-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Discussions list */}
      <div className="space-y-3">
        {discussions.map(d => (
          <div key={d.id} className={`bg-gray-800 rounded-xl p-4 border ${d.is_pinned ? 'border-bloomy-500/40' : 'border-gray-700'}`}>
            {d.is_pinned && (
              <span className="text-xs text-bloomy-400 font-semibold mb-2 block">📌 Pinned</span>
            )}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(d.author?.full_name || 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-200">{d.author?.full_name}</span>
                  <span className="text-xs text-gray-500">{timeAgo(d.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{d.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => upvote(d.id, d.upvotes)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-bloomy-400 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> {d.upvotes}
                  </button>
                  <button
                    onClick={() => setReplyTo(replyTo === d.id ? null : d.id)}
                    className="text-xs text-gray-500 hover:text-bloomy-400 transition-colors"
                  >
                    Reply
                  </button>
                  {d.replies && d.replies.length > 0 && (
                    <span className="text-xs text-gray-500">{d.replies.length} repl{d.replies.length !== 1 ? 'ies' : 'y'}</span>
                  )}
                </div>

                {/* Replies */}
                {d.replies && d.replies.length > 0 && (
                  <div className="mt-3 space-y-3 pl-4 border-l border-gray-700">
                    {d.replies.map(r => (
                      <div key={r.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(r.author?.full_name || 'U')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-gray-300">{r.author?.full_name}</span>
                            <span className="text-xs text-gray-600">{timeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyTo === d.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 bg-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-bloomy-500 placeholder:text-gray-600"
                      onKeyDown={e => e.key === 'Enter' && postReply(d.id)}
                    />
                    <button
                      onClick={() => postReply(d.id)}
                      disabled={posting || !replyText.trim()}
                      className="bg-bloomy-600 hover:bg-bloomy-500 text-white text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {discussions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No discussions yet. Be the first to ask!</p>
          </div>
        )}
      </div>
    </div>
  )
}
