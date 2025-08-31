import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const base = form.get("baseCP")
    const recap = form.get("recap")

    if (!(base instanceof File) || !(recap instanceof File)) {
      return Response.json({ success: false, error: "Both Base CP and Recap files are required" }, { status: 400 })
    }

    // Basic file type guard
    const allowed = ["pdf", "docx"]
    const isAllowed = (f: File) => {
      const ext = f.name.split(".").pop()?.toLowerCase()
      return ext && allowed.includes(ext)
    }

    if (!isAllowed(base) || !isAllowed(recap)) {
      return Response.json({ success: false, error: "Only DOCX and PDF files are allowed" }, { status: 400 })
    }

    // Create a pseudo session id
    const sessionId = Math.random().toString(36).slice(2, 10)
    const filename = `Final_Working_CP_${sessionId}.docx`
    const download_url = `/api/download/${filename}`

    // Provide sample "changes" similar to the original demo
    const changes = [
      { old_text: "Freight rate: $15,000 per day", new_text: "Freight rate: $16,500 per day" },
      { old_text: "Laycan: 15-20 October 2023", new_text: "Laycan: 18-23 October 2023" },
      { old_text: "Loading port: Rotterdam", new_text: "Loading port: Rotterdam, Netherlands" },
      { old_text: "", new_text: "Demurrage rate: $25,000 per day, pro rata" },
      { old_text: "Dispatch rate: $12,000 per day", new_text: "" },
    ]

    return Response.json({ success: true, download_url, filename, changes })
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Server error" }, { status: 500 })
  }
}
