# Support Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/support` page to the public site and rename the Footer "Contact" link to "Support" pointing to `/support`.

**Architecture:** Two changes — update Footer.tsx to rename the link, then create a static support page at `src/app/support/page.tsx` (server component) that imports a `"use client"` `EmailBox` component from `src/app/support/EmailBox.tsx`. The `EmailBox` handles clipboard copy and mailto link. No new dependencies.

**Tech Stack:** Next.js 16 App Router (server + client components), Tailwind CSS, `next/image`, existing `Navbar` and `Footer` components.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/components/landing/Footer.tsx` | Rename "Contact" → "Support", update href to `/support` |
| Create | `src/app/support/EmailBox.tsx` | Client component: email text + copy-to-clipboard button + mailto link button |
| Create | `src/app/support/page.tsx` | Server component: page shell — GIF, heading, subtext, imports `EmailBox` |

---

## Task 1: Update the Footer

**Files:**
- Modify: `src/components/landing/Footer.tsx:3-7` (FOOTER_HREFS and labels array)

No test framework is set up — verification is a production build.

- [ ] **Step 1: Update `FOOTER_HREFS` and the labels array in `src/components/landing/Footer.tsx`**

Current state (lines 3–7):
```tsx
const FOOTER_HREFS: Record<string, string> = {
  Privacy: "/privacy",
  Terms: "/terms",
  Contact: "#",
}
```

And line 67:
```tsx
{["Privacy", "Terms", "Contact"].map((label, i) => (
```

Replace with:
```tsx
const FOOTER_HREFS: Record<string, string> = {
  Privacy: "/privacy",
  Terms: "/terms",
  Support: "/support",
}
```

And:
```tsx
{["Privacy", "Terms", "Support"].map((label, i) => (
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/Footer.tsx
```

```bash
git commit -m "feat: rename footer Contact link to Support, route to /support"
```

---

## Task 2: Create the EmailBox client component

**Files:**
- Create: `src/app/support/EmailBox.tsx`

This is a `"use client"` component. It must live in its own file so that `page.tsx` can remain a server component and export `metadata`.

- [ ] **Step 1: Create `src/app/support/EmailBox.tsx`**

```tsx
"use client"

import { useState } from "react"

export function EmailBox() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText("support@birdbot.ai")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-panel px-4 py-3 w-full">
      <span className="text-sm font-sans text-text-base">support@birdbot.ai</span>
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy email address"}
          className="text-text-dim hover:text-text-base transition-colors"
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
          className="text-text-dim hover:text-text-base transition-colors"
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
```

- [ ] **Step 2: Verify the file was created**

```bash
ls birdbot-cloud/src/app/support/EmailBox.tsx
```

Expected: file path printed with no error.

- [ ] **Step 3: Commit**

```bash
git add src/app/support/EmailBox.tsx
```

```bash
git commit -m "feat: add EmailBox client component for support page"
```

---

## Task 3: Create the Support page

**Files:**
- Create: `src/app/support/page.tsx`

This is a server component. It imports `EmailBox` from `./EmailBox` and renders the full page layout.

- [ ] **Step 1: Create `src/app/support/page.tsx`**

```tsx
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import Image from "next/image"
import type { Metadata } from "next"
import { EmailBox } from "./EmailBox"

export const metadata: Metadata = {
  title: "Support — BirdBot.ai",
  description: "Get support from the BirdBot.ai team.",
}

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center">
          {/* Illustration */}
          <Image
            src="/download (1).gif"
            alt="Support illustration"
            width={200}
            height={200}
            unoptimized
            style={{ height: "auto", width: "200px" }}
          />

          {/* Heading + subtext */}
          <div className="flex flex-col gap-2">
            <h1
              className="font-heading font-bold text-text-base"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.25rem)" }}
            >
              Get Support
            </h1>
            <p className="text-sm font-sans text-text-dim leading-relaxed">
              Have a question or ran into an issue? Drop us a line and we&apos;ll
              get back to you.
            </p>
          </div>

          {/* Email box */}
          <EmailBox />
        </div>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls birdbot-cloud/src/app/support/page.tsx
```

Expected: file path printed with no error.

- [ ] **Step 3: Commit**

```bash
git add src/app/support/page.tsx
```

```bash
git commit -m "feat: add Support page at /support"
```

---

## Task 4: Build verification

- [ ] **Step 1: Run the production build**

```bash
cd birdbot-cloud && npm run build
```

Expected: build completes with no TypeScript errors. Output includes:

```
├ ○ /support                             X kB          X kB
```

No TypeScript errors. No missing module errors.
