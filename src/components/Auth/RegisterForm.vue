<template>
  <div class="auth-form">
    <div class="form-header">
      <h2>注册新账号</h2>
      <p>创建您的账号以使用系统</p>
    </div>
    
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="input-group">
        <label for="reg-account">账号</label>
        <input
          id="reg-account"
          v-model="form.account"
          type="text"
          placeholder="请输入账号"
          :disabled="isLoading"
          required
        />
      </div>
      
      <div class="input-group">
        <label for="reg-password">密码</label>
        <input
          id="reg-password"
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
      
      <div class="input-group">
        <label for="confirm-password">确认密码</label>
        <input
          id="confirm-password"
          v-model="form.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="请再次输入密码"
          :disabled="isLoading"
          required
        />
        <button
          type="button"
          class="password-toggle"
          @click="showConfirmPassword = !showConfirmPassword"
          :disabled="isLoading"
        >
          {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
        </button>
      </div>
      
      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </div>
      
      <div class="form-footer">
        <p>已有账号？ 
          <button 
            type="button" 
            class="link-button" 
            @click="$emit('switch-to-login')"
            :disabled="isLoading"
          >
            立即登录
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

interface RegisterForm {
  account: string
  password: string
  confirmPassword: string
}

interface Emits {
  (e: 'switch-to-login'): void
  (e: 'register-success', data: { account: string; password: string }): void
  (e: 'register-error', error: string): void
}

const emit = defineEmits<Emits>()

// 表单状态
const form = reactive<RegisterForm>({
  account: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 清空错误信息
const clearError = () => {
  errorMessage.value = ''
}

// 表单验证
const validateForm = (): boolean => {
  if (!form.account.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
    errorMessage.value = '请填写完整的注册信息'
    return false
  }
  
  if (form.account.trim().length < 3) {
    errorMessage.value = '账号长度至少3位'
    return false
  }
  
  if (form.password.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return false
  }
  
  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return false
  }
  
  // 密码强度检查
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/
  if (!passwordRegex.test(form.password)) {
    errorMessage.value = '密码必须包含字母和数字'
    return false
  }
  
  return true
}

// 处理表单提交
const handleSubmit = async () => {
  clearError()
  
  if (!validateForm()) {
    emit('register-error', errorMessage.value)
    return
  }
  
  isLoading.value = true
  
  try {
    // 模拟注册接口调用
    // 实际项目中应该调用真实的注册API
    await simulateRegisterAPI()
    
    // 注册成功，返回账号密码给父组件
    emit('register-success', {
      account: form.account.trim(),
      password: form.password
    })
    
  } catch (error: any) {
    console.error('注册失败:', error)
    
    let errorMsg = ''
    if (error.message === 'ACCOUNT_EXISTS') {
      errorMsg = '账号已存在，请使用其他账号'
    } else if (error.message === 'NETWORK_ERROR') {
      errorMsg = '网络连接失败，请检查网络后重试'
    } else {
      errorMsg = error.message || '注册失败，请稍后重试'
    }
    
    errorMessage.value = errorMsg
    emit('register-error', errorMsg)
  } finally {
    isLoading.value = false
  }
}

// 模拟注册API
const simulateRegisterAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟一些可能的错误情况
      const random = Math.random()
      
      if (random < 0.1) {
        // 10% 概率账号已存在
        reject(new Error('ACCOUNT_EXISTS'))
      } else if (random < 0.15) {
        // 5% 概率网络错误
        reject(new Error('NETWORK_ERROR'))
      } else {
        // 85% 概率成功
        resolve()
      }
    }, 1500) // 模拟网络延迟
  })
}

// 重置表单
const resetForm = () => {
  form.account = ''
  form.password = ''
  form.confirmPassword = ''
  errorMessage.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  isLoading.value = false
}

// 暴露方法给父组件
defineExpose({
  resetForm
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
  background: linear-gradient(135deg, #34C759, #28A745);
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
  background: linear-gradient(135deg, #28A745, #1E7E34);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(52, 199, 89, 0.3);
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
