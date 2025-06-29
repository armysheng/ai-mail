# 邮箱集成功能设计文档

## 1. 邮箱协议支持

### 1.1 支持的邮箱类型
- **Gmail**: OAuth2 + IMAP/SMTP
- **Outlook/Hotmail**: OAuth2 + IMAP/SMTP  
- **Exchange**: EWS (Exchange Web Services)
- **IMAP**: 通用IMAP协议
- **POP3**: POP3协议（仅接收）
- **企业邮箱**: 自定义IMAP/SMTP配置

### 1.2 协议配置
\`\`\`typescript
interface EmailProvider {
  id: string;
  name: string;
  type: 'oauth' | 'password';
  settings: {
    imapServer: string;
    imapPort: number;
    imapSecurity: 'ssl' | 'tls' | 'none';
    smtpServer: string;
    smtpPort: number;
    smtpSecurity: 'ssl' | 'tls' | 'none';
    authMethod: 'oauth2' | 'password' | 'app_password';
  };
}

const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    type: 'oauth',
    settings: {
      imapServer: 'imap.gmail.com',
      imapPort: 993,
      imapSecurity: 'ssl',
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecurity: 'tls',
      authMethod: 'oauth2'
    }
  },
  {
    id: 'outlook',
    name: 'Outlook',
    type: 'oauth',
    settings: {
      imapServer: 'outlook.office365.com',
      imapPort: 993,
      imapSecurity: 'ssl',
      smtpServer: 'smtp.office365.com',
      smtpPort: 587,
      smtpSecurity: 'tls',
      authMethod: 'oauth2'
    }
  },
  {
    id: 'imap',
    name: '其他邮箱 (IMAP)',
    type: 'password',
    settings: {
      imapServer: '',
      imapPort: 993,
      imapSecurity: 'ssl',
      smtpServer: '',
      smtpPort: 587,
      smtpSecurity: 'tls',
      authMethod: 'password'
    }
  }
];
\`\`\`

## 2. OAuth2 认证流程

### 2.1 Gmail OAuth2
\`\`\`typescript
// Google OAuth2 配置
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
};

// 获取授权URL
function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// 交换授权码获取Token
async function exchangeCodeForTokens(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    }),
  });
  
  return response.json();
}
\`\`\`

### 2.2 Outlook OAuth2
\`\`\`typescript
// Microsoft OAuth2 配置
const MICROSOFT_OAUTH_CONFIG = {
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  scopes: [
    'https://outlook.office.com/IMAP.AccessAsUser.All',
    'https://outlook.office.com/SMTP.Send',
    'offline_access'
  ]
};

function getMicrosoftAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_OAUTH_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: MICROSOFT_OAUTH_CONFIG.redirectUri,
    scope: MICROSOFT_OAUTH_CONFIG.scopes.join(' '),
    response_mode: 'query'
  });
  
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}
\`\`\`

## 3. 邮件同步机制

### 3.1 同步策略
\`\`\`typescript
interface SyncStrategy {
  type: 'full' | 'incremental' | 'realtime';
  interval: number; // 同步间隔（秒）
  batchSize: number; // 批量处理大小
  maxHistory: number; // 最大历史天数
}

const SYNC_STRATEGIES = {
  initial: {
    type: 'full',
    interval: 0,
    batchSize: 50,
    maxHistory: 30
  },
  regular: {
    type: 'incremental',
    interval: 300, // 5分钟
    batchSize: 20,
    maxHistory: 7
  },
  realtime: {
    type: 'realtime',
    interval: 30, // 30秒
    batchSize: 10,
    maxHistory: 1
  }
};
\`\`\`

### 3.2 IMAP同步实现
\`\`\`typescript
import { ImapFlow } from 'imapflow';

class IMAPSyncService {
  private client: ImapFlow;
  
  constructor(private config: EmailAccountConfig) {
    this.client = new ImapFlow({
      host: config.imapServer,
      port: config.imapPort,
      secure: config.imapSecurity === 'ssl',
      auth: {
        user: config.email,
        pass: config.accessToken || config.password
      }
    });
  }
  
  async connect(): Promise<void> {
    await this.client.connect();
  }
  
  async syncFolder(folderName: string = 'INBOX'): Promise<EmailMessage[]> {
    // 选择文件夹
    const lock = await this.client.getMailboxLock(folderName);
    
    try {
      // 获取最新邮件
      const messages = [];
      
      // 搜索最近的邮件
      const searchCriteria = {
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
      };
      
      const messageIds = await this.client.search(searchCriteria);
      
      // 批量获取邮件
      for (let i = 0; i < messageIds.length; i += 10) {
        const batch = messageIds.slice(i, i + 10);
        const batchMessages = await this.fetchMessages(batch);
        messages.push(...batchMessages);
      }
      
      return messages;
    } finally {
      lock.release();
    }
  }
  
  private async fetchMessages(messageIds: number[]): Promise<EmailMessage[]> {
    const messages = [];
    
    for (const id of messageIds) {
      try {
        const message = await this.client.fetchOne(id, {
          envelope: true,
          bodyStructure: true,
          source: true
        });
        
        const parsedMessage = await this.parseMessage(message);
        messages.push(parsedMessage);
      } catch (error) {
        console.error(`Failed to fetch message ${id}:`, error);
      }
    }
    
    return messages;
  }
  
  private async parseMessage(rawMessage: any): Promise<EmailMessage> {
    // 解析邮件头部
    const envelope = rawMessage.envelope;
    
    // 解析邮件内容
    const content = await this.parseMessageContent(rawMessage);
    
    // 解析附件
    const attachments = await this.parseAttachments(rawMessage);
    
    return {
      messageId: envelope.messageId,
      subject: envelope.subject,
      sender: {
        name: envelope.from[0]?.name || '',
        email: envelope.from[0]?.address || ''
      },
      recipients: envelope.to?.map(addr => ({
        name: addr.name || '',
        email: addr.address,
        type: 'to'
      })) || [],
      content: content.html || content.text || '',
      contentType: content.html ? 'html' : 'text',
      attachments,
      receivedAt: envelope.date,
      flags: rawMessage.flags
    };
  }
  
  async disconnect(): Promise<void> {
    await this.client.logout();
  }
}
\`\`\`

### 3.3 Gmail API同步
\`\`\`typescript
import { gmail_v1, google } from 'googleapis';

class GmailSyncService {
  private gmail: gmail_v1.Gmail;
  
  constructor(private accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.gmail = google.gmail({ version: 'v1', auth });
  }
  
  async syncMessages(pageToken?: string): Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
  }> {
    // 获取邮件列表
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      pageToken,
      q: 'newer_than:7d' // 最近7天
    });
    
    const messages = [];
    
    if (response.data.messages) {
      // 批量获取邮件详情
      for (const message of response.data.messages) {
        try {
          const fullMessage = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });
          
          const parsedMessage = this.parseGmailMessage(fullMessage.data);
          messages.push(parsedMessage);
        } catch (error) {
          console.error(`Failed to fetch Gmail message ${message.id}:`, error);
        }
      }
    }
    
    return {
      messages,
      nextPageToken: response.data.nextPageToken
    };
  }
  
  private parseGmailMessage(message: gmail_v1.Schema$Message): EmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
    
    // 解析邮件内容
    const content = this.extractContent(message.payload);
    
    // 解析附件
    const attachments = this.extractAttachments(message.payload);
    
    return {
      messageId: getHeader('message-id'),
      subject: getHeader('subject'),
      sender: {
        name: this.parseEmailAddress(getHeader('from')).name,
        email: this.parseEmailAddress(getHeader('from')).email
      },
      recipients: this.parseRecipients(getHeader('to')),
      content: content.html || content.text || '',
      contentType: content.html ? 'html' : 'text',
      attachments,
      receivedAt: new Date(parseInt(message.internalDate || '0')),
      gmailId: message.id,
      threadId: message.threadId
    };
  }
}
\`\`\`

## 4. 邮件发送功能

### 4.1 SMTP发送
\`\`\`typescript
import nodemailer from 'nodemailer';

class SMTPSendService {
  private transporter: nodemailer.Transporter;
  
  constructor(private config: EmailAccountConfig) {
    this.transporter = nodemailer.createTransporter({
      host: config.smtpServer,
      port: config.smtpPort,
      secure: config.smtpSecurity === 'ssl',
      auth: {
        user: config.email,
        pass: config.accessToken || config.password
      }
    });
  }
  
  async sendEmail(emailData: SendEmailRequest): Promise<string> {
    const mailOptions = {
      from: `${emailData.senderName || ''} <${this.config.email}>`,
      to: emailData.to.map(r => `${r.name || ''} <${r.email}>`).join(', '),
      cc: emailData.cc?.map(r => `${r.name || ''} <${r.email}>`).join(', '),
      bcc: emailData.bcc?.map(r => `${r.name || ''} <${r.email}>`).join(', '),
      subject: emailData.subject,
      html: emailData.contentType === 'html' ? emailData.content : undefined,
      text: emailData.contentType === 'text' ? emailData.content : undefined,
      attachments: emailData.attachments?.map(att => ({
        filename: att.name,
        path: att.path || att.url,
        contentType: att.mimeType
      })),
      inReplyTo: emailData.inReplyTo,
      references: emailData.references
    };
    
    const result = await this.transporter.sendMail(mailOptions);
    return result.messageId;
  }
}
\`\`\`

### 4.2 Gmail API发送
\`\`\`typescript
class GmailSendService {
  constructor(private gmail: gmail_v1.Gmail) {}
  
  async sendEmail(emailData: SendEmailRequest): Promise<string> {
    // 构建RFC 2822格式的邮件
    const email = this.buildRFC2822Email(emailData);
    
    // Base64编码
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    return response.data.id!;
  }
  
  private buildRFC2822Email(emailData: SendEmailRequest): string {
    const lines = [];
    
    // 邮件头部
    lines.push(`To: ${emailData.to.map(r => `${r.name} <${r.email}>`).join(', ')}`);
    if (emailData.cc?.length) {
      lines.push(`Cc: ${emailData.cc.map(r => `${r.name} <${r.email}>`).join(', ')}`);
    }
    lines.push(`Subject: ${emailData.subject}`);
    lines.push(`Content-Type: ${emailData.contentType === 'html' ? 'text/html' : 'text/plain'}; charset=utf-8`);
    
    if (emailData.inReplyTo) {
      lines.push(`In-Reply-To: ${emailData.inReplyTo}`);
    }
    
    lines.push(''); // 空行分隔头部和正文
    lines.push(emailData.content);
    
    return lines.join('\r\n');
  }
}
\`\`\`

## 5. 实时同步和推送

### 5.1 IMAP IDLE支持
\`\`\`typescript
class IMAPIdleService {
  private client: ImapFlow;
  private isIdling = false;
  
  constructor(private config: EmailAccountConfig) {
    this.client = new ImapFlow({
      host: config.imapServer,
      port: config.imapPort,
      secure: config.imapSecurity === 'ssl',
      auth: {
        user: config.email,
        pass: config.accessToken || config.password
      }
    });
  }
  
  async startIdling(): Promise<void> {
    await this.client.connect();
    
    // 选择INBOX
    const lock = await this.client.getMailboxLock('INBOX');
    
    try {
      this.isIdling = true;
      
      // 监听新邮件
      this.client.on('exists', async (data) => {
        console.log('New message arrived:', data);
        await this.handleNewMessage(data.count);
      });
      
      // 开始IDLE
      await this.client.idle();
    } finally {
      lock.release();
    }
  }
  
  private async handleNewMessage(messageCount: number): Promise<void> {
    // 获取最新邮件
    const message = await this.client.fetchOne(messageCount, {
      envelope: true,
      bodyStructure: true,
      source: true
    });
    
    // 解析并保存邮件
    const parsedMessage = await this.parseMessage(message);
    
    // 发送实时通知
    await this.notifyNewMessage(parsedMessage);
  }
  
  async stopIdling(): Promise<void> {
    this.isIdling = false;
    await this.client.logout();
  }
}
\`\`\`

### 5.2 Gmail Push通知
\`\`\`typescript
class GmailPushService {
  async setupPushNotifications(accountId: string): Promise<void> {
    const response = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: `projects/${process.env.GOOGLE_PROJECT_ID}/topics/gmail-notifications`,
        labelIds: ['INBOX'],
        labelFilterAction: 'include'
      }
    });
    
    console.log('Gmail push notifications setup:', response.data);
  }
  
  async handlePushNotification(message: any): Promise<void> {
    // 解析Pub/Sub消息
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    
    if (data.emailAddress && data.historyId) {
      // 获取历史记录
      await this.processHistoryChanges(data.emailAddress, data.historyId);
    }
  }
  
  private async processHistoryChanges(email: string, historyId: string): Promise<void> {
    const response = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId
    });
    
    if (response.data.history) {
      for (const historyItem of response.data.history) {
        if (historyItem.messagesAdded) {
          // 处理新邮件
          for (const messageAdded of historyItem.messagesAdded) {
            await this.handleNewGmailMessage(messageAdded.message!.id!);
          }
        }
      }
    }
  }
}
\`\`\`

## 6. 错误处理和重试机制

### 6.1 连接错误处理
\`\`\`typescript
class EmailSyncErrorHandler {
  private retryAttempts = 3;
  private retryDelay = 5000; // 5秒
  
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (this.isRetryableError(error)) {
          console.log(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay * attempt);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError!;
  }
  
  private isRetryableError(error: any): boolean {
    // 网络错误
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // IMAP临时错误
    if (error.responseText?.includes('TEMPFAIL')) {
      return true;
    }
    
    // OAuth token过期
    if (error.status === 401) {
      return true;
    }
    
    return false;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
\`\`\`

### 6.2 Token刷新机制
\`\`\`typescript
class TokenRefreshService {
  async refreshAccessToken(accountId: string): Promise<string> {
    const account = await this.getEmailAccount(accountId);
    
    if (account.provider === 'gmail') {
      return this.refreshGoogleToken(account.refreshToken);
    } else if (account.provider === 'outlook') {
      return this.refreshMicrosoftToken(account.refreshToken);
    }
    
    throw new Error('Unsupported provider for token refresh');
  }
  
  private async refreshGoogleToken(refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${data.error_description}`);
    }
    
    return data.access_token;
  }
}
\`\`\`

## 7. 数据库设计

### 7.1 邮箱账户表
\`\`\`sql
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- gmail, outlook, imap, pop3
  display_name VARCHAR(255),
  
  -- 认证信息
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  password_encrypted TEXT, -- 对于非OAuth账户
  
  -- 服务器配置
  imap_server VARCHAR(255),
  imap_port INTEGER,
  imap_security VARCHAR(10), -- ssl, tls, none
  smtp_server VARCHAR(255),
  smtp_port INTEGER,
  smtp_security VARCHAR(10),
  
  -- 同步状态
  status VARCHAR(20) DEFAULT 'active', -- active, error, disabled
  last_sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- 统计信息
  total_emails INTEGER DEFAULT 0,
  unread_emails INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email);
\`\`\`

### 7.2 邮件表
\`\`\`sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id),
  message_id VARCHAR(255) NOT NULL, -- RFC 2822 Message-ID
  thread_id VARCHAR(255), -- 邮件线程ID
  
  -- 基本信息
  subject TEXT,
  sender_name VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  content TEXT,
  content_type VARCHAR(10) DEFAULT 'text', -- text, html
  preview TEXT, -- 邮件预览
  
  -- 状态
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- 分类
  category VARCHAR(50), -- work, personal, marketing, notifications, other
  ai_confidence DECIMAL(3,2), -- AI分类置信度
  
  -- 时间
  received_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  
  -- 原始数据
  raw_headers JSONB,
  raw_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_is_read ON emails(is_read);
\`\`\`

### 7.3 邮件收件人表
\`\`\`sql
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL, -- to, cc, bcc
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_recipients_email_id ON email_recipients(email_id);
CREATE INDEX idx_email_recipients_email ON email_recipients(email);
\`\`\`

### 7.4 附件表
\`\`\`sql
CREATE TABLE email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  content_id VARCHAR(255), -- 用于内嵌图片
  
  -- 存储信息
  storage_path TEXT,
  storage_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_attachments_email_id ON email_attachments(email_id);
\`\`\`

## 8. 部署和监控

### 8.1 Docker配置
\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
\`\`\`

### 8.2 监控指标
\`\`\`typescript
// 监控指标定义
const METRICS = {
  // 邮件同步指标
  email_sync_duration: 'histogram',
  email_sync_errors: 'counter',
  emails_synced_total: 'counter',
  
  // API指标
  api_requests_total: 'counter',
  api_request_duration: 'histogram',
  api_errors_total: 'counter',
  
  // 系统指标
  active_connections: 'gauge',
  memory_usage: 'gauge',
  cpu_usage: 'gauge'
};
\`\`\`

这个设计文档涵盖了邮箱集成的所有核心功能，包括多协议支持、OAuth认证、实时同步、错误处理等。接下来我们可以根据这个设计开始实现具体的功能模块。
\`\`\`

现在让我创建一个邮箱添加功能的前端组件：
