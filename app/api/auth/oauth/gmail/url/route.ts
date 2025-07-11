import { type NextRequest, NextResponse } from "next/server"

// POST /api/auth/oauth/gmail/url - 获取Gmail OAuth授权URL
export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("Missing GOOGLE_CLIENT_ID environment variable")
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "Google Client ID 未配置" } },
        { status: 500 },
      )
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing GOOGLE_CLIENT_SECRET environment variable")
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "Google Client Secret 未配置" } },
        { status: 500 },
      )
    }

    if (!process.env.GOOGLE_REDIRECT_URI) {
      console.error("Missing GOOGLE_REDIRECT_URI environment variable")
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "Google Redirect URI 未配置" } },
        { status: 500 },
      )
    }

    // 暂时跳过认证检查，直接生成授权URL
    console.log("Generating Gmail OAuth URL...")

    // 动态导入 GmailOAuthService 以避免初始化错误
    const { GmailOAuthService } = await import("@/lib/services/gmail-oauth-service")
    const oauthService = new GmailOAuthService()
    const authUrl = oauthService.getAuthUrl()

    console.log("Generated auth URL successfully")

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        provider: "gmail",
      },
    })
  } catch (error) {
    console.error("Gmail OAuth URL generation error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: `生成授权URL失败: ${error.message}` } },
      { status: 500 },
    )
  }
}