import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { IMAPSyncService } from "@/lib/services/imap-sync-service"
import { SMTPSendService } from "@/lib/services/smtp-send-service"

// POST /api/accounts/test - 测试邮箱连接
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未授权访问" } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { provider, email, password, settings } = body

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱和密码不能为空" } },
        { status: 400 },
      )
    }

    const testResults = {
      imap: { success: false, message: "", details: null },
      smtp: { success: false, message: "", details: null },
    }

    // 测试IMAP连接
    try {
      const imapService = new IMAPSyncService({
        email,
        password,
        imapServer: settings.imapServer,
        imapPort: settings.imapPort,
        imapSecurity: settings.imapSecurity,
      })

      await imapService.testConnection()
      testResults.imap = {
        success: true,
        message: "IMAP连接成功",
        details: {
          server: settings.imapServer,
          port: settings.imapPort,
          security: settings.imapSecurity,
        },
      }
    } catch (error) {
      testResults.imap = {
        success: false,
        message: `IMAP连接失败: ${error.message}`,
        details: error,
      }
    }

    // 测试SMTP连接
    try {
      const smtpService = new SMTPSendService({
        email,
        password,
        smtpServer: settings.smtpServer,
        smtpPort: settings.smtpPort,
        smtpSecurity: settings.smtpSecurity,
      })

      await smtpService.testConnection()
      testResults.smtp = {
        success: true,
        message: "SMTP连接成功",
        details: {
          server: settings.smtpServer,
          port: settings.smtpPort,
          security: settings.smtpSecurity,
        },
      }
    } catch (error) {
      testResults.smtp = {
        success: false,
        message: `SMTP连接失败: ${error.message}`,
        details: error,
      }
    }

    // 判断整体测试结果
    const overallSuccess = testResults.imap.success && testResults.smtp.success

    if (overallSuccess) {
      return NextResponse.json({
        success: true,
        data: {
          message: "邮箱配置测试成功",
          details: testResults,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONNECTION_TEST_FAILED",
            message: "邮箱连接测试失败",
            details: testResults,
          },
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "测试连接时发生错误" } },
      { status: 500 },
    )
  }
}
