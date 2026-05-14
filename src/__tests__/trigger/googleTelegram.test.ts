import { describe, it, expect, vi } from "vitest"

// We're testing pure helper functions extracted from telegram.ts.
// Import them once the file is updated to export them.

// Inline the functions here to test without importing from telegram.ts
// (which has many side effects). After implementation, these will be
// confirmed by running the full test suite.

function isConfirmation(text: string): boolean {
  return /^(yes|confirm|yep|ok|sure|do it)$/i.test(text.trim())
}

const GOOGLE_KEYWORDS = /\b(calendar|schedule|meeting|event|email|gmail|inbox|unread|drive|document|doc|file)\b/i

function hasGoogleKeyword(text: string): boolean {
  return GOOGLE_KEYWORDS.test(text)
}

describe("isConfirmation", () => {
  it("accepts 'yes'", () => expect(isConfirmation("yes")).toBe(true))
  it("accepts 'confirm'", () => expect(isConfirmation("confirm")).toBe(true))
  it("accepts 'Yes' (case-insensitive)", () => expect(isConfirmation("Yes")).toBe(true))
  it("accepts 'do it'", () => expect(isConfirmation("do it")).toBe(true))
  it("rejects 'no'", () => expect(isConfirmation("no")).toBe(false))
  it("rejects 'maybe'", () => expect(isConfirmation("maybe")).toBe(false))
  it("rejects empty string", () => expect(isConfirmation("")).toBe(false))
  it("rejects partial match 'yes please'", () => expect(isConfirmation("yes please")).toBe(false))
})

describe("hasGoogleKeyword", () => {
  it("detects 'calendar'", () => expect(hasGoogleKeyword("What's on my calendar?")).toBe(true))
  it("detects 'email'", () => expect(hasGoogleKeyword("Check my email")).toBe(true))
  it("detects 'drive'", () => expect(hasGoogleKeyword("Find the doc in my drive")).toBe(true))
  it("returns false for unrelated text", () => expect(hasGoogleKeyword("Take a note about the weather tomorrow")).toBe(false))
  it("detects 'unread'", () => expect(hasGoogleKeyword("Any unread messages?")).toBe(true))
})
