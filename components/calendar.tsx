"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, MoreHorizontal, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ReminderOverview } from "./reminder-overview"

export function Calendar({
  events = [],
  notifications = [],
  onCreateEvent,
  onEventClick,
  onUpdateEvent,
  onDeleteEvent,
  onDismissNotification,
  onSnoozeNotification,
  onViewEventFromNotification,
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState("month") // month | week | day

  // 获取当前月份的日期
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 添加上个月的日期
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true })
    }

    // 添加下个月的日期
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  // 修复日期比较逻辑
  const getEventsForDate = (date) => {
    console.log("Getting events for date:", date.toDateString())
    console.log("Available events:", events)

    return events.filter((event) => {
      try {
        let eventDate

        // 简化日期处理逻辑
        if (event.date.includes("-")) {
          // 标准格式 YYYY-MM-DD
          eventDate = new Date(event.date + "T00:00:00")
        } else {
          console.warn(`Unsupported date format: ${event.date} for event: ${event.title}`)
          return false
        }

        // 检查日期是否有效
        if (isNaN(eventDate.getTime())) {
          console.warn(`Invalid date for event: ${event.title}, date: ${event.date}`)
          return false
        }

        // 比较日期（只比较年月日）
        const eventDateString = eventDate.toDateString()
        const targetDateString = date.toDateString()
        const matches = eventDateString === targetDateString

        if (matches) {
          console.log(`Event matches: ${event.title} on ${event.date}`)
        }

        return matches
      } catch (error) {
        console.error(`Error parsing date for event: ${event.title}`, error)
        return false
      }
    })
  }

  // 添加获取周视图日期的函数
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day // 调整到周日
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ]

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  const days = getDaysInMonth(currentDate)
  const today = new Date()

  // 调试信息
  console.log("Calendar events:", events)
  console.log("Today's events:", getEventsForDate(today))

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium">日历</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button size="sm" onClick={onCreateEvent}>
          <Plus className="h-4 w-4 mr-1" />
          新建
        </Button>
      </div>

      {/* 视图切换 */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            viewMode === "month" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
          }`}
          onClick={() => setViewMode("month")}
        >
          月视图
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            viewMode === "week" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
          }`}
          onClick={() => setViewMode("week")}
        >
          周视图
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            viewMode === "day" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-600"
          }`}
          onClick={() => setViewMode("day")}
        >
          日视图
        </button>
      </div>

      {/* 月视图 */}
      {viewMode === "month" && (
        <div className="flex-1 overflow-hidden">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date)
              const isToday = day.date.toDateString() === today.toDateString()

              return (
                <div
                  key={index}
                  className={`border-r border-b p-1 min-h-[80px] ${!day.isCurrentMonth ? "bg-gray-50" : ""}`}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${
                      !day.isCurrentMonth ? "text-gray-400" : isToday ? "text-orange-600 font-bold" : "text-gray-900"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>

                  {/* 事件列表 */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => {
                      const getEventColor = (event) => {
                        if (event.status === "cancelled") return "bg-red-100 text-red-800"
                        if (event.status === "tentative") return "bg-yellow-100 text-yellow-800"
                        if (event.source === "ai") return "bg-purple-100 text-purple-800"
                        return "bg-blue-100 text-blue-800"
                      }

                      const hasReminders = event.reminders && event.reminders.some((r) => r.enabled)

                      return (
                        <div
                          key={eventIndex}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                          onClick={() => onEventClick && onEventClick(event)}
                          title={`${event.title} - ${event.time}${hasReminders ? " (已设提醒)" : ""}`}
                        >
                          <div className="flex items-center gap-1">
                            {event.source === "ai" && <span>🤖</span>}
                            {event.status === "tentative" && <span>❓</span>}
                            {event.status === "cancelled" && <span>❌</span>}
                            {hasReminders && <Bell className="h-2 w-2" />}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} 更多</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 周视图 */}
      {viewMode === "week" && (
        <div className="flex-1 overflow-hidden">
          {/* 周视图头部 */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {getWeekDays(currentDate).map((day, index) => {
              const isToday = day.toDateString() === today.toDateString()
              return (
                <div key={index} className="p-3 text-center border-r">
                  <div className="text-xs text-gray-500 mb-1">{weekDays[day.getDay()]}</div>
                  <div
                    className={`text-lg font-medium ${
                      isToday
                        ? "text-orange-600 bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                        : "text-gray-900"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 周视图内容 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {getWeekDays(currentDate).map((day, index) => {
                const dayEvents = getEventsForDate(day)
                const isToday = day.toDateString() === today.toDateString()

                return (
                  <div key={index} className={`bg-white p-2 min-h-[200px] ${isToday ? "bg-orange-50" : ""}`}>
                    {/* 事件列表 */}
                    <div className="space-y-1">
                      {dayEvents.map((event, eventIndex) => {
                        const getEventColor = (event) => {
                          if (event.status === "cancelled") return "bg-red-100 text-red-800 border-red-200"
                          if (event.status === "tentative") return "bg-yellow-100 text-yellow-800 border-yellow-200"
                          if (event.source === "ai") return "bg-purple-100 text-purple-800 border-purple-200"
                          return "bg-blue-100 text-blue-800 border-blue-200"
                        }

                        const hasReminders = event.reminders && event.reminders.some((r) => r.enabled)

                        return (
                          <div
                            key={eventIndex}
                            className={`text-xs p-2 rounded border cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                            onClick={() => onEventClick && onEventClick(event)}
                            title={`${event.title} - ${event.time}${hasReminders ? " (已设提醒)" : ""}`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {event.source === "ai" && <span>🤖</span>}
                              {event.status === "tentative" && <span>❓</span>}
                              {event.status === "cancelled" && <span>❌</span>}
                              {hasReminders && <Bell className="h-2 w-2" />}
                              <span className="font-medium truncate">{event.title}</span>
                            </div>
                            <div className="text-xs opacity-75">{event.time}</div>
                            {event.location && (
                              <div className="text-xs opacity-75 flex items-center gap-1 mt-1">
                                <MapPin className="h-2 w-2" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 日视图 */}
      {viewMode === "day" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">
              {today.getMonth() + 1}月{today.getDate()}日 今日日程
            </h3>
          </div>

          {/* 添加提醒概览 */}
          <ReminderOverview
            notifications={notifications}
            onDismiss={onDismissNotification}
            onSnooze={onSnoozeNotification}
            onViewEvent={onViewEventFromNotification}
          />

          {/* 今日事件列表 */}
          {getEventsForDate(today).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">📅</div>
              <p className="text-gray-500">今日暂无日程安排</p>
              <p className="text-xs text-gray-400 mt-2">共有 {events.length} 个日程事件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(today).map((event, index) => {
                const getEventBorderColor = (event) => {
                  if (event.status === "cancelled") return "border-red-200"
                  if (event.status === "tentative") return "border-yellow-200"
                  if (event.source === "ai") return "border-purple-200"
                  return "border-gray-200"
                }

                const getEventBgColor = (event) => {
                  if (event.status === "cancelled") return "bg-red-50"
                  if (event.status === "tentative") return "bg-yellow-50"
                  if (event.source === "ai") return "bg-purple-50"
                  return "bg-white"
                }

                const hasReminders = event.reminders && event.reminders.some((r) => r.enabled)
                const enabledReminders = event.reminders ? event.reminders.filter((r) => r.enabled) : []

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer ${getEventBorderColor(event)} ${getEventBgColor(event)}`}
                    onClick={() => onEventClick && onEventClick(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.source === "ai" && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            AI提取
                          </Badge>
                        )}
                        {event.status === "tentative" && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                            待确认
                          </Badge>
                        )}
                        {event.status === "cancelled" && (
                          <Badge variant="destructive" className="text-xs">
                            已取消
                          </Badge>
                        )}
                        {hasReminders && (
                          <Badge
                            variant="outline"
                            className="text-xs text-blue-700 border-blue-300 flex items-center gap-1"
                          >
                            <Bell className="h-3 w-3" />
                            {enabledReminders.length}个提醒
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div className="flex -space-x-1">
                            {event.attendees.slice(0, 3).map((attendee, i) => (
                              <Avatar key={i} className="w-5 h-5 border border-white">
                                <AvatarFallback className="text-xs">{attendee[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                            {event.attendees.length > 3 && (
                              <span className="text-xs text-gray-500 ml-2">+{event.attendees.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 显示提醒信息 */}
                      {hasReminders && (
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <div className="flex flex-wrap gap-1">
                            {enabledReminders.slice(0, 3).map((reminder, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {reminder.type}
                              </span>
                            ))}
                            {enabledReminders.length > 3 && (
                              <span className="text-xs text-blue-600">+{enabledReminders.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-xs text-gray-500 mt-2 line-clamp-2">{event.description}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 显示所有事件的调试信息 */}
          {events.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">所有日程事件 ({events.length})</h4>
              <div className="space-y-1 text-xs text-gray-600">
                {events.map((event, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <span className="font-medium">{event.title}</span>
                      <span className="ml-2 text-gray-500">({event.source})</span>
                    </div>
                    <div className="text-right">
                      <div>{event.date}</div>
                      <div className="text-xs text-gray-400">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">今日匹配事件: {getEventsForDate(today).length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
