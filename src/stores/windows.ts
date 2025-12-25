import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'
import type { WindowData } from '@/components/Desktop/Window.vue'

export interface AppWindow extends WindowData {
  appId: string
  createdAt: number
  lastActiveAt: number
}

export const useWindowsStore = defineStore('windows', () => {
  // 状态
  const windows = ref<AppWindow[]>([])
  const nextZIndex = ref(1000)
  const activeWindowId = ref<string | null>(null)

  // 计算属性
  const openWindows = computed(() => 
    windows.value.filter(w => !w.isMinimized)
  )
  
  const minimizedWindows = computed(() => 
    windows.value.filter(w => w.isMinimized)
  )
  
  const activeWindow = computed(() => 
    windows.value.find(w => w.id === activeWindowId.value)
  )
  
  const windowsCount = computed(() => windows.value.length)

  // 操作方法
  const createWindow = (config: {
    appId: string
    title: string
    icon?: string
    component?: any
    props?: Record<string, any>
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }): AppWindow => {
    const windowId = `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 计算默认位置（屏幕中心）
    const defaultWidth = config.width || 800
    const defaultHeight = config.height || 600
    const centerX = (window.innerWidth - defaultWidth) / 2
    const centerY = (window.innerHeight - defaultHeight - 100) / 2 // 减去Dock高度
    
    const newWindow: AppWindow = {
      id: windowId,
      appId: config.appId,
      title: config.title,
      icon: config.icon,
      component: config.component,
      props: config.props,
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: defaultWidth,
      height: defaultHeight,
      minWidth: config.minWidth || 300,
      minHeight: config.minHeight || 200,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      isMaximized: false,
      isMinimized: false,
      isFocused: true,
      zIndex: nextZIndex.value++,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    }
    
    // 如果已有相同应用的窗口，稍微偏移位置
    const existingWindows = windows.value.filter(w => w.appId === config.appId)
    if (existingWindows.length > 0) {
      const offset = existingWindows.length * 30
      newWindow.x = Math.min(newWindow.x + offset, window.innerWidth - newWindow.width)
      newWindow.y = Math.min(newWindow.y + offset, window.innerHeight - newWindow.height - 100)
    }
    
    // 取消其他窗口的焦点
    windows.value.forEach(w => w.isFocused = false)
    
    windows.value.push(newWindow)
    activeWindowId.value = windowId
    
    console.log('创建窗口:', newWindow)
    return newWindow
  }

  const updateWindow = (windowId: string, updates: Partial<Omit<AppWindow, 'id' | 'appId' | 'createdAt'>>) => {
    const windowIndex = windows.value.findIndex(w => w.id === windowId)
    if (windowIndex !== -1) {
      const currentWindow = windows.value[windowIndex]
      windows.value[windowIndex] = {
        ...currentWindow,
        ...updates,
        lastActiveAt: Date.now()
      } as AppWindow
      console.log('更新窗口:', windowId, updates)
    }
  }

  const closeWindow = (windowId: string) => {
    const windowIndex = windows.value.findIndex(w => w.id === windowId)
    if (windowIndex !== -1) {
      const closedWindow = windows.value[windowIndex]!
      windows.value.splice(windowIndex, 1)
      
      // 如果关闭的是活动窗口，激活最后一个窗口
      if (activeWindowId.value === windowId) {
        const remainingWindows = windows.value.filter(w => !w.isMinimized)
        if (remainingWindows.length > 0) {
          const lastWindow = remainingWindows.reduce((latest, current) => 
            current.lastActiveAt > latest.lastActiveAt ? current : latest
          )
          focusWindow(lastWindow.id)
        } else {
          activeWindowId.value = null
        }
      }
      
      console.log('关闭窗口:', closedWindow.title)
    }
  }

  const focusWindow = (windowId: string) => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      // 取消所有窗口的焦点
      windows.value.forEach(w => w.isFocused = false)
      
      // 激活指定窗口
      window.isFocused = true
      window.zIndex = nextZIndex.value++
      window.lastActiveAt = Date.now()
      
      // 如果窗口被最小化，恢复它
      if (window.isMinimized) {
        window.isMinimized = false
      }
      
      activeWindowId.value = windowId
      console.log('激活窗口:', window.title)
    }
  }

  const minimizeWindow = (windowId: string) => {
    updateWindow(windowId, { isMinimized: true, isFocused: false })
    
    // 如果最小化的是活动窗口，激活其他窗口
    if (activeWindowId.value === windowId) {
      const visibleWindows = windows.value.filter(w => !w.isMinimized && w.id !== windowId)
      if (visibleWindows.length > 0) {
        const lastWindow = visibleWindows.reduce((latest, current) => 
          current.lastActiveAt > latest.lastActiveAt ? current : latest
        )
        focusWindow(lastWindow.id)
      } else {
        activeWindowId.value = null
      }
    }
  }

  const maximizeWindow = (windowId: string) => {
    const window = windows.value.find(w => w.id === windowId)
    if (window) {
      updateWindow(windowId, { 
        isMaximized: !window.isMaximized,
        isFocused: true
      })
      focusWindow(windowId)
    }
  }

  const restoreWindow = (windowId: string) => {
    updateWindow(windowId, { 
      isMinimized: false,
      isFocused: true
    })
    focusWindow(windowId)
  }

  const closeAllWindows = () => {
    windows.value = []
    activeWindowId.value = null
    console.log('关闭所有窗口')
  }

  const getWindowsByApp = (appId: string) => {
    return windows.value.filter(w => w.appId === appId)
  }

  const hasOpenWindow = (appId: string) => {
    return windows.value.some(w => w.appId === appId)
  }

  // 获取应用的主窗口（第一个创建的窗口）
  const getMainWindow = (appId: string) => {
    const appWindows = getWindowsByApp(appId)
    return appWindows.length > 0 ? 
      appWindows.reduce((earliest, current) => 
        current.createdAt < earliest.createdAt ? current : earliest
      ) : null
  }

  // 切换应用窗口（如果有窗口则激活，否则创建）
  const toggleApp = (appConfig: Parameters<typeof createWindow>[0]) => {
    const existingWindows = getWindowsByApp(appConfig.appId)
    
    if (existingWindows.length > 0) {
      // 如果有最小化的窗口，恢复最后活跃的
      const minimizedWindows = existingWindows.filter(w => w.isMinimized)
      if (minimizedWindows.length > 0) {
        const lastMinimized = minimizedWindows.reduce((latest, current) => 
          current.lastActiveAt > latest.lastActiveAt ? current : latest
        )
        restoreWindow(lastMinimized.id)
      } else {
        // 激活最后活跃的窗口
        const lastActive = existingWindows.reduce((latest, current) => 
          current.lastActiveAt > latest.lastActiveAt ? current : latest
        )
        focusWindow(lastActive.id)
      }
    } else {
      // 创建新窗口
      createWindow(appConfig)
    }
  }

  return {
    // 状态
    windows: readonly(windows),
    activeWindowId: readonly(activeWindowId),
    nextZIndex: readonly(nextZIndex),
    
    // 计算属性
    openWindows,
    minimizedWindows,
    activeWindow,
    windowsCount,
    
    // 方法
    createWindow,
    updateWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    closeAllWindows,
    getWindowsByApp,
    hasOpenWindow,
    getMainWindow,
    toggleApp
  }
})
