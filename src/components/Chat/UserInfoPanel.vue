<template>
  <div class="user-info-panel" :class="{ visible: isVisible }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3 class="panel-title">联系人信息</h3>
      <button class="close-btn" @click="closePanel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <!-- 用户基本信息 -->
    <div class="user-basic-info">
      <Avatar
        :src="contact?.avatar || ''"
        :alt="contact?.name || ''"
        :status="contact?.status"
        :show-status="true"
        size="xl"
        class="user-avatar-large"
      />
      
      <div class="user-details">
        <h2 class="user-name">{{ contact?.name || '未知用户' }}</h2>
        <p class="user-status">{{ getStatusText(contact?.status) }}</p>
        <p class="user-id">ID: {{ contact?.id }}</p>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn primary" @click="startChat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        发送消息
      </button>
      
      <button class="action-btn" @click="startVoiceCall">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        语音通话
      </button>
      
      <button class="action-btn" @click="startVideoCall">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        视频通话
      </button>
    </div>
    
    <!-- 详细信息 -->
    <div class="detailed-info">
      <!-- 共同群组 -->
      <div class="info-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          共同群聊
          <span class="count">{{ sharedGroups.length }}</span>
        </h4>
        <div class="group-list">
          <div 
            v-for="group in sharedGroups" 
            :key="group.id"
            class="group-item"
            @click="openGroup(group)"
          >
            <Avatar
              :src="group.avatar"
              :alt="group.name"
              size="md"
              class="group-avatar"
            />
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-members">{{ group.memberCount }} 人</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 共享文件 -->
      <div class="info-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          共享文件
          <span class="count">{{ sharedFiles.length }}</span>
        </h4>
        <div class="file-list">
          <div 
            v-for="file in sharedFiles" 
            :key="file.id"
            class="file-item"
            @click="openFile(file)"
          >
            <div class="file-icon">
              <svg v-if="file.type === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">{{ formatFileSize(file.size) }} • {{ formatDate(file.date) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 更多操作 -->
      <div class="info-section">
        <h4 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
          更多操作
        </h4>
        <div class="more-actions">
          <button class="more-action-btn" @click="muteContact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
            {{ contact?.isMuted ? '取消静音' : '静音通知' }}
          </button>
          
          <button class="more-action-btn" @click="pinContact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 3l4 4-4 4"/>
              <path d="M20 7H4"/>
              <path d="M4 17l4-4-4-4"/>
            </svg>
            {{ contact?.isPinned ? '取消置顶' : '置顶聊天' }}
          </button>
          
          <button class="more-action-btn danger" @click="blockContact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            屏蔽联系人
          </button>
          
          <button class="more-action-btn danger" @click="deleteContact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
            </svg>
            删除联系人
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Contact } from './ChatSidebar.vue'
import Avatar from '@/components/Common/Avatar.vue'

interface SharedGroup {
  id: string
  name: string
  avatar: string
  memberCount: number
}

interface SharedFile {
  id: string
  name: string
  type: 'image' | 'document' | 'video' | 'audio'
  size: number
  date: number
}

interface Props {
  contact?: Contact | null
  isVisible?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'start-chat', contact: Contact): void
  (e: 'voice-call', contact: Contact): void
  (e: 'video-call', contact: Contact): void
  (e: 'open-group', group: SharedGroup): void
  (e: 'open-file', file: SharedFile): void
  (e: 'mute-contact', contact: Contact): void
  (e: 'pin-contact', contact: Contact): void
  (e: 'block-contact', contact: Contact): void
  (e: 'delete-contact', contact: Contact): void
}

const props = withDefaults(defineProps<Props>(), {
  contact: null,
  isVisible: false
})

const emit = defineEmits<Emits>()

// 模拟共同群组数据
const sharedGroups = ref<SharedGroup[]>([
  {
    id: '1',
    name: '技术团队会议',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team1',
    memberCount: 12
  },
  {
    id: '2',
    name: '设计小组',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
    memberCount: 8
  },
  {
    id: '3',
    name: '项目讨论组',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=project',
    memberCount: 15
  }
])

