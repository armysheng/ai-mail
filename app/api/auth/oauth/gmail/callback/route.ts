import { type NextRequest, NextResponse } from "next/server"
import { GmailOAuthService } from "@/lib/services/gmail-oauth-service"
import { EmailAccountService } from "@/lib/services/email-account-service"
import { verifyToken } from "@/lib/auth"

// GET /api/auth/oauth/gmail/callback - Gmail OAuth回调处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      const errorMessage = encodeURIComponent(`OAuth错误: ${error}`)
      return NextResponse.redirect(new URL(`/?error=${errorMessage}`, request.url))
    }

    if (!code) {
      const errorMessage = encodeURIComponent("未收到授权码")
      return NextResponse.redirect(new URL(`/?error=${errorMessage}`, request.url))
    }

    try {
      const oauthService = new GmailOAuthService()
      const tokenData = await oauthService.exchangeCodeForTokens(code)

      // 创建一个简单的成功页面，显示用户信息
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail 授权成功</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
            .info { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Gmail 授权成功！</h2>
            <p>您的 Gmail 账户已成功连接。</p>
          </div>
          
          <div class="info">
            <h3>账户信息：</h3>
            <p><strong>邮箱：</strong> ${tokenData.userInfo.email}</p>
            <p><strong>姓名：</strong> ${tokenData.userInfo.name || '未提供'}</p>
            <p><strong>访问令牌：</strong> ${tokenData.accessToken.substring(0, 20)}...</p>
            <p><strong>刷新令牌：</strong> ${tokenData.refreshToken ? '已获取' : '未获取'}</p>
          </div>
          
          <a href="/" class="button">返回应用</a>
          
          <script>
            // 5秒后自动跳转
            setTimeout(() => {
              window.location.href = '/';
            }, 5000);
          </script>
        </body>
        </html>
      `

      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html' }
      })

    } catch (oauthError) {
      console.error("Gmail OAuth处理错误:", oauthError)
      const errorMessage = encodeURIComponent(`OAuth处理失败: ${oauthError.message}`)
      return NextResponse.redirect(new URL(`/?error=${errorMessage}`, request.url))
    }

  } catch (error) {
    console.error("Gmail OAuth callback error:", error)
    const errorMessage = encodeURIComponent(`回调处理失败: ${error.message}`)
    return NextResponse.redirect(new URL(`/?error=${errorMessage}`, request.url))
  }
}