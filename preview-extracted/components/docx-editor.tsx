"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type ChangeItem = { old_text: string; new_text: string }

type DocxEditorProps = {
  sourceUrl: string
  filename?: string
  onClose: () => void
}

type ViewMode = "side-by-side" | "toggle"

export default function DocxEditor({ sourceUrl, filename = "Edited_CP.docx", onClose }: DocxEditorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mammoth produces HTML, we store original (read-only) and an editable variant
  const [originalHTML, setOriginalHTML] = useState<string>("")
  const [editableHTML, setEditableHTML] = useState<string>("")

  // Change tracking
  const originalTextById = useRef<Map<string, string>>(new Map())
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())
  const [changes, setChanges] = useState<ChangeItem[]>([])

  // UI mode
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side")
  const [saved, setSaved] = useState(false)

  const editableContainerRef = useRef<HTMLDivElement | null>(null)
  const originalContainerRef = useRef<HTMLDivElement | null>(null)

  // Fetch the DOCX and convert to HTML with Mammoth on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { default: DOMPurify } = await import("dompurify")
        const mammothApi: any = await loadMammoth()

        const res = await fetch(sourceUrl)
        if (!res.ok) throw new Error(`Failed to fetch DOCX (${res.status})`)
        const blob = await res.blob()
        const arrayBuffer = await blob.arrayBuffer()

        const { value: html } = await mammothApi.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              // preserve basic structure
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Normal'] => p:fresh",
            ],
          },
        )

        if (cancelled) return

        const cleanHTML = DOMPurify.sanitize(html, { WHOLE_DOCUMENT: false })
        const prepared = prepareEditableHTML(cleanHTML)

        setOriginalHTML(cleanHTML)
        setEditableHTML(prepared.html)
        originalTextById.current = prepared.textMap
        setLoading(false)
      } catch (err: any) {
        console.error("[v0] Mammoth load error:", err)
        setError(err?.message || "Failed to load document")
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sourceUrl])

  // Build change summary whenever modifiedIds or editableHTML changes
  useEffect(() => {
    if (!editableContainerRef.current) return
    const list: ChangeItem[] = []
    for (const id of modifiedIds) {
      const node = editableContainerRef.current.querySelector<HTMLElement>(`[data-section-id="${id}"]`)
      if (!node) continue
      const newText = getNodeText(node)
      const oldText = originalTextById.current.get(id) || ""
      list.push({ old_text: oldText, new_text: newText })
    }
    setChanges(list)
  }, [modifiedIds, editableHTML])

  // Event delegation to detect edits
  useEffect(() => {
    const container = editableContainerRef.current
    if (!container) return

    function onInput(e: Event) {
      const target = e.target as HTMLElement
      const block = target.closest<HTMLElement>("[data-section-id]")
      if (!block) return
      const id = block.getAttribute("data-section-id")!
      const oldText = (originalTextById.current.get(id) || "").trim()
      const newText = getNodeText(block).trim()

      const next = new Set(modifiedIds)
      if (oldText !== newText) {
        next.add(id)
        block.classList.add("border-l-4", "border-amber-500", "bg-amber-50")
      } else {
        next.delete(id)
        block.classList.remove("border-l-4", "border-amber-500", "bg-amber-50")
      }
      setModifiedIds(next)
      setSaved(false)
    }

    container.addEventListener("input", onInput, { capture: true })
    return () => {
      container.removeEventListener("input", onInput, { capture: true })
    }
  }, [modifiedIds])

  async function handleSaveEdits() {
    setSaved(true)
  }

  async function handleDownloadEdited() {
    try {
      setError(null)
      const container = editableContainerRef.current
      if (!container) throw new Error("Nothing to export")

      // Create a clean HTML without visual indicators
      const cloned = container.cloneNode(true) as HTMLElement
      cloned.querySelectorAll("[data-section-id]").forEach((el) => {
        el.classList.remove("border-l-4", "border-amber-500", "bg-amber-50")
        el.removeAttribute("contenteditable")
        el.removeAttribute("role")
        el.removeAttribute("aria-label")
        el.removeAttribute("spellcheck")
      })

      const html = wrapAsHtmlDocument(cloned.innerHTML)

      // Lazy import exporter
      const { default: HTMLtoDOCX } = await import("html-docx-js/dist/html-docx")
      const blob = await HTMLtoDOCX.asBlob(html)
      downloadBlob(blob, filename)
    } catch (err: any) {
      console.error("[v0] Export error:", err)
      setError(err?.message || "Failed to export edited DOCX")
    }
  }

  function handleDiscardEdits() {
    // Reset edited HTML back to original structure with IDs
    const prepared = prepareEditableHTML(originalHTML)
    setEditableHTML(prepared.html)
    originalTextById.current = prepared.textMap
    setModifiedIds(new Set())
    setSaved(false)
  }

  const changesSummary = useMemo(() => {
    let added = 0
    let removed = 0
    for (const c of changes) {
      const hasOld = c.old_text.trim().length > 0
      const hasNew = c.new_text.trim().length > 0
      if (hasOld && hasNew) {
        added++
        removed++
      } else if (hasOld) {
        removed++
      } else if (hasNew) {
        added++
      }
    }
    return { count: changes.length, added, removed }
  }, [changes])

  return (
    <section className="mt-6 rounded-xl border bg-card">
      <header className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-pretty">Edit Charter Party Before Download</h3>
          <p className="text-sm text-muted-foreground">
            Make changes directly in the document. Modified sections are highlighted.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">
            View:
            <select
              className="ml-2 rounded-md border px-2 py-1 text-sm"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              aria-label="View mode"
            >
              <option value="side-by-side">Side by side</option>
              <option value="toggle">Toggle original/edited</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleSaveEdits}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
          >
            Save edits
          </button>
          <button
            type="button"
            onClick={handleDiscardEdits}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
          >
            Discard edits
          </button>
          <button
            type="button"
            onClick={handleDownloadEdited}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Download edited DOCX
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-background"
          >
            Close Editor
          </button>
        </div>
      </header>

      <div className="grid gap-0 p-4 md:grid-cols-2">
        {/* Original */}
        <div
          className={cn(
            "rounded-md border bg-muted/30 p-3 md:max-h-[70vh] md:overflow-auto",
            viewMode === "toggle" ? "hidden md:block" : "block",
          )}
          aria-label="Original document preview"
        >
          <div ref={originalContainerRef} className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: originalHTML || placeholderHTML(loading, error) }} />
          </div>
        </div>

        {/* Edited */}
        <div
          className={cn(
            "rounded-md border bg-card p-3 md:max-h-[70vh] md:overflow-auto",
            viewMode === "toggle" ? "md:col-span-2" : "block",
          )}
          aria-label="Editable document"
        >
          <div
            ref={editableContainerRef}
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: editableHTML || placeholderHTML(loading, error) }}
          />
        </div>
      </div>

      <footer className="border-t p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="font-medium">
              {changesSummary.count} section(s) modified • {changesSummary.added} additions • {changesSummary.removed}{" "}
              removals
            </div>
            <div className="text-muted-foreground">
              {saved ? "Edits saved in this session." : "You have unsaved edits."}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Tip: Click a paragraph to edit. Use Save edits before downloading.
          </div>
        </div>
      </footer>
    </section>
  )
}