// 模拟共享文件数据
const sharedFiles = ref<SharedFile[]>([
  {
    id: '1',
    name: '设计方案.pdf',
    type: 'document',
    size: 2048000,
    date: Date.now() - 86400000
  },
  {
    id: '2',
    name: '项目截图.png',
    type: 'image',
    size: 1024000,
    date: Date.now() - 172800000
  },
  {
    id: '3',
    name: '会议录音.mp3',
    type: 'audio',
    size: 5120000,
    date: Date.now() - 259200000
  }
])

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
      return '未知'
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 86400000) {
    return '今天'
  } else if (diff < 172800000) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
}

// 关闭面板
const closePanel = () => {
  emit('close')
}

// 开始聊天
const startChat = () => {
  if (props.contact) {
    emit('start-chat', props.contact)
  }
}

// 开始语音通话
const startVoiceCall = () => {
  if (props.contact) {
    emit('voice-call', props.contact)
  }
}

// 开始视频通话
const startVideoCall = () => {
  if (props.contact) {
    emit('video-call', props.contact)
  }
}

// 打开群组
const openGroup = (group: SharedGroup) => {
  emit('open-group', group)
}

// 打开文件
const openFile = (file: SharedFile) => {
  emit('open-file', file)
}

// 静音联系人
const muteContact = () => {
  if (props.contact) {
    emit('mute-contact', props.contact)
  }
}

// 置顶联系人
const pinContact = () => {
  if (props.contact) {
    emit('pin-contact', props.contact)
  }
}

// 屏蔽联系人
const blockContact = () => {
  if (props.contact) {
    if (confirm(`确定要屏蔽 ${props.contact.name} 吗？`)) {
      emit('block-contact', props.contact)
    }
  }
}

// 删除联系人
const deleteContact = () => {
  if (props.contact) {
    if (confirm(`确定要删除 ${props.contact.name} 吗？此操作无法撤销。`)) {
      emit('delete-contact', props.contact)
    }
  }
}
</script>

<style scoped>
.user-info-panel {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: white;
  border-left: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: transform 0.3s ease;
  overflow-y: auto;
}

.user-info-panel.visible {
  transform: translateX(0);
}

.user-info-panel:not(.visible) {
  transform: translateX(100%);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
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
  background: #e9ecef;
  color: #495057;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.user-basic-info {
  padding: 24px 20px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
}

.user-avatar-large {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid white;
}

.status-indicator.online {
  background: #4caf50;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  margin: 0 0 4px 0;
}

.user-status {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 8px 0;
}

.user-id {
  font-size: 12px;
  color: #adb5bd;
  margin: 0;
}

.action-buttons {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.action-btn.primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.action-btn.primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.detailed-info {
  flex: 1;
  padding: 0;
}

.info-section {
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0;
}

.section-title svg {
  width: 16px;
  height: 16px;
  color: #6c757d;
}

.count {
  background: #e9ecef;
  color: #6c757d;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
}

.group-list,
.file-list {
  padding: 0 20px 16px;
}

.group-item,
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.group-item:hover,
.file-item:hover {
  background: #f8f9fa;
  padding-left: 8px;
  padding-right: 8px;
}

.group-avatar,
.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #6c757d;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon svg {
  width: 20px;
  height: 20px;
}

.group-info,
.file-info {
  flex: 1;
  min-width: 0;
}

.group-name,
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-members,
.file-meta {
  font-size: 12px;
  color: #6c757d;
}

.more-actions {
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.more-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.more-action-btn:hover {
  background: #f8f9fa;
}

.more-action-btn.danger {
  color: #dc3545;
}

.more-action-btn.danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

.more-action-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 滚动条样式 */
.user-info-panel::-webkit-scrollbar {
  width: 6px;
}

.user-info-panel::-webkit-scrollbar-track {
  background: transparent;
}

.user-info-panel::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.user-info-panel::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .user-info-panel {
    width: 280px;
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .user-info-panel {
    width: 100%;
    min-width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
  }
  
  .panel-header {
    padding: 12px 16px;
  }
  
  .user-basic-info {
    padding: 20px 16px;
  }
  
  .action-buttons {
    padding: 16px;
  }
  
  .section-title {
    padding: 12px 16px 8px;
  }
  
  .group-list,
  .file-list,
  .more-actions {
    padding: 0 16px 12px;
  }
}
</style>
