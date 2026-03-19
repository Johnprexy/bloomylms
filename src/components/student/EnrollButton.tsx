'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingCart, Play, ArrowRight } from 'lucide-react'
import { initializePaystackPayment, verifyPaystackPayment } from '@/lib/actions/payments'

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void }
    }
  }
}

interface Props {
  course: any
  enrollment: any
  userId?: string
}

export default function EnrollButton({ course, enrollment, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const [promoApplied, setPromoApplied] = useState(false)

  if (enrollment) {
    return (
      <a href={`/learn/${course.slug}`} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
        <Play className="w-5 h-5" /> Continue Learning
      </a>
    )
  }

  if (!userId) {
    return (
      <a href={`/login?redirect=/courses/${course.slug}`} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
        Sign In to Enroll <ArrowRight className="w-5 h-5" />
      </a>
    )
  }

  async function handleEnroll() {
    if (course.price === 0) {
      setLoading(true)
      // Free course — direct enroll via API
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      })
      if (res.ok) {
        router.push(`/learn/${course.slug}`)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    const result = await initializePaystackPayment(course.id, promoApplied ? promoCode : undefined)

    if (result.error || !result.data) {
      alert(result.error || 'Failed to initialize payment')
      setLoading(false)
      return
    }

    const { reference, email, amount, currency } = result.data

    // Load Paystack script dynamically
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount,
        currency,
        ref: reference,
        metadata: { course_id: course.id },
        callback: async (response: { reference: string }) => {
          setLoading(true)
          const verify = await verifyPaystackPayment(response.reference)
          if (verify.data) {
            router.push(`/learn/${course.slug}?enrolled=true`)
          } else {
            alert('Payment verification failed. Contact support.')
          }
          setLoading(false)
        },
        onClose: () => setLoading(false),
      })
      handler.openIframe()
    }
    document.head.appendChild(script)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : (
          <><ShoppingCart className="w-5 h-5" /> {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}</>
        )}
      </button>

      {course.price > 0 && (
        <div>
          <button
            onClick={() => setShowPromo(!showPromo)}
            className="text-xs text-bloomy-600 hover:text-bloomy-700 font-medium"
          >
            {showPromo ? 'Hide' : 'Have a promo code?'}
          </button>
          {showPromo && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="input-field text-sm flex-1"
              />
              <button
                onClick={() => setPromoApplied(true)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Apply
              </button>
            </div>
          )}
          {promoApplied && (
            <p className="text-xs text-green-600 mt-1">✓ Promo code applied</p>
          )}
        </div>
      )}
    </div>
  )
}
