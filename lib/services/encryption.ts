import crypto from "crypto"

// 加密服务
export class EncryptionService {
  private static readonly ALGORITHM = "aes-256-gcm"
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required")
    }
    return crypto.scryptSync(key, "salt", EncryptionService.KEY_LENGTH)
  }

  // 加密文本
  public static encrypt(text: string): string {
    try {
      const key = this.getKey()
      const iv = crypto.randomBytes(this.IV_LENGTH)
      const cipher = crypto.createCipher(this.ALGORITHM, key)
      cipher.setAAD(Buffer.from("email-app", "utf8"))

      let encrypted = cipher.update(text, "utf8", "hex")
      encrypted += cipher.final("hex")

      const tag = cipher.getAuthTag()

      // 组合 IV + Tag + 加密数据
      return iv.toString("hex") + tag.toString("hex") + encrypted
    } catch (error) {
      console.error("Encryption error:", error)
      throw new Error("Failed to encrypt data")
    }
  }

  // 解密文本
  public static decrypt(encryptedData: string): string {
    try {
      const key = this.getKey()

      // 提取 IV, Tag 和加密数据
      const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), "hex")
      const tag = Buffer.from(encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), "hex")
      const encrypted = encryptedData.slice((this.IV_LENGTH + this.TAG_LENGTH) * 2)

      const decipher = crypto.createDecipher(this.ALGORITHM, key)
      decipher.setAAD(Buffer.from("email-app", "utf8"))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    } catch (error) {
      console.error("Decryption error:", error)
      throw new Error("Failed to decrypt data")
    }
  }

  // 生成随机密码
  public static generatePassword(length = 16): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  // 哈希密码
  public static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcrypt")
    return bcrypt.hash(password, 12)
  }

  // 验证密码
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import("bcrypt")
    return bcrypt.compare(password, hash)
  }
}
