<template>
  <div class="contact-detail-panel">
    <!-- 用户基本信息 -->
    <div class="user-header">
      <Avatar
        :src="contact?.avatar || ''"
        :alt="contact?.name || ''"
        :status="contact?.status"
        :show-status="true"
        size="xl"
        class="user-avatar"
      />
      
      <div class="user-info">
        <h2 class="user-name">{{ contact?.name || '未知用户' }}</h2>
        <div class="user-details">
          <p class="user-status">{{ getStatusText(contact?.status) }}</p>
          <p class="user-wechat">账号：{{ contact?.account || 'w761758634' }}</p>
          <p class="user-region">地区：{{ contact?.area || '未知地区' }}</p>
        </div>
      </div>
      
      <!-- 右上角菜单按钮 -->
      <div class="header-actions">
        <button 
          ref="menuButton"
          class="menu-btn" 
          @click="toggleContextMenu($event)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
        
      </div>
    </div>
    
    
    <!-- 备注和标签 -->
    <div class="info-row">
      <span class="info-label">备注</span>
      <span class="info-value">{{ contact?.alias }}</span>
    </div>
    
    <!-- 朋友圈 -->
    <div class="moments-section">
      <div class="section-header">
        <span class="section-title">朋友圈</span>
      </div>
      <div class="moments-preview">
        <div class="moment-photos">
          <div 
            v-for="(photo, index) in momentPhotos" 
            :key="index"
            class="moment-photo"
            :style="{ backgroundImage: `url(${photo})` }"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- 个性签名 -->
    <div class="info-row">
      <span class="info-label">个性签名</span>
      <span class="info-value">{{ contact?.personal_signature || '今天的努力是为了遇到明天更好的自己' }}</span>
    </div>
    
    <!-- 来源 -->
    <div class="info-row">
      <span class="info-label">来源</span>
      <span class="info-value">{{ contact?.add_source || '通过二维码添加' }}</span>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn primary" @click="handleSendMessage">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        发消息
      </button>
      
      <button class="action-btn" @click="handleVoiceCall">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        语音聊天
      </button>
      
      <button class="action-btn" @click="handleVideoCall">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        视频聊天
      </button>
    </div>
  </div>
  
  <!-- 使用 Teleport 将菜单渲染到 body，避免被容器的 overflow 裁剪 -->
  <Teleport to="body">
    <div v-if="showContextMenu" class="menu-container">
      <!-- 全屏遮罩层 - 用于点击空白处关闭菜单 -->
      <div 
        class="menu-backdrop"
        @click.self="hideContextMenu"
        @mousedown.self="hideContextMenu"
      >
        <!-- 右键菜单 -->
        <div 
          class="context-menu"
          :style="menuPosition"
          @click.stop
        >
          <div class="menu-item" @click="handleSetRemark">设置备注和标签</div>
          <div class="menu-item" @click="handleSetPermissions">设置朋友权限</div>
          <div class="menu-item" @click="handleRecommendFriend">把她推荐给朋友</div>
          <div class="menu-item" @click="handleSetAsStarFriend">设为星标朋友</div>
          <div class="menu-item" @click="handleAddToBlacklist">加入黑名单</div>
          <div class="menu-item danger" @click="deleteContact">删除联系人</div>
        </div>
      </div>
    </div>
  </Teleport>
  
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
import { ref, reactive, nextTick, Teleport } from 'vue'
import Avatar from '@/components/Common/Avatar.vue'
import Modal from '@/components/Common/Modal.vue'
import { useModal } from '@/composables/useModal'
import type { ContactInfo } from '@/components/Chat/ContactsView.vue'

interface SharedGroup {
  id: string
  name: string
  avatar: string
  memberCount: number
}

interface Props {
  contact?: ContactInfo | null
}

interface Emits {
  (e: 'start-chat', contact: ContactInfo): void
  (e: 'voice-call', contact: ContactInfo): void
  (e: 'video-call', contact: ContactInfo): void
  (e: 'open-group', group: SharedGroup): void
  (e: 'mute-contact', contact: ContactInfo): void
  (e: 'pin-contact', contact: ContactInfo): void
  (e: 'block-contact', contact: ContactInfo): void
  (e: 'delete-contact', contact: ContactInfo): void
}

const props = withDefaults(defineProps<Props>(), {
  contact: null
})

const emit = defineEmits<Emits>()

// 右键菜单显示状态
const showContextMenu = ref(false)
const menuButton = ref<HTMLElement>()
const menuPosition = reactive({
  top: '0px',
  left: '0px'
})

// 朋友圈照片数据
const momentPhotos = ref([
  'https://picsum.photos/100/100?random=1',
  'https://picsum.photos/100/100?random=2',
  'https://picsum.photos/100/100?random=3',
  'https://picsum.photos/100/100?random=4',
  'https://picsum.photos/100/100?random=5',
  'https://picsum.photos/100/100?random=6'
])

// 个性签名
const personalSignature = ref('今天的努力是为了遇到明天更好的自己')

// 联系人来源
const contactSource = ref('通过二维码添加')

// 模态框
const { modalState, handleConfirm, handleCancel, confirm } = useModal()

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
      return '离线'
  }
}

// 发送消息
const handleSendMessage = () => {
  if (props.contact) {
    emit('start-chat', props.contact)
  }
}

// 语音通话
const handleVoiceCall = () => {
  if (props.contact) {
    emit('voice-call', props.contact)
  }
}

