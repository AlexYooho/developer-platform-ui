<template>
  <div class="chat-app">
    <!-- 侧边栏 -->
    <ChatSidebar
      :contacts="contacts"
      :active-contact-id="activeContact?.id"
      :current-user="currentUser"
      :is-loading="isLoadingContacts"
      @contact-selected="handleContactSelected"
      @settings-clicked="showSettings"
    />
    
    <!-- 主聊天区域 -->
    <ChatMain
      v-if="activeContact"
      :active-contact="activeContact"
      :messages="currentMessages"
      @send-message="handleSendMessage"
      @voice-call="handleVoiceCall"
      @video-call="handleVideoCall"
      @file-upload="handleFileUpload"
      @message-delete="handleMessageDelete"
      @message-resend="handleMessageResend"
    />
    
    <!-- 空状态 - 未选择联系人 -->
    <div v-else class="chat-empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="empty-title">选择一个联系人开始聊天</div>
        <div class="empty-description">从左侧联系人列表中选择一个联系人开始对话</div>
      </div>
    </div>
    
    <!-- 用户信息面板 -->
    <UserInfoPanel
      v-if="activeContact"
      :contact="activeContact"
      :is-visible="showUserInfo"
      @close="hideUserInfo"
      @start-chat="handleStartChat"
      @voice-call="handleVoiceCall"
      @video-call="handleVideoCall"
      @open-group="handleOpenGroup"
      @open-file="handleOpenFile"
      @mute-contact="handleMuteContact"
      @pin-contact="handlePinContact"
      @block-contact="handleBlockContact"
      @delete-contact="handleDeleteContact"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import ChatSidebar from '@/components/Chat/ChatSidebar.vue'
import ChatMain from '@/components/Chat/ChatMain.vue'
import UserInfoPanel from '@/components/Chat/UserInfoPanel.vue'
import type { Contact } from '@/components/Chat/ChatSidebar.vue'
import type { Message } from '@/components/Chat/ChatMain.vue'
import api from '@/utils/api'

// 后端会话数据类型
interface ConversationData {
  id: number
  target_id: number
  conv_type: number
  name: string
  head_image: string
  last_msg_content: string
  last_msg_time: string
  unread_count: number
  pinned: boolean
  muted: boolean
}

// 后端消息数据类型
interface MessageData {
  id: number
  send_id: number
  receiver_id: number
  group_id: number | null
  conv_seq: number
  message_content: string
  message_content_type: number
  message_status: number
  read_status: number
  send_nickname: string
  send_time: string
  reference_id: number
  like_count: number
  at_user_ids: string | null
  un_read_count: number | null
}

// 当前用户信息
const currentUser = ref({
  id: 'me',
  name: '我',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  status: '在线'
})

// 联系人列表
const contacts = reactive<Contact[]>([])

// 加载状态
const isLoadingContacts = ref(false)

// 所有消息数据（按联系人ID分组）
const allMessages = reactive<Record<string, Message[]>>({})

// 当前选中的联系人
const activeContact = ref<Contact | null>(null)

// 是否显示用户信息面板
const showUserInfo = ref(true)

// 当前聊天的消息
const currentMessages = computed(() => {
  if (!activeContact.value) return []
  return allMessages[activeContact.value.id] || []
})

// 转换后端数据为前端格式
const convertConversationToContact = (conversation: ConversationData): Contact => {
  return {
    id: conversation.target_id.toString(),
    name: conversation.name,
    avatar: conversation.head_image,
    status: 'online', // 后端没有在线状态，默认设为在线
    lastMessage: conversation.last_msg_content,
    lastMessageTime: new Date(conversation.last_msg_time).getTime(),
    unreadCount: conversation.unread_count,
    isMuted: conversation.muted,
    isPinned: conversation.pinned
  }
}

