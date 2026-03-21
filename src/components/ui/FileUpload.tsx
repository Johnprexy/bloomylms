'use client'
import { useState, useRef, DragEvent } from 'react'
import { Upload, X, Loader2, CheckCircle, Link2, ExternalLink, AlertTriangle } from 'lucide-react'

interface Props {
  value: string
  fileName?: string
  onChange: (url: string, name: string, size?: number) => void
  maxSizeMB?: number
  label?: string
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', doc: '📝', pptx: '📊', ppt: '📊',
  xlsx: '📈', xls: '📈', zip: '📦', rar: '📦',
  mp4: '🎬', mp3: '🎵', png: '🖼', jpg: '🖼', jpeg: '🖼',
}

function fileExt(name: string) { return name.split('.').pop()?.toLowerCase() || '' }
function fileIcon(name: string) { return FILE_ICONS[fileExt(name)] || '📎' }

export default function FileUpload({ value, fileName, onChange, maxSizeMB = 50, label }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }
    setError('')
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/upload', { method: 'POST', body: form })

      // Read as text first to avoid JSON parse crash on HTML error pages
      const text = await response.text()
      let res: any
      try { res = JSON.parse(text) } catch {
        setError('S3 not configured yet — use "Paste URL" tab below to paste a Google Drive or Dropbox link.')
        setUploading(false)
        setMode('url')
        return
      }

      if (res.error) {
        setError(res.error)
        if (res.fallback) setMode('url')
        setUploading(false)
        return
      }

      if (res.url) {
        onChange(res.url, file.name, file.size)
        setUrlInput(res.url)
        setError('')
      }
    } catch (e: any) {
      setError('Upload failed — use "Paste URL" tab to paste a Google Drive or Dropbox link.')
      setMode('url')
    }
    setUploading(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function applyUrl() {
    const url = urlInput.trim()
    if (!url) return
    const name = url.split('/').pop()?.split('?')[0] || 'file'
    onChange(url, name)
    setError('')
  }

  function clear() {
    onChange('', ''); setUrlInput(''); setError(''); setMode('upload')
  }

  const tabBtn = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${active
      ? 'bg-bloomy-600 text-white border-bloomy-600'
      : 'bg-white text-gray-600 border-gray-200 hover:border-bloomy-300'}`

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>}

      {/* Tabs */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('upload')} className={tabBtn(mode === 'upload')}>
          <Upload className="w-3.5 h-3.5" />Upload File
        </button>
        <button type="button" onClick={() => setMode('url')} className={tabBtn(mode === 'url')}>
          <Link2 className="w-3.5 h-3.5" />Paste URL
        </button>
      </div>

      {/* UPLOAD MODE */}
      {mode === 'upload' && (
        value ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="text-2xl flex-shrink-0">{fileIcon(fileName || value)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{fileName || 'File uploaded'}</p>
              <a href={value} target="_blank" rel="noopener noreferrer"
                className="text-xs text-bloomy-600 hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />View file
              </a>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <button type="button" onClick={clear} className="text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver ? 'border-bloomy-400 bg-bloomy-50' : 'border-gray-200 hover:border-bloomy-300 hover:bg-gray-50'
            }`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-bloomy-500 animate-spin" />
                <p className="text-sm font-medium text-gray-600">Uploading to S3...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-7 h-7 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400">PDF, Word, PowerPoint, Excel, ZIP, Images · Max {maxSizeMB}MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mp3"
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </div>
        )
      )}

      {/* URL MODE */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Paste Google Drive, Dropbox or direct file URL..."
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white"
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
            />
            <button type="button" onClick={applyUrl} disabled={!urlInput.trim()}
              className="btn-primary text-sm px-4 py-2.5 disabled:opacity-50 flex-shrink-0">Set</button>
            {value && <button type="button" onClick={clear} className="text-gray-400 hover:text-red-500 px-2"><X className="w-4 h-4" /></button>}
          </div>
          {value && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="truncate flex-1">{fileName || value}</span>
              <a href={value} target="_blank" rel="noopener noreferrer"
                className="text-bloomy-600 hover:underline flex items-center gap-1 flex-shrink-0">
                <ExternalLink className="w-3 h-3" />Open
              </a>
            </div>
          )}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">How to get a shareable link:</p>
            <p>• <strong>Google Drive:</strong> Right-click file → Share → Anyone with link → Copy link</p>
            <p>• <strong>Dropbox:</strong> Click Share → Copy link</p>
            <p>• <strong>OneDrive:</strong> Share → Anyone with link → Copy</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
