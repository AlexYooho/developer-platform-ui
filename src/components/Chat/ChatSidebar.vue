<template>
  <div class="chat-sidebar">
    <!-- 顶部搜索区域 -->
    <div class="sidebar-header">
      <div class="search-container">
        <div class="search-input">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="搜索..." 
            v-model="searchQuery"
            @input="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 联系人列表 -->
    <div class="contacts-list">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载联系人...</div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!isLoading && filteredContacts.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">暂无联系人</div>
      </div>
      
      <!-- 联系人列表 -->
      <div 
        v-else
        v-for="contact in filteredContacts" 
        :key="contact.id"
        class="contact-item"
        :class="{ active: contact.id === activeContactId }"
        @click="selectContact(contact)"
      >
        <Avatar
          :src="contact.avatar"
          :alt="contact.name"
          :status="contact.status"
          :show-status="true"
          size="md"
        />
        
        <div class="contact-info">
          <div class="contact-header">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="last-time">{{ formatTime(contact.lastMessageTime) }}</div>
          </div>
          
          <div class="last-message">
            <span class="message-preview">{{ contact.lastMessage }}</span>
            <div class="message-badges">
              <div 
                v-if="contact.unreadCount > 0" 
                class="unread-badge"
              >
                {{ contact.unreadCount > 99 ? '99+' : contact.unreadCount }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部用户信息 -->
    <div class="sidebar-footer">
      <div class="current-user">
        <div class="user-avatar">
          <img :src="currentUser.avatar" :alt="currentUser.name" />
        </div>
        <div class="user-info">
          <div class="user-name">{{ currentUser.name }}</div>
          <div class="user-status">{{ currentUser.status }}</div>
        </div>
        <div class="user-actions">
          <button class="action-btn" @click="showSettings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Avatar from '@/components/Common/Avatar.vue'

export interface Contact {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'away'
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
  isMuted?: boolean
  isPinned?: boolean
}

export interface CurrentUser {
  id: string
  name: string
  avatar: string
  status: string
}

interface Props {
  contacts?: Contact[]
  activeContactId?: string
  currentUser?: CurrentUser
  isLoading?: boolean
}

interface Emits {
  (e: 'contact-selected', contact: Contact): void
  (e: 'settings-clicked'): void
}

const props = withDefaults(defineProps<Props>(), {
  contacts: () => [],
  activeContactId: '',
  isLoading: false,
  currentUser: () => ({
    id: 'me',
    name: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
    status: '在线'
  })
})

const emit = defineEmits<Emits>()

const searchQuery = ref('')

// 默认联系人数据
const defaultContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    status: 'online',
    lastMessage: '你好，新的设计方案已经完成了',
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
  }
]

// 使用传入的联系人或默认联系人
const contacts = computed(() => props.contacts.length > 0 ? props.contacts : defaultContacts)

// 过滤后的联系人列表
const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) {
    return contacts.value
  }
  return contacts.value.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    const minutes = Math.floor(diff / 60000)
    return `${minutes < 10 ? '0' + minutes : minutes}:${String(date.getMinutes()).padStart(2, '0')}`
  } else if (date.toDateString() === now.toDateString()) { // 今天
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 86400000 * 7) { // 一周内
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
}

// 选择联系人
const selectContact = (contact: Contact) => {
  emit('contact-selected', contact)
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 显示设置
const showSettings = () => {
  emit('settings-clicked')
}

onMounted(() => {
  // 如果有默认选中的联系人，发送选中事件
  if (props.activeContactId && contacts.value.length > 0) {
    const activeContact = contacts.value.find(c => c.id === props.activeContactId)
    if (activeContact) {
      selectContact(activeContact)
    }
  } else if (contacts.value.length > 0) {
    // 默认选中第一个联系人
    const firstContact = contacts.value[0]
    if (firstContact) {
      selectContact(firstContact)
    }
  }
})
</script>

<style scoped>
.chat-sidebar {
  width: 240px;
  min-width: 240px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.search-container {
  position: relative;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #6c757d;
  z-index: 1;
}

.search-input input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  background: white;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;
}

.contact-item:hover {
  background: #f1f3f4;
}

.contact-item.active {
  background: #e3f2fd;
  border-left-color: #2196f3;
}

.contact-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
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

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.contact-name {
  font-size: 15px;
  font-weight: 600;
  color: #212529;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.last-time {
  font-size: 12px;
  color: #6c757d;
  flex-shrink: 0;
  margin-left: 8px;
}

.last-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-preview {
  font-size: 13px;
  color: #6c757d;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.message-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.unread-badge {
  background: #dc3545;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.sidebar-footer {
  border-top: 1px solid #e9ecef;
  padding: 12px 16px;
}

.current-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 2px;
}

.user-status {
  font-size: 12px;
  color: #6c757d;
}

.user-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f1f3f4;
  color: #495057;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 滚动条样式 */
.contacts-list::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-track {
  background: transparent;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #6c757d;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #6c757d;
}

/* 加载动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chat-sidebar {
    width: 260px;
    min-width: 260px;
  }
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
  
  .sidebar-header {
    padding: 12px;
  }
  
  .contact-item {
    padding: 10px 12px;
  }
  
  .contact-avatar {
    width: 44px;
    height: 44px;
  }
}
</style>
