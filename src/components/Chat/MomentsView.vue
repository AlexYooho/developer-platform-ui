<template>
  <div class="moments-view">
    <!-- 头部区域 - 背景和头像 -->
    <div class="moments-header">
      <!-- 背景图片 -->
      <div class="header-background">
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=200&fit=crop" 
          alt="背景图" 
          class="bg-image"
        />
        <div class="header-overlay"></div>
      </div>
      
      <!-- 用户头像 - 右下角 -->
      <div class="user-avatar-container">
        <Avatar
          :src="currentUser.avatar"
          :alt="currentUser.name"
          size="xl"
          class="user-avatar"
        />
      </div>
    </div>

    <!-- 朋友圈内容区域 -->
    <div class="moments-content">
      <!-- 朋友圈动态列表 -->
      <div 
        v-for="moment in moments" 
        :key="moment.id"
        class="moment-item"
      >
        <!-- 用户信息 -->
        <div class="moment-header">
          <Avatar
            :src="moment.user.avatar"
            :alt="moment.user.name"
            size="md"
            class="moment-avatar"
          />
          <div class="moment-user-info">
            <div class="moment-user-name">{{ moment.user.name }}</div>
            <div class="moment-time">{{ formatTime(moment.timestamp) }}</div>
          </div>
          <div class="moment-actions">
            <button class="action-btn" @click="toggleMomentMenu(moment.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 动态内容 -->
        <div class="moment-content">
          <p v-if="moment.text" class="moment-text">{{ moment.text }}</p>
          
          <!-- 图片网格 -->
          <div v-if="moment.images && moment.images.length > 0" class="moment-images">
            <div 
              v-for="(image, index) in moment.images.slice(0, 9)" 
              :key="index"
              class="moment-image"
              @click="openImageViewer(moment.images, index)"
            >
              <img :src="image" :alt="`图片 ${index + 1}`" />
              <div v-if="index === 8 && moment.images.length > 9" class="more-images">
                +{{ moment.images.length - 9 }}
              </div>
            </div>
          </div>
          
          <!-- 位置信息 -->
          <div v-if="moment.location" class="moment-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ moment.location }}
          </div>
        </div>

        <!-- 互动区域 -->
        <div class="moment-interactions">
          <!-- 点赞和评论数 -->
          <div class="interaction-stats" v-if="moment.likes.length > 0 || moment.comments.length > 0">
            <div v-if="moment.likes.length > 0" class="likes-info">
              ❤️ {{ formatLikes(moment.likes) }}
            </div>
            <div v-if="moment.comments.length > 0" class="comments-count">
              {{ moment.comments.length }}条评论
            </div>
          </div>
          
          <!-- 评论列表 -->
          <div v-if="moment.comments.length > 0" class="comments-list">
            <div 
              v-for="comment in moment.comments.slice(0, 3)" 
              :key="comment.id"
              class="comment-item"
            >
              <span class="comment-user">{{ comment.user.name }}</span>：
              <span class="comment-text">{{ comment.text }}</span>
            </div>
            <div v-if="moment.comments.length > 3" class="more-comments" @click="showAllComments(moment.id)">
              查看全部{{ moment.comments.length }}条评论
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="moment-footer">
            <button 
              class="interaction-btn like-btn"
              :class="{ active: isLiked(moment.id) }"
              @click="toggleLike(moment.id)"
            >
              {{ isLiked(moment.id) ? '取消赞' : '赞' }}
            </button>
            <button 
              class="interaction-btn comment-btn"
              @click="showCommentInput(moment.id)"
            >
              评论
            </button>
          </div>
          
          <!-- 评论输入框 -->
          <div v-if="activeCommentId === moment.id" class="comment-input-container">
            <div class="comment-input-wrapper">
              <Avatar
                :src="currentUser.avatar"
                :alt="currentUser.name"
                size="sm"
                class="comment-avatar"
              />
              <div class="comment-input-box">
                <input
                  v-model="commentText"
                  type="text"
                  class="comment-input"
                  placeholder="评论输入框"
                  @keydown.enter="submitComment(moment.id)"
                  ref="commentInputRef"
                />
                <div class="comment-actions">
                  <button 
                    class="comment-cancel-btn"
                    @click="cancelComment"
                  >
                    取消
                  </button>
                  <button 
                    class="comment-send-btn"
                    :disabled="!commentText.trim()"
                    @click="submitComment(moment.id)"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import Avatar from '@/components/Common/Avatar.vue'

interface User {
  id: string
  name: string
  avatar: string
}

interface Comment {
  id: string
  user: User
  text: string
  timestamp: number
}

interface Moment {
  id: string
  user: User
  text: string
  images?: string[]
  location?: string
  timestamp: number
  likes: User[]
  comments: Comment[]
}

// 当前用户
const currentUser = ref<User>({
  id: 'me',
  name: '我',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'
})

// 评论相关状态
const activeCommentId = ref<string | null>(null)
const commentText = ref('')
const commentInputRef = ref<HTMLInputElement | null>(null)

// 朋友圈动态列表
const moments = ref<Moment[]>([
  {
    id: '1',
    user: {
      id: 'user1',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
    },
    text: '今天天气真不错，出来走走心情都变好了 😊',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop'
    ],
    location: '北京·朝阳公园',
    timestamp: Date.now() - 3600000,
    likes: [
      { id: 'user2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' },
      { id: 'user3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3' }
    ],
    comments: [
      {
        id: 'comment1',
        user: { id: 'user2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' },
        text: '确实很美！',
        timestamp: Date.now() - 3000000
      }
    ]
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2'
    },
    text: '刚做的蛋糕，第一次尝试，还不错！',
    images: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop'
    ],
    timestamp: Date.now() - 7200000,
    likes: [
      { id: 'me', name: '我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me' }
    ],
    comments: [
      {
        id: 'comment2',
        user: { id: 'me', name: '我', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me' },
        text: '看起来很好吃！',
        timestamp: Date.now() - 6000000
      }
    ]
  }
])

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return new Date(timestamp).toLocaleDateString()
}

