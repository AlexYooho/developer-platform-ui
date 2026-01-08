<template>
  <div class="chat-main">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="contact-info">
        <Avatar
          :src="activeContact?.avatar || ''"
          :alt="activeContact?.name || ''"
          :status="activeContact?.status"
          :show-status="true"
          size="md"
          class="contact-avatar"
        />
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
    <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
      <div class="messages-list">
        <!-- 历史消息加载指示器 -->
        <div v-if="isLoadingHistory" class="loading-history">
          <div class="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="loading-text">加载历史消息中...</span>
        </div>
        
        <!-- 没有更多历史消息提示 -->
        <div v-else-if="!hasMoreHistory && messages.length > 0" class="no-more-history">
          <span>没有更多历史消息了</span>
        </div>
        
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
            @context-menu="handleContextMenu"
          />
        </div>
      </div>
      
      <!-- 正在输入指示器 -->
      <div v-if="isTyping" class="typing-indicator">
        <Avatar
          :src="activeContact?.avatar || ''"
          :alt="activeContact?.name || ''"
          size="sm"
          class="typing-avatar"
        />
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
  
  <!-- 全局右键菜单 -->
  <ContextMenu
    :visible="contextMenu.visible.value"
    :position="contextMenu.position.value"
    :menu-items="menuItems"
    @close="contextMenu.hideMenu"
  />

  <!-- 模态框 -->
  <Modal
    v-model:visible="modalState.visible"
    :type="modalState.type"
    :title="modalState.title"
    :message="modalState.message"
    :confirm-text="modalState.confirmText"
    :cancel-text="modalState.cancelText"
    :show-cancel="modalState.showCancel"
    :show-buttons="modalState.showButtons"
    :close-on-overlay="modalState.closeOnOverlay"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import MessageItem from './MessageItem.vue'
import ChatInput from './ChatInput.vue'
import ContextMenu from '@/components/Common/ContextMenu.vue'
import Avatar from '@/components/Common/Avatar.vue'
import type { Contact } from './ChatSidebar.vue'
import type { ContextMenuItem } from '@/components/Common/ContextMenu.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useModal } from '@/composables/useModal'
import Modal from '@/components/Common/Modal.vue'
import api from '@/utils/api'
import { ErrorHandlers } from '@/utils/errorHandler'

export interface Message {
  // id: string
  // text: string
  // timestamp: number
  // isSent: boolean
  // status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  // type?: 'text' | 'image' | 'file' | 'emoji'
  // fileUrl?: string
  // fileName?: string
  // fileSize?: number
  id: string
  isSent: boolean
  sendId: number
  receiverId: number
  groupId?: number
  convSeq?: number
  messageContent: string
  messageContentType: number
  messageStatus: number
  readStatus: number
  sendNickname: string
  sendTime?: string
  timestamp: number
  referenceId?: number
  likeCount?: number
  atUserIds?: number[]
  isLiked?: boolean // 是否已点赞
  isFavorited?: boolean // 是否已收藏
  isRecalled?: boolean // 是否已撤回
}

interface Props {
  activeContact?: Contact | null
  messages?: Message[]
  loadHistoryFn?: () => Promise<boolean>
}

interface Emits {
  (e: 'send-message', message: { text: string; type: string }): void
  (e: 'voice-call', contact: Contact): void
  (e: 'video-call', contact: Contact): void
  (e: 'file-upload', file: File): void
  (e: 'context-menu', event: MouseEvent, message: Message): void
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
const isLoadingHistory = ref(false)
const hasMoreHistory = ref(true)
const justLoadedHistory = ref(false)

// 全局右键菜单
const contextMenu = useContextMenu()
const currentMessage = ref<Message | null>(null)

