import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  account: string
  token?: string
  loginTime?: number
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loginTime = ref<number | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => isAuthenticated.value && user.value !== null)
  
  const userInfo = computed(() => user.value)
  
  const sessionDuration = computed(() => {
    if (!loginTime.value) return 0
    return Date.now() - loginTime.value
  })

  // 操作方法
  const login = (userData: User) => {
    user.value = userData
    isAuthenticated.value = true
    loginTime.value = Date.now()
    
    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('loginTime', loginTime.value.toString())
    localStorage.setItem('isAuthenticated', 'true')
    
    console.log('用户登录成功:', userData)
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    loginTime.value = null
    
    // 清除localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('isAuthenticated')
    
    console.log('用户已退出登录')
  }

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedLoginTime = localStorage.getItem('loginTime')
      const savedAuthStatus = localStorage.getItem('isAuthenticated')
      
      if (savedUser && savedLoginTime && savedAuthStatus === 'true') {
        user.value = JSON.parse(savedUser)
        loginTime.value = parseInt(savedLoginTime)
        isAuthenticated.value = true
        
        // 检查会话是否过期（24小时）
        const sessionAge = Date.now() - parseInt(savedLoginTime)
        const maxSessionAge = 24 * 60 * 60 * 1000 // 24小时
        
        if (sessionAge > maxSessionAge) {
          console.log('会话已过期，自动退出登录')
          logout()
          return false
        }
        
        console.log('恢复用户会话:', user.value)
        return true
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      logout()
    }
    
    return false
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 初始化时检查认证状态
  checkAuth()

  return {
    // 状态
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loginTime: readonly(loginTime),
    
    // 计算属性
    isLoggedIn,
    userInfo,
    sessionDuration,
    
    // 方法
    login,
    logout,
    checkAuth,
    updateUser
  }
})
