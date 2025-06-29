"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Users, Clock, Calendar, X, Plus, Bell, AlertCircle } from "lucide-react"

export function EventForm({ event = null, onSave, onCancel, onDelete, contacts = [] }) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    date: event?.date || new Date().toISOString().split("T")[0],
    time: event?.time || "09:00-10:00",
    location: event?.location || "",
    description: event?.description || "",
    type: event?.type || "meeting",
    attendees: event?.attendees || [],
    status: event?.status || "confirmed",
    reminders: event?.reminders || [{ type: "15分钟前", minutes: 15, enabled: true }],
  })

  const [showAttendeeSelector, setShowAttendeeSelector] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState("")

  const eventTypes = [
    { key: "meeting", label: "会议", icon: "🤝" },
    { key: "event", label: "活动", icon: "🎯" },
    { key: "deadline", label: "截止", icon: "⏰" },
    { key: "personal", label: "私人", icon: "👤" },
  ]

  const statusOptions = [
    { key: "confirmed", label: "已确认", color: "bg-green-100 text-green-700" },
    { key: "tentative", label: "待确认", color: "bg-yellow-100 text-yellow-700" },
    { key: "cancelled", label: "已取消", color: "bg-red-100 text-red-700" },
  ]

  const reminderOptions = [
    { type: "准时", minutes: 0 },
    { type: "5分钟前", minutes: 5 },
    { type: "15分钟前", minutes: 15 },
    { type: "30分钟前", minutes: 30 },
    { type: "1小时前", minutes: 60 },
    { type: "2小时前", minutes: 120 },
    { type: "1天前", minutes: 1440 },
    { type: "1周前", minutes: 10080 },
  ]

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert("请输入事件标题")
      return
    }

    // 生成提醒通知
    const notifications = formData.reminders
      .filter((reminder) => reminder.enabled)
      .map((reminder) => {
        const eventDateTime = new Date(`${formData.date} ${formData.time.split("-")[0]}`)
        const reminderTime = new Date(eventDateTime.getTime() - reminder.minutes * 60000)

        return {
          id: `${Date.now()}-${reminder.minutes}`,
          eventId: event?.id || Date.now(),
          reminderType: reminder.type,
          triggerTime: reminderTime.toISOString(),
          urgency: reminder.minutes <= 15 ? "high" : reminder.minutes <= 60 ? "medium" : "low",
          dismissed: false,
          snoozed: false,
          event: {
            ...formData,
            id: event?.id || Date.now(),
          },
        }
      })

    onSave({ ...formData, notifications })
  }

  const addAttendee = (attendee) => {
    if (!formData.attendees.includes(attendee)) {
      setFormData((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendee],
      }))
    }
    setAttendeeSearch("")
    setShowAttendeeSelector(false)
  }

  const removeAttendee = (attendee) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a !== attendee),
    }))
  }

  const toggleReminder = (index) => {
    setFormData((prev) => ({
      ...prev,
      reminders: prev.reminders.map((reminder, i) =>
        i === index ? { ...reminder, enabled: !reminder.enabled } : reminder,
      ),
    }))
  }

  const addReminder = (reminderOption) => {
    const exists = formData.reminders.some((r) => r.minutes === reminderOption.minutes)
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        reminders: [...prev.reminders, { ...reminderOption, enabled: true }],
      }))
    }
  }

  const removeReminder = (index) => {
    setFormData((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index),
    }))
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(attendeeSearch.toLowerCase()) && !formData.attendees.includes(contact.name),
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">{event ? "编辑日程" : "新建日程"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {event && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(event.id)}
            >
              删除
            </Button>
          )}
          <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
            保存
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">标题 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="输入事件标题"
              className="text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">类型</label>
            <div className="flex gap-2 flex-wrap">
              {eventTypes.map((type) => (
                <button
                  key={type.key}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    formData.type === type.key
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.key }))}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">状态</label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((status) => (
                <button
                  key={status.key}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    formData.status === status.key
                      ? status.color + " border"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, status: status.key }))}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 时间地点 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                日期
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                <Clock className="h-4 w-4" />
                时间
              </label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                placeholder="09:00-10:00"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              地点
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="输入地点"
            />
          </div>
        </div>

        {/* 提醒设置 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-1">
            <Bell className="h-4 w-4" />
            提醒设置
          </label>

          {/* 已设置的提醒 */}
          <div className="space-y-2 mb-3">
            {formData.reminders.map((reminder, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  reminder.enabled ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reminder.enabled}
                    onChange={() => toggleReminder(index)}
                    className="rounded"
                  />
                  <Bell className={`h-4 w-4 ${reminder.enabled ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-sm ${reminder.enabled ? "text-blue-900" : "text-gray-500"}`}>
                    {reminder.type}
                  </span>
                  {reminder.minutes <= 15 && reminder.enabled && (
                    <Badge variant="destructive" className="text-xs">
                      紧急
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeReminder(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 添加提醒 */}
          <div className="flex flex-wrap gap-2">
            {reminderOptions
              .filter((option) => !formData.reminders.some((r) => r.minutes === option.minutes))
              .map((option) => (
                <button
                  key={option.minutes}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  onClick={() => addReminder(option)}
                >
                  + {option.type}
                </button>
              ))}
          </div>

          {formData.reminders.filter((r) => r.enabled).length === 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>建议至少设置一个提醒</span>
            </div>
          )}
        </div>

        {/* 参与者 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
            <Users className="h-4 w-4" />
            参与者
          </label>

          {/* 已选择的参与者 */}
          {formData.attendees.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.attendees.map((attendee, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs">{attendee[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{attendee}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 p-0 hover:bg-transparent"
                    onClick={() => removeAttendee(attendee)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* 添加参与者 */}
          <div className="relative">
            <Input
              value={attendeeSearch}
              onChange={(e) => {
                setAttendeeSearch(e.target.value)
                setShowAttendeeSelector(true)
              }}
              onFocus={() => setShowAttendeeSelector(true)}
              placeholder="输入姓名或选择联系人"
              className="pr-8"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setShowAttendeeSelector(!showAttendeeSelector)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* 联系人选择器 */}
            {showAttendeeSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {attendeeSearch && !formData.attendees.includes(attendeeSearch) && (
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => addAttendee(attendeeSearch)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{attendeeSearch[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">添加 "{attendeeSearch}"</div>
                    </div>
                  </div>
                )}

                {filteredContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => addAttendee(contact.name)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={contact.color}>{contact.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                ))}

                {filteredContacts.length === 0 && !attendeeSearch && (
                  <div className="p-4 text-center text-gray-500 text-sm">输入姓名或选择联系人</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">描述</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="添加描述信息..."
            className="min-h-[80px]"
          />
        </div>

        {/* 来源信息 */}
        {event?.source === "ai" && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <span>🤖</span>
              <span>此日程由AI从邮件中自动提取</span>
            </div>
            {event.relatedEmailId && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-blue-600 hover:text-blue-700 p-0 h-auto"
                onClick={() => {
                  // 这里可以跳转到原邮件
                  console.log("查看原邮件:", event.relatedEmailId)
                }}
              >
                查看原邮件 →
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 点击外部关闭选择器 */}
      {showAttendeeSelector && <div className="fixed inset-0 z-40" onClick={() => setShowAttendeeSelector(false)} />}
    </div>
  )
}
