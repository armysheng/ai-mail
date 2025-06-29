import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"
import DatabaseService from "./database"
import { EmailAccountService } from "./email-account-service"

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
  updatedEmails: number
  totalEmails: number
  errors: string[]
}

export class IMAPSyncService {
  private client: ImapFlow
  private config: IMAPConfig
  private db: DatabaseService
  private accountService: EmailAccountService

  constructor(config: IMAPConfig) {
    this.config = config
    this.db = DatabaseService.getInstance()
    this.accountService = new EmailAccountService()

    this.client = new ImapFlow({
      host: config.imapServer,
      port: config.imapPort,
      secure: config.imapSecurity === "ssl",
      auth: {
        user: config.email,
        pass: config.password,
      },
      logger: false, // 生产环境关闭日志
    })
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.client.connect()
      await this.client.logout()
      return true
    } catch (error) {
      console.error("IMAP connection test failed:", error)
      throw error
    }
  }

  // 同步邮件
  async syncEmails(accountId: string, folderName = "INBOX"): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      newEmails: 0,
      updatedEmails: 0,
      totalEmails: 0,
      errors: [],
    }

    try {
      // 连接到IMAP服务器
      await this.client.connect()
      console.log(`Connected to IMAP server for ${this.config.email}`)

      // 选择文件夹
      const lock = await this.client.getMailboxLock(folderName)

      try {
        // 获取文件夹信息
        const mailbox = this.client.mailbox
        result.totalEmails = mailbox?.exists || 0

        console.log(`Mailbox ${folderName} has ${result.totalEmails} messages`)

        // 获取最后同步的UID
        const lastUid = await this.getLastSyncUid(accountId, folderName)
        console.log(`Last synced UID: ${lastUid}`)

        // 搜索新邮件
        let searchCriteria: any = {}
        if (lastUid > 0) {
          searchCriteria = { uid: `${lastUid + 1}:*` }
        } else {
          // 首次同步，只获取最近30天的邮件
          const since = new Date()
          since.setDate(since.getDate() - 30)
          searchCriteria = { since }
        }

        const messageUids = await this.client.search(searchCriteria)
        console.log(`Found ${messageUids.length} messages to sync`)

        if (messageUids.length === 0) {
          result.success = true
          return result
        }

        // 批量处理邮件
        const batchSize = 10
        for (let i = 0; i < messageUids.length; i += batchSize) {
          const batch = messageUids.slice(i, i + batchSize)
          await this.processBatch(accountId, batch, result)
        }

        // 更新最后同步的UID
        if (messageUids.length > 0) {
          const maxUid = Math.max(...messageUids)
          await this.updateLastSyncUid(accountId, folderName, maxUid)
        }

        result.success = true
        console.log(`Sync completed: ${result.newEmails} new, ${result.updatedEmails} updated`)
      } finally {
        lock.release()
      }
    } catch (error) {
      console.error("IMAP sync error:", error)
      result.errors.push(error.message)
    } finally {
      try {
        await this.client.logout()
      } catch (error) {
        console.error("IMAP logout error:", error)
      }
    }

    return result
  }

  // 处理邮件批次
  private async processBatch(accountId: string, uids: number[], result: SyncResult): Promise<void> {
    for (const uid of uids) {
      try {
        // 获取邮件
        const message = await this.client.fetchOne(uid, {
          envelope: true,
          bodyStructure: true,
          source: true,
          flags: true,
          uid: true,
        })

        // 解析邮件
        const parsedEmail = await this.parseEmail(message)

        // 检查邮件是否已存在
        const existingEmail = await this.findEmailByMessageId(accountId, parsedEmail.messageId)

        if (existingEmail) {
          // 更新邮件状态
          await this.updateEmailFlags(existingEmail.id, message.flags)
          result.updatedEmails++
        } else {
          // 保存新邮件
          await this.saveEmail(accountId, parsedEmail, message.flags, uid)
          result.newEmails++
        }
      } catch (error) {
        console.error(`Error processing message UID ${uid}:`, error)
        result.errors.push(`UID ${uid}: ${error.message}`)
      }
    }
  }

  // 解析邮件
  private async parseEmail(message: any): Promise<any> {
    try {
      // 使用mailparser解析邮件
      const parsed = await simpleParser(message.source)

      // 提取基本信息
      const email = {
        messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
        subject: parsed.subject || "(无主题)",
        sender: {
          name: parsed.from?.value?.[0]?.name || "",
          email: parsed.from?.value?.[0]?.address || "",
        },
        recipients: {
          to:
            parsed.to?.value?.map((addr) => ({
              name: addr.name || "",
              email: addr.address,
              type: "to",
            })) || [],
          cc:
            parsed.cc?.value?.map((addr) => ({
              name: addr.name || "",
              email: addr.address,
              type: "cc",
            })) || [],
          bcc:
            parsed.bcc?.value?.map((addr) => ({
              name: addr.name || "",
              email: addr.address,
              type: "bcc",
            })) || [],
        },
        content: {
          text: parsed.text || "",
          html: parsed.html || "",
        },
        attachments:
          parsed.attachments?.map((att) => ({
            filename: att.filename || "attachment",
            contentType: att.contentType,
            size: att.size || 0,
            contentId: att.cid,
            content: att.content,
          })) || [],
        date: parsed.date || new Date(),
        headers: parsed.headers,
      }

      return email
    } catch (error) {
      console.error("Email parsing error:", error)
      throw new Error("Failed to parse email")
    }
  }

  // 保存邮件到数据库
  private async saveEmail(accountId: string, email: any, flags: Set<string>, uid: number): Promise<string> {
    return this.db.transaction(async (client) => {
      // 插入邮件记录
      const emailQuery = `
        INSERT INTO emails (
          account_id, message_id, subject, sender_name, sender_email,
          content_text, content_html, preview, is_read, is_starred,
          received_at, sent_at, size_bytes, headers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `

      const preview = this.generatePreview(email.content.text || email.content.html)
      const isRead = flags.has("\\Seen")
      const isStarred = flags.has("\\Flagged")

      const emailParams = [
        accountId,
        email.messageId,
        email.subject,
        email.sender.name,
        email.sender.email,
        email.content.text,
        email.content.html,
        preview,
        isRead,
        isStarred,
        email.date,
        email.date, // 暂时使用相同的时间
        0, // 大小暂时设为0
        JSON.stringify(email.headers),
      ]

      const emailResult = await client.query(emailQuery, emailParams)
      const emailId = emailResult.rows[0].id

      // 插入收件人
      const allRecipients = [...email.recipients.to, ...email.recipients.cc, ...email.recipients.bcc]

      for (const recipient of allRecipients) {
        const recipientQuery = `
          INSERT INTO email_recipients (email_id, name, email, type)
          VALUES ($1, $2, $3, $4)
        `
        await client.query(recipientQuery, [emailId, recipient.name, recipient.email, recipient.type])
      }

      // 插入附件
      for (const attachment of email.attachments) {
        const attachmentQuery = `
          INSERT INTO email_attachments (
            email_id, filename, content_type, size_bytes, content_id
          ) VALUES ($1, $2, $3, $4, $5)
        `
        await client.query(attachmentQuery, [
          emailId,
          attachment.filename,
          attachment.contentType,
          attachment.size,
          attachment.contentId,
        ])
      }

      return emailId
    })
  }

  // 生成邮件预览
  private generatePreview(content: string): string {
    if (!content) return ""

    // 移除HTML标签
    const textContent = content.replace(/<[^>]*>/g, "")

    // 移除多余的空白字符
    const cleanText = textContent.replace(/\s+/g, " ").trim()

    // 截取前200个字符
    return cleanText.length > 200 ? cleanText.substring(0, 200) + "..." : cleanText
  }

  // 查找邮件
  private async findEmailByMessageId(accountId: string, messageId: string): Promise<any> {
    const query = `
      SELECT id FROM emails 
      WHERE account_id = $1 AND message_id = $2
    `
    const result = await this.db.query(query, [accountId, messageId])
    return result.rows[0] || null
  }

  // 更新邮件标志
  private async updateEmailFlags(emailId: string, flags: Set<string>): Promise<void> {
    const query = `
      UPDATE emails 
      SET is_read = $1, is_starred = $2, updated_at = NOW()
      WHERE id = $3
    `
    const isRead = flags.has("\\Seen")
    const isStarred = flags.has("\\Flagged")

    await this.db.query(query, [isRead, isStarred, emailId])
  }

  // 获取最后同步的UID
  private async getLastSyncUid(accountId: string, folder: string): Promise<number> {
    // 这里可以从数据库或缓存中获取最后同步的UID
    // 暂时返回0，表示从头开始同步
    return 0
  }

  // 更新最后同步的UID
  private async updateLastSyncUid(accountId: string, folder: string, uid: number): Promise<void> {
    // 这里可以将最后同步的UID保存到数据库或缓存中
    console.log(`Updated last sync UID for ${accountId}/${folder}: ${uid}`)
  }
}
