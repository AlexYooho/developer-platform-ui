<template>
  <div class="chat-app">
    <!-- 左侧导航栏 -->
    <ChatNavbar 
      :active-tab="activeTab"
      @tab-change="handleTabChange"
    />
    
    <!-- 消息模块 -->
    <div v-if="activeTab === 'messages'" class="chat-content">
      <!-- 侧边栏 -->
      <ChatSidebar
        :contacts="contacts"
        :active-contact-id="activeContact?.id"
        :current-user="currentUser"
        :is-loading="isLoadingContacts"
        @contact-selected="handleContactSelected"
        @settings-clicked="showSettings"
      />
      
      <!-- 主聊天区域或空状态 -->
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
        @context-menu="handleContextMenu"
      />
      <!-- 空状态 - 未选择联系人时显示 -->
      <div v-else class="chat-empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="empty-title">选择一个联系人开始聊天</div>
          <div class="empty-description">从左侧联系人列表中选择一个联系人开始对话</div>
        </div>
      </div>
      
      <!-- 用户信息面板 - 只在选中联系人时显示 -->
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
    
    <!-- 通讯录模块 -->
    <ContactsView 
      v-else-if="activeTab === 'contacts'"
      @contact-selected="handleContactsViewContactSelected"
      @start-chat="handleContactsViewStartChat"
    />
    
    <!-- 朋友圈模块 -->
    <MomentsView v-else-if="activeTab === 'moments'" />
    
    <!-- 钱包模块 -->
    <WalletView v-else-if="activeTab === 'wallet'" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import ChatNavbar from '@/components/Chat/ChatNavbar.vue'
import ChatSidebar from '@/components/Chat/ChatSidebar.vue'
import ChatMain from '@/components/Chat/ChatMain.vue'
import UserInfoPanel from '@/components/Chat/UserInfoPanel.vue'
import ContactsView from '@/components/Chat/ContactsView.vue'
import MomentsView from '@/components/Chat/MomentsView.vue'
import WalletView from '@/components/Chat/WalletView.vue'
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
  is_sent: boolean
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
  at_user_ids: number[] | null
  un_read_count: number | null
}

// 当前激活的标签页
const activeTab = ref('messages')

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
    id: conversation.id,
    target_id: conversation.target_id,
    name: conversation.name,
    type: conversation.conv_type,
    avatar: conversation.head_image,
    status: 'online', // 后端没有在线状态，默认设为在线
    lastMessageContent: conversation.last_msg_content,
    lastMessageTime: new Date(conversation.last_msg_time).getTime(),
    unreadCount: conversation.unread_count,
    isMuted: conversation.muted,
    isPinned: conversation.pinned
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
    } else {
      console.error('获取会话列表失败:', response.data?.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取会话列表出错:', error)
  } finally {
    isLoadingContacts.value = false
  }
}

// 转换后端消息数据为前端Message格式
const convertMessageToFrontend = (messageData: MessageData): Message => {
  return {
    id: messageData.id.toString(),
    isSent: messageData.is_sent,
    sendId: messageData.send_id,
    receiverId: messageData.receiver_id,
    groupId: messageData.group_id || undefined,
    convSeq: messageData.conv_seq,
    messageContent: messageData.message_content,
    messageContentType: messageData.message_content_type,
    messageStatus: messageData.message_status,
    readStatus: messageData.read_status,
    sendNickname: messageData.send_nickname,
    sendTime: messageData.send_time,
    timestamp: new Date(messageData.send_time).getTime(),
    referenceId: messageData.reference_id,
    likeCount: messageData.like_count,
    atUserIds: messageData.at_user_ids || []
  }
}

// 获取指定联系人的消息列表
const fetchMessages = async (targetId: number) => {
  try {
    const response = await api.message.getMessages(targetId)
    if (response.data && response.code === 200) {
      // 转换消息数据
      const messages = response.data.map((msgData: MessageData) => convertMessageToFrontend(msgData))
      
      // 按时间排序（从旧到新）
      messages.sort((a: Message, b: Message) => a.timestamp - b.timestamp)
      
      // 存储到对应联系人的消息列表中
      allMessages[targetId] = messages
    } else {
      // 如果获取失败，设置为空数组
      allMessages[targetId] = []
    }
  } catch (error) {
    // 如果请求失败，设置为空数组
    allMessages[targetId] = []
  }
}

// 处理联系人选择
const handleContactSelected = async (contact: Contact) => {
  // 先获取该联系人的消息列表
  await fetchMessages(contact.target_id)
  
  // 然后设置活跃联系人（这样消息已经准备好了）
  activeContact.value = contact
  showUserInfo.value = true
  
  // 清除未读消息数
  const contactIndex = contacts.findIndex(c => c.id === contact.id)
  if (contactIndex !== -1) {
    contacts[contactIndex]!.unreadCount = 0
  }
}