// 转换后端消息数据为前端Message格式
const convertMessageToFrontend = (messageData: MessageData, currentUserId: number = 1): Message => {
  return {
    id: messageData.id.toString(),
    text: messageData.message_content,
    timestamp: new Date(messageData.send_time).getTime(),
    isSent: messageData.send_id === currentUserId,
    status: messageData.message_status === 0 ? 'sent' : 'failed',
    type: messageData.message_content_type === 0 ? 'text' : 'file'
  }
}

// 获取会话列表
const fetchConversations = async () => {
  if (isLoadingContacts.value) return
  isLoadingContacts.value = true
  try {
    const response = await api.message.getConversationList()
    if (response.data && response.code === 200) {
      // 清空现有联系人
      contacts.splice(0, contacts.length)
      // 转换并添加新的联系人数据
      const newContacts = response.data.map(convertConversationToContact)
      contacts.push(...newContacts)
      // 如果有联系人且没有选中的联系人，默认选中第一个
      if (contacts.length > 0 && !activeContact.value) {
        const firstContact = contacts[0]
        if (firstContact) {
          // handleContactSelected(firstContact)
        }
      }
    } else {
      console.error('获取会话列表失败:', response.data?.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取会话列表出错:', error)
    // 如果请求失败，可以显示一些默认数据或错误提示
    // 这里暂时保持空列表
  } finally {
    isLoadingContacts.value = false
  }
}

// 获取指定联系人的消息列表
const fetchMessages = async (contactId: string) => {
  try {
    const response = await api.message.getMessages(contactId)
    if (response.data && response.code === 200) {
      // 转换消息数据
      const messages = response.data.map((msgData: MessageData) => convertMessageToFrontend(msgData))
      
      // 按时间排序（从旧到新）
      messages.sort((a: Message, b: Message) => a.timestamp - b.timestamp)
      
      // 存储到对应联系人的消息列表中
      allMessages[contactId] = messages
    } else {
      console.error('获取消息列表失败:', response.data?.msg || '未知错误')
      // 如果获取失败，设置为空数组
      allMessages[contactId] = []
    }
  } catch (error) {
    console.error('获取消息列表出错:', error)
    // 如果请求失败，设置为空数组
    allMessages[contactId] = []
  }
}

// 处理联系人选择
const handleContactSelected = async (contact: Contact) => {
  activeContact.value = contact
  showUserInfo.value = true
  
  // 清除未读消息数
  const contactIndex = contacts.findIndex(c => c.id === contact.id)
  if (contactIndex !== -1) {
    contacts[contactIndex]!.unreadCount = 0
  }
  
  // 获取该联系人的消息列表
  await fetchMessages(contact.id)
}

// 处理发送消息
const handleSendMessage = (data: { text: string; type: string }) => {
  if (!activeContact.value) return
  
  const newMessage: Message = {
    id: Date.now().toString(),
    text: data.text,
    timestamp: Date.now(),
    isSent: true,
    status: 'sending',
    type: data.type as any
  }
  
  // 添加到消息列表
  if (!allMessages[activeContact.value.id]) {
    allMessages[activeContact.value.id] = []
  }
  allMessages[activeContact.value.id]?.push(newMessage)
  
  // 更新联系人的最后消息
  const contactIndex = contacts.findIndex(c => c.id === activeContact.value?.id)
  if (contactIndex !== -1) {
    contacts[contactIndex]!.lastMessage = data.text
    contacts[contactIndex]!.lastMessageTime = Date.now()
  }
  
  // 模拟发送状态变化
  setTimeout(() => {
    newMessage.status = 'sent'
    setTimeout(() => {
      newMessage.status = 'delivered'
      setTimeout(() => {
        newMessage.status = 'read'
      }, 1000)
    }, 500)
  }, 500)
  
  // 模拟对方回复
  setTimeout(() => {
    const replies = [
      '看起来很棒！',
      '真的很厉害！',
      '我也想试试',
      '教教我怎么做的',
      '有时间一起讨论一下',
      '期待看到最终效果',
      '好的，明白了',
      '收到！'
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)] || '好的'
    
    const replyMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: randomReply,
      timestamp: Date.now(),
      isSent: false,
      status: 'read'
    }
    
    if (activeContact.value) {
      allMessages[activeContact.value.id]?.push(replyMessage)
      
      // 更新联系人的最后消息
      if (contactIndex !== -1) {
        contacts[contactIndex]!.lastMessage = randomReply
        contacts[contactIndex]!.lastMessageTime = Date.now()
      }
    }
  }, 1000 + Math.random() * 2000)
}