  // 模态框
const { modalState, handleConfirm, handleCancel, alert } = useModal()

// 右键菜单处理函数
const handleContextMenu = (event: MouseEvent, message: Message) => {
  currentMessage.value = message
  contextMenu.showMenu(event)
}

// 菜单项配置
const menuItems = computed<ContextMenuItem[]>(() => {
  if (!currentMessage.value) return []
  
  const message = currentMessage.value
  const items: ContextMenuItem[] = []
  
  // 复制
  items.push({
    key: 'copy',
    label: '复制',
    iconPath: 'M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    action: () => copyMessage(message)
  })
  
  // 转发
  items.push({
    key: 'forward',
    label: '转发',
    iconPath: 'M9 17l4-5-4-5 M20 18v-2a4 4 0 0 0-4-4H4',
    action: () => forwardMessage(message)
  })
  
  // 收藏/取消收藏
  items.push({
    key: 'favorite',
    label: message.isFavorited ? '取消收藏' : '收藏',
    iconPath: message.isFavorited 
      ? 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
      : 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    action: () => toggleFavorite(message)
  })
  
  // 点赞/取消点赞
  items.push({
    key: 'like',
    label: message.isLiked ? '取消点赞' : '点赞',
    iconPath: message.isLiked
      ? 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'
      : 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    action: () => toggleLike(message)
  })
  
  // 撤回（只有自己发送的消息且在2分钟内可以撤回）
  const canRecall = message.isSent && !message.isRecalled && (Date.now() - message.timestamp) < 5000 * 60 * 1000
  if (canRecall) {
    items.push({
      key: 'recall',
      label: '撤回',
      iconPath: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
      action: () => recallMessage(message)
    })
  }
  
  // 删除（只有自己发送的消息可以删除）
  if (message.isSent) {
    items.push({
      key: 'delete',
      label: '删除',
      iconPath: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
      action: () => handleDelete(message)
    })
  }
  
  // 回复
  items.push({
    key: 'reply',
    label: '回复',
    iconPath: 'M9 17l-4-5 4-5 M20 18v-2a4 4 0 0 0-4-4H4',
    action: () => replyMessage(message)
  })
  
  return items
})

// 消息操作函数
const copyMessage = (message: Message) => {
  navigator.clipboard.writeText(message.messageContent)
  // 可以添加复制成功的提示
  console.log('消息已复制到剪贴板')
}

// 转发消息
const forwardMessage = (message: Message) => {
  // 这里可以打开转发对话框，选择转发的联系人
  console.log('转发消息:', message.messageContent)
  // 实际实现时可能需要打开一个联系人选择器
  // emit('forward-message', message)
}

// 切换收藏状态
const toggleFavorite = (message: Message) => {
  message.isFavorited = !message.isFavorited
  console.log(message.isFavorited ? '已收藏' : '已取消收藏')
  // 这里可以调用API更新收藏状态
  // api.message.toggleFavorite(message.id, message.isFavorited)
}

// 切换点赞状态
const toggleLike = (message: Message) => {
  const wasLiked = message.isLiked
  message.isLiked = !message.isLiked
  
  // 更新点赞数量
  if (message.isLiked) {
    message.likeCount = (message.likeCount || 0) + 1
  } else {
    message.likeCount = Math.max((message.likeCount || 0) - 1, 0)
  }
  
  console.log(message.isLiked ? '已点赞' : '已取消点赞')
  // 这里可以调用API更新点赞状态
  // api.message.toggleLike(message.id, message.isLiked)
}

// 撤回消息
const recallMessage = async (message: Message) => {
  // 检查是否可以撤回（5分钟内）
  const timeDiff = Date.now() - message.timestamp
  if (timeDiff > 5000 * 60 * 1000) {
    alert('消息发送时间超过2分钟，无法撤回')
    return
  }

  try{
    const data = {
      message_id: message.id,
      target_id: props.activeContact?.target_id,
    }
    const response = await api.message.withdrawMessage(props.activeContact!.type,data);
    if(response.code !== 200) {
      alert(response.msg)
      return
    }
    message.isRecalled = true
    message.messageContent = '你撤回了一条消息'
  } catch (error) {
    await alert(ErrorHandlers.convert(error))
  }
}

const handleDelete = (message: Message) => {
  // 这里可以添加删除确认逻辑
  console.log('删除消息:', message.id)
}

const replyMessage = (message: Message) => {
  // 这里可以添加回复逻辑
  console.log('回复消息:', message.id)
}


// 使用传入的消息或默认消息
const messages = computed(() => props.messages)

// 按日期分组消息
const groupedMessages = computed(() => {
  const groups: Record<string, Message[]> = {} // Record<日期, 消息数组>
  
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
  console.log('调用 scrollToBottom，justLoadedHistory:', justLoadedHistory.value)
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  })
}

// 立即滚动到底部（用于联系人切换）
const scrollToBottomImmediate = () => {
  console.log('调用 scrollToBottomImmediate，justLoadedHistory:', justLoadedHistory.value)
  // 使用 setTimeout 确保 DOM 完全更新后再滚动
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 0)
}

