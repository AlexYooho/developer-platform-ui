<template>
  <div class="contacts-view">
    <!-- 左侧联系人列表1 -->
    <div class="contacts-left">
      <!-- 搜索栏1 -->
      <div class="search-header">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索联系人" 
            class="search-input"
          />
        </div>
        <button class="add-contact-btn" @click="showAddContactModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </button>
      </div>

      <!-- 联系人分组 -->
      <div class="contacts-content">
      <!-- 好友申请 -->
      <div class="contact-section" v-if="friendRequests.length > 0">
        <div class="section-header">
          <h3 class="section-title">好友申请</h3>
          <span class="section-count">{{ friendRequests.length }}</span>
        </div>
        <div class="contact-list">
          <div 
            v-for="request in friendRequests" 
            :key="request.id"
            class="contact-item request-item"
          >
            <Avatar
              :src="request.avatar"
              :alt="request.name"
              size="md"
              class="contact-avatar"
            />
            <div class="contact-info">
              <div class="contact-name">{{ request.name }}</div>
              <div class="contact-message">{{ request.message }}</div>
            </div>
            <div class="request-actions">
              <button class="action-btn accept" @click="acceptFriendRequest(request.id)">
                同意
              </button>
              <button class="action-btn reject" @click="rejectFriendRequest(request.id)">
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系人列表 -->
      <div class="contact-section">
        <div class="section-header">
          <h3 class="section-title">我的好友</h3>
          <span class="section-count">{{ filteredContacts.length }}</span>
        </div>
        <div class="contact-list">
          <div 
            v-for="contact in filteredContacts" 
            :key="contact.id"
            class="contact-item"
            @click="handleContactClick(contact)"
          >
            <Avatar
              :src="contact.avatar"
              :alt="contact.name"
              :status="contact.status"
              :show-status="true"
              size="md"
              class="contact-avatar"
            />
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div class="contact-status">{{ getStatusText(contact.status) }}</div>
            </div>
            <div class="contact-actions">
              <button class="action-btn" @click.stop="startChat(contact)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- 右侧联系人详情面板 -->
    <div class="contacts-right">
      <ContactDetailPanel
        v-if="selectedContact"
        :contact="selectedContact"
        @start-chat="handleStartChat"
        @voice-call="handleVoiceCall"
        @video-call="handleVideoCall"
        @open-group="handleOpenGroup"
        @mute-contact="handleMuteContact"
        @pin-contact="handlePinContact"
        @block-contact="handleBlockContact"
        @delete-contact="handleDeleteContact"
      />
      <!-- 空状态 - 未选择联系人时显示 -->
      <div v-else class="contact-empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="empty-title">选择一个联系人查看详情</div>
          <div class="empty-description">从左侧联系人列表中选择一个联系人查看详细信息</div>
        </div>
      </div>
    </div>

    <!-- 添加联系人模态框 -->
    <div v-if="showAddContactModal" class="modal-overlay" @click="showAddContactModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加好友</h3>
          <button class="close-btn" @click="showAddContactModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户ID或手机号</label>
            <input v-model="newContactId" type="text" placeholder="请输入用户ID或手机号" />
          </div>
          <div class="form-group">
            <label>验证消息</label>
            <textarea v-model="verificationMessage" placeholder="请输入验证消息"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showAddContactModal = false">取消</button>
          <button class="btn primary" @click="sendFriendRequest">发送申请</button>
        </div>
      </div>
    </div>
  </div>

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
import { ref, computed, onMounted } from 'vue'
import Avatar from '@/components/Common/Avatar.vue'
import ContactDetailPanel from '@/components/Chat/ContactDetailPanel.vue'
import api from '@/utils/api'
import Modal from '@/components/Common/Modal.vue'
import { useModal } from '@/composables/useModal'

// 前端联系人列表数据类型
export interface ContactInfo {
  id: string
  name: string
  avatar: string
  status: 'online' | 'away' | 'offline',
  area: string
  alias: string
  personal_signature: string
  add_source: string
  account: string
  email?: string
}

// 后端好友列表数据类型
interface FriendInfo {
  id: string
  alias: string
  tag_name: string
  status: number
  add_source: number
  account: string
  nick_name: string
  head_image: string
  area: string
  user_name: string
  sex: number
}

interface FriendRequest {
  id: string
  name: string
  avatar: string
  message: string
  timestamp: number
}

interface Emits {
  (e: 'contact-selected', contact: ContactInfo): void
  (e: 'start-chat', contact: ContactInfo): void
}

// 模态框
const { modalState, handleConfirm, handleCancel, alert } = useModal()

const emit = defineEmits<Emits>()

// 搜索查询
const searchQuery = ref('')

// 选中的联系人
const selectedContact = ref<ContactInfo | null>(null)


// 转换好友信息格式
const convertToFriendInfo = (friend: FriendInfo): ContactInfo => {
  return {
    id: friend.id,
    name: friend.nick_name,
    avatar: friend.head_image,
    status: 'online',
    account: friend.account,
    area: friend.area,
    alias: friend.alias,
    personal_signature: "",
    add_source: friend.add_source.toString()
  }
}

// 获取好友列表
const getFriendList = async () => {
  const response = await api.friend.getFriendList()
  if (response.data && response.code === 200) {
    contacts.value = response.data.map(convertToFriendInfo)
  }
}

// 联系人列表
const contacts = ref<ContactInfo[]>([])

// 好友申请列表
const friendRequests = ref<FriendRequest[]>([
  {
    id: 'req1',
    name: '赵六',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    message: '你好，我是赵六，希望能成为朋友',
    timestamp: Date.now() - 3600000
  }
])

