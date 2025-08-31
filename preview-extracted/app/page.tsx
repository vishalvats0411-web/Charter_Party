"use client"

import type React from "react"
import { useMemo, useState, useRef, useCallback } from "react"
import DocxEditor from "@/components/docx-editor"

type ChangeItem = { old_text: string; new_text: string }

function bytesToKB(size: number) {
  return (size / 1024).toFixed(2)
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const shared = "flex flex-col items-center text-center gap-2 flex-1 relative"
  const circleBase = "w-12 h-12 rounded-full flex items-center justify-center border-2"
  const line = "absolute top-6 left-0 right-0 h-0.5 bg-muted-foreground/30 -z-10"
  return (
    <div className="relative w-full">
      <div className={line} />
      <div className="flex items-start justify-between gap-4">
        {[1, 2, 3].map((n) => {
          const active = step === n
          const completed = step > n
          return (
            <div key={n} className={shared} aria-current={active ? "step" : undefined}>
              <div
                className={[
                  circleBase,
                  active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : completed
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-background border-muted-foreground/60 text-muted-foreground",
                ].join(" ")}
              >
                <span className="font-semibold">{n}</span>
              </div>
              <div className="text-sm font-medium text-pretty">
                {n === 1 && "Upload Documents"}
                {n === 2 && "Processing"}
                {n === 3 && "Download Result"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileInput({
  id,
  label,
  hint,
  file,
  onChange,
  onClear,
}: {
  id: string
  label: string
  hint: string
  file?: File | null
  onChange: (f: File | null) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const acceptTypes = useMemo(
    () => [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".pdf",
      ".docx",
    ],
    [],
  )

  const pickFile = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.value = ""
    el.click()
  }, [])

  const handleInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const f = e.currentTarget.files?.[0] ?? null
      onChange(f || null)
      e.currentTarget.value = ""
    },
    [onChange],
  )

  const handleDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const dt = e.dataTransfer
      const f = dt?.files?.[0]
      if (!f) return
      const nameOk = /\.(pdf|docx)$/i.test(f.name)
      const typeOk =
        f.type === "application/pdf" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        f.type === ""
      if (nameOk || typeOk) {
        onChange(f)
      }
    },
    [onChange],
  )

  const handleDragOver = useCallback<React.DragEventHandler<HTMLDivElement>>((e) => {
    e.preventDefault()
  }, [])

  return (
    <div className="rounded-xl border bg-card p-4 md:p-6">
      <div className="mb-2">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${id}-hint`}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            pickFile()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="mt-2 block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center hover:border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <span className="sr-only">Upload icon</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="text-muted-foreground"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 16a1 1 0 0 0 1-1V9.41l1.3 1.3a1 1 0 0 0 1.4-1.42l-3-3a1 1 0 0 0-1.4 0l-3 3A1 1 0 0 0 9.3 10.7L10.6 9.4V15a1 1 0 0 0 1 1Zm7-1a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 14 0Z" />
          </svg>
        </div>
        <div id={`${id}-hint`} className="text-sm">
          <span className="font-medium text-blue-700">Click to upload</span> or drag and drop
        </div>
        <div className="text-xs text-muted-foreground">DOCX or PDF</div>
      </div>
      <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm" aria-live="polite">
        {file ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-muted-foreground">
                {file.name.split(".").pop()?.toUpperCase()} • {bytesToKB(file.size)} KB
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
              aria-label={`Remove ${label} file`}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-muted-foreground">No file selected</div>
        )}
      </div>
    </div>
  )
}

function ChangesList({ changes }: { changes: ChangeItem[] }) {
  const summary = useMemo(() => {
    let added = 0
    let removed = 0
    for (const ch of changes) {
      const hasOld = ch.old_text.trim().length > 0
      const hasNew = ch.new_text.trim().length > 0
      if (hasOld && hasNew) {
        added++
        removed++
      } else if (hasOld) {
        removed++
      } else if (hasNew) {
        added++
      }
    }
    return { added, removed }
  }, [changes])

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/40 p-4">
        <div className="font-medium">{changes.length} changes made to the document</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {summary.added} additions • {summary.removed} removals
        </div>
      </div>
      <div className="space-y-3">
        {changes.map((change, i) => (
          <div key={i} className="rounded-md border-l-4 border-blue-600 bg-card p-3">
            <div className="mb-2 text-sm font-medium">Change {i + 1}</div>
            {change.old_text.trim() ? (
              <div className="mb-2 rounded bg-red-50 p-2 text-sm">
                <span className="font-medium">Original: </span>
                <span>{change.old_text.length > 200 ? change.old_text.slice(0, 200) + "..." : change.old_text}</span>
              </div>
            ) : null}
            {change.new_text.trim() ? (
              <div className="rounded bg-emerald-50 p-2 text-sm">
                <span className="font-medium">Updated: </span>
                <span>{change.new_text.length > 200 ? change.new_text.slice(0, 200) + "..." : change.new_text}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniUpload({
  id,
  accept = ".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html",
  onPick,
  label = "Upload a file",
  hint = "(DOCX, PDF, TXT)",
}: {
  id: string
  accept?: string
  onPick: (file: File | null) => void
  label?: string
  hint?: string
}) {
  const ref = useRef<HTMLInputElement | null>(null)
  return (
    <div className="mt-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!ref.current) return
          ref.current.value = ""
          ref.current.click()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!ref.current) return
            ref.current.value = ""
            ref.current.click()
          }
        }}
        className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm hover:border-blue-600 hover:bg-blue-50"
      >
        <span className="text-muted-foreground">
          {label} <span className="opacity-70">{hint}</span>
        </span>
      </div>
      <input
        id={id}
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onPick(e.currentTarget.files?.[0] ?? null)
          e.currentTarget.value = ""
        }}
      />
    </div>
  )
}

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [baseFile, setBaseFile] = useState<File | null>(null)
  const [recapFile, setRecapFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadHref, setDownloadHref] = useState<string>("")
  const [downloadName, setDownloadName] = useState<string>("")
  const [changes, setChanges] = useState<ChangeItem[] | null>(null)
  const [showChanges, setShowChanges] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [fixtureRecapText, setFixtureRecapText] = useState<string>("")
  const [baseContractText, setBaseContractText] = useState<string>("")

  function resetAll() {
    setBaseFile(null)
    setRecapFile(null)
    setError(null)
    setLoading(false)
    setDownloadHref("")
    setDownloadName("")
    setChanges(null)
    setShowChanges(false)
    setShowEditor(false)
    setFixtureRecapText("")
    setBaseContractText("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)
      setStep(2)

      // create fallback files from text if uploads are missing
      let finalBaseFile = baseFile
      if (!finalBaseFile && baseContractText.trim()) {
        const blob = new Blob([baseContractText], {
          type: /<\s*html/i.test(baseContractText) ? "text/html" : "text/plain",
        })
        finalBaseFile = new File([blob], /<\s*html/i.test(baseContractText) ? "base.html" : "base.txt", {
          type: blob.type,
        })
      }

      let finalRecapFile = recapFile
      if (!finalRecapFile && fixtureRecapText.trim()) {
        const blob = new Blob([fixtureRecapText], { type: "text/plain" })
        finalRecapFile = new File([blob], "recap.txt", { type: "text/plain" })
      }

      if (!finalBaseFile || !finalRecapFile) {
        setLoading(false)
        setStep(1)
        setError("Please provide Base CP and Recap via file upload or text input.")
        return
      }

      const form = new FormData()
      form.append("baseCP", finalBaseFile)
      form.append("recap", finalRecapFile)

      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Upload failed")
      }

      setLoading(false)
      setStep(3)
      setDownloadHref(data.download_url)
      setDownloadName(data.filename)
      setChanges(Array.isArray(data.changes) ? data.changes : [])
    } catch (err: any) {
      setLoading(false)
      setStep(1)
      setError(err?.message || "Something went wrong")
    }
  }

  return (
    <main>
      <header className="bg-blue-700 text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="mb-4 text-sm font-semibold tracking-wide text-blue-100">Smart CP Generator</div>
          <h1 className="text-balance text-3xl font-semibold md:text-4xl">
            Transform Base CP + Recap into a finalized Charter Party in minutes
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-blue-100">
            Upload your Base Charter Party and Recap. We’ll process them and produce a working CP for download.
          </p>
          <div className="mt-6">
            <a
              href="#upload"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <Stepper step={step} />

        {error ? (
          <div role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Upload Section */}
        {step === 1 && (
          <form id="upload" onSubmit={handleSubmit} className="mt-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left column: inputs */}
              <div className="space-y-6">
                {/* 1. Base Contract Template */}
                <div className="rounded-xl border bg-card p-4 md:p-6">
                  <div className="mb-2">
                    <div className="text-sm font-medium">1. Base Contract Template</div>
                    <p className="text-sm text-muted-foreground">
                      Provide the base contract as structured text (HTML) or upload a file.
                    </p>
                  </div>
                  <textarea
                    value={baseContractText}
                    onChange={(e) => setBaseContractText(e.target.value)}
                    className="mt-2 w-full min-h-[220px] rounded-md border bg-background p-3 font-mono text-xs"
                    placeholder={`<!DOCTYPE html>
<html>
  <head><title>Base Charter Party Contract</title></head>
  <body>
    <h1>Standard Charter Party Contract</h1>
    <section>
      <h2>1. Vessel Identification</h2>
      <p>This Charter Party Contract is entered into between the Owner, { '{Owner Name}' }, and the Charterer, { '{Charterer Name}' }, for the vessel named { '{Vessel Name}' }.</p>
    </section>
  </body>
</html>`}
                  />
                  <MiniUpload id="base-upload" onPick={(f) => setBaseFile(f)} />
                  <div className="mt-2 rounded-md bg-muted/40 p-2 text-sm" aria-live="polite">
                    {baseFile ? (
                      <span className="text-muted-foreground">
                        Selected: <span className="font-medium text-foreground">{baseFile.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No file selected</span>
                    )}
                  </div>
                </div>

                {/* 2. Fixture Recap */}
                <div className="rounded-xl border bg-card p-4 md:p-6">
                  <div className="mb-2">
                    <div className="text-sm font-medium">2. Fixture Recap</div>
                    <p className="text-sm text-muted-foreground">Enter key commercial terms text or upload a file.</p>
                  </div>
                  <textarea
                    value={fixtureRecapText}
                    onChange={(e) => setFixtureRecapText(e.target.value)}
                    className="mt-2 w-full min-h-[140px] rounded-md border bg-background p-3 font-mono text-xs"
                    placeholder={`Vessel: MV CORNET EXPLORER
Charterer: "Global Freight Logistics"
Owner: "Oceanic Carriers Inc."
Laycan: "2024-08-15 / 2024-08-18"
Load Port: "Port of Singapore"
Discharge Port: "Port of Rotterdam"
Freight Rate: "$25.00 per metric ton"`}
                  />
                  <MiniUpload id="fixture-upload" onPick={(f) => setRecapFile(f)} />
                  <div className="mt-2 rounded-md bg-muted/40 p-2 text-sm" aria-live="polite">
                    {recapFile ? (
                      <span className="text-muted-foreground">
                        Selected: <span className="font-medium text-foreground">{recapFile.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No file selected</span>
                    )}
                  </div>
                </div>

                {/* Generate button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    ✨ Generate Contract
                  </button>
                  <div className="mt-2 text-xs text-muted-foreground">Max size 16MB each</div>
                </div>
              </div>

              {/* Right column: preview pane */}
              <div className="rounded-xl border border-dashed bg-card p-6">
                <div className="flex h-full min-h-[420px] items-center justify-center">
                  {baseContractText.trim() ? (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      {/</.test(baseContractText) ? (
                        <div dangerouslySetInnerHTML={{ __html: baseContractText }} />
                      ) : (
                        <pre className="whitespace-pre-wrap">{baseContractText}</pre>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-sm text-center">
                      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10" />
                      <div className="text-base font-medium">Your Contract Appears Here</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fill in the base contract and recap on the left, then click “Generate Contract”.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Loading */}
        {step === 2 && (
          <div className="mt-12 rounded-xl border bg-card p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <div className="text-lg font-medium">Processing your documents...</div>
            <div className="text-sm text-muted-foreground">This may take a minute.</div>
          </div>
        )}

        {/* Result */}
        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="text-xl font-semibold">Charter Party Generated Successfully!</div>
                  <div className="text-sm text-muted-foreground">
                    Your customized Charter Party is ready for download.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={downloadHref || "#"}
                    download
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowEditor(true)}
                    className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-background"
                    aria-disabled={!downloadHref}
                    disabled={!downloadHref}
                  >
                    Edit in Browser
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-muted/40 p-3 text-sm">
                <div className="font-medium">{downloadName || "Final_Working_CP_Generated_Clean.docx"}</div>
                <div className="text-muted-foreground">Generated just now • DOCX Format</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowChanges(true)}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
                >
                  View Changes
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
                >
                  Process Another
                </button>
                <span className="text-sm text-muted-foreground">
                  Review Recommended: Please review the generated document before finalizing.
                </span>
              </div>
            </div>

            {/* Changes Drawer/Section */}
            {showChanges && (
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">Document Changes</div>
                  <button
                    type="button"
                    onClick={() => setShowChanges(false)}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
                  >
                    Close
                  </button>
                </div>
                <ChangesList changes={changes || []} />
              </div>
            )}

            {/* Editor Section */}
            {showEditor && downloadHref ? (
              <DocxEditor
                sourceUrl={downloadHref}
                filename={downloadName || "Edited_CP.docx"}
                onClose={() => setShowEditor(false)}
              />
            ) : null}
          </div>
        )}

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-balance text-2xl font-semibold">How It Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">Three simple steps to generate your Charter Party</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-2 text-blue-600">1. Upload Documents</div>
              <p className="text-sm text-muted-foreground">
                Upload your Base Charter Party and Recap in DOCX or PDF format.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-2 text-blue-600">2. AI Processing</div>
              <p className="text-sm text-muted-foreground">
                We analyze both documents and map recap terms to the correct CP clauses.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-2 text-blue-600">3. Download & Review</div>
              <p className="text-sm text-muted-foreground">
                Download your customized Charter Party with tracked changes for review.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 bg-foreground text-background">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="text-lg font-semibold">Smart CP Generator</div>
          <div className="mt-2 text-sm text-muted bg-foreground/0 text-background/80">
            Your digital chartering assistant for faster, more accurate Charter Party generation.
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <a className="underline-offset-2 hover:underline" href="#">
              Terms of Service
            </a>
            <a className="underline-offset-2 hover:underline" href="#">
              Privacy Policy
            </a>
          </div>
          <div className="mt-6 text-sm text-background/60">© 2025 Smart CP Generator. All rights reserved.</div>
        </div>
      </footer>
    </main>
  )
}
