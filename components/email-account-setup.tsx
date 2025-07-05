"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Mail, Shield, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, HelpCircle } from "lucide-react"
import { GmailSetupGuide } from "./gmail-setup-guide"

export function EmailAccountSetup({ onBack, onComplete }) {
  const [step, setStep] = useState(1) // 1: 选择提供商, 2: 配置, 3: 验证, 4: 完成
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showGmailGuide, setShowGmailGuide] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    // IMAP设置
    imapServer: "",
    imapPort: 993,
    imapSecurity: "ssl",
    // SMTP设置
    smtpServer: "",
    smtpPort: 587,
    smtpSecurity: "tls",
    // 高级设置
    syncEnabled: true,
    syncInterval: 5, // 分钟
    maxHistory: 30, // 天
  })

  const emailProviders = [
    {
      id: "gmail",
      name: "Gmail",
      icon: "🔵",
      type: "oauth",
      description: "Google邮箱，支持OAuth2安全认证",
      popular: true,
      settings: {
        imapServer: "imap.gmail.com",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpServer: "smtp.gmail.com",
        smtpPort: 587,
        smtpSecurity: "tls",
      },
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: "🔷",
      type: "oauth",
      description: "Microsoft邮箱，支持OAuth2安全认证",
      popular: true,
      settings: {
        imapServer: "outlook.office365.com",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpServer: "smtp.office365.com",
        smtpPort: 587,
        smtpSecurity: "tls",
      },
    },
    {
      id: "qq",
      name: "QQ邮箱",
      icon: "🐧",
      type: "password",
      description: "腾讯QQ邮箱，需要开启IMAP/SMTP服务",
      settings: {
        imapServer: "imap.qq.com",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpServer: "smtp.qq.com",
        smtpPort: 587,
        smtpSecurity: "tls",
      },
    },
    {
      id: "163",
      name: "网易邮箱",
      icon: "📧",
      type: "password",
      description: "网易163/126邮箱",
      settings: {
        imapServer: "imap.163.com",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpServer: "smtp.163.com",
        smtpPort: 587,
        smtpSecurity: "tls",
      },
    },
    {
      id: "imap",
      name: "其他邮箱",
      icon: "⚙️",
      type: "password",
      description: "支持IMAP/SMTP协议的邮箱",
      settings: {
        imapServer: "",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpServer: "",
        smtpPort: 587,
        smtpSecurity: "tls",
      },
    },
  ]

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider)
    setFormData((prev) => ({
      ...prev,
      ...provider.settings,
    }))

    if (provider.type === "oauth") {
      if (provider.id === "gmail") {
        setShowGmailGuide(true)
      } else {
        // 其他OAuth流程
        handleOAuthFlow(provider)
      }
    } else {
      // 密码认证流程
      setStep(2)
    }
  }

  const handleOAuthFlow = async (provider) => {
    setIsLoading(true)
    try {
      // 获取OAuth授权URL
      const response = await fetch(`/api/auth/oauth/${provider.id}/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()

      if (data.success) {
        // 打开OAuth授权页面
        window.location.href = data.data.authUrl
      } else {
        throw new Error(data.error?.message || "获取授权URL失败")
      }
    } catch (error) {
      console.error("OAuth flow error:", error)
      alert(`OAuth认证失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 如果显示Gmail设置指南
  if (showGmailGuide) {
    return (
      <GmailSetupGuide
        onBack={() => {
          setShowGmailGuide(false)
          setSelectedProvider(null)
        }}
        onComplete={() => {
          setShowGmailGuide(false)
          onComplete()
        }}
      />
    )
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/accounts/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider.id,
          email: formData.email,
          password: formData.password,
          settings: {
            imapServer: formData.imapServer,
            imapPort: formData.imapPort,
            imapSecurity: formData.imapSecurity,
            smtpServer: formData.smtpServer,
            smtpPort: formData.smtpPort,
            smtpSecurity: formData.smtpSecurity,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: "连接测试成功！",
          details: data.data,
        })
        setStep(3)
      } else {
        setTestResult({
          success: false,
          message: data.error?.message || "连接测试失败",
          details: data.error?.details,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `连接测试失败: ${error.message}`,
        details: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAccount = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider.id,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.email,
          settings: {
            imapServer: formData.imapServer,
            imapPort: formData.imapPort,
            imapSecurity: formData.imapSecurity,
            smtpServer: formData.smtpServer,
            smtpPort: formData.smtpPort,
            smtpSecurity: formData.smtpSecurity,
            syncEnabled: formData.syncEnabled,
            syncInterval: formData.syncInterval,
            maxHistory: formData.maxHistory,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()

      if (data.success) {
        setStep(4)
        console.log("Account added successfully:", data.data)
      } else {
        throw new Error(data.error?.message || "添加账户失败")
      }
    } catch (error) {
      console.error("Add account error:", error)
      alert("添加邮箱失败：" + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">选择邮箱类型</h2>
        <p className="text-gray-600">选择您要添加的邮箱服务商</p>
      </div>

      <div className="space-y-3">
        {emailProviders.map((provider) => (
          <div
            key={provider.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-orange-300 hover:shadow-sm ${
              selectedProvider?.id === provider.id ? "border-orange-500 bg-orange-50" : "border-gray-200"
            }`}
            onClick={() => handleProviderSelect(provider)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{provider.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{provider.name}</h3>
                  {provider.popular && (
                    <Badge variant="secondary" className="text-xs">
                      推荐
                    </Badge>
                  )}
                  {provider.type === "oauth" && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      安全认证
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{provider.description}</p>
              </div>
              {isLoading && selectedProvider?.id === provider.id && (
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">安全提示</p>
            <p className="text-blue-700">
              推荐使用OAuth2认证的邮箱服务，更加安全可靠。对于其他邮箱，请确保开启IMAP/SMTP服务并使用应用专用密码。
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">配置邮箱</h2>
        <p className="text-gray-600">请填写您的邮箱账户信息</p>
      </div>

      <div className="space-y-4">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 border-b pb-2">基本信息</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱地址 *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="your@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedProvider?.id === "qq" ? "授权码" : "密码"} *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={selectedProvider?.id === "qq" ? "请输入QQ邮箱授权码" : "请输入密码"}
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {selectedProvider?.id === "qq" && (
              <p className="text-xs text-gray-500 mt-1">请在QQ邮箱设置中开启IMAP/SMTP服务并获取授权码</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">显示名称</label>
            <Input
              value={formData.displayName}
              onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="可选，用于显示的名称"
              className="w-full"
            />
          </div>
        </div>

        {/* 服务器设置 */}
        {selectedProvider?.id === "imap" && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 border-b pb-2">服务器设置</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IMAP服务器 *</label>
                <Input
                  value={formData.imapServer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imapServer: e.target.value }))}
                  placeholder="imap.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IMAP端口 *</label>
                <Input
                  type="number"
                  value={formData.imapPort}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imapPort: parseInt(e.target.value) }))}
                  placeholder="993"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP服务器 *</label>
                <Input
                  value={formData.smtpServer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, smtpServer: e.target.value }))}
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP端口 *</label>
                <Input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData((prev) => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                  placeholder="587"
                />
              </div>
            </div>
          </div>
        )}

        {/* 同步设置 */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 border-b pb-2">同步设置</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">启用自动同步</p>
              <p className="text-xs text-gray-500">定期同步新邮件</p>
            </div>
            <Switch
              checked={formData.syncEnabled}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, syncEnabled: checked }))}
            />
          </div>

          {formData.syncEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">同步间隔（分钟）</label>
                <select
                  value={formData.syncInterval}
                  onChange={(e) => setFormData((prev) => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1分钟</option>
                  <option value={5}>5分钟</option>
                  <option value={15}>15分钟</option>
                  <option value={30}>30分钟</option>
                  <option value={60}>1小时</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">历史邮件（天）</label>
                <select
                  value={formData.maxHistory}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxHistory: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={7}>7天</option>
                  <option value={30}>30天</option>
                  <option value={90}>90天</option>
                  <option value={365}>1年</option>
                  <option value={0}>全部</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          返回
        </Button>
        <Button
          onClick={handleTestConnection}
          disabled={!formData.email || !formData.password || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              测试连接...
            </>
          ) : (
            "测试连接"
          )}
        </Button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-lg ${
            testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${testResult.success ? "text-green-900" : "text-red-900"}`}>
                {testResult.message}
              </p>
              {testResult.details && (
                <p className={`text-sm mt-1 ${testResult.success ? "text-green-700" : "text-red-700"}`}>
                  {typeof testResult.details === "string" ? testResult.details : JSON.stringify(testResult.details)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">连接成功</h2>
        <p className="text-gray-600">邮箱配置正确，准备添加到您的账户</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">邮箱地址</span>
          <span className="text-sm font-medium">{formData.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">服务商</span>
          <span className="text-sm font-medium">{selectedProvider?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">同步设置</span>
          <span className="text-sm font-medium">
            {formData.syncEnabled ? `每${formData.syncInterval}分钟` : "手动同步"}
          </span>
        </div>
        {testResult?.details && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">服务器状态</span>
            <span className="text-sm font-medium text-green-600">连接正常</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
          返回修改
        </Button>
        <Button onClick={handleAddAccount} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              添加中...
            </>
          ) : (
            "添加邮箱"
          )}
        </Button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">添加成功</h2>
        <p className="text-gray-600">邮箱已成功添加到您的账户</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-900">{formData.email || selectedProvider?.name}</span>
        </div>
        <p className="text-sm text-green-700">
          邮箱已添加成功，您现在可以开始使用邮件功能了。
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">接下来您可以：</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 查看收件箱中的邮件</li>
          <li>• 发送和回复邮件</li>
          <li>• 体验AI智能分类功能</li>
          <li>• 管理日程和任务</li>
          <li>• 在设置中调整同步频率</li>
        </ul>
      </div>

      <Button onClick={onComplete} className="w-full">
        完成设置
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">添加邮箱</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">步骤 {step}/4</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step
                    ? "bg-orange-600 text-white"
                    : stepNum === step + 1
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {stepNum < step ? <CheckCircle className="h-4 w-4" /> : stepNum}
              </div>
              {stepNum < 4 && <div className={`w-8 h-1 mx-2 ${stepNum < step ? "bg-orange-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  )
}