// 添加联系人模态框
const showAddContactModal = ref(false)
const newContactId = ref('')
const verificationMessage = ref('你好，我想加你为好友')

// 过滤后的联系人列表
const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return contacts.value
  }
  return contacts.value.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    contact.account?.includes(searchQuery.value) ||
    contact.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'online':
      return '在线'
    case 'away':
      return '离开'
    case 'offline':
      return '离线'
    default:
      return '未知'
  }
}

// 处理联系人点击
const handleContactClick = (contact: ContactInfo) => {
  selectedContact.value = contact
  emit('contact-selected', contact)
}

// 开始聊天
const startChat = (contact: ContactInfo) => {
  emit('start-chat', contact)
}

// 发送好友申请
const sendFriendRequest = () => {
  if (!newContactId.value.trim()) {
    alert('请输入用户ID或手机号')
    return
  }
  
  // 这里应该调用API发送好友申请
  console.log('发送好友申请:', {
    contactId: newContactId.value,
    message: verificationMessage.value
  })
  
  // 重置表单
  newContactId.value = ''
  verificationMessage.value = '你好，我想加你为好友'
  showAddContactModal.value = false
  
  alert('好友申请已发送')
}

// 同意好友申请
const acceptFriendRequest = (requestId: string) => {
  const requestIndex = friendRequests.value.findIndex(req => req.id === requestId)
  if (requestIndex !== -1) {
    const request = friendRequests.value[requestIndex]
    if (request) {
      // 添加到联系人列表
      contacts.value.push({
        id: request.id,
        name: request.name,
        avatar: request.avatar,
        status: 'online',
        area: '',
        alias: '',
        personal_signature: '',
        add_source: '',
        account: ''
      })
      
      // 从申请列表中移除
      friendRequests.value.splice(requestIndex, 1)
      
      alert(`已同意 ${request.name} 的好友申请`)
    }
  }
}

// 拒绝好友申请
const rejectFriendRequest = (requestId: string) => {
  const requestIndex = friendRequests.value.findIndex(req => req.id === requestId)
  if (requestIndex !== -1) {
    const request = friendRequests.value[requestIndex]
    if (request) {
      friendRequests.value.splice(requestIndex, 1)
      alert(`已拒绝 ${request.name} 的好友申请`)
    }
  }
}

// UserInfoPanel 事件处理方法
const handleStartChat = (contact: ContactInfo) => {
  // 找到原始联系人并触发开始聊天
  const originalContact = contacts.value.find(c => c.id === contact.id)
  if (originalContact) {
    emit('start-chat', originalContact)
  }
}

const handleVoiceCall = (contact: ContactInfo) => {
  console.log('语音通话:', contact.name)
}

const handleVideoCall = (contact: ContactInfo) => {
  console.log('视频通话:', contact.name)
}

const handleOpenGroup = (group: any) => {
  console.log('打开群组:', group)
}

const handleMuteContact = (contact: ContactInfo) => {
  console.log('静音联系人:', contact.name)
}

const handlePinContact = (contact: ContactInfo) => {
  console.log('置顶联系人:', contact.name)
}

const handleBlockContact = (contact: ContactInfo) => {
  console.log('屏蔽联系人:', contact.name)
}

const handleDeleteContact = (contact: ContactInfo) => {
  console.log('删除联系人:', contact.name)
}

onMounted(() => {
  // 获取好友列表
  getFriendList()
})
</script>

<style scoped>
.contacts-view {
  width: 100%;
  height: 100%;
  display: flex;
  background: #f8f9fa;
  overflow: hidden;
}

.contacts-left {
  width: 320px;
  min-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.contacts-right {
  flex: 1 !important;
  height: 100%;
  display: flex !important;
  background: white;
  overflow: hidden;
  min-width: 0; /* 确保flex子项能正确收缩 */
  max-width: none !important;
  width: 100% !important;
}

.search-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #6c757d;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #007bff;
}

.add-contact-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.add-contact-btn:hover {
  background: #0056b3;
}

.add-contact-btn svg {
  width: 20px;
  height: 20px;
}

.contacts-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.contact-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.section-count {
  background: #e9ecef;
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.contact-item:hover {
  background: #f8f9fa;
  border-color: #e9ecef;
  transform: translateY(-1px);
}

.request-item {
  border-left: 4px solid #ffc107;
}

.contact-avatar {
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-status,
.contact-message {
  font-size: 12px;
  color: #6c757d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-actions {
  display: flex;
  gap: 8px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.accept {
  background: #28a745;
  color: white;
}

.action-btn.accept:hover {
  background: #218838;
}

.action-btn.reject {
  background: #dc3545;
  color: white;
}

.action-btn.reject:hover {
  background: #c82333;
}

.action-btn:not(.accept):not(.reject) {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.action-btn:not(.accept):not(.reject):hover {
  background: #e9ecef;
  color: #495057;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.close-btn {
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

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #007bff;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.btn.secondary:hover {
  background: #e9ecef;
  color: #495057;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover {
  background: #0056b3;
}

/* 联系人详情空状态 */
.contact-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #6c757d;
  text-align: center;
}

.contact-empty-state .empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.contact-empty-state .empty-icon {
  font-size: 48px;
  color: #adb5bd;
}

.contact-empty-state .empty-icon svg {
  width: 48px;
  height: 48px;
}

.contact-empty-state .empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #495057;
}

.contact-empty-state .empty-description {
  font-size: 14px;
  color: #6c757d;
}


/* 滚动条样式 */
.contacts-content::-webkit-scrollbar {
  width: 6px;
}

.contacts-content::-webkit-scrollbar-track {
  background: transparent;
}

.contacts-content::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.contacts-content::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
