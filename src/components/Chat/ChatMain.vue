<template>
  <div class="chat-main">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="contact-info">
        <div class="contact-avatar">
          <img :src="activeContact?.avatar" :alt="activeContact?.name" />
          <div 
            class="status-indicator" 
            :class="activeContact?.status"
            v-if="activeContact?.status === 'online'"
          ></div>
        </div>
        <div class="contact-details">
          <div class="contact-name">{{ activeContact?.name || '选择联系人' }}</div>
          <div class="contact-status">{{ getStatusText(activeContact?.status) }}</div>
        </div>
      </div>
      
      <div class="chat-actions">
        <button class="action-btn" title="语音通话" @click="startVoiceCall">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </button>
        <button class="action-btn" title="视频通话" @click="startVideoCall">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </button>
        <button class="action-btn" title="更多" @click="showMoreActions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <!-- 日期分隔符 -->
        <div 
          v-for="(group, date) in groupedMessages" 
          :key="date"
          class="message-group"
        >
          <div class="date-divider">
            <span class="date-text">{{ formatDate(date) }}</span>
          </div>
          
          <!-- 消息列表 -->
          <MessageItem
            v-for="message in group"
            :key="message.id"
            :message="message"
            :show-avatar="!message.isSent"
            :contact-avatar="activeContact?.avatar"
            @resend="handleResendMessage"
            @delete="handleDeleteMessage"
          />
        </div>
      </div>
      
      <!-- 正在输入指示器 -->
      <div v-if="isTyping" class="typing-indicator">
        <div class="typing-avatar">
          <img :src="activeContact?.avatar" :alt="activeContact?.name" />
        </div>
        <div class="typing-content">
          <div class="typing-bubble">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <ChatInput
      v-if="activeContact"
      :disabled="!activeContact"
      @send-message="handleSendMessage"
      @typing="handleTyping"
      @file-upload="handleFileUpload"
      @emoji-select="handleEmojiSelect"
    />
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="empty-title">选择一个联系人开始聊天</div>
      <div class="empty-description">从左侧联系人列表中选择一个联系人开始对话</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import MessageItem from './MessageItem.vue'
import ChatInput from './ChatInput.vue'
import type { Contact } from './ChatSidebar.vue'

export interface Message {
  id: string
  text: string
  timestamp: number
  isSent: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  type?: 'text' | 'image' | 'file' | 'emoji'
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface Props {
  activeContact?: Contact | null
  messages?: Message[]
}

interface Emits {
  (e: 'send-message', message: { text: string; type: string }): void
  (e: 'voice-call', contact: Contact): void
  (e: 'video-call', contact: Contact): void
  (e: 'file-upload', file: File): void
  (e: 'message-delete', messageId: string): void
  (e: 'message-resend', messageId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  activeContact: null,
  messages: () => []
})

const emit = defineEmits<Emits>()

const messagesContainer = ref<HTMLElement>()
const isTyping = ref(false)
const typingTimer = ref<number>()

// 默认消息数据
const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Inter 不错，但也许可以试试更现代一点的？',
    timestamp: Date.now() - 3600000,
    isSent: false,
    status: 'read'
  },
  {
    id: '2',
    text: '数据！我们试试 Rounded Mplus 吧。',
    timestamp: Date.now() - 3300000,
    isSent: false,
    status: 'read'
  },
  {
    id: '3',
    text: '听起来不错。',
    timestamp: Date.now() - 1800000,
    isSent: true,
    status: 'read'
  }
]

// 使用传入的消息或默认消息
const messages = computed(() => props.messages.length > 0 ? props.messages : defaultMessages)

// 按日期分组消息
const groupedMessages = computed(() => {
  const groups: Record<string, Message[]> = {}
  
  messages.value.forEach(message => {
    const date = new Date(message.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
  })
  
  return groups
})

// 获取状态文本
const getStatusText = (status?: string) => {
  switch (status) {
    case 'online':
      return '在线'
    case 'away':
      return '离开'
    case 'offline':
      return '离线'
    default:
      return ''
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 86400000 && date.toDateString() === now.toDateString()) {
    return '今天'
  } else if (diff < 172800000) {
    return '昨天'
  } else if (diff < 604800000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  } else {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  })
}

// 处理发送消息
const handleSendMessage = (data: { text: string; type: string }) => {
  emit('send-message', data)
  scrollToBottom()
}

// 处理正在输入
const handleTyping = () => {
  // 这里可以发送正在输入的状态给服务器
  console.log('User is typing...')
}

// 处理文件上传
const handleFileUpload = (file: File) => {
  emit('file-upload', file)
}

// 处理表情选择
const handleEmojiSelect = (emoji: string) => {
  handleSendMessage({ text: emoji, type: 'emoji' })
}

// 处理重发消息
const handleResendMessage = (messageId: string) => {
  emit('message-resend', messageId)
}

// 处理删除消息
const handleDeleteMessage = (messageId: string) => {
  emit('message-delete', messageId)
}

// 开始语音通话
const startVoiceCall = () => {
  if (props.activeContact) {
    emit('voice-call', props.activeContact)
  }
}

// 开始视频通话
const startVideoCall = () => {
  if (props.activeContact) {
    emit('video-call', props.activeContact)
  }
}

// 显示更多操作
const showMoreActions = () => {
  console.log('Show more actions')
}

// 模拟对方正在输入
const simulateTyping = () => {
  if (Math.random() > 0.7) {
    isTyping.value = true
    setTimeout(() => {
      isTyping.value = false
    }, 2000 + Math.random() * 3000)
  }
}

// 监听活跃联系人变化
watch(() => props.activeContact, (newContact) => {
  if (newContact) {
    scrollToBottom(false)
    // 模拟对方可能正在输入
    setTimeout(simulateTyping, 1000)
  }
})

// 监听消息变化
watch(() => messages.value.length, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom(false)
})

onUnmounted(() => {
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
  }
})
</script>

<style scoped>
.chat-main {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  height: 64px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  z-index: 10;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background: #4caf50;
}

.contact-details {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 2px;
}

.contact-status {
  font-size: 13px;
  color: #6c757d;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: #f8f9fa;
}

.messages-list {
  padding: 16px 24px;
}

.message-group {
  margin-bottom: 24px;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.date-text {
  background: #e9ecef;
  color: #6c757d;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.typing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 24px 16px;
  animation: fadeIn 0.3s ease;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.typing-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.typing-content {
  flex: 1;
}

.typing-bubble {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  padding: 12px 16px;
  max-width: 80px;
  display: inline-block;
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #dee2e6;
  margin-bottom: 16px;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #6c757d;
  max-width: 300px;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 0 16px;
    height: 56px;
  }
  
  .messages-list {
    padding: 12px 16px;
  }
  
  .typing-indicator {
    padding: 0 16px 12px;
  }
  
  .empty-state {
    padding: 32px 16px;
  }
}
</style>
