# 邮件应用后端API接口规范

## 1. 认证相关接口

### 1.1 用户登录
\`\`\`
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "张小明",
      "email": "user@example.com",
      "avatar": "avatar_url"
    }
  }
}
\`\`\`

### 1.2 用户注册
\`\`\`
POST /api/auth/register
Content-Type: application/json

Request:
{
  "name": "张小明",
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### 1.3 刷新Token
\`\`\`
POST /api/auth/refresh
Authorization: Bearer {token}
\`\`\`

### 1.4 退出登录
\`\`\`
POST /api/auth/logout
Authorization: Bearer {token}
\`\`\`

## 2. 邮箱账户管理接口

### 2.1 添加邮箱账户
\`\`\`
POST /api/accounts
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "email": "work@company.com",
  "password": "email_password",
  "provider": "gmail", // gmail, outlook, imap, pop3
  "settings": {
    "imapServer": "imap.gmail.com",
    "imapPort": 993,
    "smtpServer": "smtp.gmail.com",
    "smtpPort": 587,
    "ssl": true
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "account_id",
    "email": "work@company.com",
    "provider": "gmail",
    "status": "connected",
    "lastSync": "2024-12-28T10:00:00Z"
  }
}
\`\`\`

### 2.2 获取邮箱账户列表
\`\`\`
GET /api/accounts
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "account_id",
      "email": "work@company.com",
      "provider": "gmail",
      "status": "connected",
      "lastSync": "2024-12-28T10:00:00Z",
      "unreadCount": 5
    }
  ]
}
\`\`\`

### 2.3 同步邮箱
\`\`\`
POST /api/accounts/{accountId}/sync
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "syncId": "sync_id",
    "status": "in_progress",
    "newEmails": 12,
    "updatedEmails": 3
  }
}
\`\`\`

### 2.4 删除邮箱账户
\`\`\`
DELETE /api/accounts/{accountId}
Authorization: Bearer {token}
\`\`\`

## 3. 邮件相关接口

### 3.1 获取邮件列表
\`\`\`
GET /api/emails?page=1&limit=20&category=all&account=account_id&unread=false
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "email_id",
        "accountId": "account_id",
        "messageId": "message_id",
        "subject": "项目进度更新",
        "sender": {
          "name": "张小明",
          "email": "zhang@example.com"
        },
        "recipients": [
          {
            "name": "李四",
            "email": "li@example.com",
            "type": "to" // to, cc, bcc
          }
        ],
        "preview": "邮件预览内容...",
        "content": "完整邮件内容...",
        "isRead": false,
        "isStarred": false,
        "category": "work", // work, personal, marketing, notifications, other
        "aiClassification": {
          "confidence": 0.95,
          "categories": ["work", "project"],
          "extractedData": {
            "tasks": [...],
            "schedules": [...],
            "contacts": [...]
          }
        },
        "attachments": [
          {
            "id": "attachment_id",
            "name": "report.pdf",
            "size": 1024000,
            "mimeType": "application/pdf",
            "downloadUrl": "/api/attachments/attachment_id"
          }
        ],
        "receivedAt": "2024-12-28T09:42:00Z",
        "createdAt": "2024-12-28T09:42:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    },
    "stats": {
      "total": 150,
      "unread": 5,
      "categories": {
        "work": 45,
        "personal": 30,
        "marketing": 25,
        "notifications": 20,
        "other": 30
      }
    }
  }
}
\`\`\`

### 3.2 获取邮件详情
\`\`\`
GET /api/emails/{emailId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    // 完整邮件信息，包括原始头部信息
    "headers": {
      "messageId": "message_id",
      "inReplyTo": "reply_to_id",
      "references": ["ref1", "ref2"]
    },
    "thread": [
      // 邮件线程中的其他邮件
    ]
  }
}
\`\`\`

### 3.3 发送邮件
\`\`\`
POST /api/emails
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "accountId": "account_id",
  "to": [
    {
      "name": "李四",
      "email": "li@example.com"
    }
  ],
  "cc": [],
  "bcc": [],
  "subject": "邮件主题",
  "content": "邮件内容",
  "contentType": "html", // html, text
  "attachments": ["attachment_id1", "attachment_id2"],
  "replyTo": "original_email_id", // 可选，回复邮件时使用
  "priority": "normal" // low, normal, high
}

Response:
{
  "success": true,
  "data": {
    "id": "sent_email_id",
    "messageId": "message_id",
    "status": "sent",
    "sentAt": "2024-12-28T10:00:00Z"
  }
}
\`\`\`

### 3.4 更新邮件状态
\`\`\`
PATCH /api/emails/{emailId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "isRead": true,
  "isStarred": false,
  "category": "work"
}
\`\`\`

### 3.5 删除邮件
\`\`\`
DELETE /api/emails/{emailId}
Authorization: Bearer {token}
\`\`\`

### 3.6 搜索邮件
\`\`\`
GET /api/emails/search?q=keyword&from=sender@example.com&date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer {token}
\`\`\`

## 4. AI功能接口

### 4.1 邮件AI分析
\`\`\`
POST /api/ai/analyze-email
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "emailId": "email_id",
  "content": "邮件内容",
  "subject": "邮件主题"
}

Response:
{
  "success": true,
  "data": {
    "classification": {
      "category": "work",
      "confidence": 0.95,
      "subcategories": ["project", "meeting"]
    },
    "extractedTasks": [
      {
        "title": "完成项目报告",
        "description": "需要在周五前完成",
        "priority": "high",
        "dueDate": "2024-12-29",
        "assignee": "张小明"
      }
    ],
    "extractedSchedules": [
      {
        "title": "项目会议",
        "date": "2024-12-29",
        "time": "14:00-16:00",
        "location": "会议室A",
        "attendees": ["张三", "李四"]
      }
    ],
    "extractedContacts": [
      {
        "name": "王五",
        "email": "wang@example.com",
        "phone": "13800138000"
      }
    ],
    "sentiment": {
      "score": 0.7,
      "label": "positive" // positive, negative, neutral
    },
    "summary": "邮件摘要内容..."
  }
}
\`\`\`

### 4.2 智能回复建议
\`\`\`
POST /api/ai/reply-suggestions
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "emailId": "email_id",
  "context": "回复上下文"
}

Response:
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "quick", // quick, formal, casual
        "content": "好的，我会按时完成。",
        "confidence": 0.9
      },
      {
        "type": "formal",
        "content": "收到，我将在截止日期前完成相关工作。",
        "confidence": 0.8
      }
    ]
  }
}
\`\`\`

### 4.3 批量AI处理
\`\`\`
POST /api/ai/batch-process
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "emailIds": ["email1", "email2", "email3"],
  "operations": ["classify", "extract_tasks", "extract_schedules"]
}
\`\`\`

## 5. 联系人接口

### 5.1 获取联系人列表
\`\`\`
GET /api/contacts?category=all&search=keyword
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "contact_id",
      "name": "张三",
      "email": "zhang@example.com",
      "phone": "13800138000",
      "avatar": "avatar_url",
      "category": "team", // team, frequent, family, other
      "lastContact": "2024-12-28T10:00:00Z",
      "emailCount": 25,
      "tags": ["同事", "项目组"]
    }
  ]
}
\`\`\`

### 5.2 创建联系人
\`\`\`
POST /api/contacts
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "张三",
  "email": "zhang@example.com",
  "phone": "13800138000",
  "category": "team",
  "tags": ["同事", "项目组"],
  "notes": "项目组成员"
}
\`\`\`

### 5.3 更新联系人
\`\`\`
PUT /api/contacts/{contactId}
Authorization: Bearer {token}
\`\`\`

### 5.4 删除联系人
\`\`\`
DELETE /api/contacts/{contactId}
Authorization: Bearer {token}
\`\`\`

## 6. 日历接口

### 6.1 获取日程列表
\`\`\`
GET /api/calendar/events?start=2024-12-01&end=2024-12-31&view=month
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "event_id",
      "title": "项目会议",
      "description": "讨论项目进度",
      "startTime": "2024-12-29T14:00:00Z",
      "endTime": "2024-12-29T16:00:00Z",
      "location": "会议室A",
      "attendees": [
        {
          "name": "张三",
          "email": "zhang@example.com",
          "status": "accepted" // pending, accepted, declined
        }
      ],
      "type": "meeting", // meeting, event, deadline, personal
      "status": "confirmed", // confirmed, tentative, cancelled
      "source": "manual", // manual, ai, import
      "relatedEmailId": "email_id",
      "reminders": [
        {
          "type": "15分钟前",
          "minutes": 15,
          "enabled": true
        }
      ],
      "recurrence": {
        "pattern": "weekly", // daily, weekly, monthly, yearly
        "interval": 1,
        "endDate": "2025-01-31"
      }
    }
  ]
}
\`\`\`

### 6.2 创建日程
\`\`\`
POST /api/calendar/events
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "项目会议",
  "description": "讨论项目进度",
  "startTime": "2024-12-29T14:00:00Z",
  "endTime": "2024-12-29T16:00:00Z",
  "location": "会议室A",
  "attendees": ["contact_id1", "contact_id2"],
  "type": "meeting",
  "reminders": [
    {
      "type": "15分钟前",
      "minutes": 15,
      "enabled": true
    }
  ]
}
\`\`\`

### 6.3 更新日程
\`\`\`
PUT /api/calendar/events/{eventId}
Authorization: Bearer {token}
\`\`\`

### 6.4 删除日程
\`\`\`
DELETE /api/calendar/events/{eventId}
Authorization: Bearer {token}
\`\`\`

### 6.5 检查时间冲突
\`\`\`
POST /api/calendar/check-conflicts
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "startTime": "2024-12-29T14:00:00Z",
  "endTime": "2024-12-29T16:00:00Z",
  "excludeEventId": "event_id" // 可选，编辑时排除自己
}

Response:
{
  "success": true,
  "data": {
    "hasConflicts": true,
    "conflicts": [
      {
        "eventId": "conflict_event_id",
        "title": "另一个会议",
        "startTime": "2024-12-29T15:00:00Z",
        "endTime": "2024-12-29T17:00:00Z"
      }
    ]
  }
}
\`\`\`

## 7. 通知接口

### 7.1 获取通知列表
\`\`\`
GET /api/notifications?status=active&type=reminder
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "type": "reminder", // reminder, email, system
      "title": "会议提醒",
      "message": "项目会议将在15分钟后开始",
      "triggerTime": "2024-12-29T13:45:00Z",
      "status": "active", // active, dismissed, snoozed
      "priority": "high", // low, medium, high
      "relatedId": "event_id",
      "relatedType": "event", // event, email, task
      "createdAt": "2024-12-29T13:30:00Z"
    }
  ]
}
\`\`\`

### 7.2 创建通知
\`\`\`
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "type": "reminder",
  "title": "会议提醒",
  "message": "项目会议将在15分钟后开始",
  "triggerTime": "2024-12-29T13:45:00Z",
  "priority": "high",
  "relatedId": "event_id",
  "relatedType": "event"
}
\`\`\`

### 7.3 更新通知状态
\`\`\`
PATCH /api/notifications/{notificationId}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "dismissed"
}
\`\`\`

### 7.4 延迟通知
\`\`\`
POST /api/notifications/{notificationId}/snooze
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "minutes": 10
}
\`\`\`

## 8. 用户设置接口

### 8.1 获取用户设置
\`\`\`
GET /api/user/settings
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "notifications": {
      "email": true,
      "push": true,
      "reminder": true,
      "marketing": false
    },
    "ai": {
      "autoClassify": true,
      "smartReply": true,
      "scheduleExtraction": true,
      "taskGeneration": true
    },
    "appearance": {
      "theme": "light",
      "language": "zh-CN",
      "compactMode": false
    },
    "privacy": {
      "readReceipts": true,
      "onlineStatus": true,
      "dataCollection": false
    }
  }
}
\`\`\`

### 8.2 更新用户设置
\`\`\`
PUT /api/user/settings
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "notifications": {
    "email": true,
    "push": false
  }
}
\`\`\`

### 8.3 获取用户统计
\`\`\`
GET /api/user/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "emails": {
      "todayReceived": 12,
      "todaySent": 8,
      "totalReceived": 1234,
      "totalSent": 567,
      "unread": 5,
      "avgDaily": 23,
      "responseRate": 89
    },
    "calendar": {
      "todayEvents": 3,
      "weekEvents": 12,
      "pendingEvents": 2
    },
    "ai": {
      "classified": 156,
      "schedules": 23,
      "tasks": 45,
      "replies": 12
    },
    "storage": {
      "emailStorage": 2.3, // GB
      "attachmentStorage": 1.8,
      "calendarStorage": 0.156,
      "totalLimit": 15
    }
  }
}
\`\`\`

### 8.4 更新用户资料
\`\`\`
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "张小明",
  "title": "高级产品经理",
  "department": "技术部",
  "avatar": "avatar_url"
}
\`\`\`

## 9. 文件上传接口

### 9.1 上传附件
\`\`\`
POST /api/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
FormData with file

Response:
{
  "success": true,
  "data": {
    "id": "attachment_id",
    "name": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "url": "/api/attachments/attachment_id"
  }
}
\`\`\`

### 9.2 下载附件
\`\`\`
GET /api/attachments/{attachmentId}
Authorization: Bearer {token}
\`\`\`

## 10. WebSocket 实时通信

### 10.1 连接WebSocket
\`\`\`
ws://localhost:3000/ws?token=jwt_token
\`\`\`

### 10.2 实时事件
\`\`\`javascript
// 新邮件通知
{
  "type": "new_email",
  "data": {
    "emailId": "email_id",
    "subject": "新邮件主题",
    "sender": "sender@example.com"
  }
}

// 同步状态更新
{
  "type": "sync_status",
  "data": {
    "accountId": "account_id",
    "status": "syncing", // syncing, completed, error
    "progress": 75
  }
}

// 提醒通知
{
  "type": "reminder",
  "data": {
    "notificationId": "notification_id",
    "title": "会议提醒",
    "message": "会议将在15分钟后开始"
  }
}
\`\`\`

## 11. 错误处理

### 11.1 标准错误响应
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误",
    "details": {
      "field": "password",
      "reason": "密码不正确"
    }
  }
}
\`\`\`

### 11.2 常见错误码
- `INVALID_CREDENTIALS`: 认证失败
- `TOKEN_EXPIRED`: Token过期
- `INSUFFICIENT_PERMISSIONS`: 权限不足
- `RESOURCE_NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 参数验证失败
- `EMAIL_SYNC_ERROR`: 邮箱同步失败
- `AI_PROCESSING_ERROR`: AI处理失败
- `STORAGE_LIMIT_EXCEEDED`: 存储空间不足

## 12. 分页和排序

### 12.1 分页参数
\`\`\`
GET /api/emails?page=1&limit=20&sort=receivedAt&order=desc
\`\`\`

### 12.2 排序字段
- `receivedAt`: 接收时间
- `subject`: 主题
- `sender`: 发件人
- `isRead`: 已读状态
- `isStarred`: 星标状态

## 13. 批量操作

### 13.1 批量更新邮件
\`\`\`
PATCH /api/emails/batch
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "emailIds": ["email1", "email2", "email3"],
  "updates": {
    "isRead": true,
    "category": "work"
  }
}
\`\`\`

### 13.2 批量删除
\`\`\`
DELETE /api/emails/batch
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "emailIds": ["email1", "email2", "email3"]
}
