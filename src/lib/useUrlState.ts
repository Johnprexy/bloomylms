'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Syncs key-value state to URL search params.
 * On refresh, values are read back from the URL automatically.
 *
 * Usage:
 *   const { getParam, setParam, setParams } = useUrlState()
 *   const courseId = getParam('course') // reads from URL
 *   setParam('course', id)              // writes to URL without navigation
 *   setParams({ course: id, tab: 'curriculum' }) // set multiple at once
 */
export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getParam = useCallback((key: string) => {
    return searchParams.get(key)
  }, [searchParams])

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false })
  }, [router, pathname, searchParams])

  const setParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false })
  }, [router, pathname, searchParams])

  const clearParams = useCallback((...keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    keys.forEach(k => params.delete(k))
    const qs = params.toString()
    router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false })
  }, [router, pathname, searchParams])

  return { getParam, setParam, setParams, clearParams, searchParams }
}
