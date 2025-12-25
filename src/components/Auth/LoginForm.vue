<template>
  <div class="auth-form">
    <div class="form-header">
      <h2>登录到系统</h2>
      <p>请输入您的账号和密码</p>
    </div>
    
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="input-group">
        <label for="login-account">账号</label>
        <input
          id="login-account"
          v-model="form.account"
          type="text"
          placeholder="请输入账号"
          :disabled="isLoading"
          required
        />
      </div>
      
      <div class="input-group">
        <label for="login-password">密码</label>
        <input
          id="login-password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
          :disabled="isLoading"
          required
        />
        <button
          type="button"
          class="password-toggle"
          @click="showPassword = !showPassword"
          :disabled="isLoading"
        >
          {{ showPassword ? '👁️' : '👁️‍🗨️' }}
        </button>
      </div>
      
      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </div>
      
      <div class="form-footer">
        <p>还没有账号？ 
          <button 
            type="button" 
            class="link-button" 
            @click="$emit('switch-to-register')"
            :disabled="isLoading"
          >
            立即注册
          </button>
        </p>
      </div>
    </form>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import api from '@/utils/api'

interface LoginForm {
  account: string
  password: string
}

interface Emits {
  (e: 'switch-to-register'): void
  (e: 'login-success', user: any): void
  (e: 'login-error', error: string): void
}

const emit = defineEmits<Emits>()

// 表单状态
const form = reactive<LoginForm>({
  account: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

// 清空错误信息
const clearError = () => {
  errorMessage.value = ''
}

// 处理表单提交
const handleSubmit = async () => {
  clearError()
  
  if (!form.account.trim() || !form.password.trim()) {
    errorMessage.value = '请填写完整的账号和密码'
    emit('login-error', errorMessage.value)
    return
  }
  
  isLoading.value = true
  
  try {
    const response = await api.sso.login({
      account: form.account.trim(),
      password: form.password
    })
    
    console.log('登录响应:', response)
    
    // 触发登录成功事件
    emit('login-success', {
      account: form.account,
      ...response.data
    })
    
  } catch (error: any) {
    console.error('登录失败:', error)
    
    let errorMsg = ''
    if (error.response?.status === 401) {
      errorMsg = '账号或密码错误，请检查后重试'
    } else if (error.response?.status === 404) {
      errorMsg = '账号不存在，请先注册'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMsg = '网络连接失败，请检查网络后重试'
    } else {
      errorMsg = error.response?.data?.message || '登录失败，请稍后重试'
    }
    
    errorMessage.value = errorMsg
    emit('login-error', errorMsg)
  } finally {
    isLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.account = ''
  form.password = ''
  errorMessage.value = ''
  showPassword.value = false
  isLoading.value = false
}

// 设置表单数据（用于注册成功后自动填充）
const setFormData = (data: Partial<LoginForm>) => {
  if (data.account) form.account = data.account
  if (data.password) form.password = data.password
}

// 暴露方法给父组件
defineExpose({
  resetForm,
  setFormData
})
</script>

<style scoped>
.auth-form {
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #666;
  font-size: 0.9rem;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  position: relative;
}

.input-group label {
  display: block;
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #007AFF;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.input-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 1rem;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056CC, #003D99);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.form-footer p {
  color: #666;
  font-size: 0.9rem;
}

.link-button {
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.link-button:hover:not(:disabled) {
  color: #0056CC;
}

.link-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 1rem;
  border: 1px solid rgba(255, 59, 48, 0.2);
  animation: errorShake 0.5s ease;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-form {
    padding: 1.5rem;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
}
</style>
