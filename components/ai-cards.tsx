"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Star,
  MoreHorizontal,
  ChevronRight,
  Tag,
  MapPin,
  DollarSign,
  Bell,
} from "lucide-react"

// 任务卡片组件 - 强调"要做什么"
export function TaskCard({ task, onComplete, onPostpone, onViewOriginal }) {
  const getTaskTypeIcon = (type) => {
    switch (type) {
      case "deliverable":
        return "📋"
      case "review":
        return "👀"
      case "communication":
        return "💬"
      default:
        return "✅"
    }
  }

  const getTaskTypeLabel = (type) => {
    switch (type) {
      case "deliverable":
        return "可交付"
      case "review":
        return "审核"
      case "communication":
        return "沟通"
      default:
        return "任务"
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border mb-3 ${
        !task.isRead ? "border-blue-200 shadow-md" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {!task.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
            <span className="text-sm">{getTaskTypeIcon(task.type)}</span>
            <span className="text-xs text-orange-700 font-medium">{getTaskTypeLabel(task.type)}</span>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
            }`}
          />
          <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs">
            {task.priority === "high" ? "高优先级" : task.priority === "medium" ? "中优先级" : "低优先级"}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <h3 className={`font-medium mb-2 ${!task.isRead ? "text-gray-900 font-semibold" : "text-gray-900"}`}>
        {task.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>截止: {task.dueDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{task.assignee}</span>
        </div>
        {task.estimatedTime && (
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>预计: {task.estimatedTime}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Button size="sm" onClick={onComplete} className="flex-1 h-8 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          完成任务
        </Button>
        <Button variant="outline" size="sm" onClick={onPostpone} className="flex-1 h-8 bg-transparent">
          <Clock className="h-3 w-3 mr-1" />
          推迟
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onViewOriginal}
        className="w-full h-7 text-xs text-gray-500 hover:text-gray-700"
      >
        查看原邮件 →
      </Button>
    </div>
  )
}

// 日程卡片组件 - 强调"什么时候在哪里"
export function ScheduleCard({ schedule, onAddToCalendar, onSetReminder, onViewOriginal }) {
  const getScheduleTypeIcon = (type) => {
    switch (type) {
      case "meeting":
        return "🤝"
      case "event":
        return "🎯"
      case "deadline":
        return "⏰"
      default:
        return "📅"
    }
  }

  const getScheduleTypeLabel = (type) => {
    switch (type) {
      case "meeting":
        return "会议"
      case "event":
        return "活动"
      case "deadline":
        return "截止"
      default:
        return "日程"
    }
  }

  const getMeetingTypeColor = (meetingType) => {
    switch (meetingType) {
      case "internal":
        return "bg-blue-50 text-blue-700"
      case "external":
        return "bg-purple-50 text-purple-700"
      case "deadline":
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border mb-3 ${
        !schedule.isRead ? "border-blue-200 shadow-md" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {!schedule.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${getMeetingTypeColor(schedule.meetingType)}`}
          >
            <span className="text-sm">{getScheduleTypeIcon(schedule.type)}</span>
            <span className="text-xs font-medium">{getScheduleTypeLabel(schedule.type)}</span>
          </div>
          {schedule.hasConflict && (
            <Badge variant="destructive" className="text-xs">
              时间冲突
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <h3 className={`font-medium mb-2 ${!schedule.isRead ? "text-gray-900 font-semibold" : "text-gray-900"}`}>
        {schedule.title}
      </h3>

      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{schedule.date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{schedule.time}</span>
        </div>
      </div>

      {schedule.location && (
        <div className="flex items-center gap-1 mb-3 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{schedule.location}</span>
        </div>
      )}

      {schedule.attendees && schedule.attendees.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">参与者:</span>
          <div className="flex -space-x-1">
            {schedule.attendees.slice(0, 3).map((attendee, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-white">
                <AvatarFallback className="text-xs">{attendee[0]}</AvatarFallback>
              </Avatar>
            ))}
            {schedule.attendees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">+{schedule.attendees.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Button size="sm" onClick={onAddToCalendar} className="flex-1 h-8 bg-blue-600 hover:bg-blue-700">
          <Calendar className="h-3 w-3 mr-1" />
          加入日历
        </Button>
        <Button variant="outline" size="sm" onClick={onSetReminder} className="flex-1 h-8 bg-transparent">
          <Bell className="h-3 w-3 mr-1" />
          设置提醒
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onViewOriginal}
        className="w-full h-7 text-xs text-gray-500 hover:text-gray-700"
      >
        查看原邮件 →
      </Button>
    </div>
  )
}

// 营销汇总卡片组件 - 添加相同的优化
export function MarketingCard({ marketing, onViewDetails, onAddToWishlist, onViewOriginal }) {
  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm border mb-3 ${
        !marketing.isRead ? "border-purple-200 shadow-md" : "border-purple-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {!marketing.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          <Badge className="bg-purple-100 text-purple-700 text-xs">营销推广</Badge>
          {marketing.totalSavings > 0 && (
            <Badge variant="destructive" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              省¥{marketing.totalSavings}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <h3 className={`font-medium mb-2 ${!marketing.isRead ? "text-gray-900 font-semibold" : "text-gray-900"}`}>
        {marketing.brand}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        {marketing.category} • {marketing.promotions.length}个优惠
      </p>

      <div className="space-y-2 mb-3">
        {marketing.promotions.slice(0, 2).map((promo, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{promo.title}</span>
            <Badge variant="outline" className="text-xs">
              {promo.discount}
            </Badge>
          </div>
        ))}
        {marketing.promotions.length > 2 && (
          <div className="text-xs text-gray-500">还有 {marketing.promotions.length - 2} 个优惠...</div>
        )}
      </div>

      {marketing.expiryDate && (
        <div className="flex items-center gap-1 mb-3 text-xs text-orange-600">
          <AlertCircle className="h-3 w-3" />
          <span>有效期至 {marketing.expiryDate}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Button size="sm" onClick={onViewDetails} className="flex-1 h-8">
          查看详情
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
        <Button variant="outline" size="sm" onClick={onAddToWishlist} className="h-8 bg-transparent">
          <Star className="h-3 w-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onViewOriginal}
        className="w-full h-7 text-xs text-gray-500 hover:text-gray-700"
      >
        查看原邮件 →
      </Button>
    </div>
  )
}

// 信息汇总卡片组件 - 添加相同的优化
export function InfoCard({ info, onViewDetails, onViewOriginal }) {
  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border mb-3 ${
        !info.isRead ? "border-blue-200 shadow-md" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {!info.isRead && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          <Badge variant="outline" className="text-xs">
            {info.category}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{info.count}封邮件</span>
        </div>
      </div>

      <h3 className={`font-medium mb-2 ${!info.isRead ? "text-gray-900 font-semibold" : "text-gray-900"}`}>
        {info.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{info.summary}</p>

      <div className="flex items-center gap-2 mb-3">
        {info.tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            <Tag className="h-2 w-2 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        <Button variant="outline" size="sm" onClick={onViewDetails} className="w-full h-8 bg-transparent">
          查看详情
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onViewOriginal}
          className="w-full h-7 text-xs text-gray-500 hover:text-gray-700"
        >
          查看原邮件 →
        </Button>
      </div>
    </div>
  )
}
