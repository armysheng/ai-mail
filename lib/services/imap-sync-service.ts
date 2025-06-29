import { ImapFlow } from 'imapflow'

export interface IMAPConfig {
  email: string
  password: string
  imapServer: string
  imapPort: number
  imapSecurity: string
}

export interface SyncResult {
  success: boolean
  newEmails: number
  totalEmails: number
  errors: string[]
}

export class IMAPSyncService {
  private client: ImapFlow
  private config: IMAPConfig

  constructor(config: IMAPConfig) {
    this.config = config
    this.client = new ImapFlow({
      host: config.imapServer,
      port: config.imapPort,
      secure: config.imapSecurity === 'ssl',
      auth: {
        user: config.email,
        pass: config.password
      }
    })
  }

  async testConnection(): Promise<void> {
    try {
      await this.client.connect()
      await this.client.logout()
    } catch (error) {
      throw new Error(`IMAP connection failed: ${error.message}`)
    }
  }

  async syncEmails(accountId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      newEmails: 0,
      totalEmails: 0,
      errors: []
    }

    try {
      await this.client.connect()
      
      // 选择收件箱
      const lock = await this.client.getMailboxLock('INBOX')
      
      try {
        // 获取邮件数量
        const mailboxInfo = await this.client.status('INBOX', { messages: true })
        result.totalEmails = mailboxInfo.messages || 0
        
        // 搜索最近的邮件
        const searchCriteria = {
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
        }
        
        const messageIds = await this.client.search(searchCriteria)
        
        // 批量获取邮件
        let newEmailCount = 0
        for (const id of messageIds.slice(0, 50)) { // 限制每次同步50封
          try {
            const message = await this.client.fetchOne(id, {
              envelope: true,
              bodyStructure: true,
              source: true
            })
            
            // 这里应该保存邮件到数据库
            // await this.saveEmailToDatabase(accountId, message)
            newEmailCount++
          } catch (error) {
            result.errors.push(`Failed to fetch message ${id}: ${error.message}`)
          }
        }
        
        result.newEmails = newEmailCount
        result.success = true
        
      } finally {
        lock.release()
      }
      
    } catch (error) {
      result.errors.push(`Sync failed: ${error.message}`)
    } finally {
      try {
        await this.client.logout()
      } catch (error) {
        // Ignore logout errors
      }
    }

    return result
  }
}