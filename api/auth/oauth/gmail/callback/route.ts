import { type NextRequest, NextResponse } from "next/server"
import { GmailOAuthService } from "@/lib/services/gmail-oauth-service"
import { EmailAccountService } from "@/lib/services/email-account-service"
import { verifyToken } from "@/lib/auth"

// GET /api/auth/oauth/gmail/callback - Gmail OAuth回调处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // 可以用来传递用户ID或其他状态
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(new URL(`/settings/accounts?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/settings/accounts?error=no_code", request.url))
    }

    // 这里需要从state或session中获取用户信息
    // 简化处理，实际应用中需要更安全的状态管理
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url))
    }

    const oauthService = new GmailOAuthService()
    const tokenData = await oauthService.exchangeCodeForTokens(code)

    // 创建Gmail账户
    const accountService = new EmailAccountService()

    // 检查账户是否已存在
    const existingAccount = await accountService.findByEmail(user.id, tokenData.userInfo.email)

    if (existingAccount) {
      // 更新现有账户的token
      await accountService.updateTokens(
        existingAccount.id,
        tokenData.accessToken,
        tokenData.refreshToken,
        new Date(tokenData.expiryDate),
      )
    } else {
      // 创建新账户
      await accountService.createAccount({
        userId: user.id,
        email: tokenData.userInfo.email,
        displayName: tokenData.userInfo.name || tokenData.userInfo.email,
        provider: "gmail",
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        settings: {
          imapServer: "imap.gmail.com",
          imapPort: 993,
          imapSecurity: "ssl",
          smtpServer: "smtp.gmail.com",
          smtpPort: 587,
          smtpSecurity: "tls",
          syncEnabled: true,
          syncInterval: 5,
          maxHistory: 30,
        },
      })
    }

    // 重定向到成功页面
    return NextResponse.redirect(new URL("/settings/accounts?success=gmail_connected", request.url))
  } catch (error) {
    console.error("Gmail OAuth callback error:", error)
    return NextResponse.redirect(new URL(`/settings/accounts?error=${encodeURIComponent(error.message)}`, request.url))
  }
}
