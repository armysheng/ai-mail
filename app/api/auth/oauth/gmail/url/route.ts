import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { GmailOAuthService } from "@/lib/services/gmail-oauth-service"

// POST /api/auth/oauth/gmail/url - 获取Gmail OAuth授权URL
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未授权访问" } },
        { status: 401 },
      )
    }

    const oauthService = new GmailOAuthService()
    const authUrl = oauthService.getAuthUrl()

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