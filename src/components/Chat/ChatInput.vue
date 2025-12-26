<template>
  <div class="chat-input">
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <!-- 表情按钮 -->
      <button 
        class="toolbar-btn" 
        title="表情"
        @click="toggleEmojiPicker"
        :class="{ active: showEmojiPicker }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </button>
      
      <!-- 文件上传按钮 -->
      <button 
        class="toolbar-btn" 
        title="上传文件"
        @click="triggerFileUpload"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
      
      <!-- 图片上传按钮 -->
      <button 
        class="toolbar-btn" 
        title="上传图片"
        @click="triggerImageUpload"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      </button>
      
      <!-- 更多功能按钮 -->
      <button 
        class="toolbar-btn" 
        title="更多功能"
        @click="showMoreOptions"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="19" cy="12" r="1"/>
          <circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 文本输入框 -->
      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          placeholder="输入消息..."
          @keydown="handleKeydown"
          @input="handleInput"
          @paste="handlePaste"
          :disabled="disabled"
          rows="1"
          :style="{ height: textareaHeight + 'px' }"
        ></textarea>
        
        <!-- 输入提示 -->
        <div v-if="isTyping" class="typing-hint">
          正在输入...
        </div>
      </div>
      
      <!-- 发送按钮 -->
      <button 
        class="send-btn"
        :disabled="!canSend || disabled"
        @click="sendMessage"
        :class="{ active: canSend }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22,2 15,22 11,13 2,9 22,2"/>
        </svg>
      </button>
    </div>
    
    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="emoji-picker">
      <div class="emoji-header">
        <span class="emoji-title">选择表情</span>
        <button class="close-btn" @click="hideEmojiPicker">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="emoji-grid">
        <button
          v-for="emoji in emojiList"
          :key="emoji"
          class="emoji-item"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="*/*"
      style="display: none"
      @change="handleFileSelect"
    />
    
    <!-- 隐藏的图片输入 -->
    <input
      ref="imageInputRef"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

interface Emits {
  (e: 'send-message', data: { text: string; type: string }): void
  (e: 'typing'): void
  (e: 'file-upload', file: File): void
  (e: 'emoji-select', emoji: string): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '输入消息...',
  maxLength: 1000
})

const emit = defineEmits<Emits>()

const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const imageInputRef = ref<HTMLInputElement>()

const inputText = ref('')
const textareaHeight = ref(40)
const showEmojiPicker = ref(false)
const isTyping = ref(false)
const typingTimer = ref<number>()

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
]

// 是否可以发送
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && inputText.value.length <= props.maxLength
})

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (canSend.value) {
      sendMessage()
    }
  }
}

// 处理输入
const handleInput = () => {
  adjustTextareaHeight()
  handleTypingStatus()
  emit('typing')
}

// 处理粘贴
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item && item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      if (file) {
        emit('file-upload', file)
        event.preventDefault()
      }
    }
  }
}

// 调整输入框高度
const adjustTextareaHeight = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      const scrollHeight = textareaRef.value.scrollHeight
      const maxHeight = 120 // 最大高度
      textareaHeight.value = Math.min(scrollHeight, maxHeight)
    }
  })
}

// 处理输入状态
const handleTypingStatus = () => {
  isTyping.value = true
  
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
  }
  
  typingTimer.value = setTimeout(() => {
    isTyping.value = false
  }, 1000)
}

// 发送消息
const sendMessage = () => {
  if (!canSend.value || props.disabled) return
  
  const text = inputText.value.trim()
  if (text) {
    emit('send-message', { text, type: 'text' })
    inputText.value = ''
    textareaHeight.value = 40
    isTyping.value = false
    
    if (typingTimer.value) {
      clearTimeout(typingTimer.value)
    }
  }
}

// 切换表情选择器
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// 隐藏表情选择器
const hideEmojiPicker = () => {
  showEmojiPicker.value = false
}

// 选择表情
const selectEmoji = (emoji: string) => {
  inputText.value += emoji
  adjustTextareaHeight()
  emit('emoji-select', emoji)
  hideEmojiPicker()
  
  // 聚焦到输入框
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 触发文件上传
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

// 触发图片上传
const triggerImageUpload = () => {
  imageInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) {
        emit('file-upload', file)
      }
    }
  }
  target.value = '' // 清空选择
}

// 处理图片选择
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) {
        emit('file-upload', file)
      }
    }
  }
  target.value = '' // 清空选择
}

// 显示更多选项
const showMoreOptions = () => {
  console.log('显示更多选项')
}

// 点击外部关闭表情选择器
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.emoji-picker') && !target.closest('.toolbar-btn')) {
    hideEmojiPicker()
  }
}

// 监听输入文本变化
watch(() => inputText.value, () => {
  adjustTextareaHeight()
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  adjustTextareaHeight()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
  }
})
</script>

<style scoped>
.chat-input {
  background: white;
  border-top: 1px solid #e9ecef;
  padding: 12px 16px;
  position: relative;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.toolbar-btn.active {
  background: #007bff;
  color: white;
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input-wrapper textarea {
  width: 100%;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  background: white;
  color: #333;
  line-height: 1.4;
  transition: all 0.2s ease;
  min-height: 40px;
  max-height: 120px;
}

.input-wrapper textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.input-wrapper textarea:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.typing-hint {
  position: absolute;
  bottom: -20px;
  left: 16px;
  font-size: 11px;
  color: #6c757d;
  animation: fadeInOut 2s infinite;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #e9ecef;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #dee2e6;
  transform: scale(1.05);
}

.send-btn.active {
  background: #007bff;
  color: white;
}

.send-btn.active:hover {
  background: #0056b3;
}

.send-btn:disabled {
  background: #f8f9fa;
  color: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-bottom: 8px;
  max-height: 300px;
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.emoji-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
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
  width: 14px;
  height: 14px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
}

.emoji-item:hover {
  background: #f8f9fa;
  transform: scale(1.2);
}

/* 滚动条样式 */
.emoji-grid::-webkit-scrollbar {
  width: 6px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input {
    padding: 8px 12px;
  }
  
  .input-toolbar {
    margin-bottom: 8px;
  }
  
  .toolbar-btn {
    width: 32px;
    height: 32px;
  }
  
  .toolbar-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .send-btn {
    width: 36px;
    height: 36px;
  }
  
  .send-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .emoji-picker {
    left: 8px;
    right: 8px;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(8, 1fr);
  }
  
  .emoji-item {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}
</style>
