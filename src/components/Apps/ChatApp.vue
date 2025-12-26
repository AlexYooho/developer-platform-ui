<template>
  <div class="chat-app">
    <!-- 侧边栏 -->
    <ChatSidebar
      :contacts="contacts"
      :active-contact-id="activeContact?.id"
      :current-user="currentUser"
      @contact-selected="handleContactSelected"
      @settings-clicked="showSettings"
    />
    
    <!-- 主聊天区域 -->
    <ChatMain
      :active-contact="activeContact"
      :messages="currentMessages"
      @send-message="handleSendMessage"
      @voice-call="handleVoiceCall"
      @video-call="handleVideoCall"
      @file-upload="handleFileUpload"
      @message-delete="handleMessageDelete"
      @message-resend="handleMessageResend"
    />
    
    <!-- 用户信息面板 -->
    <UserInfoPanel
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

// 当前用户信息
const currentUser = ref({
  id: 'me',
  name: '我',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  status: '在线'
})

// 联系人列表
const contacts = reactive<Contact[]>([
  {
    id: '1',
    name: 'Sarah Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    status: 'online',
    lastMessage: 'Inter 不错，但也许可以试试更现代一点的？',
    lastMessageTime: Date.now() - 300000,
    unreadCount: 0
  },
  {
    id: '2',
    name: '技术团队会议',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team',
    status: 'online',
    lastMessage: '你好，会议室可以预约吗？',
    lastMessageTime: Date.now() - 360000,
    unreadCount: 5
  },
  {
    id: '3',
    name: 'Mike Product',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    status: 'away',
    lastMessage: '昨天了，看 Notion，我们聊聊吧...',
    lastMessageTime: Date.now() - 600000,
    unreadCount: 1
  },
  {
    id: '4',
    name: 'David Backend',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    status: 'offline',
    lastMessage: '你好啊，我来晚了点...',
    lastMessageTime: Date.now() - 86400000,
    unreadCount: 0
  },
  {
    id: '5',
    name: '设计小组',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
    status: 'online',
    lastMessage: '经验交流新想法！',
    lastMessageTime: Date.now() - 3600000,
    unreadCount: 0
  },
  {
    id: '6',
    name: 'Emily Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    status: 'online',
    lastMessage: '你有空一起看看吗？',
    lastMessageTime: Date.now() - 3660000,
    unreadCount: 3
  }
])

// 所有消息数据（按联系人ID分组）
const allMessages = reactive<Record<string, Message[]>>({
  '1': [
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
  ],
  '2': [
    {
      id: '4',
      text: '你好，会议室可以预约吗？',
      timestamp: Date.now() - 360000,
      isSent: false,
      status: 'delivered'
    }
  ],
  '3': [
    {
      id: '5',
      text: '昨天了，看 Notion，我们聊聊吧...',
      timestamp: Date.now() - 600000,
      isSent: false,
      status: 'sent'
    }
  ]
})

// 当前选中的联系人
const activeContact = ref<Contact | null>(null)

// 是否显示用户信息面板
const showUserInfo = ref(true)

// 当前聊天的消息
const currentMessages = computed(() => {
  if (!activeContact.value) return []
  return allMessages[activeContact.value.id] || []
})

// 处理联系人选择
const handleContactSelected = (contact: Contact) => {
  activeContact.value = contact
  showUserInfo.value = true
  
  // 清除未读消息数
  const contactIndex = contacts.findIndex(c => c.id === contact.id)
  if (contactIndex !== -1) {
    contacts[contactIndex]!.unreadCount = 0
  }
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
  // 默认选中第一个联系人
  if (contacts.length > 0) {
    const firstContact = contacts[0]
    if (firstContact) {
      handleContactSelected(firstContact)
    }
  }
})
</script>

<style scoped>
.chat-app {
  height: 100%;
  display: flex;
  background: #f8f9fa;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-app {
    flex-direction: column;
  }
}
</style>
