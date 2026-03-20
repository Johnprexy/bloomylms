'use client'
import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  confirmText?: string      // if set, user must type this exact text to confirm
  confirmPlaceholder?: string
  destructive?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Delete', confirmText,
  confirmPlaceholder, destructive = true, onConfirm, onCancel
}: Props) {
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const canConfirm = confirmText ? typed === confirmText : true

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${destructive ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type-to-confirm */}
        {confirmText && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 mb-2">
              Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{confirmText}</span> to confirm
            </p>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmPlaceholder || `Type "${confirmText}" to confirm`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && canConfirm && handleConfirm()}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 btn-secondary text-sm py-2.5">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