// 处理滚动事件
const handleScroll = async () => {
  if (!messagesContainer.value) {
    console.log('没有 messagesContainer')
    return
  }
  
  if (isLoadingHistory.value) {
    console.log('正在加载历史消息，跳过')
    return
  }
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  
  console.log('滚动事件 - scrollTop:', scrollTop, 'hasMoreHistory:', hasMoreHistory.value, 'isLoadingHistory:', isLoadingHistory.value)
  
  // 当滚动到顶部附近时加载历史消息
  if (scrollTop < 100 && hasMoreHistory.value) {
    console.log('触发历史消息加载')
    isLoadingHistory.value = true
    justLoadedHistory.value = true
    
    // 记录当前滚动位置
    const previousScrollHeight = scrollHeight
    
    try {
      console.log('开始调用 loadHistoryFn')
      // 调用父组件的历史消息加载方法
      const hasMore = props.loadHistoryFn ? await props.loadHistoryFn() : false
      console.log('loadHistoryFn 返回结果:', hasMore)
      
      // 只有在确实没有更多消息时才设置为false
      if (!hasMore) {
        hasMoreHistory.value = false
        console.log('没有更多历史消息了')
      }
      
      // 等待Vue完成所有DOM更新
      await nextTick()
      await nextTick()
      
      // 加载完成后，保持用户的阅读位置
      if (messagesContainer.value) {
        const newScrollHeight = messagesContainer.value.scrollHeight
        const scrollDiff = newScrollHeight - previousScrollHeight
        const newScrollTop = scrollTop + scrollDiff
        messagesContainer.value.scrollTop = newScrollTop
        console.log('滚动位置调整 - 原高度:', previousScrollHeight, '新高度:', newScrollHeight, '差值:', scrollDiff, '新位置:', newScrollTop)
      }
      
      // 延迟重置标志，确保所有监听器都已经执行
      setTimeout(() => {
        justLoadedHistory.value = false
        console.log('重置 justLoadedHistory 标志')
      }, 500)
    } catch (error) {
      console.error('加载历史消息失败:', error)
      justLoadedHistory.value = false
    } finally {
      isLoadingHistory.value = false
      console.log('历史消息加载流程结束，isLoadingHistory 设置为 false')
    }
  }
}

// 处理发送消息
const handleSendMessage = (data: { text: string; type: string }) => {
  emit('send-message', data)
  scrollToBottom()
}

// 处理正在输入
const handleTyping = () => {
  // 这里可以发送正在输入的状态给服务器
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
watch(() => props.activeContact, (newContact, oldContact) => {
  if (newContact && newContact.id !== oldContact?.id) {
    // 模拟对方可能正在输入
    setTimeout(simulateTyping, 1000)
  }
})

// 监听消息prop变化 - 用于联系人切换时的消息加载
watch(() => props.messages, (newMessages, oldMessages) => {
  // 如果是联系人切换导致的消息变化（消息数组完全替换）
  // 但不是加载历史消息导致的变化
  if (newMessages && oldMessages && newMessages !== oldMessages && !justLoadedHistory.value) {
    console.log('消息数组变化，滚动到底部')
    scrollToBottomImmediate()
  } else if (justLoadedHistory.value) {
    console.log('加载历史消息导致的消息数组变化，不滚动到底部')
  }
}, { immediate: false })

// 监听消息数量变化 - 只在消息增加时滚动（新消息）
watch(() => messages.value.length, (newLength, oldLength) => {
  // 只有在消息数量增加时才滚动（新消息），避免切换联系人时的重复滚动
  // 但是如果刚刚加载了历史消息，则不滚动到底部
  if (oldLength !== undefined && newLength > oldLength && !justLoadedHistory.value) {
    console.log('检测到新消息，滚动到底部')
    scrollToBottom()
  } else if (justLoadedHistory.value) {
    console.log('刚刚加载了历史消息，不滚动到底部')
  }
})

// 监听联系人变化，重置历史消息状态
watch(() => props.activeContact?.id, (newId, oldId) => {
  if (newId !== oldId) {
    console.log('联系人切换，重置历史消息状态 - 从', oldId, '到', newId)
    hasMoreHistory.value = true
    isLoadingHistory.value = false
    justLoadedHistory.value = false
  }
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
  position: relative;
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

/* 历史消息加载指示器 */
.loading-history {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  gap: 4px;
  margin-right: 8px;
}

.loading-spinner span {
  width: 6px;
  height: 6px;
  background-color: #999;
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

.loading-spinner span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-spinner span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.no-more-history {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #999;
  font-size: 12px;
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
