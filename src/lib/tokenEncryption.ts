import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const CURRENT_VERSION = "v1"

function getKey(): Buffer {
  const b64 = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  if (!b64) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not set")
  const key = Buffer.from(b64, "base64")
  if (key.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes")
  return key
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${CURRENT_VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":")
  if (parts.length !== 4) throw new Error("Invalid ciphertext format")
  const [version, ivHex, authTagHex, encryptedHex] = parts
  if (version !== "v1") throw new Error(`Unsupported encryption version: ${version}`)
  const key = getKey()
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