// 处理语音通话
const handleVoiceCall = (contact: Contact) => {
  console.log('开始语音通话:', contact.name)
  // 这里可以集成实际的语音通话功能
}

// 处理视频通话
const handleVideoCall = (contact: Contact) => {
  console.log('开始视频通话:', contact.name)
  // 这里可以集成实际的视频通话功能
}

// 处理文件上传
const handleFileUpload = (file: File) => {
  console.log('上传文件:', file.name)
  // 这里可以处理文件上传逻辑
  
  // 模拟文件消息
  if (activeContact.value) {
    const fileMessage: Message = {
      id: Date.now().toString(),
      text: file.name,
      timestamp: Date.now(),
      isSent: true,
      status: 'sent',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      fileName: file.name,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file)
    }
    
    if (!allMessages[activeContact.value.id]) {
      allMessages[activeContact.value.id] = []
    }
    allMessages[activeContact.value.id]?.push(fileMessage)
  }
}

// 处理消息删除
const handleMessageDelete = (messageId: string) => {
  if (!activeContact.value) return
  
  const messages = allMessages[activeContact.value.id]
  if (messages) {
    const index = messages.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.splice(index, 1)
    }
  }
}

// 处理消息重发
const handleMessageResend = (messageId: string) => {
  if (!activeContact.value) return
  
  const messages = allMessages[activeContact.value.id]
  if (messages) {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      message.status = 'sending'
      setTimeout(() => {
        if (message) {
          message.status = 'sent'
        }
      }, 1000)
    }
  }
}

// 显示设置
const showSettings = () => {
  console.log('显示设置')
}


// 隐藏用户信息面板
const hideUserInfo = () => {
  showUserInfo.value = false
}

// 处理开始聊天
const handleStartChat = (contact: Contact) => {
  activeContact.value = contact
  showUserInfo.value = true
}

// 处理打开群组
const handleOpenGroup = (group: any) => {
  console.log('打开群组:', group.name)
}

// 处理打开文件
const handleOpenFile = (file: any) => {
  console.log('打开文件:', file.name)
}

// 处理静音联系人
const handleMuteContact = (contact: Contact) => {
  console.log('静音联系人:', contact.name)
  // 这里可以实现静音逻辑
}

// 处理置顶联系人
const handlePinContact = (contact: Contact) => {
  console.log('置顶联系人:', contact.name)
  // 这里可以实现置顶逻辑
}

// 处理屏蔽联系人
const handleBlockContact = (contact: Contact) => {
  console.log('屏蔽联系人:', contact.name)
  // 这里可以实现屏蔽逻辑
}

// 处理删除联系人
const handleDeleteContact = (contact: Contact) => {
  console.log('删除联系人:', contact.name)
  // 这里可以实现删除逻辑
  const index = contacts.findIndex(c => c.id === contact.id)
  if (index !== -1) {
    contacts.splice(index, 1)
    if (activeContact.value?.id === contact.id) {
      activeContact.value = null
    }
  }
}

onMounted(() => {
  // 获取会话列表
  fetchConversations()
})
</script>

<style scoped>
.chat-app {
  height: 100%;
  display: flex;
  background: #f8f9fa;
  overflow: hidden;
}

/* 空状态样式 */
.chat-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-right: 1px solid #e9ecef;
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
  color: #adb5bd;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-app {
    flex-direction: column;
  }
}
</style>