/**
 * Prepare HTML for editing:
 * - Assign data-section-id to edit blocks
 * - Add contenteditable and accessibility attributes
 * - Collect original text content for change tracking
 */
function prepareEditableHTML(inputHTML: string): { html: string; textMap: Map<string, string> } {
  const doc = new DOMParser().parseFromString(inputHTML || "<div></div>", "text/html")
  const textMap = new Map<string, string>()
  let counter = 0

  // Editable blocks: headings, paragraphs, list items, table cells
  const selectors = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th"].join(",")
  const nodes = doc.body.querySelectorAll<HTMLElement>(selectors)
  nodes.forEach((node) => {
    const id = ++counter + ""
    node.setAttribute("data-section-id", id)
    node.setAttribute("contenteditable", "true")
    node.setAttribute("role", "textbox")
    node.setAttribute("aria-label", "Editable text block")
    node.setAttribute("spellcheck", "true")
    // baseline styles for visibility when edited
    node.classList.add("transition-colors")
    textMap.set(id, getNodeText(node))
  })

  return { html: doc.body.innerHTML, textMap }
}

function getNodeText(node: HTMLElement): string {
  // Get visible text, ignoring extra whitespace
  return (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim()
}

function wrapAsHtmlDocument(inner: string): string {
  // Minimal HTML wrapper to help html-docx-js preserve structure
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Edited Document</title>
    <style>
      body { font-family: Arial, sans-serif; }
      table, td, th { border: 1px solid #ccc; border-collapse: collapse; }
      td, th { padding: 4px; }
      h1,h2,h3,h4,h5,h6 { margin: 0.5em 0; }
      p, li { margin: 0.5em 0; }
    </style>
  </head>
  <body>
    ${inner}
  </body>
</html>`.trim()
}

function placeholderHTML(loading: boolean, error: string | null): string {
  if (loading) {
    return `<div class="text-sm text-muted-foreground">Loading document...</div>`
  }
  if (error) {
    return `<div class="text-sm text-red-600">Error: ${escapeHtml(error)}</div>`
  }
  return `<div class="text-sm text-muted-foreground">No content</div>`
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]!)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function resolveMammoth(mod: any): any {
  // Cases handled:
  // 1) ESM default export: mod.default.convertToHtml
  // 2) Named export: mod.mammoth.convertToHtml
  // 3) Direct export: mod.convertToHtml
  // 4) Global from side-effect: (globalThis as any).mammoth.convertToHtml
  const g: any = globalThis as any
  if (mod?.default?.convertToHtml) return mod.default
  if (mod?.mammoth?.convertToHtml) return mod.mammoth
  if (mod?.convertToHtml) return mod
  if (g?.mammoth?.convertToHtml) return g.mammoth
  throw new Error("Mammoth failed to load correctly. convertToHtml not found on module or global scope.")
}

async function loadMammoth(): Promise<any> {
  // Try common module entry points first
  try {
    // Try the browser build path
    // @ts-ignore - path may not have types
    const mod1 = await import("mammoth/mammoth.browser").catch(() => null as any)
    if (mod1) {
      const api = resolveMammoth(mod1)
      if (typeof api?.convertToHtml === "function") return api
    }
  } catch {
    // ignore
  }
  try {
    // Try package root
    const mod2 = await import("mammoth").catch(() => null as any)
    if (mod2) {
      const api = resolveMammoth(mod2)
      if (typeof api?.convertToHtml === "function") return api
    }
  } catch {
    // ignore
  }
  // Fallback: inject browser build from a CDN and use global window.mammoth
  await injectScriptOnce("https://cdn.jsdelivr.net/npm/mammoth/mammoth.browser.min.js", "mammoth-browser")
  const g: any = globalThis as any
  if (g?.mammoth?.convertToHtml) return g.mammoth
  // Try unpkg as a secondary CDN
  await injectScriptOnce("https://unpkg.com/mammoth/mammoth.browser.min.js", "mammoth-browser-unpkg")
  if (g?.mammoth?.convertToHtml) return g.mammoth
  throw new Error("Mammoth failed to load (convertToHtml unavailable after CDN fallback).")
}

function injectScriptOnce(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window to inject script"))
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      if ((existing as any)._loaded) return resolve()
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true })
      return
    }
    const s = document.createElement("script")
    s.id = id
    s.src = src
    s.async = true
    ;(s as any)._loaded = false
    s.onload = () => {
      ;(s as any)._loaded = true
      resolve()
    }
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(s)
  })
}
