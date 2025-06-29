"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, Plus } from "lucide-react"

export function ContactSelector({ contacts, onSelectContact, selectedContacts = [], onRemoveContact }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedContacts.find((selected) => selected.email === contact.email),
  )

  const handleSelectContact = (contact) => {
    onSelectContact(contact)
    setSearchTerm("")
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* 已选择的联系人 */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedContacts.map((contact, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <Avatar className="w-4 h-4">
                <AvatarFallback className={`${contact.color} text-xs`}>{contact.avatar}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{contact.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => onRemoveContact(contact)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="relative">
        <Input
          placeholder="输入邮箱地址或选择联系人"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-8"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 联系人下拉列表 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索联系人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? "未找到匹配的联系人" : "暂无联系人"}
              </div>
            ) : (
              filteredContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectContact(contact)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={contact.color}>{contact.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{contact.name}</div>
                    <div className="text-xs text-gray-500 truncate">{contact.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉框 */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
