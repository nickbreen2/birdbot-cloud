import { describe, it, expect, beforeAll } from "vitest"

beforeAll(() => {
  // 32 bytes of 'a' encoded as base64 — a valid test key
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64")
})

import { encrypt, decrypt } from "@/lib/tokenEncryption"

describe("encrypt / decrypt", () => {
  it("round-trips an access token", () => {
    const token = "ya29.a0AfH6SMBxyz_someRealLookingToken"
    expect(decrypt(encrypt(token))).toBe(token)
  })

  it("round-trips a refresh token", () => {
    const token = "1//0gBxyz_someRealLookingRefreshToken"
    expect(decrypt(encrypt(token))).toBe(token)
  })

  it("produces output starting with v1:", () => {
    expect(encrypt("test")).toMatch(/^v1:/)
  })

  it("produces 4 colon-separated parts (v1:iv:authTag:ciphertext)", () => {
    const parts = encrypt("test").split(":")
    expect(parts).toHaveLength(4)
    expect(parts[0]).toBe("v1")
  })

  it("produces a different ciphertext each call (random IV)", () => {
    const a = encrypt("same-input")
    const b = encrypt("same-input")
    expect(a).not.toBe(b)
    // Both still decrypt correctly
    expect(decrypt(a)).toBe("same-input")
    expect(decrypt(b)).toBe("same-input")
  })

  it("throws on plaintext that is not versioned ciphertext", () => {
    expect(() => decrypt("plain-token-value")).toThrow("Invalid ciphertext format")
  })

  it("throws on unsupported version prefix", () => {
    const valid = encrypt("test")
    const v2 = valid.replace(/^v1:/, "v2:")
    expect(() => decrypt(v2)).toThrow("Unsupported encryption version: v2")
  })

  it("throws when GOOGLE_TOKEN_ENCRYPTION_KEY is not set", () => {
    const saved = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    expect(() => encrypt("test")).toThrow("GOOGLE_TOKEN_ENCRYPTION_KEY is not set")
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = saved
  })

  it("throws when key is not 32 bytes", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.from("tooshort").toString("base64")
    expect(() => encrypt("test")).toThrow("must be 32 bytes")
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64")
  })
})
