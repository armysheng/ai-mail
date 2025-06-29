import DatabaseService from "./database"
import { EncryptionService } from "./encryption"

export interface EmailAccountConfig {
  id?: string
  userId: string
  email: string
  displayName: string
  provider: string
  password?: string
  accessToken?: string
  refreshToken?: string
  settings: {
    imapServer: string
    imapPort: number
    imapSecurity: string
    smtpServer: string
    smtpPort: number
    smtpSecurity: string
    syncEnabled: boolean
    syncInterval: number
    maxHistory: number
  }
}

export interface EmailAccount {
  id: string
  userId: string
  email: string
  displayName: string
  provider: string
  status: string
  lastSyncAt: Date | null
  totalEmails: number
  unreadEmails: number
  settings: any
  createdAt: Date
  updatedAt: Date
}

export class EmailAccountService {
  private db: DatabaseService

  constructor() {
    this.db = DatabaseService.getInstance()
  }

  // 创建邮箱账户
  async createAccount(config: EmailAccountConfig): Promise<EmailAccount> {
    const query = `
      INSERT INTO email_accounts (
        user_id, email, display_name, provider,
        password_encrypted, access_token_encrypted, refresh_token_encrypted,
        imap_server, imap_port, imap_security,
        smtp_server, smtp_port, smtp_security,
        sync_enabled, sync_interval, max_history_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `

    const params = [
      config.userId,
      config.email,
      config.displayName,
      config.provider,
      config.password ? EncryptionService.encrypt(config.password) : null,
      config.accessToken ? EncryptionService.encrypt(config.accessToken) : null,
      config.refreshToken ? EncryptionService.encrypt(config.refreshToken) : null,
      config.settings.imapServer,
      config.settings.imapPort,
      config.settings.imapSecurity,
      config.settings.smtpServer,
      config.settings.smtpPort,
      config.settings.smtpSecurity,
      config.settings.syncEnabled,
      config.settings.syncInterval,
      config.settings.maxHistory,
    ]

    try {
      const result = await this.db.query(query, params)
      return this.mapRowToAccount(result.rows[0])
    } catch (error) {
      console.error("Create account error:", error)
      throw new Error("Failed to create email account")
    }
  }

  // 获取用户的所有邮箱账户
  async getUserAccounts(userId: string): Promise<EmailAccount[]> {
    const query = `
      SELECT * FROM email_accounts 
      WHERE user_id = $1 AND status != 'deleted'
      ORDER BY created_at ASC
    `

    try {
      const result = await this.db.query(query, [userId])
      return result.rows.map((row) => this.mapRowToAccount(row))
    } catch (error) {
      console.error("Get user accounts error:", error)
      throw new Error("Failed to get user accounts")
    }
  }

  // 根据ID获取账户
  async getAccountById(accountId: string): Promise<EmailAccount | null> {
    const query = `
      SELECT * FROM email_accounts 
      WHERE id = $1 AND status != 'deleted'
    `

    try {
      const result = await this.db.query(query, [accountId])
      if (result.rows.length === 0) {
        return null
      }
      return this.mapRowToAccount(result.rows[0])
    } catch (error) {
      console.error("Get account by ID error:", error)
      throw new Error("Failed to get account")
    }
  }

  // 根据邮箱地址查找账户
  async findByEmail(userId: string, email: string): Promise<EmailAccount | null> {
    const query = `
      SELECT * FROM email_accounts 
      WHERE user_id = $1 AND email = $2 AND status != 'deleted'
    `

    try {
      const result = await this.db.query(query, [userId, email])
      if (result.rows.length === 0) {
        return null
      }
      return this.mapRowToAccount(result.rows[0])
    } catch (error) {
      console.error("Find by email error:", error)
      throw new Error("Failed to find account by email")
    }
  }

  // 更新同步状态
  async updateSyncStatus(
    accountId: string,
    status: string,
    data?: {
      lastSyncAt?: Date
      newEmails?: number
      totalEmails?: number
      syncError?: string
    },
  ): Promise<void> {
    let query = `UPDATE email_accounts SET status = $1, updated_at = NOW()`
    const params = [status]
    let paramIndex = 2

    if (data?.lastSyncAt) {
      query += `, last_sync_at = $${paramIndex}`
      params.push(data.lastSyncAt)
      paramIndex++
    }

    if (data?.totalEmails !== undefined) {
      query += `, total_emails = $${paramIndex}`
      params.push(data.totalEmails)
      paramIndex++
    }

    if (data?.syncError) {
      query += `, sync_error = $${paramIndex}`
      params.push(data.syncError)
      paramIndex++
    } else if (status === "active") {
      query += `, sync_error = NULL`
    }

    // 设置下次同步时间
    if (status === "active") {
      query += `, next_sync_at = NOW() + INTERVAL '5 minutes'`
    }

    query += ` WHERE id = $${paramIndex}`
    params.push(accountId)

    try {
      await this.db.query(query, params)
    } catch (error) {
      console.error("Update sync status error:", error)
      throw new Error("Failed to update sync status")
    }
  }

