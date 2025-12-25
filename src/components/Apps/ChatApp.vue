<template>
  <div class="chat-app">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-info">
        <div class="avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=friend" alt="头像" />
        </div>
        <div class="user-info">
          <div class="username">好友聊天</div>
          <div class="status">在线</div>
        </div>
      </div>
      <div class="chat-actions">
        <button class="action-btn" title="语音通话">📞</button>
        <button class="action-btn" title="视频通话">📹</button>
        <button class="action-btn" title="更多">⋯</button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{ 'message-sent': message.isSent, 'message-received': !message.isSent }"
      >
        <div class="message-avatar" v-if="!message.isSent">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=friend" alt="头像" />
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <div class="message-avatar" v-if="message.isSent">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=me" alt="我的头像" />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="input-toolbar">
        <button class="toolbar-btn" title="表情">😊</button>
        <button class="toolbar-btn" title="文件">📎</button>
        <button class="toolbar-btn" title="图片">🖼️</button>
      </div>
      <div class="input-area">
        <textarea
          v-model="currentMessage"
          placeholder="输入消息..."
          @keydown="handleKeydown"
          @input="adjustTextareaHeight"
          ref="messageInput"
          rows="1"
        ></textarea>
        <button 
          class="send-btn"
          :disabled="!currentMessage.trim()"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'

interface Message {
  id: string
  text: string
  timestamp: number
  isSent: boolean
}

const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const currentMessage = ref('')

const messages = reactive<Message[]>([
  {
    id: '1',
    text: '你好！今天过得怎么样？',
    timestamp: Date.now() - 300000,
    isSent: false
  },
  {
    id: '2',
    text: '还不错！刚刚在开发一个新项目',
    timestamp: Date.now() - 240000,
    isSent: true
  },
  {
    id: '3',
    text: '听起来很有趣，是什么项目呢？',
    timestamp: Date.now() - 180000,
    isSent: false
  },
  {
    id: '4',
    text: '一个仿macOS的桌面系统，用Vue 3开发的',
    timestamp: Date.now() - 120000,
    isSent: true
  },
  {
    id: '5',
    text: '哇，那一定很酷！可以给我看看吗？',
    timestamp: Date.now() - 60000,
    isSent: false
  }
])

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (date.toDateString() === now.toDateString()) { // 今天
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 发送消息
const sendMessage = () => {
  if (!currentMessage.value.trim()) return
  
  const newMessage: Message = {
    id: Date.now().toString(),
    text: currentMessage.value.trim(),
    timestamp: Date.now(),
    isSent: true
  }
  
  messages.push(newMessage)
  currentMessage.value = ''
  
  // 重置输入框高度
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
  }
  
  // 滚动到底部
  scrollToBottom()
  
  // 模拟对方回复
  setTimeout(() => {
    const replies = [
      '看起来很棒！',
      '真的很厉害！',
      '我也想试试',
      '教教我怎么做的',
      '有时间一起讨论一下',
      '期待看到最终效果'
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)] || '好的'
    
    messages.push({
      id: (Date.now() + 1).toString(),
      text: randomReply,
      timestamp: Date.now(),
      isSent: false
    })
    
    scrollToBottom()
  }, 1000 + Math.random() * 2000)
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 自动调整输入框高度
const adjustTextareaHeight = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 120) + 'px'
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.status {
  font-size: 12px;
  color: #00C851;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: #e0e0e0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 80%;
}

.message-sent {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-received {
  align-self: flex-start;
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
  flex: 1;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message-sent .message-bubble {
  background: #007AFF;
  color: white;
  border-bottom-right-radius: 6px;
}

.message-received .message-bubble {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 6px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.chat-input {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 20px;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.toolbar-btn:hover {
  background: #e0e0e0;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area textarea {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.4;
}

.input-area textarea:focus {
  border-color: #007AFF;
}

.send-btn {
  padding: 10px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: #0056CC;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .chat-header {
    padding: 0 12px;
  }
  
  .chat-messages {
    padding: 12px;
  }
  
  .chat-input {
    padding: 8px 12px;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>