// 格式化点赞用户列表
const formatLikes = (likes: User[]): string => {
  if (likes.length === 0) return ''
  if (likes.length <= 3) return likes.map(user => user.name).join('、')
  return `${likes.slice(0, 3).map(user => user.name).join('、')}等${likes.length}人`
}

// 检查是否已点赞
const isLiked = (momentId: string): boolean => {
  const moment = moments.value.find(m => m.id === momentId)
  return moment?.likes.some(user => user.id === currentUser.value.id) || false
}

// 切换点赞状态
const toggleLike = (momentId: string) => {
  const moment = moments.value.find(m => m.id === momentId)
  if (!moment) return

  const likeIndex = moment.likes.findIndex(user => user.id === currentUser.value.id)
  if (likeIndex > -1) {
    moment.likes.splice(likeIndex, 1)
  } else {
    moment.likes.push(currentUser.value)
  }
}

// 显示所有评论
const showAllComments = (momentId: string) => {
  console.log('显示所有评论:', momentId)
}

// 打开图片查看器
const openImageViewer = (images: string[], index: number) => {
  console.log('打开图片查看器:', images, index)
}

// 切换动态菜单
const toggleMomentMenu = (momentId: string) => {
  console.log('切换动态菜单:', momentId)
}

// 显示评论输入框
const showCommentInput = (momentId: string) => {
  activeCommentId.value = momentId
  commentText.value = ''
  // 使用 nextTick 确保 DOM 更新后再聚焦
  nextTick(() => {
    commentInputRef.value?.focus()
  })
}

// 取消评论
const cancelComment = () => {
  activeCommentId.value = null
  commentText.value = ''
}

// 提交评论
const submitComment = (momentId: string) => {
  if (!commentText.value.trim()) return
  
  const moment = moments.value.find(m => m.id === momentId)
  if (!moment) return
  
  // 创建新评论
  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    user: currentUser.value,
    text: commentText.value.trim(),
    timestamp: Date.now()
  }
  
  // 添加到评论列表
  moment.comments.push(newComment)
  
  // 重置状态
  activeCommentId.value = null
  commentText.value = ''
}
</script>

<style scoped>
.moments-view {
  height: 100%;
  width: 100%;
  background: #f5f5f5;
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

/* 头部区域样式 */
.moments-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.header-background {
  position: relative;
  width: 100%;
  height: 100%;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
}

/* 用户头像容器 */
.user-avatar-container {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border: 3px solid white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 朋友圈内容区域 */
.moments-content {
  background: white;
  min-height: calc(100% - 200px);
  width: 100%;
}

/* 朋友圈条目样式 */
.moment-item {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 16px;
  width: 100%;
  max-width: none;
}

.moment-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.moment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

.moment-user-info {
  flex: 1;
  min-width: 0;
}

.moment-user-name {
  font-size: 16px;
  font-weight: 500;
  color: #4a90e2;
  margin-bottom: 4px;
}

.moment-time {
  font-size: 12px;
  color: #999;
}

.moment-actions {
  margin-left: auto;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 动态内容样式 */
.moment-content {
  margin-left: 52px;
  margin-bottom: 12px;
  width: calc(100% - 52px);
}

.moment-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 12px 0;
  word-break: break-word;
}

/* 图片网格样式 */
.moment-images {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
  grid-template-columns: repeat(3, 1fr);
  max-width: 300px;
}

.moment-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.moment-image:hover {
  transform: scale(1.02);
}

.moment-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-images {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

/* 位置信息样式 */
.moment-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #4a90e2;
  margin-bottom: 8px;
}

.moment-location svg {
  width: 14px;
  height: 14px;
}

/* 互动区域样式 */
.moment-interactions {
  margin-left: 52px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  width: calc(100% - 52px);
}

.interaction-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.likes-info {
  color: #666;
}

.comments-count {
  color: #999;
}

/* 评论列表样式 */
.comments-list {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.comment-item {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.comment-item:last-child {
  margin-bottom: 0;
}

.comment-user {
  color: #4a90e2;
  font-weight: 500;
}

.comment-text {
  color: #333;
}

.more-comments {
  font-size: 14px;
  color: #4a90e2;
  cursor: pointer;
  margin-top: 4px;
}

.more-comments:hover {
  text-decoration: underline;
}

/* 操作按钮样式 */
.moment-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.interaction-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.interaction-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.like-btn.active {
  color: #e74c3c;
}

/* 评论输入框样式 */
.comment-input-container {
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-input-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.comment-input:focus {
  border-color: #4a90e2;
}

.comment-input::placeholder {
  color: #999;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.comment-cancel-btn,
.comment-send-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.comment-cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.comment-cancel-btn:hover {
  background: #e9ecef;
  color: #333;
}

.comment-send-btn {
  background: #4a90e2;
  color: white;
}

.comment-send-btn:hover:not(:disabled) {
  background: #357abd;
}

.comment-send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 滚动条样式 */
.moments-view::-webkit-scrollbar {
  width: 6px;
}

.moments-view::-webkit-scrollbar-track {
  background: transparent;
}

.moments-view::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.moments-view::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .moments-header {
    height: 150px;
  }
  
  .user-avatar-container {
    bottom: 12px;
    right: 12px;
  }
  
  .user-avatar {
    width: 60px;
    height: 60px;
  }
  
  .moment-item {
    padding: 12px;
  }
  
  .moment-images {
    max-width: 150px;
  }
}
</style>