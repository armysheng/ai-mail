-- 邮件应用数据库架构设计

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  title VARCHAR(255),
  department VARCHAR(255),
  
  -- 设置
  settings JSONB DEFAULT '{}',
  
  -- 统计信息
  stats JSONB DEFAULT '{}',
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
  email_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 邮箱账户表
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本信息
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  provider VARCHAR(50) NOT NULL, -- gmail, outlook, imap, pop3, qq, 163
  
  -- 认证信息 (加密存储)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  password_encrypted TEXT,
  token_expires_at TIMESTAMP,
  
  -- 服务器配置
  imap_server VARCHAR(255),
  imap_port INTEGER,
  imap_security VARCHAR(10), -- ssl, tls, none
  smtp_server VARCHAR(255),
  smtp_port INTEGER,
  smtp_security VARCHAR(10),
  
  -- 同步设置
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_interval INTEGER DEFAULT 5, -- 分钟
  max_history_days INTEGER DEFAULT 30,
  
  -- 同步状态
  status VARCHAR(20) DEFAULT 'active', -- active, syncing, error, disabled
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- 统计信息
  total_emails INTEGER DEFAULT 0,
  unread_emails INTEGER DEFAULT 0,
  last_message_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, email)
);

-- 邮件表
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- 邮件标识
  message_id VARCHAR(500) NOT NULL, -- RFC 2822 Message-ID
  thread_id VARCHAR(255), -- 邮件线程ID
  gmail_id VARCHAR(255), -- Gmail特有ID
  
  -- 基本信息
  subject TEXT,
  sender_name VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  
  -- 内容
  content_text TEXT,
  content_html TEXT,
  preview TEXT, -- 邮件预览 (前200字符)
  
  -- 状态标志
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_spam BOOLEAN DEFAULT FALSE,
  
  -- 分类信息
  category VARCHAR(50), -- work, personal, marketing, notifications, social, other
  ai_category VARCHAR(50), -- AI分类结果
  ai_confidence DECIMAL(3,2), -- AI分类置信度
  ai_processed BOOLEAN DEFAULT FALSE,
  
  -- 提取的结构化数据
  extracted_data JSONB DEFAULT '{}', -- AI提取的任务、日程、联系人等
  
  -- 邮件头部信息
  headers JSONB DEFAULT '{}',
  
  -- 时间信息
  received_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  
  -- 大小信息
  size_bytes BIGINT DEFAULT 0,
  
  -- 原始数据 (可选，用于调试)
  raw_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 邮件收件人表
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL, -- to, cc, bcc
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 邮件附件表
CREATE TABLE email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  
  -- 附件信息
  filename VARCHAR(500) NOT NULL,
  content_type VARCHAR(100),
  size_bytes BIGINT NOT NULL,
  content_id VARCHAR(255), -- 用于内嵌图片
  
  -- 存储信息
  storage_path TEXT,
  storage_url TEXT,
  is_inline BOOLEAN DEFAULT FALSE,
  
  -- 处理状态
  is_downloaded BOOLEAN DEFAULT FALSE,
  download_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 联系人表
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本信息
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- 分类和标签
  category VARCHAR(50) DEFAULT 'other', -- team, frequent, family, other
  tags TEXT[], -- 标签数组
  
  -- 备注信息
  notes TEXT,
  company VARCHAR(255),
  title VARCHAR(255),
  
  -- 统计信息
  email_count INTEGER DEFAULT 0,
  last_contact_at TIMESTAMP,
  
  -- 来源信息
  source VARCHAR(50) DEFAULT 'manual', -- manual, imported, auto_extracted
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, email)
);

-- 日历事件表
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本信息
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  
  -- 时间信息
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- 分类和状态
  type VARCHAR(50) DEFAULT 'event', -- meeting, event, deadline, personal
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high
  
  -- 来源信息
  source VARCHAR(50) DEFAULT 'manual', -- manual, ai, import
  related_email_id UUID REFERENCES emails(id),
  
  -- 重复设置
  recurrence_rule TEXT, -- RRULE格式
  recurrence_end_date TIMESTAMP,
  
  -- 提醒设置
  reminders JSONB DEFAULT '[]', -- 提醒配置数组
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 事件参与者表
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  
  -- 参与者信息
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, tentative
  is_organizer BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 通知内容
  type VARCHAR(50) NOT NULL, -- reminder, email, system, ai_insight
  title VARCHAR(500) NOT NULL,
  message TEXT,
  
  -- 关联信息
  related_id UUID, -- 关联的资源ID (邮件、事件等)
  related_type VARCHAR(50), -- email, event, task, contact
  
  -- 触发和状态
  trigger_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, dismissed, snoozed
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- 处理信息
  sent_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  snoozed_until TIMESTAMP,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI处理任务表
