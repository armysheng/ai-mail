import nodemailer from 'nodemailer'

export interface SMTPConfig {
  email: string
  password: string
  smtpServer: string
  smtpPort: number
  smtpSecurity: string
}

export class SMTPSendService {
  private transporter: any
  private config: SMTPConfig

  constructor(config: SMTPConfig) {
    this.config = config
    this.transporter = nodemailer.createTransporter({
      host: config.smtpServer,
      port: config.smtpPort,
      secure: config.smtpSecurity === 'ssl',
      auth: {
        user: config.email,
        pass: config.password
      }
    })
  }

  async testConnection(): Promise<void> {
    try {
      await this.transporter.verify()
    } catch (error) {
      throw new Error(`SMTP connection failed: ${error.message}`)
    }
  }

  async sendEmail(emailData: any): Promise<string> {
    try {
      const result = await this.transporter.sendMail(emailData)
      return result.messageId
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
}