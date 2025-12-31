<template>
  <div class="modal-example">
    <h2>模态框组件示例</h2>
    
    <div class="example-section">
      <h3>基本用法</h3>
      <div class="button-group">
        <button @click="showInfo" class="btn btn-info">信息提示</button>
        <button @click="showSuccess" class="btn btn-success">成功提示</button>
        <button @click="showWarning" class="btn btn-warning">警告提示</button>
        <button @click="showError" class="btn btn-error">错误提示</button>
      </div>
    </div>
    
    <div class="example-section">
      <h3>确认对话框</h3>
      <div class="button-group">
        <button @click="showConfirm" class="btn btn-primary">确认对话框</button>
        <button @click="showDeleteConfirm" class="btn btn-danger">删除确认</button>
      </div>
    </div>
    
    <div class="example-section">
      <h3>自定义选项</h3>
      <div class="button-group">
        <button @click="showCustomModal" class="btn btn-secondary">自定义模态框</button>
        <button @click="showToast" class="btn btn-info">Toast 提示</button>
      </div>
    </div>
    
    <!-- 模态框组件 -->
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
  </div>
</template>

<script setup lang="ts">
import Modal from '@/components/Common/Modal.vue'
import { useModal } from '@/composables/useModal'

const { modalState, handleConfirm, handleCancel, confirm, alert, success, warning, error, toast, showModal } = useModal()

// 信息提示
const showInfo = () => {
  alert('这是一个信息提示框', '提示')
}

// 成功提示
const showSuccess = () => {
  success('操作成功完成！', '成功')
}

// 警告提示
const showWarning = () => {
  warning('请注意，这是一个警告信息', '警告')
}

// 错误提示
const showError = () => {
  error('发生了一个错误，请重试', '错误')
}

// 确认对话框
const showConfirm = async () => {
  const result = await confirm('确定要执行这个操作吗？', '确认')
  if (result) {
    success('操作已确认')
  } else {
    alert('操作已取消')
  }
}

// 删除确认
const showDeleteConfirm = async () => {
  const result = await confirm('确认删除该好友?')
  if (result) {
    success('好友已删除')
  }
}

// 自定义模态框
const showCustomModal = async () => {
  const result = await showModal({
    type: 'warning',
    title: '自定义标题',
    message: '这是一个自定义的模态框，可以设置各种选项',
    confirmText: '同意',
    cancelText: '拒绝',
    showCancel: true,
    closeOnOverlay: false
  })
  
  if (result) {
    success('您选择了同意')
  } else {
    alert('您选择了拒绝')
  }
}

// Toast 提示
const showToast = () => {
  toast('这是一个自动消失的提示', 3000)
}
</script>

<style scoped>
.modal-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 30px;
}

.example-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-error {
  background: #ef4444;
  color: white;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}
</style>
