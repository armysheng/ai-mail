"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Paperclip,
  MoreVertical,
  Search,
  Plus,
  X,
  Settings,
  Star,
  Download,
  Send,
  CalendarIcon,
  User,
  Mail,
  Users,
  Sparkles,
  List,
} from "lucide-react"
import { TaskCard, ScheduleCard, MarketingCard, InfoCard } from "@/components/ai-cards"
import { ContactSelector } from "@/components/contact-selector"
import { Calendar } from "@/components/calendar"
import { EventForm } from "@/components/event-form"
import { NotificationCenter, FloatingNotification } from "@/components/notification-center"
import { ProfilePage } from "@/components/profile-page"

export default function EmailApp() {
  const [activeTab, setActiveTab] = useState("inbox")
  const [viewMode, setViewMode] = useState("normal") // normal | ai
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [isComposing, setIsComposing] = useState(false)
  const [emailFilter, setEmailFilter] = useState("all") // 统一的邮件分类筛选
  const [contactFilter, setContactFilter] = useState("all")
  const [selectedContacts, setSelectedContacts] = useState([])

  // 用户统计数据
  const [userStats, setUserStats] = useState({
    todayReceived: 12,
    todaySent: 8,
    unread: 5,
    todayEvents: 3,
    weekEvents: 12,
    pendingEvents: 2,
    totalReceived: 1234,
    totalSent: 567,
    avgDaily: 23,
    responseRate: 89,
    aiClassified: 156,
    aiSchedules: 23,
    aiTasks: 45,
    aiReplies: 12,
  })

  // 日程和通知相关状态
  const [calendarEvents, setCalendarEvents] = useState([
    {
      id: 1,
      title: "产品评审会议",
      date: "2024-12-29",
      time: "14:00-16:00",
      location: "会议室A",
      attendees: ["张三", "李四", "王五"],
      type: "meeting",
      source: "manual", // manual | ai
      relatedEmailId: null,
      description: "讨论Q1产品规划",
      status: "confirmed", // confirmed | tentative | cancelled
      reminders: [
        { type: "15分钟前", minutes: 15, enabled: true },
        { type: "1小时前", minutes: 60, enabled: true },
      ],
    },
    {
      id: 2,
      title: "客户拜访",
      date: "2024-12-30",
      time: "09:30-11:30",
      location: "客户公司",
      attendees: ["销售经理"],
      type: "event",
      source: "manual",
      relatedEmailId: null,
      description: "年终总结会议",
      status: "confirmed",
      reminders: [{ type: "30分钟前", minutes: 30, enabled: true }],
    },
    {
      id: 3,
      title: "项目截止日期",
      date: "2025-01-05",
      time: "23:59",
      location: "线上提交",
      attendees: [],
      type: "deadline",
      source: "manual",
      relatedEmailId: null,
      description: "项目最终提交",
      status: "confirmed",
      reminders: [
        { type: "1天前", minutes: 1440, enabled: true },
        { type: "1小时前", minutes: 60, enabled: true },
      ],
    },
  ])

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [floatingNotifications, setFloatingNotifications] = useState([])

  // 生成通知
  useEffect(() => {
    const generateNotifications = () => {
      const allNotifications = []

      calendarEvents.forEach((event) => {
        if (event.reminders) {
          event.reminders
            .filter((reminder) => reminder.enabled)
            .forEach((reminder) => {
              const eventDateTime = new Date(`${event.date} ${event.time.split("-")[0]}`)
              const reminderTime = new Date(eventDateTime.getTime() - reminder.minutes * 60000)

              allNotifications.push({
                id: `${event.id}-${reminder.minutes}`,
                eventId: event.id,
                reminderType: reminder.type,
                triggerTime: reminderTime.toISOString(),
                urgency: reminder.minutes <= 15 ? "high" : reminder.minutes <= 60 ? "medium" : "low",
                dismissed: false,
                snoozed: false,
                event: event,
              })
            })
        }
      })

      setNotifications(allNotifications)
    }

    generateNotifications()
  }, [calendarEvents])

  // 检查是否有新的通知需要显示
  useEffect(() => {
    const checkForFloatingNotifications = () => {
      const now = new Date()
      const newFloatingNotifications = notifications.filter((notification) => {
        const notificationTime = new Date(notification.triggerTime)
        const timeDiff = now.getTime() - notificationTime.getTime()

        // 在触发时间的前后1分钟内显示浮动通知
        return (
          timeDiff >= 0 &&
          timeDiff <= 60000 &&
          !notification.dismissed &&
          !notification.snoozed &&
          !floatingNotifications.some((fn) => fn.id === notification.id)
        )
      })

      if (newFloatingNotifications.length > 0) {
        setFloatingNotifications((prev) => [...prev, ...newFloatingNotifications])
      }
    }

    const interval = setInterval(checkForFloatingNotifications, 30000) // 每30秒检查一次
    checkForFloatingNotifications() // 立即检查一次

    return () => clearInterval(interval)
  }, [notifications, floatingNotifications])

  // 修复日期转换逻辑
  const convertDateToStandardFormat = (dateString) => {
    console.log("Converting date:", dateString)
    const today = new Date()

    if (dateString.includes("月") && dateString.includes("日")) {
      // 处理中文日期格式，如 "12月29日"
      const year = today.getFullYear()
      const monthStr = dateString.split("月")[0]
      const dayStr = dateString.split("月")[1].replace("日", "")
      const month = Number.parseInt(monthStr)
      const day = Number.parseInt(dayStr)
      const result = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
      console.log("Chinese date converted:", dateString, "->", result)
      return result
    }

    // 处理相对日期
    let targetDate
    switch (dateString) {
      case "今天":
        targetDate = new Date(today)
        break
      case "明天":
        targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        break
      case "本周末":
        // 找到本周六
        const daysUntilSaturday = (6 - today.getDay()) % 7 || 7 // 如果今天是周六，则是下周六
        targetDate = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000)
        break
      case "下周六":
        // 找到下周六
        const daysUntilNextSaturday = ((6 - today.getDay()) % 7) + 7
        targetDate = new Date(today.getTime() + daysUntilNextSaturday * 24 * 60 * 60 * 1000)
        break
      case "下个月":
        // 下个月的今天
        targetDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
        break
      default:
        // 如果已经是标准格式或其他格式，直接返回
        console.log("Using original date:", dateString)
        return dateString
    }

    const result = targetDate.toISOString().split("T")[0]
    console.log("Relative date converted:", dateString, "->", result)
    return result
  }

  // 添加日程管理函数
  const handleAddToCalendar = (scheduleCard) => {
    console.log("Adding schedule to calendar:", scheduleCard)
    const standardDate = convertDateToStandardFormat(scheduleCard.date)
    console.log("Converted date:", standardDate)

    const newEvent = {
      id: Date.now(), // 简单的ID生成
      title: scheduleCard.title,
      date: standardDate,
      time: scheduleCard.time,
      location: scheduleCard.location || "",
      attendees: scheduleCard.attendees || [],
      type: scheduleCard.type,
      source: "ai",
      relatedEmailId: scheduleCard.relatedEmailId,
      description: `从邮件自动添加：${scheduleCard.title}`,
      status: "tentative", // AI添加的默认为待确认
      reminders: [{ type: "15分钟前", minutes: 15, enabled: true }],
    }

    console.log("New event created:", newEvent)
    setCalendarEvents((prev) => {
      const updated = [...prev, newEvent]
      console.log("Updated calendar events:", updated)
      return updated
    })

    // 显示成功消息
    alert(`已添加到日历: ${newEvent.title} (${standardDate})`)
  }

  const handleSetReminder = (scheduleCard) => {
    // 直接为AI日程卡片设置提醒，不添加到日历
    const reminderNotification = {
      id: `reminder-${Date.now()}`,
      eventId: `ai-${scheduleCard.id}`,
      reminderType: "15分钟前",
      triggerTime: new Date(Date.now() + 15 * 60000).toISOString(), // 15分钟后触发（演示用）
      urgency: "high",
      dismissed: false,
      snoozed: false,
      event: {
        id: `ai-${scheduleCard.id}`,
        title: scheduleCard.title,
        date: convertDateToStandardFormat(scheduleCard.date),
        time: scheduleCard.time,
        location: scheduleCard.location || "",
        type: scheduleCard.type,
        source: "ai",
      },
    }

    setNotifications((prev) => [...prev, reminderNotification])
    console.log("已设置提醒:", scheduleCard.title)
  }

  const handleCreateEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      ...eventData,
      source: "manual",
      relatedEmailId: null,
      status: "confirmed",
    }

    setCalendarEvents((prev) => [...prev, newEvent])
    setIsCreatingEvent(false)
  }

  const handleUpdateEvent = (eventId, updates) => {
    setCalendarEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, ...updates } : event)))
  }

  const handleDeleteEvent = (eventId) => {
    setCalendarEvents((prev) => prev.filter((event) => event.id !== eventId))
    // 同时删除相关通知
    setNotifications((prev) => prev.filter((notification) => notification.eventId !== eventId))
    setSelectedEvent(null)
  }

  const handleDismissNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, dismissed: true } : notification,
      ),
    )
    setFloatingNotifications((prev) => prev.filter((fn) => fn.id !== notificationId))
  }

  const handleSnoozeNotification = (notificationId, minutes) => {
    const newTriggerTime = new Date(Date.now() + minutes * 60000).toISOString()

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              snoozed: true,
              triggerTime: newTriggerTime,
              reminderType: `${minutes}分钟后`,
            }
          : notification,
      ),
    )
    setFloatingNotifications((prev) => prev.filter((fn) => fn.id !== notificationId))
  }

  const handleViewEventFromNotification = (event) => {
    if (event.source === "ai") {
      // 如果是AI事件，跳转到对应的邮件
      const relatedEmail = emails.find((email) => email.id === event.relatedEmailId)
      if (relatedEmail) {
        setSelectedEmail(relatedEmail)
      }
    } else {
      // 如果是日历事件，打开事件编辑
      const calendarEvent = calendarEvents.find((e) => e.id === event.id)
      if (calendarEvent) {
        setSelectedEvent(calendarEvent)
        setActiveTab("calendar")
      }
    }
    setIsNotificationCenterOpen(false)
  }

  // 处理设置更新
  const handleUpdateSettings = (category, key, value) => {
    console.log(`Setting updated: ${category}.${key} = ${value}`)
    // 这里可以添加设置保存逻辑
  }

  // 重新设计tab体系 - 私人和社交合并

  // 普通视角的tab - 私人和社交合并
  const normalViewTabs = [
    { key: "all", label: "全部", icon: "📧", description: "所有邮件" },
    { key: "work", label: "工作", icon: "💼", description: "工作相关邮件" },
    { key: "personal", label: "私人", icon: "👤", description: "个人和社交邮件" },
    { key: "promotion", label: "推广", icon: "📢", description: "营销、通知、资讯" },
    { key: "other", label: "其他", icon: "❓", description: "分类失败的邮件" },
  ]

  // AI视角的tab - 营销放最后
  const aiViewTabs = [
    { key: "all", label: "全部", icon: "✨", description: "所有AI卡片" },
    { key: "tasks", label: "任务", icon: "📋", description: "任务卡片" },
    { key: "schedules", label: "日程", icon: "📅", description: "日程卡片" },
    { key: "info", label: "信息", icon: "📊", description: "信息汇总" },
    { key: "marketing", label: "营销", icon: "💰", description: "营销卡片" },
  ]

  // 联系人数据
  const allContacts = [
    {
      name: "安小妮",
      email: "angie@example.com",
      avatar: "安",
      color: "bg-purple-100 text-purple-600",
      category: "team",
    },
    {
      name: "陈明",
      email: "chenming@example.com",
      avatar: "陈",
      color: "bg-orange-100 text-orange-600",
      category: "frequent",
    },
    {
      name: "崔婷婷",
      email: "cuitt@example.com",
      avatar: "崔",
      color: "bg-green-100 text-green-600",
      category: "team",
    },
    {
      name: "李总监",
      email: "director.li@example.com",
      avatar: "李",
      color: "bg-yellow-100 text-yellow-600",
      category: "frequent",
    },
    { name: "刘嘉", email: "liujia@example.com", avatar: "刘", color: "bg-pink-100 text-pink-600", category: "team" },
    {
      name: "王小华",
      email: "wangxh@example.com",
      avatar: "王",
      color: "bg-blue-100 text-blue-600",
      category: "family",
    },
    { name: "张三", email: "zhangsan@example.com", avatar: "张", color: "bg-red-100 text-red-600", category: "team" },
    {
      name: "李四",
      email: "lisi@example.com",
      avatar: "李",
      color: "bg-indigo-100 text-indigo-600",
      category: "frequent",
    },
  ]

  // 扩展的邮件数据 - 私人和社交邮件保持原分类，但在筛选时合并
  const emails = [
    {
      id: 1,
      sender: "张小明",
      subject: "项目进度更新",
      preview: "嗨，团队成员们，这是本周项目进度的最新更新...",
      time: "09:42",
      avatar: "张",
      color: "bg-blue-100 text-blue-600",
      category: "work",
      isRead: false,
      content: `嗨，团队成员们，

这是本周项目进度的最新更新情况，我们已经完成了以下工作：

• 用户界面设计完成度 90%
• 后端API开发完成度 75%
• 数据库优化工作完成度 85%
• 自动化测试用例编写完成度 60%

根据目前的进度，我们预计可以在下周五前完成所有开发工作，然后进入为期两周的测试阶段。

请各位同事抓紧时间完成自己负责的模块，如有任何问题或需要协助，请及时与我联系。

祝好，
张小明

项目经理 | 技术部`,
      attachments: [{ name: "项目进度报告.xlsx", size: "2.4MB" }],
    },
    {
      id: 2,
      sender: "Apple Store",
      subject: "iPhone 15 Pro 限时优惠",
      preview: "您好，iPhone 15 Pro 现在享受教育优惠，立减800元...",
      time: "昨天",
      avatar: "🍎",
      color: "bg-gray-100 text-gray-600",
      category: "marketing",
      isRead: true,
    },
    {
      id: 3,
      sender: "人力资源部",
      subject: "关于年度考核的通知",
      preview: "各位同事，根据公司规定，本季度的绩效考核将...",
      time: "周一",
      avatar: "人",
      color: "bg-purple-100 text-purple-600",
      category: "work",
      isRead: true,
    },
    {
      id: 4,
      sender: "妈妈",
      subject: "周末回家吃饭",
      preview: "儿子，这周末有空回家吃饭吗？妈妈给你做你最爱吃的红烧肉...",
      time: "12/20",
      avatar: "妈",
      color: "bg-pink-100 text-pink-600",
      category: "personal",
      isRead: false,
    },
    {
      id: 5,
      sender: "微信团队",
      subject: "您有新的朋友圈点赞",
      preview: "李四、王五等3位好友赞了您的朋友圈...",
      time: "12/18",
      avatar: "微",
      color: "bg-green-100 text-green-600",
      category: "social",
      isRead: true,
    },
    {
      id: 6,
      sender: "支付宝",
      subject: "您的账单已生成",
      preview: "您好，您的12月账单已生成，本月支出2,580元...",
      time: "12/15",
      avatar: "支",
      color: "bg-blue-100 text-blue-600",
      category: "notifications",
      isRead: false,
    },
    {
      id: 7,
      sender: "36氪",
      subject: "今日科技资讯精选",
      preview: "AI大模型最新进展、苹果发布新品、特斯拉股价上涨...",
      time: "12/14",
      avatar: "36",
      color: "bg-orange-100 text-orange-600",
      category: "news",
      isRead: true,
    },
    {
      id: 8,
      sender: "老同学小王",
      subject: "同学聚会邀请",
      preview: "嗨！下个月我们班要组织同学聚会，你有时间参加吗？...",
      time: "12/12",
      avatar: "王",
      color: "bg-yellow-100 text-yellow-600",
      category: "personal",
      isRead: false,
    },
    {
      id: 9,
      sender: "京东商城",
      subject: "年终大促开始啦",
      preview: "全场满减、限时秒杀、优惠券大放送，错过再等一年...",
      time: "12/10",
      avatar: "京",
      color: "bg-red-100 text-red-600",
      category: "marketing",
      isRead: true,
    },
    {
      id: 10,
      sender: "GitHub",
      subject: "Security alert for your repository",
      preview: "We found a potential security vulnerability in your repository...",
      time: "12/08",
      avatar: "Git",
      color: "bg-gray-100 text-gray-600",
      category: "notifications",
      isRead: false,
    },
    // 添加一些"其他"分类的邮件
    {
      id: 11,
      sender: "unknown@spam.com",
      subject: "恭喜您中奖了！",
      preview: "尊敬的用户，恭喜您在我们的抽奖活动中获得一等奖...",
      time: "12/05",
      avatar: "?",
      color: "bg-gray-100 text-gray-600",
      category: "other",
      isRead: false,
    },
    {
      id: 12,
      sender: "邮件系统",
      subject: "邮件投递失败",
      preview: "您发送给 test@example.com 的邮件投递失败...",
      time: "12/03",
      avatar: "📧",
      color: "bg-gray-100 text-gray-600",
      category: "other",
      isRead: true,
    },
    // 添加更多社交邮件
    {
      id: 13,
      sender: "LinkedIn",
      subject: "您有新的职位推荐",
      preview: "基于您的技能和经验，我们为您推荐了3个新职位...",
      time: "12/01",
      avatar: "💼",
      color: "bg-blue-100 text-blue-600",
      category: "social",
      isRead: false,
    },
    {
      id: 14,
      sender: "好友小李",
      subject: "生日聚会邀请",
      preview: "嗨！下周六是我的生日，想邀请你来参加生日聚会...",
      time: "11/28",
      avatar: "李",
      color: "bg-green-100 text-green-600",
      category: "personal",
      isRead: true,
    },
  ]

  // AI卡片数据 - 基于邮件内容生成
  const aiCards = {
    tasks: [
      {
        id: 1,
        title: "完成项目进度报告",
        description: "需要整理本周的开发进度，包括前端、后端和测试的完成情况",
        priority: "high",
        dueDate: "今天 18:00",
        assignee: "张小明",
        isRead: false,
        relatedEmailId: 1,
        type: "deliverable",
        estimatedTime: "2小时",
      },
      {
        id: 2,
        title: "参加年度考核",
        description: "准备年度考核材料，包括工作总结和自我评价",
        priority: "medium",
        dueDate: "下周五",
        assignee: "我",
        isRead: true,
        relatedEmailId: 3,
        type: "review",
        estimatedTime: "1小时",
      },
      {
        id: 3,
        title: "回复同学聚会邀请",
        description: "确认是否参加下个月的同学聚会",
        priority: "low",
        dueDate: "本周内",
        assignee: "我",
        isRead: false,
        relatedEmailId: 8,
        type: "communication",
        estimatedTime: "10分钟",
      },
    ],
    schedules: [
      {
        id: 1,
        title: "产品评审会议",
        type: "meeting",
        date: "12月29日",
        time: "14:00-16:00",
        location: "会议室A",
        attendees: ["张三", "李四", "王五", "赵六"],
        isRead: false,
        relatedEmailId: 1,
        hasConflict: false,
        meetingType: "internal",
      },
      {
        id: 2,
        title: "周末回家吃饭",
        type: "event",
        date: "本周末",
        time: "18:00",
        location: "家里",
        attendees: ["妈妈", "爸爸"],
        isRead: false,
        relatedEmailId: 4,
        hasConflict: false,
        meetingType: "personal",
      },
      {
        id: 3,
        title: "同学聚会",
        type: "event",
        date: "下个月",
        time: "待定",
        location: "待定",
        attendees: ["老同学们"],
        isRead: false,
        relatedEmailId: 8,
        hasConflict: false,
        meetingType: "social",
      },
      {
        id: 4,
        title: "小李生日聚会",
        type: "event",
        date: "下周六",
        time: "19:00",
        location: "待定",
        attendees: ["小李", "朋友们"],
        isRead: true,
        relatedEmailId: 14,
        hasConflict: false,
        meetingType: "social",
      },
    ],
    marketing: [
      {
        id: 1,
        brand: "Apple Store",
        category: "数码产品",
        totalSavings: 800,
        expiryDate: "12月31日",
        promotions: [
          { title: "iPhone 15 Pro", discount: "教育优惠¥800" },
          { title: "MacBook Air", discount: "限时9折" },
          { title: "AirPods Pro", discount: "买一送一" },
        ],
        isRead: true,
        relatedEmailId: 2,
      },
      {
        id: 2,
        brand: "京东商城",
        category: "年终大促",
        totalSavings: 500,
        expiryDate: "1月1日",
        promotions: [
          { title: "家电满减", discount: "满1000减100" },
          { title: "服装特卖", discount: "全场5折起" },
          { title: "图书优惠", discount: "满99减20" },
        ],
        isRead: true,
        relatedEmailId: 9,
      },
    ],
    info: [
      {
        id: 1,
        title: "工作邮件汇总",
        category: "工作报告",
        count: 2,
        summary: "收到2封工作相关邮件，包括项目进度更新、年度考核通知等",
        tags: ["工作", "项目", "考核"],
        isRead: false,
        relatedEmailId: 1,
      },
      {
        id: 2,
        title: "私人社交汇总",
        category: "私人社交",
        count: 5,
        summary: "收到5封私人和社交邮件，包括家人问候、朋友邀请、社交网络通知等",
        tags: ["家人", "朋友", "社交", "聚会"],
        isRead: false,
        relatedEmailId: 4,
      },
      {
        id: 3,
        title: "推广信息汇总",
        category: "推广信息",
        count: 4,
        summary: "收到4封推广相关邮件，包括营销优惠、系统通知、新闻资讯等",
        tags: ["优惠", "通知", "资讯"],
        isRead: false,
        relatedEmailId: 6,
      },
    ],
  }

  // 根据筛选条件获取联系人
  const getFilteredContacts = () => {
    switch (contactFilter) {
      case "frequent":
        return allContacts.filter((contact) => contact.category === "frequent")
      case "team":
        return allContacts.filter((contact) => contact.category === "team")
      case "family":
        return allContacts.filter((contact) => contact.category === "family")
      default:
        return allContacts
    }
  }

  const ComposeEmail = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsComposing(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">新邮件</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">收件人</label>
          <ContactSelector
            contacts={allContacts}
            selectedContacts={selectedContacts}
            onSelectContact={(contact) => setSelectedContacts([...selectedContacts, contact])}
            onRemoveContact={(contact) =>
              setSelectedContacts(selectedContacts.filter((c) => c.email !== contact.email))
            }
          />
          <div className="flex gap-4 mt-2">
            <button className="text-sm text-gray-600">添加抄送</button>
            <button className="text-sm text-gray-600">添加密送</button>
          </div>
        </div>

        <div>
          <Input placeholder="主题" />
        </div>

        <div className="flex-1">
          <Textarea placeholder="撰写邮件..." className="min-h-[200px] resize-none border-0 p-0 focus-visible:ring-0" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <span className="text-xs">📄</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">会议纪要.docx</div>
              <div className="text-xs text-gray-500">1.2MB</div>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <span className="text-xs">🖼️</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">屏幕截图.png</div>
              <div className="text-xs text-gray-500">856KB</div>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <span className="text-lg">🖼️</span>
            </Button>
            <Button variant="ghost" size="icon">
              <span className="text-lg">😊</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8">发送</Button>
        </div>
      </div>
    </div>
  )

  const ContactsList = () => {
    const filteredContacts = getFilteredContacts()

    // 按首字母分组
    const groupedContacts = filteredContacts.reduce((groups, contact) => {
      const firstLetter = contact.name[0].toUpperCase()
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(contact)
      return groups
    }, {})

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-medium">联系人</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              contactFilter === "all" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
            }`}
            onClick={() => setContactFilter("all")}
          >
            全部
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              contactFilter === "frequent" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
            }`}
            onClick={() => setContactFilter("frequent")}
          >
            常用
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              contactFilter === "team" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
            }`}
            onClick={() => setContactFilter("team")}
          >
            团队
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              contactFilter === "family" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
            }`}
            onClick={() => setContactFilter("family")}
          >
            家人
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedContacts)
            .sort()
            .map((letter) => (
              <div key={letter} className="p-4">
                <div className="text-sm font-medium text-gray-500 mb-3">{letter}</div>
                <div className="space-y-3">
                  {groupedContacts[letter].map((contact, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={contact.color}>{contact.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无联系人</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const EmailList = () => {
    const currentTabs = viewMode === "normal" ? normalViewTabs : aiViewTabs

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-medium">收件箱</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <div className="relative">
              <NotificationCenter
                notifications={notifications}
                onDismiss={handleDismissNotification}
                onSnooze={handleSnoozeNotification}
                onViewEvent={handleViewEventFromNotification}
                isOpen={isNotificationCenterOpen}
                onToggle={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              />
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 视角切换 */}
        <div className="flex border-b bg-gray-50">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              viewMode === "normal" ? "border-b-2 border-orange-500 text-orange-600 bg-white" : "text-gray-600"
            }`}
            onClick={() => {
              setViewMode("normal")
              setEmailFilter("all") // 切换视角时重置筛选
            }}
          >
            <List className="h-4 w-4" />
            普通视角
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              viewMode === "ai" ? "border-b-2 border-orange-500 text-orange-600 bg-white" : "text-gray-600"
            }`}
            onClick={() => {
              setViewMode("ai")
              setEmailFilter("all") // 切换视角时重置筛选
            }}
          >
            <Sparkles className="h-4 w-4" />
            AI视角
          </button>
        </div>

        {/* 动态tab筛选 */}
        <div className="flex gap-1 p-2 border-b bg-gray-50 overflow-x-auto">
          {currentTabs.map((tab) => {
            let count = 0
            let unreadCount = 0

            if (viewMode === "normal") {
              // 普通视角：统计邮件数量
              if (tab.key === "all") {
                count = emails.length
                unreadCount = emails.filter((e) => !e.isRead).length
              } else if (tab.key === "personal") {
                // 私人：个人和社交邮件合并
                const personalEmails = emails.filter((e) => e.category === "personal" || e.category === "social")
                count = personalEmails.length
                unreadCount = personalEmails.filter((e) => !e.isRead).length
              } else if (tab.key === "promotion") {
                // 推广：营销、通知、资讯合并
                const promotionEmails = emails.filter(
                  (e) => e.category === "marketing" || e.category === "notifications" || e.category === "news",
                )
                count = promotionEmails.length
                unreadCount = promotionEmails.filter((e) => !e.isRead).length
              } else if (tab.key === "other") {
                // 其他：分类失败的邮件
                const otherEmails = emails.filter((e) => e.category === "other")
                count = otherEmails.length
                unreadCount = otherEmails.filter((e) => !e.isRead).length
              } else {
                count = emails.filter((e) => e.category === tab.key).length
                unreadCount = emails.filter((e) => e.category === tab.key && !e.isRead).length
              }
            } else {
              // AI视角：统计AI卡片数量
              if (tab.key === "all") {
                count = aiCards.tasks.length + aiCards.schedules.length + aiCards.marketing.length + aiCards.info.length
                unreadCount = [...aiCards.tasks, ...aiCards.schedules, ...aiCards.marketing, ...aiCards.info].filter(
                  (card) => !card.isRead,
                ).length
              } else if (tab.key === "tasks") {
                count = aiCards.tasks.length
                unreadCount = aiCards.tasks.filter((task) => !task.isRead).length
              } else if (tab.key === "schedules") {
                count = aiCards.schedules.length
                unreadCount = aiCards.schedules.filter((schedule) => !schedule.isRead).length
              } else if (tab.key === "marketing") {
                count = aiCards.marketing.length
                unreadCount = aiCards.marketing.filter((marketing) => !marketing.isRead).length
              } else if (tab.key === "info") {
                count = aiCards.info.length
                unreadCount = aiCards.info.filter((info) => !info.isRead).length
              }
            }

            return (
              <button
                key={tab.key}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  emailFilter === tab.key
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setEmailFilter(tab.key)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="text-xs text-gray-500">({count})</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {viewMode === "normal" ? <NormalView /> : <AIView />}
      </div>
    )
  }

  // 更新NormalView以支持私人和社交合并
  const NormalView = () => {
    const getFilteredEmails = () => {
      if (emailFilter === "all") {
        return emails
      } else if (emailFilter === "personal") {
        // 私人：个人和社交邮件合并
        return emails.filter((e) => e.category === "personal" || e.category === "social")
      } else if (emailFilter === "promotion") {
        // 推广：营销、通知、资讯合并
        return emails.filter(
          (e) => e.category === "marketing" || e.category === "notifications" || e.category === "news",
        )
      } else if (emailFilter === "other") {
        // 其他：分类失败的邮件
        return emails.filter((e) => e.category === "other")
      } else {
        return emails.filter((email) => email.category === emailFilter)
      }
    }

    const filteredEmails = getFilteredEmails()

    return (
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无邮件</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              className={`flex items-start gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer ${
                !email.isRead ? "bg-blue-50" : ""
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              <Avatar className="w-10 h-10 mt-1">
                <AvatarFallback className={email.color}>{email.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className={`truncate ${!email.isRead ? "font-semibold" : "font-medium"}`}>{email.sender}</div>
                  <div className="text-xs text-gray-500 ml-2">{email.time}</div>
                </div>
                <div className={`text-sm mb-1 truncate ${!email.isRead ? "font-semibold" : "font-medium"}`}>
                  {!email.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2" />}
                  {email.subject}
                </div>
                <div className="text-sm text-gray-600 truncate">{email.preview}</div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  // 更新AIView - 营销放最后
  const AIView = () => {
    const getFilteredCards = () => {
      let cards = []

      switch (emailFilter) {
        case "tasks":
          cards = aiCards.tasks.map((task) => ({ type: "task", data: task }))
          break
        case "schedules":
          cards = aiCards.schedules.map((schedule) => ({ type: "schedule", data: schedule }))
          break
        case "marketing":
          cards = aiCards.marketing.map((marketing) => ({ type: "marketing", data: marketing }))
          break
        case "info":
          cards = aiCards.info.map((info) => ({ type: "info", data: info }))
          break
        default:
          // 全部 - 营销放在最后
          cards = [
            ...aiCards.tasks.map((task) => ({ type: "task", data: task })),
            ...aiCards.schedules.map((schedule) => ({ type: "schedule", data: schedule })),
            ...aiCards.info.map((info) => ({ type: "info", data: info })),
            ...aiCards.marketing.map((marketing) => ({ type: "marketing", data: marketing })), // 营销放最后
          ]
      }

      // 按已读未读排序，未读的排在前面
      return cards.sort((a, b) => {
        if (a.data.isRead === b.data.isRead) return 0
        return a.data.isRead ? 1 : -1
      })
    }

    const filteredCards = getFilteredCards()

    return (
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无相关内容</p>
          </div>
        ) : (
          filteredCards.map((card, index) => {
            switch (card.type) {
              case "task":
                return (
                  <TaskCard
                    key={`task-${card.data.id}`}
                    task={card.data}
                    onComplete={() => console.log("完成任务:", card.data.id)}
                    onPostpone={() => console.log("推迟任务:", card.data.id)}
                    onViewOriginal={() => handleViewOriginalEmail(card.data.relatedEmailId)}
                  />
                )
              case "schedule":
                return (
                  <ScheduleCard
                    key={`schedule-${card.data.id}`}
                    schedule={card.data}
                    onAddToCalendar={() => handleAddToCalendar(card.data)}
                    onSetReminder={() => handleSetReminder(card.data)}
                    onViewOriginal={() => handleViewOriginalEmail(card.data.relatedEmailId)}
                  />
                )
              case "marketing":
                return (
                  <MarketingCard
                    key={`marketing-${card.data.id}`}
                    marketing={card.data}
                    onViewDetails={() => console.log("查看详情:", card.data.id)}
                    onAddToWishlist={() => console.log("添加到心愿单:", card.data.id)}
                    onViewOriginal={() => handleViewOriginalEmail(card.data.relatedEmailId)}
                  />
                )
              case "info":
                return (
                  <InfoCard
                    key={`info-${card.data.id}`}
                    info={card.data}
                    onViewDetails={() => console.log("查看详情:", card.data.id)}
                    onViewOriginal={() => handleViewOriginalEmail(card.data.relatedEmailId)}
                  />
                )
              default:
                return null
            }
          })
        )}
      </div>
    )
  }

  const EmailDetail = ({ email }) => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">邮件详情</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <span className="text-lg">↗️</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Star className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">{email.subject}</h2>
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback className={email.color}>{email.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{email.sender}</div>
              <div className="text-sm text-gray-500">发送至：我 ▼</div>
            </div>
            <div className="text-sm text-gray-500">今天 {email.time}</div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none mb-6">
          <div className="whitespace-pre-line text-sm leading-relaxed">{email.content || email.preview}</div>
        </div>

        {email.attachments && (
          <div className="mb-6">
            {email.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <span className="text-xs">📊</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{attachment.name}</div>
                  <div className="text-xs text-gray-500">{attachment.size}</div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Input placeholder="回复..." className="flex-1" />
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )

  const handleViewOriginalEmail = (emailId) => {
    const email = emails.find((e) => e.id === emailId)
    setSelectedEmail(email)
  }

  // 如果正在创建或编辑事件
  if (isCreatingEvent || selectedEvent) {
    return (
      <EventForm
        event={selectedEvent}
        onSave={(eventData) => {
          if (selectedEvent) {
            handleUpdateEvent(selectedEvent.id, eventData)
            setSelectedEvent(null)
          } else {
            handleCreateEvent(eventData)
          }
        }}
        onCancel={() => {
          setIsCreatingEvent(false)
          setSelectedEvent(null)
        }}
        onDelete={selectedEvent ? handleDeleteEvent : null}
        contacts={allContacts}
      />
    )
  }

  if (isComposing) {
    return <ComposeEmail />
  }

  if (selectedEmail) {
    return <EmailDetail email={selectedEmail} />
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-hidden">
        {activeTab === "inbox" && <EmailList />}
        {activeTab === "contacts" && <ContactsList />}
        {activeTab === "calendar" && (
          <Calendar
            events={calendarEvents}
            notifications={notifications}
            onCreateEvent={() => setIsCreatingEvent(true)}
            onEventClick={(event) => setSelectedEvent(event)}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onDismissNotification={handleDismissNotification}
            onSnoozeNotification={handleSnoozeNotification}
            onViewEventFromNotification={handleViewEventFromNotification}
          />
        )}
        {activeTab === "profile" && (
          <ProfilePage
            userStats={userStats}
            onUpdateSettings={handleUpdateSettings}
            onBack={() => setActiveTab("inbox")}
          />
        )}
      </div>

      <div className="bg-white border-t">
        <div className="flex items-center justify-around py-2">
          <button
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === "inbox" ? "text-orange-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("inbox")}
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">邮件</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === "contacts" ? "text-orange-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("contacts")}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">联系人</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2" onClick={() => setIsComposing(true)}>
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </button>
          <button
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === "calendar" ? "text-orange-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("calendar")}
          >
            <CalendarIcon className="h-5 w-5" />
            <span className="text-xs">日历</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === "profile" ? "text-orange-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("profile")}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">我的</span>
          </button>
        </div>
      </div>

      {/* 浮动通知 */}
      {floatingNotifications.map((notification) => (
        <FloatingNotification
          key={notification.id}
          notification={notification}
          onDismiss={handleDismissNotification}
          onSnooze={handleSnoozeNotification}
          onViewEvent={handleViewEventFromNotification}
        />
      ))}
    </div>
  )
}
