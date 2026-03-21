'use client'
import { useState, useRef, DragEvent } from 'react'
import { Upload, X, FileText, Loader2, CheckCircle, Link2, ExternalLink, Download, AlertTriangle } from 'lucide-react'

interface Props {
  value: string
  fileName?: string
  onChange: (url: string, name: string, size?: number) => void
  accept?: string
  maxSizeMB?: number
  label?: string
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', doc: '📝', pptx: '📊', ppt: '📊',
  xlsx: '📈', xls: '📈', zip: '📦', rar: '📦', mp4: '🎬',
  mp3: '🎵', png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', txt: '📃',
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICONS[ext] || '📎'
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function FileUpload({ value, fileName, onChange, maxSizeMB = 50, label }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }
    setError('')
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)

      const response = await fetch('/api/upload', { method: 'POST', body: form })

      // Always parse as text first to avoid JSON parse errors
      const text = await response.text()
      let res: any
      try {
        res = JSON.parse(text)
      } catch {
        // Not JSON — usually means Vercel Blob isn't configured
        setError('File storage not set up yet. Use "Paste URL" tab — paste a Google Drive or Dropbox share link.')
        setUploading(false)
        setMode('url')
        return
      }

      if (res.error) {
        setError(res.error)
        // If storage not configured, auto-switch to URL mode
        if (res.error.includes('Paste URL') || res.error.includes('not configured') || res.error.includes('token')) {
          setMode('url')
        }
        setUploading(false)
        return
      }

      if (res.url) {
        onChange(res.url, file.name, file.size)
        setUrlInput(res.url)
      }
    } catch (e: any) {
      setError('Upload failed — use "Paste URL" tab instead to paste a Google Drive or Dropbox link.')
      setMode('url')
    }

    setUploading(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function applyUrl() {
    const url = urlInput.trim()
    if (!url) return
    const name = url.split('/').pop()?.split('?')[0] || 'file'
    onChange(url, name)
  }

  function clear() {
    onChange('', '')
    setUrlInput('')
    setError('')
    setMode('upload')
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-700 rounded-lg p-0.5 w-fit">
        <button type="button" onClick={() => setMode('upload')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
          <Upload className="w-3 h-3" />Upload File
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
          <Link2 className="w-3 h-3" />Paste URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <>
          {value ? (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3">
              <span className="text-2xl">{fileIcon(fileName || value)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{fileName || 'Uploaded file'}</p>
                <a href={value} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-bloomy-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />View file
                </a>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <button type="button" onClick={clear} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-bloomy-400 bg-bloomy-900/20' : 'border-gray-600 hover:border-bloomy-500 hover:bg-gray-700/30'
              }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-bloomy-400 animate-spin" />
                  <p className="text-sm text-gray-300 font-medium">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-500" />
                  <p className="text-sm font-medium text-gray-300">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-500">PDF, Word, PowerPoint, Excel, ZIP, Images · Max {maxSizeMB}MB</p>
                </div>
              )}
              <input ref={inputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mp3"
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
            </div>
          )}
        </>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Paste link from Google Drive, Dropbox, OneDrive..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-bloomy-500"
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
            />
            <button type="button" onClick={applyUrl} disabled={!urlInput.trim()}
              className="btn-primary text-sm px-4 py-2.5 disabled:opacity-50 flex-shrink-0">
              Set
            </button>
            {value && <button type="button" onClick={clear} className="text-gray-500 hover:text-red-400 px-2"><X className="w-4 h-4" /></button>}
          </div>
          {value && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="truncate flex-1">{fileName || value}</span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-bloomy-400 hover:underline flex items-center gap-1 flex-shrink-0">
                <ExternalLink className="w-3 h-3" />Open
              </a>
            </div>
          )}
          <div className="bg-gray-700/50 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">How to get a shareable link:</p>
            <p>• <strong className="text-gray-200">Google Drive:</strong> Right-click file → Share → Copy link</p>
            <p>• <strong className="text-gray-200">Dropbox:</strong> Click Share → Copy link</p>
            <p>• <strong className="text-gray-200">OneDrive:</strong> Share → Anyone with link → Copy</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-3 py-2.5 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
