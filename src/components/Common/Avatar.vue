<template>
  <div 
    class="avatar"
    :class="[
      `avatar-${size}`,
      { 'avatar-online': showStatus && status === 'online' },
      { 'avatar-offline': showStatus && status === 'offline' },
      { 'avatar-away': showStatus && status === 'away' },
      { 'avatar-clickable': clickable }
    ]"
    :style="{ width: avatarSize, height: avatarSize }"
    @click="handleClick"
  >
    <img 
      :src="src" 
      :alt="alt"
      class="avatar-image"
      @error="handleImageError"
    />
    
    <!-- 在线状态指示器 -->
    <div 
      v-if="showStatus" 
      class="status-indicator"
      :class="`status-${status}`"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarStatus = 'online' | 'offline' | 'away'

interface Props {
  src: string
  alt?: string
  size?: AvatarSize
  status?: AvatarStatus
  showStatus?: boolean
  clickable?: boolean
  fallbackSrc?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  alt: '头像',
  size: 'md',
  status: 'offline',
  showStatus: false,
  clickable: false,
  fallbackSrc: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
})

const emit = defineEmits<Emits>()

// 头像尺寸映射
const sizeMap = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '48px',
  xl: '64px'
}

const avatarSize = computed(() => sizeMap[props.size])

// 处理点击事件
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

// 处理图片加载失败
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (props.fallbackSrc && img.src !== props.fallbackSrc) {
    img.src = props.fallbackSrc
  }
}
</script>

<style scoped>
.avatar {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8f9fa;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar-clickable:hover {
  transform: scale(1.05);
}

/* 尺寸样式 */
.avatar-xs {
  width: 24px;
  height: 24px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
}

.avatar-md {
  width: 40px;
  height: 40px;
}

.avatar-lg {
  width: 48px;
  height: 48px;
}

.avatar-xl {
  width: 64px;
  height: 64px;
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.avatar-xs .status-indicator {
  width: 8px;
  height: 8px;
  border-width: 1px;
}

.avatar-sm .status-indicator {
  width: 10px;
  height: 10px;
  border-width: 1px;
}

.avatar-lg .status-indicator,
.avatar-xl .status-indicator {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

/* 状态颜色 */
.status-online {
  background-color: #28a745;
}

.status-offline {
  background-color: #6c757d;
}

.status-away {
  background-color: #ffc107;
}

/* 不同尺寸的状态指示器位置调整 */
.avatar-xs .status-indicator {
  bottom: -1px;
  right: -1px;
}

.avatar-sm .status-indicator {
  bottom: -1px;
  right: -1px;
}

.avatar-md .status-indicator {
  bottom: 0;
  right: 0;
}

.avatar-lg .status-indicator {
  bottom: 1px;
  right: 1px;
}

.avatar-xl .status-indicator {
  bottom: 2px;
  right: 2px;
}
</style>