// 视频通话
const handleVideoCall = () => {
  if (props.contact) {
    emit('video-call', props.contact)
  }
}

// 切换菜单显示状态
const toggleContextMenu = (event: MouseEvent) => {
  console.log('Toggle menu clicked, current state:', showContextMenu.value)
  console.log('Window state:', {
    isMaximized: window.outerWidth === screen.width && window.outerHeight === screen.height,
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    screenSize: { width: screen.width, height: screen.height }
  })
  
  if (showContextMenu.value) {
    hideContextMenu()
  } else {
    showContextMenu.value = true
    // 使用 nextTick 确保 DOM 更新后再计算位置
    nextTick(() => {
      calculateMenuPosition(event)
    })
  }
  console.log('New state:', showContextMenu.value)
}

// 计算菜单位置 - 菜单在鼠标左侧弹出
const calculateMenuPosition = (event: MouseEvent) => {
  const menuWidth = 160
  const menuHeight = 240
  
  // 获取按钮的位置信息
  const buttonRect = menuButton.value?.getBoundingClientRect()
  if (!buttonRect) return
  
  console.log('Button rect:', buttonRect)
  console.log('Event coordinates:', { clientX: event.clientX, clientY: event.clientY })
  console.log('Viewport size:', { width: window.innerWidth, height: window.innerHeight })
  
  // 使用按钮位置而不是鼠标位置，确保在所有窗口状态下都准确
  let left = buttonRect.left - menuWidth - 8  // 菜单出现在按钮左侧，留8px间距
  let top = buttonRect.top
  
  // 边界检测
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // 左边界检测 - 如果菜单会超出左边界，改为显示在右侧
  if (left < 10) {
    left = buttonRect.right + 8  // 改为按钮右侧
  }
  
  // 右边界检测 - 如果改为右侧后仍超出，调整位置
  if (left + menuWidth > viewportWidth - 10) {
    left = viewportWidth - menuWidth - 10
  }
  
  // 底部边界检测 - 如果菜单会超出底部，向上调整
  if (top + menuHeight > viewportHeight - 10) {
    top = viewportHeight - menuHeight - 10
  }
  
  // 顶部边界检测
  top = Math.max(10, top)
  
  menuPosition.top = `${top}px`
  menuPosition.left = `${left}px`
  
  console.log('Final menu position:', { left, top, buttonLeft: buttonRect.left, buttonTop: buttonRect.top })
}

// 隐藏菜单
const hideContextMenu = () => {
  console.log('Hiding context menu')
  showContextMenu.value = false
}

// 右键菜单操作
const handleSetRemark = () => {
  hideContextMenu()
  console.log('设置备注和标签')
}

const handleSetPermissions = () => {
  hideContextMenu()
  console.log('设置朋友权限')
}

const handleRecommendFriend = () => {
  hideContextMenu()
  console.log('推荐给朋友')
}

const handleSetAsStarFriend = () => {
  hideContextMenu()
  console.log('设为星标朋友')
}

const handleAddToBlacklist = () => {
  hideContextMenu()
  if (props.contact) {
    emit('block-contact', props.contact)
  }
}

// 删除联系人
const deleteContact = async () => {
  hideContextMenu()
  if (props.contact) {
    const result = await confirm(`确认删除该好友?`)
    if (result) {
      emit('delete-contact', props.contact)
    }
  }
}
</script>

<style scoped>
.contact-detail-panel {
  width: 100% !important;
  height: 100% !important;
  background: white;
  display: flex !important;
  flex-direction: column !important;
  overflow-y: auto;
  flex: 1 !important;
  min-width: 0;
  max-width: none !important;
}

/* 用户头部信息 */
.user-header {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  position: relative;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  margin-right: 16px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin: 0 0 8px 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-status,
.user-wechat,
.user-region {
  font-size: 13px;
  color: #6c757d;
  margin: 0;
}

.header-actions {
  position: relative;
}

.menu-btn {
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
  transition: background-color 0.2s ease;
}

.menu-btn:hover {
  background: #f8f9fa;
}

.menu-btn svg {
  width: 16px;
  height: 16px;
}

/* 菜单容器 */
.menu-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999; /* 确保在最顶层 */
  pointer-events: none; /* 容器本身不拦截事件 */
}

/* 全屏遮罩层 */
.menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: auto; /* 遮罩层接收点击事件 */
  cursor: default;
  z-index: 1;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2; /* 相对于遮罩层更高 */
  min-width: 160px;
  max-height: 300px;
  overflow-y: auto;
  pointer-events: auto; /* 菜单接收鼠标事件 */
}

.menu-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item.danger {
  color: #dc3545;
}

.menu-item.danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* 信息行 */
.info-row {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #f8f9fa;
  align-items: flex-start;
}

.info-label {
  width: 80px;
  font-size: 14px;
  color: #6c757d;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #212529;
  word-break: break-all;
}

/* 朋友圈部分 */
.moments-section {
  border-bottom: 1px solid #f8f9fa;
}

.section-header {
  padding: 16px 20px 12px;
}

.section-title {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.moments-preview {
  padding: 0 20px 16px;
}

.moment-photos {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.moment-photo {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.moment-photo:hover {
  transform: scale(1.05);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 20px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.action-btn.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.action-btn.primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

/* 滚动条样式 */
.contact-detail-panel::-webkit-scrollbar {
  width: 6px;
}

.contact-detail-panel::-webkit-scrollbar-track {
  background: transparent;
}

.contact-detail-panel::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.contact-detail-panel::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