  // 更新邮件统计
  async updateEmailStats(accountId: string, totalEmails: number, unreadEmails: number): Promise<void> {
    const query = `
      UPDATE email_accounts 
      SET total_emails = $1, unread_emails = $2, updated_at = NOW()
      WHERE id = $3
    `

    try {
      await this.db.query(query, [totalEmails, unreadEmails, accountId])
    } catch (error) {
      console.error("Update email stats error:", error)
      throw new Error("Failed to update email stats")
    }
  }

  // 更新访问令牌
  async updateTokens(accountId: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void> {
    let query = `
      UPDATE email_accounts 
      SET access_token_encrypted = $1, updated_at = NOW()
    `
    const params = [EncryptionService.encrypt(accessToken)]
    let paramIndex = 2

    if (refreshToken) {
      query += `, refresh_token_encrypted = $${paramIndex}`
      params.push(EncryptionService.encrypt(refreshToken))
      paramIndex++
    }

    if (expiresAt) {
      query += `, token_expires_at = $${paramIndex}`
      params.push(expiresAt)
      paramIndex++
    }

    query += ` WHERE id = $${paramIndex}`
    params.push(accountId)

    try {
      await this.db.query(query, params)
    } catch (error) {
      console.error("Update tokens error:", error)
      throw new Error("Failed to update tokens")
    }
  }

  // 删除账户
  async deleteAccount(accountId: string): Promise<void> {
    const query = `
      UPDATE email_accounts 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1
    `

    try {
      await this.db.query(query, [accountId])
    } catch (error) {
      console.error("Delete account error:", error)
      throw new Error("Failed to delete account")
    }
  }

  // 获取需要同步的账户
  async getAccountsForSync(): Promise<EmailAccount[]> {
    const query = `
      SELECT * FROM email_accounts 
      WHERE sync_enabled = TRUE 
        AND status = 'active'
        AND (next_sync_at IS NULL OR next_sync_at <= NOW())
      ORDER BY last_sync_at ASC NULLS FIRST
      LIMIT 10
    `

    try {
      const result = await this.db.query(query)
      return result.rows.map((row) => this.mapRowToAccount(row))
    } catch (error) {
      console.error("Get accounts for sync error:", error)
      throw new Error("Failed to get accounts for sync")
    }
  }

  // 获取解密后的认证信息
  async getDecryptedCredentials(accountId: string): Promise<{
    password?: string
    accessToken?: string
    refreshToken?: string
  }> {
    const query = `
      SELECT password_encrypted, access_token_encrypted, refresh_token_encrypted
      FROM email_accounts 
      WHERE id = $1
    `

    try {
      const result = await this.db.query(query, [accountId])
      if (result.rows.length === 0) {
        throw new Error("Account not found")
      }

      const row = result.rows[0]
      return {
        password: row.password_encrypted ? EncryptionService.decrypt(row.password_encrypted) : undefined,
        accessToken: row.access_token_encrypted ? EncryptionService.decrypt(row.access_token_encrypted) : undefined,
        refreshToken: row.refresh_token_encrypted ? EncryptionService.decrypt(row.refresh_token_encrypted) : undefined,
      }
    } catch (error) {
      console.error("Get decrypted credentials error:", error)
      throw new Error("Failed to get credentials")
    }
  }

  // 映射数据库行到账户对象
  private mapRowToAccount(row: any): EmailAccount {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      provider: row.provider,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      totalEmails: row.total_emails || 0,
      unreadEmails: row.unread_emails || 0,
      settings: {
        imapServer: row.imap_server,
        imapPort: row.imap_port,
        imapSecurity: row.imap_security,
        smtpServer: row.smtp_server,
        smtpPort: row.smtp_port,
        smtpSecurity: row.smtp_security,
        syncEnabled: row.sync_enabled,
        syncInterval: row.sync_interval,
        maxHistory: row.max_history_days,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
