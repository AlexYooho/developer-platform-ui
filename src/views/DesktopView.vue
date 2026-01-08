<template>
  <div class="desktop-view">
    <!-- 桌面背景 -->
    <DesktopBackground :show-particles="true" :particle-count="60">
      
      <!-- 时间显示 -->
      <div class="desktop-time">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
    </DesktopBackground>
    
    <!-- 程序坞 -->
    <Dock :apps="dockApps" @app-click="handleAppClick" />
    
    <!-- 用户信息显示 -->
    <div class="user-info" v-if="authStore.isLoggedIn">
      <div class="user-avatar">{{ authStore.userInfo?.account?.charAt(0).toUpperCase() }}</div>
      <div class="user-details">
        <div class="user-name">{{ authStore.userInfo?.account }}</div>
        <div class="user-status">在线</div>
      </div>
      <button class="logout-btn" @click="handleLogout" title="退出登录">
        🚪
      </button>
    </div>
    
    
    <!-- 窗口系统 -->
    <Window
      v-for="window in windowsStore.windows"
      :key="window.id"
      :window="window"
      @update="handleWindowUpdate"
      @close="windowsStore.closeWindow"
      @focus="windowsStore.focusWindow"
    />
    
    <!-- 认证容器 -->
    <AuthContainer 
      :show-modal="showLoginModal" 
      @close="showLoginModal = false"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, markRaw } from 'vue'
import DesktopBackground from '@/components/Desktop/DesktopBackground.vue'
import Dock from '@/components/Desktop/Dock.vue'
import AuthContainer from '@/components/Auth/AuthContainer.vue'
import Window from '@/components/Desktop/Window.vue'
import ChatApp from '@/components/Apps/ChatApp.vue'
import FileManagerApp from '@/components/Apps/FileManagerApp.vue'
import PhotosApp from '@/components/Apps/PhotosApp.vue'
import { useAuthStore } from '@/stores/auth'
import { useWindowsStore } from '@/stores/windows'


interface App {
  id: string
  name: string
  icon: string
  iconName: string
  isActive: boolean
  isRunning: boolean
  onClick?: () => void
}

// 认证状态管理
const authStore = useAuthStore()
const showLoginModal = ref(false)

// 窗口管理
const windowsStore = useWindowsStore()

// 应用组件映射（使用markRaw避免响应式处理）
const appComponents: Record<string, any> = {
  chat: markRaw(ChatApp),
  filemanager: markRaw(FileManagerApp),
  photos: markRaw(PhotosApp)
}

// 当前时间
const currentTime = ref('')
const currentDate = ref('')


// Dock应用
const dockApps = reactive<App[]>([
  {
    id: 'chat',
    name: '聊天',
    icon: '',
    iconName: 'chat',
    isActive: false,
    isRunning: false,
    onClick: () => console.log('打开聊天')
  },
  {
    id: 'filemanager',
    name: '文件管理',
    icon: '',
    iconName: 'filemanager',
    isActive: false,
    isRunning: false,
    onClick: () => console.log('打开文件管理')
  },
  {
    id: 'photos',
    name: '相册',
    icon: '',
    iconName: 'photos',
    isActive: false,
    isRunning: false,
    onClick: () => console.log('打开相册')
  }
])


// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}


// 处理Dock应用点击
const handleAppClick = (app: App) => {
  
  // 应用配置
  const appConfigs: Record<string, { title: string; width?: number; height?: number; icon?: string }> = {
    chat: { title: '聊天', width: 1000, height: 700, icon: '💬' },
    filemanager: { title: '文件管理', width: 900, height: 650, icon: '📁' },
    photos: { title: '相册', width: 1000, height: 700, icon: '🖼️' }
  }
  
  const component = appComponents[app.id]
  const config = appConfigs[app.id]
  
  if (component && config) {
    // 检查是否已经有该应用的窗口打开
    const existingWindow = windowsStore.windows.find(w => w.appId === app.id)
    
    if (existingWindow) {
      // 如果窗口已存在，更新尺寸并激活它
      windowsStore.updateWindow(existingWindow.id, {
        width: config.width || 800,
        height: config.height || 600
      })
      if (existingWindow.isMinimized) {
        windowsStore.restoreWindow(existingWindow.id)
      } else {
        windowsStore.focusWindow(existingWindow.id)
      }
    } else {
      // 创建新窗口
      windowsStore.createWindow({
        appId: app.id,
        title: config.title,
        icon: config.icon,
        component: component,
        width: config.width,
        height: config.height,
        minWidth: 400,
        minHeight: 300
      })
    }
    
    // 更新dock中的运行状态
    const dockApp = dockApps.find(a => a.id === app.id)
    if (dockApp) {
      dockApp.isRunning = true
    }
  }
}


// 处理登录成功
const handleLoginSuccess = (userData: any) => {
  authStore.login(userData)
}

// 处理退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    authStore.logout()
    showLoginModal.value = true
  }
}

// 处理窗口更新
const handleWindowUpdate = (updatedWindow: any) => {
  windowsStore.updateWindow(updatedWindow.id, updatedWindow)
}

// 检查登录状态
const checkLoginStatus = () => {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
  }
}

// 生命周期
onMounted(() => {
  updateTime()
  const timeInterval = setInterval(updateTime, 1000)
  
  // 检查登录状态
  checkLoginStatus()
  
  // 清理函数
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})
</script>

<style scoped>
.desktop-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  user-select: none;
}


.desktop-time {
  position: absolute;
  top: 30px;
  right: 30px;
  text-align: right;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.time {
  font-size: 48px;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 4px;
}

.date {
  font-size: 16px;
  opacity: 0.9;
}

.user-info {
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50px;
  padding: 8px 16px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: userInfoSlideIn 0.5s ease;
}

@keyframes userInfoSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.user-status {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}


/* 响应式设计 */
@media (max-width: 768px) {
  .desktop-time {
    top: 20px;
    right: 20px;
  }
  
  .time {
    font-size: 36px;
  }
  
  .date {
    font-size: 14px;
  }
  
  
  .user-info {
    top: 20px;
    left: 20px;
    padding: 6px 12px 6px 6px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .user-name {
    font-size: 13px;
  }
  
  .user-status {
    font-size: 11px;
  }
  
  .logout-btn {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .desktop-time {
    top: 15px;
    right: 15px;
  }
  
  .time {
    font-size: 28px;
  }
  
  .date {
    font-size: 12px;
  }
  
  
  
  .user-info {
    top: 15px;
    left: 15px;
    padding: 4px 8px 4px 4px;
  }
  
  .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .user-details {
    display: none; /* 在小屏幕上隐藏用户详情 */
  }
  
  .logout-btn {
    width: 20px;
    height: 20px;
    font-size: 9px;
  }
}
</style>
