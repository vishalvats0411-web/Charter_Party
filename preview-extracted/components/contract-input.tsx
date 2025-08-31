"use client"

import { useId } from "react"
import { FileDropzone } from "./file-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type ContractInputs = {
  fixtureRecap: string
  baseContract: string
  recapFile?: File | null
  baseFile?: File | null
}

export function ContractInput({
  value,
  onChange,
}: {
  value: ContractInputs
  onChange: (next: ContractInputs) => void
}) {
  const recapId = useId()
  const baseId = useId()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1. Base Contract Template</CardTitle>
          <p className="text-xs text-muted-foreground">
            Provide the base contract as structured text (HTML) or upload a file.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor={baseId} className="sr-only">
              Base Contract Template
            </Label>
            <Textarea
              id={baseId}
              value={value.baseContract}
              onChange={(e) => onChange({ ...value, baseContract: e.target.value })}
              className="min-h-[220px] font-mono text-xs"
              placeholder={`<!DOCTYPE html>
<html>
  <head>
    <title>Base Charter Party Contract</title>
  </head>
  <body>
    <h1>Standard Charter Party Contract</h1>
    <section>
      <h2>1. Vessel Identification</h2>
      <p>This Charter Party Contract is entered into between the Owner, { '{Owner Name}' }, and the Charterer, { '{Charterer Name}' }, for the vessel named { '{Vessel Name}' }.</p>
    </section>
  </body>
</html>`}
            />
          </div>
          <FileDropzone id="base-upload" onFileSelected={(file) => onChange({ ...value, baseFile: file })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Fixture Recap</CardTitle>
          <p className="text-xs text-muted-foreground">Enter key commercial terms or upload a file.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor={recapId} className="sr-only">
              Fixture Recap
            </Label>
            <Textarea
              id={recapId}
              value={value.fixtureRecap}
              onChange={(e) => onChange({ ...value, fixtureRecap: e.target.value })}
              className="min-h-[160px] font-mono text-xs"
              placeholder={`Vessel: MV CORNET EXPLORER
Charterer: "Global Freight Logistics"
Owner: "Oceanic Carriers Inc."
Laycan: "2024-08-15 / 2024-08-18"
Load Port: "Port of Singapore"
Discharge Port: "Port of Rotterdam"
Freight Rate: "$25.00 per metric ton"`}
            />
          </div>
          <FileDropzone id="recap-upload" onFileSelected={(file) => onChange({ ...value, recapFile: file })} />
        </CardContent>
      </Card>
    </div>
  )
}