// 处理发送消息
const handleSendMessage = async (data: { text: string; type: string }) => {
  if (!activeContact.value) return

  const sendData = {
    target_id: 2,
    message_main_type: activeContact.value.type,
    message_content_type: 0,
    message_content: data.text,
    terminal_type: 0
  }
  const response = await api.message.sendMessage(activeContact.value.type, sendData)
  if(response.data && response.code === 200) {
    console.log('发送消息成功:', response.data)
  }else{
    console.error('发送消息失败:', response.data?.msg || '未知错误')
  }
  
  const newMessage: Message = {
    id: Date.now().toString(),
    isSent: true,
    sendId: 1,
    receiverId: activeContact.value?.id,
    groupId: undefined,
    messageContent: data.text,
    messageContentType: data.type as any,
    messageStatus: 0,
    readStatus: 0,
    sendNickname: currentUser.value?.name || '',
    timestamp: Date.now(),
    //status: 'sending',
    //type: data.type as any
    
  }
  
  // 添加到消息列表
  if (!allMessages[activeContact.value.id]) {
    allMessages[activeContact.value.id] = []
  }
  allMessages[activeContact.value.id]?.push(newMessage)
  
  // 更新联系人的最后消息
  const contactIndex = contacts.findIndex(c => c.id === activeContact.value?.id)
  if (contactIndex !== -1) {
    contacts[contactIndex]!.lastMessageContent = data.text
    contacts[contactIndex]!.lastMessageTime = Date.now()
  }
  
  // 模拟发送状态变化
  setTimeout(() => {
    newMessage.messageStatus = 0
    setTimeout(() => {
      newMessage.messageStatus = 1
      setTimeout(() => {
        newMessage.messageStatus = 2
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
      sendId: 2,
      receiverId: activeContact.value?.target_id || 0,
      messageContent: randomReply,
      messageContentType: 0,
      timestamp: Date.now(),
      isSent: false,
      messageStatus: 2,
      readStatus: 1,
      sendNickname: currentUser.value?.name || '',
      referenceId: 0,
      likeCount: 0,
      atUserIds: []
    }
    
    if (activeContact.value) {
      allMessages[activeContact.value.id]?.push(replyMessage)
      
      // 更新联系人的最后消息
      if (contactIndex !== -1) {
        contacts[contactIndex]!.lastMessageContent = randomReply
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
      messageContent: file.name,
      timestamp: Date.now(),
      isSent: true,
      messageStatus: 0,
      messageContentType: file.type.startsWith('image/') ? 1 : 2,
      sendId: 1,
      receiverId: activeContact.value?.target_id,
      readStatus: 0,
      sendNickname: currentUser.value?.name || ''
      // fileName: file.name,
      // fileSize: file.size,
      // fileUrl: URL.createObjectURL(file)
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
      message.messageStatus = 0
      setTimeout(() => {
        if (message) {
          message.messageStatus = 1
        }
      }, 1000)
    }
  }
}

// 显示设置
const showSettings = () => {
  console.log('显示设置')
}

// 处理右键菜单
const handleContextMenu = (event: MouseEvent, message: Message) => {
  console.log('右键菜单', event, message)
  // 这里可以添加右键菜单的处理逻辑
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

// 处理标签页切换
const handleTabChange = (tabId: string) => {
  activeTab.value = tabId
  
  // 切换到消息标签时，如果没有选中联系人，清空右侧面板
  if (tabId === 'messages' && !activeContact.value) {
    showUserInfo.value = false
  }
}

// 处理通讯录视图中的联系人选择
const handleContactsViewContactSelected = (contact: any) => {
  console.log('通讯录中选择了联系人:', contact)
  // 这里可以显示联系人详情或其他操作
}

// 处理通讯录视图中的开始聊天
const handleContactsViewStartChat = (contact: any) => {
  // 切换到消息标签
  activeTab.value = 'messages'
  
  // 查找是否已存在该联系人的会话
  const existingContact = contacts.find(c => c.id === contact.id)
  if (existingContact) {
    // 如果存在，直接选中
    handleContactSelected(existingContact)
  } else {
    // 如果不存在，添加到联系人列表并选中
    const newContact: Contact = {
      id: contact.id,
      target_id: contact.target_id,
      name: contact.name,
      type: contact.type,
      avatar: contact.avatar,
      status: contact.status || 'online',
      lastMessageContent: '',
      lastMessageTime: Date.now(),
      unreadCount: 0
    }
    contacts.push(newContact)
    handleContactSelected(newContact)
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

.chat-content {
  flex: 1;
  display: flex;
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
