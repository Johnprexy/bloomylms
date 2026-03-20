'use client'
import { useState, useRef, DragEvent } from 'react'
import { Upload, X, FileText, File, Loader2, CheckCircle, Link2, ExternalLink } from 'lucide-react'

interface Props {
  value: string        // current file_url
  fileName?: string    // current file_name
  onChange: (url: string, name: string, size?: number) => void
  accept?: string      // e.g. ".pdf,.docx,.pptx"
  maxSizeMB?: number
  label?: string
}

const ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', doc: '📝', pptx: '📊', ppt: '📊',
  xlsx: '📈', xls: '📈', zip: '📦', mp4: '🎬', webm: '🎬',
  png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', txt: '📃',
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ICONS[ext] || '📎'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function FileUpload({ value, fileName, onChange, accept, maxSizeMB = 50, label }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload')
  const [urlInput, setUrlInput] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }
    setError('')
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form }).then(r => r.json())
      if (res.error) { setError(res.error); setUploading(false); return }
      onChange(res.url, file.name, file.size)
      setUrlInput(res.url)
    } catch (e: any) {
      setError('Upload failed: ' + e.message)
    }
    setUploading(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function applyUrl() {
    const url = urlInput.trim()
    if (!url) return
    const name = url.split('/').pop() || 'file'
    onChange(url, name)
  }

  function clear() {
    onChange('', '')
    setUrlInput('')
    setMode('upload')
  }

  // Uploaded / URL set state
  if (value && mode !== 'url') {
    // Auto switch to showing the file
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-gray-500">{label}</label>}

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setMode('upload')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1.5"><Upload className="w-3 h-3" />Upload File</span>
        </button>
        <button onClick={() => setMode('url')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3" />Paste URL</span>
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          {value ? (
            // File uploaded successfully
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-2xl">{fileIcon(fileName || value)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{fileName || 'Uploaded file'}</p>
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-bloomy-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />View file
                </a>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <button onClick={clear} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            // Drop zone
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-bloomy-400 bg-bloomy-50' : 'border-gray-200 hover:border-bloomy-300 hover:bg-gray-50'
              }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-bloomy-500 animate-spin" />
                  <p className="text-sm text-gray-500 font-medium">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Drop file here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, Word, PowerPoint, Excel, ZIP, Images · Max {maxSizeMB}MB</p>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" className="hidden" accept={accept || '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg,.gif,.mp4'} onChange={handleFileInput} />
            </div>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://drive.google.com/... or any file URL"
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500"
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
            />
            <button onClick={applyUrl} disabled={!urlInput.trim()}
              className="btn-secondary text-sm px-4 py-2.5 disabled:opacity-50">
              Set
            </button>
            {value && <button onClick={clear} className="text-gray-400 hover:text-red-500 px-2"><X className="w-4 h-4" /></button>}
          </div>
          {value && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="truncate">{fileName || value}</span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-bloomy-600 hover:underline flex items-center gap-0.5 flex-shrink-0">
                <ExternalLink className="w-3 h-3" />Open
              </a>
            </div>
          )}
          <p className="text-xs text-gray-400">Paste a link from Google Drive, Dropbox, OneDrive, or any direct URL</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          <X className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}
    </div>
  )
}
