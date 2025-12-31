import { ref, nextTick } from 'vue'

export interface ModalOptions {
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showButtons?: boolean
  closeOnOverlay?: boolean
}

export interface ModalState {
  visible: boolean
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  title?: string
  message: string
  confirmText: string
  cancelText: string
  showCancel: boolean
  showButtons: boolean
  closeOnOverlay: boolean
}

export function useModal() {
  const modalState = ref<ModalState>({
    visible: false,
    type: 'info',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    showCancel: true,
    showButtons: true,
    closeOnOverlay: true
  })

  let resolvePromise: ((value: boolean) => void) | null = null

  // 显示模态框
  const showModal = (options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolvePromise = resolve
      
      modalState.value = {
        visible: true,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        showCancel: options.showCancel !== false,
        showButtons: options.showButtons !== false,
        closeOnOverlay: options.closeOnOverlay !== false
      }
    })
  }

  // 确认操作
  const handleConfirm = () => {
    modalState.value.visible = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  // 取消操作
  const handleCancel = () => {
    modalState.value.visible = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  // 关闭模态框
  const closeModal = () => {
    modalState.value.visible = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  // 便捷方法
  const confirm = (message: string, title?: string): Promise<boolean> => {
    return showModal({
      type: 'confirm',
      title,
      message,
      showCancel: true,
      showButtons: true
    })
  }

  const alert = (message: string, title?: string): Promise<boolean> => {
    return showModal({
      type: 'info',
      title,
      message,
      showCancel: false,
      showButtons: true
    })
  }

  const success = (message: string, title?: string): Promise<boolean> => {
    return showModal({
      type: 'success',
      title,
      message,
      showCancel: false,
      showButtons: true
    })
  }

  const warning = (message: string, title?: string): Promise<boolean> => {
    return showModal({
      type: 'warning',
      title,
      message,
      showCancel: false,
      showButtons: true
    })
  }

  const error = (message: string, title?: string): Promise<boolean> => {
    return showModal({
      type: 'error',
      title,
      message,
      showCancel: false,
      showButtons: true
    })
  }

  // 纯提示（无按钮，自动消失）
  const toast = (message: string, duration: number = 2000): Promise<boolean> => {
    const promise = showModal({
      type: 'info',
      message,
      showButtons: false,
      closeOnOverlay: false
    })
    
    // 自动关闭
    setTimeout(() => {
      closeModal()
    }, duration)
    
    return promise
  }

  return {
    modalState,
    showModal,
    handleConfirm,
    handleCancel,
    closeModal,
    confirm,
    alert,
    success,
    warning,
    error,
    toast
  }
}
