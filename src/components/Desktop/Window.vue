<template>
  <div
    class="window"
    :class="{
      maximized: isMaximized,
      minimized: isMinimized,
      focused: isFocused,
      dragging: isDragging,
      resizing: isResizing
    }"
    :style="windowStyle"
    @mousedown="handleFocus"
  >
    <!-- 窗口标题栏 -->
    <div
      class="window-header"
      @mousedown="startDrag"
      @dblclick="toggleMaximize"
    >
      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button
          class="control-btn close"
          @click="handleClose"
          title="关闭"
        >
          ✕
        </button>
        <button
          class="control-btn minimize"
          @click="handleMinimize"
          title="最小化"
        >
          −
        </button>
        <button
          class="control-btn maximize"
          @click="toggleMaximize"
          :title="isMaximized ? '还原' : '最大化'"
        >
          {{ isMaximized ? '❐' : '□' }}
        </button>
      </div>
      
      <!-- 窗口标题 -->
      <div class="window-title">
        <img v-if="window.icon" :src="window.icon" class="window-icon" />
        <span>{{ window.title }}</span>
      </div>
      
      <!-- 占位符，保持标题居中 -->
      <div class="window-controls-placeholder"></div>
    </div>
    
    <!-- 窗口内容 -->
    <div class="window-content">
      <component
        v-if="window.component"
        :is="window.component"
        v-bind="window.props"
        @close="handleClose"
      />
      <div v-else class="default-content">
        <h2>{{ window.title }}</h2>
        <p>这是 {{ window.title }} 的内容区域</p>
        <p>窗口ID: {{ window.id }}</p>
      </div>
    </div>
    
    <!-- 调整大小的拖拽点 -->
    <div
      v-if="!isMaximized"
      class="resize-handle resize-handle-se"
      @mousedown="(e) => startResize('se', e)"
    ></div>
    <div
      v-if="!isMaximized"
      class="resize-handle resize-handle-s"
      @mousedown="(e) => startResize('s', e)"
    ></div>
    <div
      v-if="!isMaximized"
      class="resize-handle resize-handle-e"
      @mousedown="(e) => startResize('e', e)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface WindowData {
  id: string
  title: string
  icon?: string
  component?: any
  props?: Record<string, any>
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  isMaximized: boolean
  isMinimized: boolean
  isFocused: boolean
  zIndex: number
}

interface Props {
  window: WindowData
}

interface Emits {
  (e: 'update', window: WindowData): void
  (e: 'close', windowId: string): void
  (e: 'focus', windowId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 窗口状态
const isMaximized = computed(() => props.window.isMaximized)
const isMinimized = computed(() => props.window.isMinimized)
const isFocused = computed(() => props.window.isFocused)

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const resizeDirection = ref('')
const dragStart = ref({ x: 0, y: 0, windowX: 0, windowY: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// 窗口样式
const windowStyle = computed(() => {
  if (isMaximized.value) {
    return {
      left: '0px',
      top: '0px',
      width: '100vw',
      height: 'calc(100vh - 100px)', // 减去Dock高度
      zIndex: props.window.zIndex
    }
  }
  
  if (isMinimized.value) {
    return {
      display: 'none'
    }
  }
  
  return {
    left: `${props.window.x}px`,
    top: `${props.window.y}px`,
    width: `${props.window.width}px`,
    height: `${props.window.height}px`,
    zIndex: props.window.zIndex
  }
})

// 更新窗口数据
const updateWindow = (updates: Partial<WindowData>) => {
  emit('update', { ...props.window, ...updates })
}

// 处理焦点
const handleFocus = () => {
  if (!isFocused.value) {
    emit('focus', props.window.id)
  }
}

// 处理关闭
const handleClose = () => {
  emit('close', props.window.id)
}

// 处理最小化
const handleMinimize = () => {
  updateWindow({ isMinimized: true })
}

// 切换最大化
const toggleMaximize = () => {
  updateWindow({ isMaximized: !isMaximized.value })
}

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  if (isMaximized.value) return
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    windowX: props.window.x,
    windowY: props.window.y
  }
  
  // 使用 passive: false 确保可以阻止默认行为
  document.addEventListener('mousemove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag, { passive: false })
  
  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
  
  // 添加拖拽时的样式优化
  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'
}

// 拖拽节流控制
let dragAnimationId: number | null = null

// 处理拖拽
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return
  
  // 取消之前的动画帧，避免重复执行
  if (dragAnimationId) {
    cancelAnimationFrame(dragAnimationId)
  }
  
  // 使用 requestAnimationFrame 优化性能
  dragAnimationId = requestAnimationFrame(() => {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    let newX = dragStart.value.windowX + deltaX
    let newY = dragStart.value.windowY + deltaY
    
    // 限制窗口不超出屏幕边界
    const maxX = window.innerWidth - props.window.width
    const maxY = window.innerHeight - props.window.height - 100 // 减去Dock高度
    
    newX = Math.max(0, Math.min(newX, maxX))
    newY = Math.max(0, Math.min(newY, maxY))
    
    updateWindow({ x: newX, y: newY })
    dragAnimationId = null
  })
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  // 恢复默认样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 开始调整大小
const startResize = (direction: string, event: MouseEvent) => {
  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: props.window.width,
    height: props.window.height
  }
  
  // 使用 passive: false 确保可以阻止默认行为
  document.addEventListener('mousemove', handleResize, { passive: false })
  document.addEventListener('mouseup', stopResize, { passive: false })
  
  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()
  
  // 添加调整大小时的样式优化
  document.body.style.userSelect = 'none'
}

// 调整大小节流控制
let resizeAnimationId: number | null = null

// 处理调整大小
const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  // 取消之前的动画帧，避免重复执行
  if (resizeAnimationId) {
    cancelAnimationFrame(resizeAnimationId)
  }
  
  // 使用 requestAnimationFrame 优化性能
  resizeAnimationId = requestAnimationFrame(() => {
    const deltaX = event.clientX - resizeStart.value.x
    const deltaY = event.clientY - resizeStart.value.y
    
    let newWidth = resizeStart.value.width
    let newHeight = resizeStart.value.height
    
    if (resizeDirection.value.includes('e')) {
      newWidth = resizeStart.value.width + deltaX
    }
    if (resizeDirection.value.includes('s')) {
      newHeight = resizeStart.value.height + deltaY
    }
    
    // 限制最小和最大尺寸
    const minWidth = props.window.minWidth || 300
    const minHeight = props.window.minHeight || 200
    const maxWidth = props.window.maxWidth || window.innerWidth
    const maxHeight = props.window.maxHeight || window.innerHeight - 100
    
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight))
    
    updateWindow({ width: newWidth, height: newHeight })
    resizeAnimationId = null
  })
}

