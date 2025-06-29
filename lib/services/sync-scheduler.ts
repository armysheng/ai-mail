import { EmailAccountService } from "./email-account-service"
import { IMAPSyncService } from "./imap-sync-service"
import { GmailSyncService } from "./gmail-sync-service"
import { DatabaseService } from "./database-service" // Import DatabaseService

export class SyncScheduler {
  private accountService: EmailAccountService
  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    this.accountService = new EmailAccountService()
  }

  // 启动同步调度器
  start(): void {
    if (this.isRunning) {
      console.log("Sync scheduler is already running")
      return
    }

    this.isRunning = true
    console.log("Starting sync scheduler...")

    // 立即执行一次同步
    this.runSyncCycle()

    // 设置定时同步 (每分钟检查一次)
    this.syncInterval = setInterval(() => {
      this.runSyncCycle()
    }, 60 * 1000)
  }

  // 停止同步调度器
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    console.log("Stopping sync scheduler...")

    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // 执行同步周期
  private async runSyncCycle(): Promise<void> {
    try {
      console.log("Running sync cycle...")

      // 获取需要同步的账户
      const accounts = await this.accountService.getAccountsForSync()
      console.log(`Found ${accounts.length} accounts to sync`)

      // 并发同步多个账户 (限制并发数)
      const concurrency = 3
      for (let i = 0; i < accounts.length; i += concurrency) {
        const batch = accounts.slice(i, i + concurrency)
        const promises = batch.map((account) => this.syncAccount(account.id))
        await Promise.allSettled(promises)
      }

      console.log("Sync cycle completed")
    } catch (error) {
      console.error("Sync cycle error:", error)
    }
  }

  // 同步单个账户
  private async syncAccount(accountId: string): Promise<void> {
    try {
      console.log(`Starting sync for account ${accountId}`)

      // 更新同步状态
      await this.accountService.updateSyncStatus(accountId, "syncing")

      // 获取账户信息
      const account = await this.accountService.getAccountById(accountId)
      if (!account) {
        throw new Error("Account not found")
      }

      // 获取解密的认证信息
      const credentials = await this.accountService.getDecryptedCredentials(accountId)

      let syncService
      let result

      if (account.provider === "gmail") {
        // Gmail同步
        if (!credentials.accessToken) {
          throw new Error("Gmail access token not found")
        }
        syncService = new GmailSyncService(credentials.accessToken)
        result = await syncService.syncEmails(accountId)
      } else {
        // IMAP同步
        if (!credentials.password) {
          throw new Error("IMAP password not found")
        }

        const imapConfig = {
          email: account.email,
          password: credentials.password,
          imapServer: account.settings.imapServer,
          imapPort: account.settings.imapPort,
          imapSecurity: account.settings.imapSecurity,
        }

        syncService = new IMAPSyncService(imapConfig)
        result = await syncService.syncEmails(accountId)
      }

      if (result.success) {
        // 同步成功
        await this.accountService.updateSyncStatus(accountId, "active", {
          lastSyncAt: new Date(),
          totalEmails: result.totalEmails,
        })

        // 更新邮件统计
        await this.updateEmailCounts(accountId)

        console.log(`Sync completed for account ${accountId}: ${result.newEmails} new emails`)
      } else {
        // 同步失败
        const errorMessage = result.errors.join("; ")
        await this.accountService.updateSyncStatus(accountId, "error", {
          syncError: errorMessage,
        })
        console.error(`Sync failed for account ${accountId}: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Sync error for account ${accountId}:`, error)
      await this.accountService.updateSyncStatus(accountId, "error", {
        syncError: error.message,
      })
    }
  }

  // 更新邮件统计
  private async updateEmailCounts(accountId: string): Promise<void> {
    try {
      const db = DatabaseService.getInstance()

      // 统计总邮件数和未读邮件数
      const query = `
        SELECT 
          COUNT(*) as total_emails,
          COUNT(*) FILTER (WHERE is_read = FALSE) as unread_emails
        FROM emails 
        WHERE account_id = $1 AND is_deleted = FALSE
      `

      const result = await db.query(query, [accountId])
      const stats = result.rows[0]

      await this.accountService.updateEmailStats(
        accountId,
        Number.parseInt(stats.total_emails),
        Number.parseInt(stats.unread_emails),
      )
    } catch (error) {
      console.error("Update email counts error:", error)
    }
  }

  // 手动触发账户同步
  async triggerSync(accountId: string): Promise<void> {
    console.log(`Manual sync triggered for account ${accountId}`)
    await this.syncAccount(accountId)
  }

  // 获取同步状态
  getStatus(): { isRunning: boolean; lastRun?: Date } {
    return {
      isRunning: this.isRunning,
      // 可以添加更多状态信息
    }
  }
}

// 全局同步调度器实例
let globalScheduler: SyncScheduler | null = null

export function getGlobalScheduler(): SyncScheduler {
  if (!globalScheduler) {
    globalScheduler = new SyncScheduler()
  }
  return globalScheduler
}
