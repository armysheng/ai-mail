"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, Shield, Mail, ArrowRight, ExternalLink, Copy } from "lucide-react"

export function GmailSetupGuide({ onComplete, onBack }) {
  const [step, setStep] = useState(1) // 1: 介绍, 2: 授权中, 3: 完成
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authUrl, setAuthUrl] = useState("")

  const handleStartOAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Starting OAuth flow...")
      
      const response = await fetch("/api/auth/oauth/gmail/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("HTTP error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log("OAuth URL response:", data)

      if (data.success) {
        setAuthUrl(data.data.authUrl)
        setStep(2)
        
        // 打开OAuth授权页面
        const popup = window.open(data.data.authUrl, '_blank', 'width=500,height=600')
        
        // 检查弹窗是否被阻止
        if (!popup) {
          throw new Error("弹窗被浏览器阻止，请允许弹窗或手动点击链接")
        }
      } else {
        throw new Error(data.error?.message || "获取授权URL失败")
      }
    } catch (error) {
      console.error("Gmail OAuth error:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("已复制到剪贴板")
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert("已复制到剪贴板")
    })
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔵</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">连接Gmail账户</h2>
        <p className="text-gray-600">使用Google官方OAuth2安全认证</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">安全保障</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 使用Google官方OAuth2认证</li>
              <li>• 不会获取您的密码</li>
              <li>• 可随时撤销授权</li>
              <li>• 数据传输全程加密</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">授权后可以：</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-sm">读取邮件</p>
              <p className="text-xs text-gray-500">同步收件箱邮件</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-lg">📤</span>
            <div>
              <p className="font-medium text-sm">发送邮件</p>
              <p className="text-xs text-gray-500">代您发送邮件</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-lg">🤖</span>
            <div>
              <p className="font-medium text-sm">AI智能分析</p>
              <p className="text-xs text-gray-500">自动分类和提取信息</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 mb-1">配置要求</p>
            <p className="text-yellow-700">
              请确保已在 .env.local 文件中配置了正确的 Google OAuth 凭据（GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、GOOGLE_REDIRECT_URI）。
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">配置错误</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-2 text-xs text-red-600">
                <p>请检查以下配置：</p>
                <ul className="list-disc list-inside mt-1">
                  <li>GOOGLE_CLIENT_ID 是否已设置</li>
                  <li>GOOGLE_CLIENT_SECRET 是否已设置</li>
                  <li>GOOGLE_REDIRECT_URI 是否正确</li>
                  <li>是否已重启开发服务器</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          返回
        </Button>
        <Button onClick={handleStartOAuth} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              准备中...
            </>
          ) : (
            <>
              开始授权
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">等待授权</h2>
        <p className="text-gray-600">请在弹出的Google页面中完成授权</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-center space-y-3">
          <p className="text-sm text-blue-700 mb-3">如果没有弹出授权页面，请点击下方链接手动打开</p>
          
          {authUrl && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(authUrl, '_blank', 'width=500,height=600')}
                className="text-blue-600 border-blue-200 bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                打开授权页面
              </Button>
              
              <div className="text-xs text-gray-500">
                <p>或复制链接到浏览器：</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                    {authUrl.substring(0, 50)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(authUrl)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">授权步骤：</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
              1
            </div>
            <span>选择您的Google账户</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">
              2
            </div>
            <span>确认授权权限</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">
              3
            </div>
            <span>完成后关闭窗口</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-transparent">
          返回
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1 bg-green-600 hover:bg-green-700">
          我已完成授权
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">设置完成</h2>
        <p className="text-gray-600">Gmail账户配置已完成</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-900">配置成功</span>
        </div>
        <p className="text-sm text-green-700">
          您的Gmail账户已成功配置。现在可以开始使用邮件功能了。
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">接下来您可以：</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 查看和管理邮件</li>
          <li>• 发送新邮件</li>
          <li>• 体验AI智能分类</li>
          <li>• 使用智能回复功能</li>
          <li>• 管理日程和任务</li>
        </ul>
      </div>

      <Button onClick={onComplete} className="w-full">
        开始使用
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🔵</span>
          </div>
          <h1 className="text-lg font-medium">Gmail设置</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          OAuth2安全认证
        </Badge>
      </div>

      {/* 进度指示器 */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  stepNum <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {stepNum < step ? <CheckCircle className="h-3 w-3" /> : stepNum}
              </div>
              {stepNum < 3 && <div className={`w-8 h-1 mx-1 ${stepNum < step ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  )
}