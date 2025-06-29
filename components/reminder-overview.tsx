"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react"

export function ReminderOverview({ notifications = [], onDismiss, onSnooze, onViewEvent }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 获取今日和即将到来的提醒
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const todayReminders = notifications.filter((notification) => {
    const triggerTime = new Date(notification.triggerTime)
    return triggerTime >= todayStart && triggerTime < todayEnd && !notification.dismissed
  })

  const upcomingReminders = notifications.filter((notification) => {
    const triggerTime = new Date(notification.triggerTime)
    return triggerTime >= todayEnd && triggerTime < weekEnd && !notification.dismissed
  })

  const overdueReminders = notifications.filter((notification) => {
    const triggerTime = new Date(notification.triggerTime)
    return triggerTime < now && !notification.dismissed && !notification.snoozed
  })

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    if (date.toDateString() === today.toDateString()) {
      return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `明天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return date.toLocaleString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const totalActiveReminders = todayReminders.length + upcomingReminders.length + overdueReminders.length

  if (totalActiveReminders === 0) {
    return (
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="text-sm">暂无提醒</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg mb-4">
      {/* 头部概览 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-blue-600" />
            {totalActiveReminders > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
              >
                {totalActiveReminders}
              </Badge>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">提醒概览</h3>
            <p className="text-sm text-gray-500">
              {overdueReminders.length > 0 && `${overdueReminders.length}个逾期 • `}
              {todayReminders.length > 0 && `${todayReminders.length}个今日 • `}
              {upcomingReminders.length > 0 && `${upcomingReminders.length}个即将到来`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          {isExpanded ? "收起" : "展开"}
        </Button>
      </div>

      {/* 详细列表 */}
      {isExpanded && (
        <div className="border-t">
          {/* 逾期提醒 */}
          {overdueReminders.length > 0 && (
            <div className="p-4 border-b bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">逾期提醒 ({overdueReminders.length})</span>
              </div>
              <div className="space-y-2">
                {overdueReminders.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between bg-white p-2 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{notification.event.title}</div>
                      <div className="text-xs text-gray-500">{formatTime(notification.triggerTime)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onViewEvent(notification.event)}
                      >
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onDismiss(notification.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 今日提醒 */}
          {todayReminders.length > 0 && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">今日提醒 ({todayReminders.length})</span>
              </div>
              <div className="space-y-2">
                {todayReminders.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getUrgencyColor(notification.urgency).split(" ")[0]}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{notification.event.title}</div>
                        <div className="text-xs text-gray-500">{formatTime(notification.triggerTime)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onViewEvent(notification.event)}
                      >
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onDismiss(notification.id)}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 即将到来的提醒 */}
          {upcomingReminders.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">即将到来 ({upcomingReminders.length})</span>
              </div>
              <div className="space-y-2">
                {upcomingReminders.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getUrgencyColor(notification.urgency).split(" ")[0]}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{notification.event.title}</div>
                        <div className="text-xs text-gray-500">{formatTime(notification.triggerTime)}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => onViewEvent(notification.event)}
                    >
                      查看
                    </Button>
                  </div>
                ))}
                {upcomingReminders.length > 5 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    还有 {upcomingReminders.length - 5} 个提醒...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
