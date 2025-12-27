<template>
  <div 
    class="message-item"
    :class="{ 
      'message-sent': message.isSent, 
      'message-received': !message.isSent,
      'message-failed': message.status === 'failed'
    }"
  >
    <!-- 接收消息的头像 -->
    <Avatar
      v-if="showAvatar && !message.isSent"
      :src="contactAvatar"
      alt="联系人头像"
      size="sm"
      class="message-avatar"
    />
    
    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息气泡 -->
      <div 
        class="message-bubble"
        @contextmenu.prevent="showContextMenu"
        @click="handleMessageClick"
      >
        <!-- 文本消息 -->
        <div v-if="message.type === 'text' || !message.type" class="message-text">
          {{ message.text }}
        </div>
        
        <!-- 图片消息 -->
        <div v-else-if="message.type === 'image'" class="message-image">
          <img :src="message.fileUrl" :alt="message.fileName" @click="previewImage" />
        </div>
        
        <!-- 文件消息 -->
        <div v-else-if="message.type === 'file'" class="message-file">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ message.fileName }}</div>
            <div class="file-size">{{ formatFileSize(message.fileSize) }}</div>
          </div>
          <button class="download-btn" @click="downloadFile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
        
        <!-- 表情消息 -->
        <div v-else-if="message.type === 'emoji'" class="message-emoji">
          {{ message.text }}
        </div>
      </div>
      
      <!-- 消息时间和状态 -->
      <div class="message-meta">
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        
        <!-- 发送状态（仅发送的消息显示） -->
        <div v-if="message.isSent" class="message-status">
          <svg 
            v-if="message.status === 'sending'" 
            class="status-icon sending" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          
          <svg 
            v-else-if="message.status === 'sent'" 
            class="status-icon sent" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          
          <svg 
            v-else-if="message.status === 'delivered'" 
            class="status-icon delivered" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="20,6 9,17 4,12"/>
            <polyline points="16,6 5,17 0,12"/>
          </svg>
          
          <svg 
            v-else-if="message.status === 'read'" 
            class="status-icon read" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="20,6 9,17 4,12"/>
            <polyline points="16,6 5,17 0,12"/>
          </svg>
          
          <svg 
            v-else-if="message.status === 'failed'" 
            class="status-icon failed" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        
        <!-- 重发按钮（失败消息） -->
        <button 
          v-if="message.status === 'failed'" 
          class="resend-btn"
          @click="handleResend"
          title="重新发送"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 发送消息的头像 -->
    <Avatar
      v-if="message.isSent"
      src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
      alt="我的头像"
      size="sm"
      class="message-avatar"
    />
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Message } from './ChatMain.vue'
import Avatar from '@/components/Common/Avatar.vue'

interface Props {
  message: Message
  showAvatar?: boolean
  contactAvatar?: string
}

interface Emits {
  (e: 'resend', messageId: string): void
  (e: 'delete', messageId: string): void
  (e: 'reply', message: Message): void
  (e: 'copy', text: string): void
  (e: 'context-menu', event: MouseEvent, message: Message): void
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  contactAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=contact'
})

const emit = defineEmits<Emits>()


// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  })
}

// 格式化文件大小
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent) => {
  emit('context-menu', event, props.message)
}


// 处理消息点击
const handleMessageClick = () => {
  // 可以在这里添加其他点击处理逻辑
}

// 处理重发
const handleResend = () => {
  emit('resend', props.message.id)
}

// 处理删除
const handleDelete = () => {
  emit('delete', props.message.id)
}

// 复制消息
const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.text)
    emit('copy', props.message.text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 回复消息
const replyMessage = () => {
  emit('reply', props.message)
}

// 预览图片
const previewImage = () => {
  if (props.message.fileUrl) {
    window.open(props.message.fileUrl, '_blank')
  }
}

// 下载文件
const downloadFile = () => {
  if (props.message.fileUrl && props.message.fileName) {
    const link = document.createElement('a')
    link.href = props.message.fileUrl
    link.download = props.message.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

</script>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
  position: relative;
  width: 100%;
}

.message-sent {
  justify-content: flex-end;
}

.message-sent .message-content {
  order: 1;
}

.message-sent .message-avatar {
  order: 2;
}

.message-received {
  justify-content: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  word-wrap: break-word;
  word-break: break-word;
  display: inline-block;
  max-width: 100%;
  width: fit-content;
}

.message-sent .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 6px;
}

.message-received .message-bubble {
  background: white;
  color: #333;
  border: 1px solid #e9ecef;
  border-bottom-left-radius: 6px;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-failed .message-bubble {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-image {
  max-width: 200px;
}

.message-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.message-image img:hover {
  transform: scale(1.02);
}

.message-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  min-width: 200px;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  flex-shrink: 0;
}

.file-icon svg {
  width: 20px;
  height: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  opacity: 0.8;
}

.download-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: currentColor;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.download-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.download-btn svg {
  width: 16px;
  height: 16px;
}

.message-emoji {
  font-size: 32px;
  line-height: 1;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
  color: #6c757d;
}

.message-sent .message-meta {
  justify-content: flex-end;
}

.message-received .message-meta {
  justify-content: flex-start;
}

.message-time {
  white-space: nowrap;
}

.message-status {
  display: flex;
  align-items: center;
}

.status-icon {
  width: 12px;
  height: 12px;
}

.status-icon.sending {
  color: #6c757d;
  animation: spin 1s linear infinite;
}

.status-icon.sent {
  color: #6c757d;
}

.status-icon.delivered {
  color: #28a745;
}

.status-icon.read {
  color: #007bff;
}

.status-icon.failed {
  color: #dc3545;
}

.resend-btn {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.resend-btn:hover {
  background: rgba(220, 53, 69, 0.1);
  transform: scale(1.1);
}

.resend-btn svg {
  width: 12px;
  height: 12px;
}


/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .message-bubble {
    padding: 10px 14px;
  }
  
  .message-file {
    min-width: 160px;
  }
  
  .file-icon {
    width: 36px;
    height: 36px;
  }
  
  .download-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
