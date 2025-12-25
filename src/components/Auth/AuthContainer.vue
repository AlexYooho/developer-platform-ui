<template>
  <div class="auth-overlay" v-if="showModal" @click="handleOverlayClick">
    <div class="auth-modal" @click.stop>
      <!-- 登录表单 -->
      <LoginForm
        v-if="currentView === 'login'"
        ref="loginFormRef"
        @switch-to-register="switchToRegister"
        @login-success="handleLoginSuccess"
        @login-error="handleLoginError"
      />
      
      <!-- 注册表单 -->
      <RegisterForm
        v-else-if="currentView === 'register'"
        ref="registerFormRef"
        @switch-to-login="switchToLogin"
        @register-success="handleRegisterSuccess"
        @register-error="handleRegisterError"
      />
      
      <!-- 成功提示 -->
      <div v-else-if="currentView === 'success'" class="success-view">
        <div class="success-icon">✅</div>
        <h2>登录成功</h2>
        <p>欢迎回来！正在进入系统...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'

interface Props {
  showModal?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'login-success', user: any): void
}

const props = withDefaults(defineProps<Props>(), {
  showModal: false
})

const emit = defineEmits<Emits>()

// 组件引用
const loginFormRef = ref<InstanceType<typeof LoginForm>>()
const registerFormRef = ref<InstanceType<typeof RegisterForm>>()

// 当前视图状态
const currentView = ref<'login' | 'register' | 'success'>('login')

// 处理蒙版点击
const handleOverlayClick = () => {
  emit('close')
}

// 切换到注册视图
const switchToRegister = () => {
  currentView.value = 'register'
  // 重置登录表单
  loginFormRef.value?.resetForm()
}

// 切换到登录视图
const switchToLogin = () => {
  currentView.value = 'login'
  // 重置注册表单
  registerFormRef.value?.resetForm()
}

// 处理登录成功
const handleLoginSuccess = (userData: any) => {
  console.log('认证容器：登录成功', userData)
  
  // 显示成功状态
  currentView.value = 'success'
  
  // 2秒后关闭模态框并触发登录成功事件
  setTimeout(() => {
    emit('login-success', userData)
    emit('close')
    resetContainer()
  }, 2000)
}

// 处理登录错误
const handleLoginError = (error: string) => {
  console.error('认证容器：登录错误', error)
}

// 处理注册成功
const handleRegisterSuccess = (data: { account: string; password: string }) => {
  console.log('认证容器：注册成功', data)
  
  // 切换到登录视图并自动填充表单
  currentView.value = 'login'
  
  // 等待DOM更新后填充登录表单
  setTimeout(() => {
    loginFormRef.value?.setFormData({
      account: data.account,
      password: data.password
    })
    
    // 显示成功提示
    alert('注册成功！请使用新账号登录')
  }, 100)
}

// 处理注册错误
const handleRegisterError = (error: string) => {
  console.error('认证容器：注册错误', error)
}

// 重置容器状态
const resetContainer = () => {
  currentView.value = 'login'
  loginFormRef.value?.resetForm()
  registerFormRef.value?.resetForm()
}

// 暴露方法给父组件
defineExpose({
  resetContainer
})
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.auth-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.success-view {
  padding: 3rem 2rem;
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: successBounce 0.6s ease;
}

@keyframes successBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.success-view h2 {
  color: #34C759;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.success-view p {
  color: #666;
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
