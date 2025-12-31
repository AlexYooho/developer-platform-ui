<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
      <div class="modal-container" :class="modalClass">
        <!-- 标题 -->
        <div v-if="title" class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
        </div>
        
        <!-- 内容 -->
        <div class="modal-body">
          <div v-if="icon" class="modal-icon" :class="iconClass">
            <component :is="iconComponent" />
          </div>
          <div class="modal-message">{{ message }}</div>
        </div>
        
        <!-- 按钮区域 -->
        <div v-if="showButtons" class="modal-footer">
          <button 
            v-if="showCancel"
            class="modal-btn cancel-btn"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button 
            class="modal-btn confirm-btn"
            :class="confirmButtonClass"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

export interface ModalProps {
  visible: boolean
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showButtons?: boolean
  closeOnOverlay?: boolean
}

export interface ModalEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<ModalProps>(), {
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  showButtons: true,
  closeOnOverlay: true
})

const emit = defineEmits<ModalEmits>()

// 模态框样式类
const modalClass = computed(() => {
  return `modal-${props.type}`
})

// 图标样式类
const iconClass = computed(() => {
  return `icon-${props.type}`
})

// 确认按钮样式类
const confirmButtonClass = computed(() => {
  const classMap = {
    info: 'btn-primary',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-danger',
    confirm: 'btn-primary'
  }
  return classMap[props.type]
})

// 是否显示图标
const icon = computed(() => {
  return ['success', 'warning', 'error', 'confirm'].includes(props.type)
})

// 图标组件
const iconComponent = computed(() => {
  const iconMap = {
    success: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M9 12l2 2 4-4' }),
      h('circle', { cx: '12', cy: '12', r: '10' })
    ]),
    warning: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
      h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
    ]),
    error: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
      h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })
    ]),
    confirm: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
      h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
    ])
  }
  return iconMap[props.type as keyof typeof iconMap] || null
})

// 处理确认
const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('update:visible', false)
  }
}
</script>

<style scoped>
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
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 20px 20px 0 20px;
  text-align: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-body {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon svg {
  width: 24px;
  height: 24px;
}

.icon-success {
  background: #f0f9ff;
  color: #10b981;
}

.icon-warning {
  background: #fffbeb;
  color: #f59e0b;
}

.icon-error {
  background: #fef2f2;
  color: #ef4444;
}

.icon-confirm {
  background: #eff6ff;
  color: #3b82f6;
}

.modal-message {
  font-size: 16px;
  line-height: 1.5;
  color: #666;
  word-break: break-word;
}

.modal-footer {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e9ecef;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #333;
}

.confirm-btn {
  color: white;
}

.btn-primary {
  background: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-container {
    min-width: 280px;
    margin: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-btn {
    flex: none;
  }
}
</style>
