"use client"

import { useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { UploadCloud } from "lucide-react"

type FileDropzoneProps = {
  id: string
  accept?: string
  label?: string
  hint?: string
  onFileSelected?: (file: File | null) => void
  className?: string
}

export function FileDropzone({
  id,
  accept = ".docx,.pdf,.txt",
  label = "Upload a file",
  hint = "(DOCX, PDF, TXT)",
  onFileSelected,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const openPicker = useCallback(() => {
    if (!inputRef.current) return
    // Allow selecting the same file twice by resetting the value first
    inputRef.current.value = ""
    inputRef.current.click()
  }, [])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files && files.length > 0 ? files[0] : null
      setFileName(file ? file.name : "")
      onFileSelected?.(file)
    },
    [onFileSelected],
  )

  return (
    <div className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} ${hint}`}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex items-center gap-3 rounded-md border border-dashed px-3 py-2 text-sm",
          isDragging ? "border-primary/60 bg-primary/5" : "border-muted-foreground/20",
          "cursor-pointer hover:border-primary/50 transition-colors",
        )}
      >
        <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">
          {label} <span className="opacity-70">{hint}</span>
        </span>
        {fileName ? (
          <span className="ml-auto truncate max-w-[50%]" aria-live="polite">
            {fileName}
          </span>
        ) : null}
      </div>

      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={
          accept ||
          ".docx,.pdf,.txt,.html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html"
        }
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.currentTarget.value = ""
        }}
      />
    </div>
  )
}
