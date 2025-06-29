import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { EmailAccountService } from "@/lib/services/email-account-service"
import { IMAPSyncService } from "@/lib/services/imap-sync-service"
import { GmailSyncService } from "@/lib/services/gmail-sync-service"

// GET /api/accounts - 获取邮箱账户列表
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "未授权访问" } },
        { status: 401 },
      )
    }

    const accountService = new EmailAccountService()
    const accounts = await accountService.getUserAccounts(user.id)

    return NextResponse.json({
      success: true,
      data: accounts,
    })
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } },
      { status: 500 },
    )
  }
}

// POST /api/accounts - 添加邮箱账户
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
    const { provider, email, password, displayName, settings } = body

    // 验证必填字段
    if (!provider || !email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "缺少必填字段" } },
        { status: 400 },
      )
    }

    const accountService = new EmailAccountService()

    // 检查邮箱是否已存在
    const existingAccount = await accountService.findByEmail(user.id, email)
    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_EMAIL", message: "该邮箱已添加" } },
        { status: 409 },
      )
    }

    // 创建邮箱账户
    const accountData = {
      userId: user.id,
      provider,
      email,
      password, // 将在服务中加密
      displayName: displayName || email,
      settings: {
        imapServer: settings.imapServer,
        imapPort: settings.imapPort,
        imapSecurity: settings.imapSecurity,
        smtpServer: settings.smtpServer,
        smtpPort: settings.smtpPort,
        smtpSecurity: settings.smtpSecurity,
        syncEnabled: settings.syncEnabled ?? true,
        syncInterval: settings.syncInterval ?? 5,
        maxHistory: settings.maxHistory ?? 30,
      },
    }

    const account = await accountService.createAccount(accountData)

    // 启动初始同步
    if (settings.syncEnabled) {
      // 异步启动同步，不等待完成
      startInitialSync(account.id).catch((error) => {
        console.error("Initial sync failed:", error)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        email: account.email,
        provider: account.provider,
        status: account.status,
        displayName: account.displayName,
      },
    })
  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "创建账户失败" } },
      { status: 500 },
    )
  }
}

// 启动初始同步
async function startInitialSync(accountId: string) {
  try {
    const accountService = new EmailAccountService()
    const account = await accountService.getAccountById(accountId)

    if (!account) {
      throw new Error("Account not found")
    }

    let syncService

    if (account.provider === "gmail") {
      syncService = new GmailSyncService(account.accessToken)
    } else {
      syncService = new IMAPSyncService({
        email: account.email,
        password: account.password, // 已解密
        imapServer: account.settings.imapServer,
        imapPort: account.settings.imapPort,
        imapSecurity: account.settings.imapSecurity,
      })
    }

    // 更新同步状态
    await accountService.updateSyncStatus(accountId, "syncing")

    // 执行同步
    const result = await syncService.syncEmails()

    // 更新同步结果
    await accountService.updateSyncStatus(accountId, "completed", {
      lastSyncAt: new Date(),
      newEmails: result.newEmails,
      totalEmails: result.totalEmails,
    })

    console.log(`Initial sync completed for account ${accountId}:`, result)
  } catch (error) {
    console.error(`Initial sync failed for account ${accountId}:`, error)

    // 更新错误状态
    const accountService = new EmailAccountService()
    await accountService.updateSyncStatus(accountId, "error", {
      syncError: error.message,
    })
  }
}
