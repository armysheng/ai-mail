"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Clock, MapPin, CheckCircle, AlarmClockIcon as Snooze } from "lucide-react"

export function NotificationCenter({ notifications = [], onDismiss, onSnooze, onViewEvent, isOpen, onToggle }) {
  const [activeNotifications, setActiveNotifications] = useState([])

  // 模拟实时通知检查
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date()
      const upcomingNotifications = notifications.filter((notification) => {
        const notificationTime = new Date(notification.triggerTime)
        return notificationTime <= now && !notification.dismissed && !notification.snoozed
      })
      setActiveNotifications(upcomingNotifications)
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 60000) // 每分钟检查一次

    return () => clearInterval(interval)
  }, [notifications])

  const getNotificationIcon = (type) => {
    switch (type) {
      case "meeting":
        return "🤝"
      case "event":
        return "🎯"
      case "deadline":
        return "⏰"
      case "personal":
        return "👤"
      default:
        return "📅"
    }
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "border-red-200 bg-red-50"
      case "medium":
        return "border-yellow-200 bg-yellow-50"
      case "low":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const formatTimeUntil = (eventTime) => {
    const now = new Date()
    const event = new Date(eventTime)
    const diffMs = event.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 0) return "已开始"
    if (diffMins < 60) return `${diffMins}分钟后`
    if (diffHours < 24) return `${diffHours}小时后`
    return `${Math.floor(diffHours / 24)}天后`
  }

  return (
    <>
      {/* 通知按钮 */}
      <Button variant="ghost" size="icon" className="relative" onClick={onToggle}>
        <Bell className="h-5 w-5" />
        {activeNotifications.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {activeNotifications.length}
          </Badge>
        )}
      </Button>

      {/* 通知面板 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">通知中心</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-80">
            {activeNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {activeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-3 ${getUrgencyColor(notification.urgency)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getNotificationIcon(notification.event.type)}</span>
                        <div>
                          <h4 className="font-medium text-sm">{notification.event.title}</h4>
                          <p className="text-xs text-gray-600">
                            {formatTimeUntil(notification.event.date + " " + notification.event.time.split("-")[0])}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={notification.urgency === "high" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {notification.reminderType}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{notification.event.time}</span>
                      </div>
                      {notification.event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{notification.event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs bg-transparent"
                        onClick={() => onViewEvent(notification.event)}
                      >
                        查看详情
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => onSnooze(notification.id, 10)} // 延迟10分钟
                      >
                        <Snooze className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onDismiss(notification.id)}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 全部清除按钮 */}
          {activeNotifications.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => activeNotifications.forEach((n) => onDismiss(n.id))}
              >
                清除所有通知
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={onToggle} />}
    </>
  )
}

// 浮动通知组件
export function FloatingNotification({ notification, onDismiss, onSnooze, onViewEvent }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 10秒后自动消失
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(notification.id), 300)
    }, 10000)

    return () => clearTimeout(timer)
  }, [notification.id, onDismiss])

  if (!isVisible) return null

  const getNotificationIcon = (type) => {
    switch (type) {
      case "meeting":
        return "🤝"
      case "event":
        return "🎯"
      case "deadline":
        return "⏰"
      case "personal":
        return "👤"
      default:
        return "📅"
    }
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "border-red-300 bg-red-50 shadow-red-100"
      case "medium":
        return "border-yellow-300 bg-yellow-50 shadow-yellow-100"
      case "low":
        return "border-blue-300 bg-blue-50 shadow-blue-100"
      default:
        return "border-gray-300 bg-white shadow-gray-100"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`border rounded-lg p-4 shadow-lg max-w-sm ${getUrgencyColor(notification.urgency)}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getNotificationIcon(notification.event.type)}</span>
            <div>
              <h4 className="font-medium">{notification.event.title}</h4>
              <p className="text-sm text-gray-600">{notification.reminderType}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onDismiss(notification.id), 300)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{notification.event.time}</span>
          </div>
          {notification.event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{notification.event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={() => onViewEvent(notification.event)}>
            查看详情
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSnooze(notification.id, 10)}>
            稍后提醒
          </Button>
        </div>
      </div>
    </div>
  )
}
