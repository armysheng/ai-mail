import { google } from "googleapis"

export class GmailOAuthService {
  private oauth2Client: any

  constructor() {
    // Check for required environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID environment variable is required")
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("GOOGLE_CLIENT_SECRET environment variable is required")
    }
    if (!process.env.GOOGLE_REDIRECT_URI) {
      throw new Error("GOOGLE_REDIRECT_URI environment variable is required")
    }

    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      )
    } catch (error) {
      console.error("Failed to initialize OAuth2 client:", error)
      throw new Error(`OAuth2 client initialization failed: ${error.message}`)
    }
  }

  // 获取授权URL
  getAuthUrl(): string {
    try {
      const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ]

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent", // 强制显示同意页面以获取refresh_token
        include_granted_scopes: true,
      })

      console.log("Generated auth URL:", authUrl)
      return authUrl
    } catch (error) {
      console.error("Failed to generate auth URL:", error)
      throw new Error(`Failed to generate authorization URL: ${error.message}`)
    }
  }

  // 交换授权码获取Token
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiryDate: number
    userInfo: any
  }> {
    try {
      console.log("Exchanging code for tokens:", code.substring(0, 20) + "...")
      
      // 获取访问令牌
      const { tokens } = await this.oauth2Client.getToken(code)
      console.log("Received tokens:", {
        access_token: tokens.access_token ? "present" : "missing",
        refresh_token: tokens.refresh_token ? "present" : "missing",
        expiry_date: tokens.expiry_date
      })

      if (!tokens.access_token) {
        throw new Error("No access token received")
      }

      // 设置凭据以获取用户信息
      this.oauth2Client.setCredentials(tokens)

      // 获取用户信息
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client })
      const userInfoResponse = await oauth2.userinfo.get()
      console.log("User info received:", userInfoResponse.data)

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiryDate: tokens.expiry_date || 0,
        userInfo: userInfoResponse.data,
      }
    } catch (error) {
      console.error("Gmail OAuth token exchange error:", error)
      throw new Error(`Failed to exchange authorization code: ${error.message}`)
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
      throw new Error(`Failed to refresh access token: ${error.message}`)
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
      throw new Error(`Failed to revoke access token: ${error.message}`)
    }
  }
}