// ============================================================
// ANKU — FileUploader
// ============================================================

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
}

interface FileUploaderProps {
  onUpload: (file: File) => Promise<string>
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  maxFiles?: number
  accept?: string
  maxSizeMB?: number
  label?: string
  hint?: string
}

export default function FileUploader({
  onUpload,
  files,
  onChange,
  maxFiles = 5,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeMB = 10,
  label,
  hint,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const validateFile = (file: File): string | null => {
    if (files.length >= maxFiles) return `Maximum ${maxFiles} fichiers`
    if (file.size > maxSizeMB * 1024 * 1024) return `Fichier trop lourd (max ${maxSizeMB} MB)`
    const allowed = accept.split(',').map((t) => t.trim())
    if (!allowed.includes(file.type)) return 'Format non supporté'
    return null
  }

  const handleFile = async (file: File) => {
    setError('')
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    try {
      const url = await onUpload(file)
      onChange([...files, { url, name: file.name, size: file.size, type: file.type }])
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }
  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-xs font-medium mb-1.5"
          style={{
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`w-full p-4 rounded-2xl border-2 border-dashed transition cursor-pointer
          ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/20'
              : 'border-white/30 hover:border-white/60 bg-black/40'
          }
          ${isUploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3 text-center">
          {isUploading ? (
            <>
              <Loader size={18} className="text-emerald-400 animate-spin" />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Upload en cours...
              </span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-emerald-400" />
              <div className="text-left">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  Clique ou dépose un fichier
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  PDF, JPG, PNG · max {maxSizeMB} MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {hint && (
        <p
          className="text-[10px] mt-1 ml-1"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {hint}
        </p>
      )}

      {error && (
        <div
          className="flex items-center gap-1.5 text-[11px] mt-2 ml-1"
          style={{ color: '#fca5a5' }}
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-white/20"
            >
              {f.type.startsWith('image/') ? (
                <img src={f.url} alt={f.name} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center">
                  <FileText size={14} className="text-emerald-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: '#ffffff' }}
                >
                  {f.name}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatSize(f.size)}
                </p>
              </div>
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(i)
                }}
                className="w-6 h-6 rounded-full hover:bg-red-500/30 flex items-center justify-center transition shrink-0"
              >
                <X size={12} className="text-red-300" />
              </button>
            </div>
          ))}
          <p
            className="text-[10px] text-center"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {files.length} / {maxFiles} document(s)
          </p>
        </div>
      )}
    </div>
  )
}
