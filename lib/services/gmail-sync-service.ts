import { type gmail_v1, google } from "googleapis"
import DatabaseService from "./database"
import { EmailAccountService } from "./email-account-service"

export interface GmailSyncResult {
  success: boolean
  newEmails: number
  updatedEmails: number
  totalEmails: number
  errors: string[]
  nextPageToken?: string
}

export class GmailSyncService {
  private gmail: gmail_v1.Gmail
  private db: DatabaseService
  private accountService: EmailAccountService

  constructor(accessToken: string) {
    this.db = DatabaseService.getInstance()
    this.accountService = new EmailAccountService()

    // 设置OAuth2认证
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    this.gmail = google.gmail({ version: "v1", auth })
  }

  // 测试Gmail连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.gmail.users.getProfile({ userId: "me" })
      return !!response.data.emailAddress
    } catch (error) {
      console.error("Gmail connection test failed:", error)
      throw error
    }
  }

  // 同步Gmail邮件
  async syncEmails(accountId: string, pageToken?: string): Promise<GmailSyncResult> {
    const result: GmailSyncResult = {
      success: false,
      newEmails: 0,
      updatedEmails: 0,
      totalEmails: 0,
      errors: [],
    }

    try {
      console.log(`Starting Gmail sync for account ${accountId}`)

      // 获取邮件列表
      const listResponse = await this.gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        pageToken,
        q: "newer_than:30d", // 最近30天的邮件
      })

      const messages = listResponse.data.messages || []
      result.totalEmails = messages.length
      result.nextPageToken = listResponse.data.nextPageToken

      console.log(`Found ${messages.length} messages to process`)

      if (messages.length === 0) {
        result.success = true
        return result
      }

      // 批量处理邮件
      const batchSize = 10
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        await this.processBatch(accountId, batch, result)
      }

      result.success = true
      console.log(`Gmail sync completed: ${result.newEmails} new, ${result.updatedEmails} updated`)
    } catch (error) {
      console.error("Gmail sync error:", error)
      result.errors.push(error.message)

      // 检查是否是认证错误
      if (error.code === 401) {
        result.errors.push("Access token expired, need to refresh")
      }
    }

    return result
  }

  // 处理邮件批次
  private async processBatch(accountId: string, messages: any[], result: GmailSyncResult): Promise<void> {
    for (const message of messages) {
      try {
        // 获取完整邮件信息
        const fullMessage = await this.gmail.users.messages.get({
          userId: "me",
          id: message.id!,
          format: "full",
        })

        // 解析Gmail邮件
        const parsedEmail = this.parseGmailMessage(fullMessage.data)

        // 检查邮件是否已存在
        const existingEmail = await this.findEmailByGmailId(accountId, message.id!)

        if (existingEmail) {
          // 更新邮件状态
          await this.updateGmailEmail(existingEmail.id, fullMessage.data)
          result.updatedEmails++
        } else {
          // 保存新邮件
          await this.saveGmailEmail(accountId, parsedEmail, fullMessage.data)
          result.newEmails++
        }
      } catch (error) {
        console.error(`Error processing Gmail message ${message.id}:`, error)
        result.errors.push(`Message ${message.id}: ${error.message}`)
      }
    }
  }

  // 解析Gmail邮件
  private parseGmailMessage(message: gmail_v1.Schema$Message): any {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ""

    // 解析邮件内容
    const content = this.extractGmailContent(message.payload)

    // 解析附件
    const attachments = this.extractGmailAttachments(message.payload)

    return {
      gmailId: message.id,
      messageId: getHeader("message-id") || `gmail-${message.id}`,
      threadId: message.threadId,
      subject: getHeader("subject") || "(无主题)",
      sender: this.parseEmailAddress(getHeader("from")),
      recipients: {
        to: this.parseRecipients(getHeader("to")),
        cc: this.parseRecipients(getHeader("cc")),
        bcc: this.parseRecipients(getHeader("bcc")),
      },
      content,
      attachments,
      date: new Date(Number.parseInt(message.internalDate || "0")),
      labels: message.labelIds || [],
      headers: Object.fromEntries(headers.map((h) => [h.name!, h.value!])),
    }
  }

  // 提取Gmail邮件内容
  private extractGmailContent(payload: gmail_v1.Schema$MessagePart | undefined): { text: string; html: string } {
    let textContent = ""
    let htmlContent = ""

    if (!payload) return { text: textContent, html: htmlContent }

    // 处理单部分邮件
    if (payload.body?.data) {
      const content = Buffer.from(payload.body.data, "base64").toString("utf-8")

      if (payload.mimeType === "text/plain") {
        textContent = content
      } else if (payload.mimeType === "text/html") {
        htmlContent = content
      }
    }

    // 处理多部分邮件
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          textContent += Buffer.from(part.body.data, "base64").toString("utf-8")
        } else if (part.mimeType === "text/html" && part.body?.data) {
          htmlContent += Buffer.from(part.body.data, "base64").toString("utf-8")
        } else if (part.parts) {
          // 递归处理嵌套部分
          const nestedContent = this.extractGmailContent(part)
          textContent += nestedContent.text
          htmlContent += nestedContent.html
        }
      }
    }

    return { text: textContent, html: htmlContent }
  }

  // 提取Gmail附件
  private extractGmailAttachments(payload: gmail_v1.Schema$MessagePart | undefined): any[] {
    const attachments: any[] = []

    if (!payload) return attachments

    const processAttachment = (part: gmail_v1.Schema$MessagePart) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          contentType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
          contentId: part.headers?.find((h) => h.name === "Content-ID")?.value,
        })
      }
    }

    // 检查当前部分
    processAttachment(payload)

    // 递归检查子部分
    if (payload.parts) {
      for (const part of payload.parts) {
        attachments.push(...this.extractGmailAttachments(part))
      }
    }

    return attachments
  }

  // 解析邮箱地址
  private parseEmailAddress(addressString: string): { name: string; email: string } {
    if (!addressString) return { name: "", email: "" }

    // 匹配格式: "Name <email@domain.com>" 或 "email@domain.com"
    const match = addressString.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/)

    if (match) {
      return {
        name: (match[1] || "").trim(),
        email: (match[2] || "").trim(),
      }
    }

    return { name: "", email: addressString.trim() }
  }

  // 解析收件人列表
  private parseRecipients(recipientsString: string): Array<{ name: string; email: string; type: string }> {
    if (!recipientsString) return []

    return recipientsString.split(",").map((addr) => {
      const parsed = this.parseEmailAddress(addr.trim())
      return {
        name: parsed.name,
        email: parsed.email,
        type: "to", // 类型将在调用时设置
      }
    })
  }

  // 保存Gmail邮件
  private async saveGmailEmail(accountId: string, email: any, gmailMessage: gmail_v1.Schema$Message): Promise<string> {
    return this.db.transaction(async (client) => {
      // 插入邮件记录
      const emailQuery = `
        INSERT INTO emails (
          account_id, message_id, gmail_id, thread_id, subject, 
          sender_name, sender_email, content_text, content_html, preview,
          is_read, is_starred, received_at, sent_at, headers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `

      const preview = this.generatePreview(email.content.text || email.content.html)
      const isRead = email.labels.includes("UNREAD") === false
      const isStarred = email.labels.includes("STARRED")

      const emailParams = [
        accountId,
        email.messageId,
        email.gmailId,
        email.threadId,
        email.subject,
        email.sender.name,
        email.sender.email,
        email.content.text,
        email.content.html,
        preview,
        isRead,
        isStarred,
        email.date,
        email.date,
        JSON.stringify(email.headers),
      ]

      const emailResult = await client.query(emailQuery, emailParams)
      const emailId = emailResult.rows[0].id

      // 插入收件人
      const allRecipients = [
        ...email.recipients.to.map((r) => ({ ...r, type: "to" })),
        ...email.recipients.cc.map((r) => ({ ...r, type: "cc" })),
        ...email.recipients.bcc.map((r) => ({ ...r, type: "bcc" })),
      ]

      for (const recipient of allRecipients) {
        const recipientQuery = `
          INSERT INTO email_recipients (email_id, name, email, type)
          VALUES ($1, $2, $3, $4)
        `
        await client.query(recipientQuery, [emailId, recipient.name, recipient.email, recipient.type])
      }

      // 插入附件信息（不下载实际文件）
      for (const attachment of email.attachments) {
        const attachmentQuery = `
          INSERT INTO email_attachments (
            email_id, filename, content_type, size_bytes, content_id, storage_path
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `
        await client.query(attachmentQuery, [
          emailId,
          attachment.filename,
          attachment.contentType,
          attachment.size,
          attachment.contentId,
          `gmail:${email.gmailId}:${attachment.attachmentId}`, // Gmail特有的存储路径
        ])
      }

      return emailId
    })
  }

  // 查找Gmail邮件
  private async findEmailByGmailId(accountId: string, gmailId: string): Promise<any> {
    const query = `
      SELECT id FROM emails 
      WHERE account_id = $1 AND gmail_id = $2
    `
    const result = await this.db.query(query, [accountId, gmailId])
    return result.rows[0] || null
  }

  // 更新Gmail邮件
  private async updateGmailEmail(emailId: string, gmailMessage: gmail_v1.Schema$Message): Promise<void> {
    const labels = gmailMessage.labelIds || []
    const isRead = !labels.includes("UNREAD")
    const isStarred = labels.includes("STARRED")

    const query = `
      UPDATE emails 
      SET is_read = $1, is_starred = $2, updated_at = NOW()
      WHERE id = $3
    `
    await this.db.query(query, [isRead, isStarred, emailId])
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

  // 发送Gmail邮件
  async sendEmail(emailData: any): Promise<string> {
    try {
      // 构建RFC 2822格式的邮件
      const email = this.buildRFC2822Email(emailData)

      // Base64编码
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      })

      return response.data.id!
    } catch (error) {
      console.error("Gmail send error:", error)
      throw error
    }
  }

  // 构建RFC 2822格式邮件
  private buildRFC2822Email(emailData: any): string {
    const lines = []

    // 邮件头部
    lines.push(`To: ${emailData.to.map((r) => `${r.name} <${r.email}>`).join(", ")}`)

    if (emailData.cc?.length) {
      lines.push(`Cc: ${emailData.cc.map((r) => `${r.name} <${r.email}>`).join(", ")}`)
    }

    lines.push(`Subject: ${emailData.subject}`)
    lines.push(`Content-Type: ${emailData.contentType === "html" ? "text/html" : "text/plain"}; charset=utf-8`)

    if (emailData.inReplyTo) {
      lines.push(`In-Reply-To: ${emailData.inReplyTo}`)
    }

    lines.push("") // 空行分隔头部和正文
    lines.push(emailData.content)

    return lines.join("\r\n")
  }

  // 下载Gmail附件
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: attachmentId,
      })

      if (response.data.data) {
        return Buffer.from(response.data.data, "base64")
      }

      throw new Error("Attachment data not found")
    } catch (error) {
      console.error("Gmail attachment download error:", error)
      throw error
    }
  }
}
