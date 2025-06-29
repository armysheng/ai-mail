"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, Shield, Mail, ArrowRight } from "lucide-react"

export function GmailSetupGuide({ onComplete, onBack }) {
  const [step, setStep] = useState(1) // 1: 介绍, 2: 授权中, 3: 完成
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStartOAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/oauth/gmail/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setStep(2)
        // 打开OAuth授权页面
        window.location.href = data.data.authUrl
      } else {
        throw new Error(data.error.message)
      }
    } catch (error) {
      console.error("Gmail OAuth error:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
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
            <p className="font-medium text-yellow-900 mb-1">注意事项</p>
            <p className="text-yellow-700">
              点击授权后将跳转到Google官方页面，请在弹出的窗口中完成授权。授权完成后会自动返回。
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">授权失败</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">正在授权</h2>
        <p className="text-gray-600">请在弹出的Google页面中完成授权</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-blue-700 mb-3">如果没有弹出授权页面，请点击下方按钮手动打开</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartOAuth}
            className="text-blue-600 border-blue-200 bg-transparent"
          >
            重新打开授权页面
          </Button>
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
            <span>自动返回应用</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">授权成功</h2>
        <p className="text-gray-600">Gmail账户已成功连接</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-900">连接成功</span>
        </div>
        <p className="text-sm text-green-700">您的Gmail账户已成功连接，系统正在后台同步您的邮件。</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">接下来您可以：</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 查看同步的邮件</li>
          <li>• 体验AI智能分类</li>
          <li>• 使用智能回复功能</li>
          <li>• 管理日程和任务</li>
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
