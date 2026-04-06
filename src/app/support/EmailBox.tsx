"use client"

import { useState } from "react"

export function EmailBox() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText("support@birdbot.ai")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable or permission denied — stay silent
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-panel px-4 py-3 w-full">
      <span className="text-sm font-sans text-text-base">support@birdbot.ai</span>
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy email address"}
          className="cursor-pointer text-text-dim hover:text-text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-bright/50 rounded"
        >
          {copied ? (
            /* Checkmark icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            /* Clipboard icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        {/* Open mail button */}
        <a
          href="mailto:support@birdbot.ai"
          aria-label="Open email client"
          className="cursor-pointer text-text-dim hover:text-text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-bright/50 rounded"
        >
          {/* External link icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  )
}