CREATE TABLE ai_processing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 任务信息
  type VARCHAR(50) NOT NULL, -- classify_email, extract_tasks, extract_events, generate_reply
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- 输入数据
  input_data JSONB NOT NULL,
  
  -- 输出结果
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- 处理信息
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_time_ms INTEGER,
  
  -- 优先级和重试
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 同步任务表
CREATE TABLE sync_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- 任务信息
  type VARCHAR(50) NOT NULL, -- full_sync, incremental_sync, send_email
  status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  
  -- 同步参数
  sync_params JSONB DEFAULT '{}',
  
  -- 结果统计
  emails_processed INTEGER DEFAULT 0,
  emails_new INTEGER DEFAULT 0,
  emails_updated INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  
  -- 错误信息
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  
  -- 时间信息
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户会话表
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 会话信息
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  
  -- 设备信息
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 时间
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 邮箱账户表索引
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email);
CREATE INDEX idx_email_accounts_status ON email_accounts(status);
CREATE INDEX idx_email_accounts_next_sync ON email_accounts(next_sync_at) WHERE sync_enabled = TRUE;

-- 邮件表索引
CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_sender_email ON emails(sender_email);
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_is_read ON emails(is_read);
CREATE INDEX idx_emails_is_deleted ON emails(is_deleted);
CREATE INDEX idx_emails_ai_processed ON emails(ai_processed) WHERE ai_processed = FALSE;

-- 复合索引
CREATE INDEX idx_emails_account_category_read ON emails(account_id, category, is_read);
CREATE INDEX idx_emails_account_received ON emails(account_id, received_at DESC);

-- 邮件收件人索引
CREATE INDEX idx_email_recipients_email_id ON email_recipients(email_id);
CREATE INDEX idx_email_recipients_email ON email_recipients(email);

-- 附件表索引
CREATE INDEX idx_email_attachments_email_id ON email_attachments(email_id);

-- 联系人表索引
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_at DESC);

-- 日历事件索引
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_related_email ON calendar_events(related_email_id);

-- 事件参与者索引
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_email ON event_attendees(email);

-- 通知表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_trigger_time ON notifications(trigger_time);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_related ON notifications(related_type, related_id);

-- AI任务索引
CREATE INDEX idx_ai_tasks_user_id ON ai_processing_tasks(user_id);
CREATE INDEX idx_ai_tasks_status ON ai_processing_tasks(status);
CREATE INDEX idx_ai_tasks_type ON ai_processing_tasks(type);
CREATE INDEX idx_ai_tasks_created ON ai_processing_tasks(created_at);

-- 同步任务索引
CREATE INDEX idx_sync_tasks_account_id ON sync_tasks(account_id);
CREATE INDEX idx_sync_tasks_status ON sync_tasks(status);
CREATE INDEX idx_sync_tasks_type ON sync_tasks(type);
CREATE INDEX idx_sync_tasks_created ON sync_tasks(created_at);

-- 会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- 系统配置索引
CREATE INDEX idx_system_config_key ON system_config(key);

-- 创建触发器函数：更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认系统配置
INSERT INTO system_config (key, value, description) VALUES
('ai_classification_enabled', 'true', '是否启用AI邮件分类'),
('ai_task_extraction_enabled', 'true', '是否启用AI任务提取'),
('ai_schedule_extraction_enabled', 'true', '是否启用AI日程提取'),
('max_attachment_size_mb', '25', '最大附件大小(MB)'),
('sync_batch_size', '50', '同步批次大小'),
('notification_retention_days', '30', '通知保留天数'),
('ai_processing_timeout_seconds', '30', 'AI处理超时时间(秒)');
