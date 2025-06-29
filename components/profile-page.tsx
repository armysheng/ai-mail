"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Settings,
  Mail,
  Calendar,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  Info,
  ChevronRight,
  Edit,
  Camera,
  BarChart3,
  Database,
  Sparkles,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  LogOut,
} from "lucide-react"

export function ProfilePage({ onBack, userStats, onUpdateSettings }) {
  const [activeSection, setActiveSection] = useState("overview") // overview | settings | stats | help
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      reminder: true,
      marketing: false,
    },
    ai: {
      autoClassify: true,
      smartReply: true,
      scheduleExtraction: true,
      taskGeneration: true,
    },
    appearance: {
      theme: "light", // light | dark | auto
      language: "zh-CN",
      compactMode: false,
    },
    privacy: {
      readReceipts: true,
      onlineStatus: true,
      dataCollection: false,
    },
  })

  const [userProfile, setUserProfile] = useState({
    name: "张小明",
    email: "zhangxiaoming@example.com",
    avatar: "张",
    title: "产品经理",
    department: "技术部",
    joinDate: "2023年3月",
  })

  const [isEditing, setIsEditing] = useState(false)

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
    onUpdateSettings?.(category, key, value)
  }

  const OverviewSection = () => (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-orange-100 text-orange-600 text-xl font-bold">
                {userProfile.avatar}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="ghost"
              className="absolute -bottom-1 -right-1 h-6 w-6 bg-white shadow-sm rounded-full"
              onClick={() => setIsEditing(true)}
            >
              <Camera className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
            <p className="text-gray-600">{userProfile.title}</p>
            <p className="text-sm text-gray-500">{userProfile.department}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-1" />
            编辑
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">邮箱地址</span>
            <p className="font-medium">{userProfile.email}</p>
          </div>
          <div>
            <span className="text-gray-500">加入时间</span>
            <p className="font-medium">{userProfile.joinDate}</p>
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">邮件统计</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">今日收到</span>
              <span className="font-medium">{userStats?.todayReceived || 12}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">今日发送</span>
              <span className="font-medium">{userStats?.todaySent || 8}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">未读邮件</span>
              <span className="font-medium text-orange-600">{userStats?.unread || 5}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">日程统计</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">今日日程</span>
              <span className="font-medium">{userStats?.todayEvents || 3}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">本周日程</span>
              <span className="font-medium">{userStats?.weekEvents || 12}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">待确认</span>
              <span className="font-medium text-yellow-600">{userStats?.pendingEvents || 2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI 使用统计 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-gray-700">AI 助手使用情况</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">自动分类邮件</span>
            <p className="font-medium">{userStats?.aiClassified || 156} 封</p>
          </div>
          <div>
            <span className="text-gray-500">提取日程</span>
            <p className="font-medium">{userStats?.aiSchedules || 23} 个</p>
          </div>
          <div>
            <span className="text-gray-500">生成任务</span>
            <p className="font-medium">{userStats?.aiTasks || 45} 个</p>
          </div>
          <div>
            <span className="text-gray-500">智能回复</span>
            <p className="font-medium">{userStats?.aiReplies || 12} 次</p>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700 mb-3">快捷操作</h3>
        <Button
          variant="outline"
          className="w-full justify-between bg-transparent"
          onClick={() => setActiveSection("stats")}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>详细统计</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between bg-transparent"
          onClick={() => setActiveSection("settings")}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>应用设置</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const SettingsSection = () => (
    <div className="space-y-6">
      {/* 通知设置 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-700">通知设置</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">邮件通知</p>
              <p className="text-xs text-gray-500">新邮件到达时通知</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => updateSetting("notifications", "email", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">推送通知</p>
              <p className="text-xs text-gray-500">系统推送消息</p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) => updateSetting("notifications", "push", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">日程提醒</p>
              <p className="text-xs text-gray-500">日程开始前提醒</p>
            </div>
            <Switch
              checked={settings.notifications.reminder}
              onCheckedChange={(checked) => updateSetting("notifications", "reminder", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">营销邮件</p>
              <p className="text-xs text-gray-500">营销和推广邮件通知</p>
            </div>
            <Switch
              checked={settings.notifications.marketing}
              onCheckedChange={(checked) => updateSetting("notifications", "marketing", checked)}
            />
          </div>
        </div>
      </div>

      {/* AI 功能设置 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-700">AI 功能</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">自动分类</p>
              <p className="text-xs text-gray-500">AI 自动分类邮件</p>
            </div>
            <Switch
              checked={settings.ai.autoClassify}
              onCheckedChange={(checked) => updateSetting("ai", "autoClassify", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">智能回复</p>
              <p className="text-xs text-gray-500">AI 生成回复建议</p>
            </div>
            <Switch
              checked={settings.ai.smartReply}
              onCheckedChange={(checked) => updateSetting("ai", "smartReply", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">日程提取</p>
              <p className="text-xs text-gray-500">从邮件中提取日程</p>
            </div>
            <Switch
              checked={settings.ai.scheduleExtraction}
              onCheckedChange={(checked) => updateSetting("ai", "scheduleExtraction", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">任务生成</p>
              <p className="text-xs text-gray-500">AI 生成待办任务</p>
            </div>
            <Switch
              checked={settings.ai.taskGeneration}
              onCheckedChange={(checked) => updateSetting("ai", "taskGeneration", checked)}
            />
          </div>
        </div>
      </div>

      {/* 外观设置 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-gray-700">外观设置</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm mb-2">主题模式</p>
            <div className="flex gap-2">
              <Button
                variant={settings.appearance.theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting("appearance", "theme", "light")}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-1" />
                浅色
              </Button>
              <Button
                variant={settings.appearance.theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting("appearance", "theme", "dark")}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-1" />
                深色
              </Button>
              <Button
                variant={settings.appearance.theme === "auto" ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting("appearance", "theme", "auto")}
                className="flex-1"
              >
                自动
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">紧凑模式</p>
              <p className="text-xs text-gray-500">减少界面间距</p>
            </div>
            <Switch
              checked={settings.appearance.compactMode}
              onCheckedChange={(checked) => updateSetting("appearance", "compactMode", checked)}
            />
          </div>
        </div>
      </div>

      {/* 隐私设置 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h3 className="font-medium text-gray-700">隐私设置</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">已读回执</p>
              <p className="text-xs text-gray-500">发送已读回执</p>
            </div>
            <Switch
              checked={settings.privacy.readReceipts}
              onCheckedChange={(checked) => updateSetting("privacy", "readReceipts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">在线状态</p>
              <p className="text-xs text-gray-500">显示在线状态</p>
            </div>
            <Switch
              checked={settings.privacy.onlineStatus}
              onCheckedChange={(checked) => updateSetting("privacy", "onlineStatus", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">数据收集</p>
              <p className="text-xs text-gray-500">允许收集使用数据</p>
            </div>
            <Switch
              checked={settings.privacy.dataCollection}
              onCheckedChange={(checked) => updateSetting("privacy", "dataCollection", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const StatsSection = () => (
    <div className="space-y-6">
      {/* 邮件统计 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-700">邮件统计</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{userStats?.totalReceived || 1234}</div>
            <div className="text-sm text-gray-600">总接收</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{userStats?.totalSent || 567}</div>
            <div className="text-sm text-gray-600">总发送</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{userStats?.avgDaily || 23}</div>
            <div className="text-sm text-gray-600">日均处理</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{userStats?.responseRate || 89}%</div>
            <div className="text-sm text-gray-600">回复率</div>
          </div>
        </div>
      </div>

      {/* 存储使用情况 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-700">存储使用</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>邮件存储</span>
              <span>2.3 GB / 15 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "15%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>附件存储</span>
              <span>1.8 GB / 15 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "12%" }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>日历数据</span>
              <span>156 MB / 15 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: "1%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI 使用详情 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-700">AI 使用详情</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">邮件自动分类</span>
            <Badge variant="secondary">{userStats?.aiClassified || 156} 封</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">智能日程提取</span>
            <Badge variant="secondary">{userStats?.aiSchedules || 23} 个</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">任务自动生成</span>
            <Badge variant="secondary">{userStats?.aiTasks || 45} 个</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">智能回复建议</span>
            <Badge variant="secondary">{userStats?.aiReplies || 12} 次</Badge>
          </div>
        </div>
      </div>
    </div>
  )

  const HelpSection = () => (
    <div className="space-y-6">
      {/* 帮助中心 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-700">帮助中心</h3>
        </div>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-between">
            <span>使用指南</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>常见问题</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>快捷键说明</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>联系客服</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-700">数据管理</h3>
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-between bg-transparent">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>导出数据</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>导入数据</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between text-red-600 hover:text-red-700 bg-transparent">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span>清除缓存</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 关于应用 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-700">关于应用</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">应用版本</span>
            <span className="font-medium">v2.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">构建版本</span>
            <span className="font-medium">20241228</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">更新时间</span>
            <span className="font-medium">2024年12月28日</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" className="w-full justify-between">
            <span>隐私政策</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>服务条款</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="pt-4">
        <Button variant="outline" className="w-full text-red-600 hover:text-red-700 border-red-200 bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "settings":
        return <SettingsSection />
      case "stats":
        return <StatsSection />
      case "help":
        return <HelpSection />
      default:
        return <OverviewSection />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {activeSection !== "overview" && (
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("overview")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-medium">
            {activeSection === "overview" && "我的"}
            {activeSection === "settings" && "设置"}
            {activeSection === "stats" && "统计"}
            {activeSection === "help" && "帮助"}
          </h1>
        </div>
        {activeSection === "overview" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* 导航标签 */}
      {activeSection === "overview" && (
        <div className="flex border-b bg-gray-50">
          <button
            className="flex-1 py-3 text-sm font-medium border-b-2 border-orange-500 text-orange-600 bg-white"
            onClick={() => setActiveSection("overview")}
          >
            概览
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-gray-600" onClick={() => setActiveSection("stats")}>
            统计
          </button>
          <button
            className="flex-1 py-3 text-sm font-medium text-gray-600"
            onClick={() => setActiveSection("settings")}
          >
            设置
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-gray-600" onClick={() => setActiveSection("help")}>
            帮助
          </button>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </div>
  )
}