// 停止调整大小
const stopResize = () => {
  isResizing.value = false
  resizeDirection.value = ''
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 恢复默认样式
  document.body.style.userSelect = ''
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 取消未完成的动画帧
  if (dragAnimationId) {
    cancelAnimationFrame(dragAnimationId)
  }
  if (resizeAnimationId) {
    cancelAnimationFrame(resizeAnimationId)
  }
  
  // 恢复body样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})
</script>

<style scoped>
.window {
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  /* 硬件加速 */
  transform: translateZ(0);
  will-change: transform;
  /* 优化渲染性能 */
  contain: layout style paint;
}

.window.maximized {
  border-radius: 0;
  transition: all 0.3s ease;
}

.window.minimized {
  transform: scale(0.8);
  opacity: 0;
  pointer-events: none;
}

.window.focused {
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
}

.window.dragging {
  /* 拖拽时禁用过渡动画，提高响应性 */
  transition: none !important;
  /* 增强硬件加速 */
  transform: translateZ(0) scale(1.002);
  /* 提高层级 */
  z-index: 9999 !important;
}

.window.resizing {
  /* 调整大小时禁用过渡动画 */
  transition: none !important;
  /* 硬件加速 */
  transform: translateZ(0);
}

.window-header {
  height: 40px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: move;
  position: relative;
  /* 优化拖拽性能 */
  transform: translateZ(0);
  /* 防止文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.window-header:active {
  cursor: grabbing;
}

.window-controls {
  display: flex;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  transition: all 0.2s ease;
  color: transparent;
}

.control-btn:hover {
  color: white;
}

.control-btn.close {
  background: #FF5F57;
}

.control-btn.close:hover {
  background: #FF3B30;
}

.control-btn.minimize {
  background: #FFBD2E;
}

.control-btn.minimize:hover {
  background: #FF9500;
}

.control-btn.maximize {
  background: #28CA42;
}

.control-btn.maximize:hover {
  background: #34C759;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  pointer-events: none;
}

.window-icon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.window-controls-placeholder {
  width: 76px; /* 与controls相同宽度 */
}

.window-content {
  flex: 1;
  overflow: auto;
  height: calc(100% - 40px);
}

.default-content {
  padding: 2rem;
  text-align: center;
}

.default-content h2 {
  color: #333;
  margin-bottom: 1rem;
}

.default-content p {
  color: #666;
  margin-bottom: 0.5rem;
}

/* 调整大小拖拽点 */
.resize-handle {
  position: absolute;
  background: transparent;
  /* 硬件加速 */
  transform: translateZ(0);
  /* 优化交互 */
  touch-action: none;
}

.resize-handle:hover {
  background: rgba(0, 122, 255, 0.1);
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

.resize-handle-se:hover {
  background: linear-gradient(-45deg, transparent 0%, transparent 40%, rgba(0, 122, 255, 0.3) 50%);
}

.resize-handle-s {
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 4px;
  cursor: s-resize;
}

.resize-handle-e {
  top: 12px;
  right: 0;
  bottom: 12px;
  width: 4px;
  cursor: e-resize;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .window {
    border-radius: 8px;
  }
  
  .window.maximized {
    height: calc(100vh - 80px) !important;
  }
  
  .window-header {
    height: 36px;
    padding: 0 8px;
  }
  
  .control-btn {
    width: 10px;
    height: 10px;
    font-size: 7px;
  }
  
  .window-title {
    font-size: 13px;
  }
  
  .window-icon {
    width: 14px;
    height: 14px;
  }
}
</style>
