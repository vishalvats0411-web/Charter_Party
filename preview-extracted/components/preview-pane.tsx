"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function PreviewPane({
  html,
  className,
}: {
  html?: string
  className?: string
}) {
  const hasContent = !!html?.trim()

  return (
    <Card
      className={cn("relative flex min-h-[420px] w-full items-center justify-center border border-dashed", className)}
    >
      {hasContent ? (
        <div className="prose prose-invert max-w-none p-6 text-sm">
          {/* Render sanitized HTML if you wire it up later */}
          <div dangerouslySetInnerHTML={{ __html: html! }} />
        </div>
      ) : (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Image
              src="/images/reference-ui.png"
              alt="Reference layout: input on the left, preview on the right"
              width={36}
              height={36}
              className="opacity-80"
            />
          </div>
          <div className="text-base font-medium">Your Contract Appears Here</div>
          <p className="text-sm text-muted-foreground">
            Fill in the fixture recap and base contract on the left, then click “Generate Contract” to create your
            merged contract.
          </p>
        </div>
      )}
    </Card>
  )
}
