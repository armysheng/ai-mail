import { google } from 'googleapis'

export interface SyncResult {
  success: boolean
  newEmails: number
  totalEmails: number
  errors: string[]
}

export class GmailSyncService {
  private gmail: any
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
    
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    
    this.gmail = google.gmail({ version: 'v1', auth })
  }

  async syncEmails(accountId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      newEmails: 0,
      totalEmails: 0,
      errors: []
    }

    try {
      // 获取邮件列表
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 50,
        q: 'newer_than:7d' // 最近7天
      })

      if (response.data.messages) {
        result.totalEmails = response.data.messages.length
        
        // 批量获取邮件详情
        let newEmailCount = 0
        for (const message of response.data.messages) {
          try {
            const fullMessage = await this.gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            })
            
            // 这里应该保存邮件到数据库
            // await this.saveEmailToDatabase(accountId, fullMessage.data)
            newEmailCount++
          } catch (error) {
            result.errors.push(`Failed to fetch Gmail message ${message.id}: ${error.message}`)
          }
        }
        
        result.newEmails = newEmailCount
      }
      
      result.success = true
      
    } catch (error) {
      result.errors.push(`Gmail sync failed: ${error.message}`)
    }

    return result
  }
}