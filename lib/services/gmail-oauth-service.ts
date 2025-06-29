import { google } from "googleapis"

export class GmailOAuthService {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )
  }

  // 获取授权URL
  getAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // 强制显示同意页面以获取refresh_token
    })
  }

  // 交换授权码获取Token
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiryDate: number
    userInfo: any
  }> {
    try {
      // 获取访问令牌
      const { tokens } = await this.oauth2Client.getToken(code)

      if (!tokens.access_token) {
        throw new Error("No access token received")
      }

      // 设置凭据以获取用户信息
      this.oauth2Client.setCredentials(tokens)

      // 获取用户信息
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client })
      const userInfoResponse = await oauth2.userinfo.get()

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiryDate: tokens.expiry_date || 0,
        userInfo: userInfoResponse.data,
      }
    } catch (error) {
      console.error("Gmail OAuth token exchange error:", error)
      throw new Error("Failed to exchange authorization code")
    }
  }

  // 刷新访问令牌
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiryDate: number
  }> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      if (!credentials.access_token) {
        throw new Error("No access token received from refresh")
      }

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date || 0,
      }
    } catch (error) {
      console.error("Gmail token refresh error:", error)
      throw new Error("Failed to refresh access token")
    }
  }

  // 验证访问令牌
  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      })

      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client })
      await gmail.users.getProfile({ userId: "me" })

      return true
    } catch (error) {
      console.error("Gmail token verification error:", error)
      return false
    }
  }

  // 撤销访问令牌
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken)
    } catch (error) {
      console.error("Gmail token revocation error:", error)
      throw new Error("Failed to revoke access token")
    }
  }
}
