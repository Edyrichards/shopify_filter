// Enhanced security utilities
import * as crypto from "crypto"

export function validateHmacSignature(payload: string, signature: string, secret: string): boolean {
  const computedSignature = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64")

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
}

export function encryptSensitiveData(data: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey, "hex"), iv)

  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")

  return iv.toString("hex") + ":" + encrypted
}

export function decryptSensitiveData(encryptedData: string, encryptionKey: string): string {
  const [ivHex, encryptedHex] = encryptedData.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey, "hex"), iv)

  let decrypted = decipher.update(encryptedHex, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // In production, use bcrypt or argon2
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err)
      resolve(salt + ":" + derivedKey.toString("hex"))
    })
  })
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":")
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err)
      resolve(key === derivedKey.toString("hex"))
    })
  })
}
