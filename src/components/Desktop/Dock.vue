<template>
  <div class="dock-container">
    <div class="dock" ref="dockRef">
      <div 
        v-for="(app, index) in apps" 
        :key="app.id"
        class="dock-item"
        :class="{ 
          active: app.isActive, 
          running: isAppRunning(app.id) 
        }"
        @click="handleAppClick(app)"
        @mouseenter="handleMouseEnter(index, $event)"
        @mouseleave="handleMouseLeave"
        :style="getDockItemStyle(index)"
      >
        <div class="app-icon">
          <AppIcons :name="app.iconName" :size="48" />
          <div v-if="isAppRunning(app.id)" class="running-indicator"></div>
        </div>
        <div class="app-tooltip" v-if="hoveredIndex === index">
          {{ app.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import AppIcons from '@/components/icons/AppIcons.vue'
import { useWindowsStore } from '@/stores/windows'
import ChatApp from '@/components/Apps/ChatApp.vue'
import TerminalApp from '@/components/Apps/TerminalApp.vue'

interface App {
  id: string
  name: string
  icon: string
  iconName: string
  isActive: boolean
  isRunning: boolean
  onClick?: () => void
}

interface Props {
  apps?: App[]
}

const props = withDefaults(defineProps<Props>(), {
  apps: () => [
    {
      id: 'chat',
      name: '聊天',
      icon: '',
      iconName: 'chat',
      isActive: false,
      isRunning: true
    },
    {
      id: 'safari',
      name: 'Safari',
      icon: '',
      iconName: 'safari',
      isActive: false,
      isRunning: false
    },
    {
      id: 'chrome',
      name: 'Chrome',
      icon: '',
      iconName: 'chrome',
      isActive: false,
      isRunning: true
    },
    {
      id: 'vscode',
      name: 'VS Code',
      icon: '',
      iconName: 'vscode',
      isActive: true,
      isRunning: true
    },
    {
      id: 'terminal',
      name: 'Terminal',
      icon: '',
      iconName: 'terminal',
      isActive: false,
      isRunning: false
    },
    {
      id: 'music',
      name: 'Music',
      icon: '',
      iconName: 'music',
      isActive: false,
      isRunning: false
    },
    {
      id: 'settings',
      name: 'System Preferences',
      icon: '',
      iconName: 'settings',
      isActive: false,
      isRunning: false
    },
    {
      id: 'trash',
      name: 'Trash',
      icon: '',
      iconName: 'trash',
      isActive: false,
      isRunning: false
    }
  ]
})

const dockRef = ref<HTMLElement>()
const hoveredIndex = ref(-1)
const mouseX = ref(0)
const dockItemScales = reactive<number[]>([])

// 窗口管理
const windowsStore = useWindowsStore()

// 初始化缩放数组
onMounted(() => {
  props.apps.forEach((_, index) => {
    dockItemScales[index] = 1
  })
})

// 处理鼠标进入
const handleMouseEnter = (index: number, event: MouseEvent) => {
  hoveredIndex.value = index
  updateDockItemScales(event.clientX)
}

// 处理鼠标离开
const handleMouseLeave = () => {
  hoveredIndex.value = -1
  // 重置所有缩放
  props.apps.forEach((_, index) => {
    dockItemScales[index] = 1
  })
}

// 更新Dock项目缩放
const updateDockItemScales = (mouseX: number) => {
  if (!dockRef.value) return

  const dockRect = dockRef.value.getBoundingClientRect()
  const dockItems = dockRef.value.querySelectorAll('.dock-item')
  
  dockItems.forEach((item, index) => {
    const itemRect = item.getBoundingClientRect()
    const itemCenter = itemRect.left + itemRect.width / 2
    const distance = Math.abs(mouseX - itemCenter)
    const maxDistance = 100 // 影响范围
    
    if (distance < maxDistance) {
      const scale = 1 + (1 - distance / maxDistance) * 0.5 // 最大放大1.5倍
      dockItemScales[index] = scale
    } else {
      dockItemScales[index] = 1
    }
  })
}

// 获取Dock项目样式
const getDockItemStyle = (index: number) => {
  return {
    transform: `scale(${dockItemScales[index] || 1})`,
    zIndex: hoveredIndex.value === index ? 10 : 1
  }
}

// 处理应用点击
const handleAppClick = (app: App) => {
  console.log(`点击了应用: ${app.name}`)
  
  // 切换活跃状态
  props.apps.forEach(a => a.isActive = false)
  app.isActive = true
  app.isRunning = true
  
  // 打开或切换到应用窗口
  const windowConfig = getDefaultWindowSize(app.id)
  windowsStore.toggleApp({
    appId: app.id,
    title: app.name,
    icon: app.iconName,
    component: getAppComponent(app.id),
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight
  })
  
  // 执行自定义点击事件
  if (app.onClick) {
    app.onClick()
  }
  
  // 发射事件给父组件
  emit('app-click', app)
}

// 检查应用是否正在运行
const isAppRunning = (appId: string) => {
  return windowsStore.hasOpenWindow(appId)
}

// 获取应用对应的组件
const getAppComponent = (appId: string) => {
  const components: Record<string, any> = {
    chat: ChatApp,
    terminal: TerminalApp,
    // 其他应用暂时使用默认内容
    safari: null,
    chrome: null,
    vscode: null,
    music: null,
    settings: null,
    trash: null
  }
  
  return components[appId] || null
}

// 获取应用默认窗口大小
const getDefaultWindowSize = (appId: string) => {
  const sizes: Record<string, any> = {
    chat: { width: 800, height: 600, minWidth: 500, minHeight: 400 },
    safari: { width: 1200, height: 800, minWidth: 800, minHeight: 500 },
    chrome: { width: 1200, height: 800, minWidth: 800, minHeight: 500 },
    vscode: { width: 1400, height: 900, minWidth: 1000, minHeight: 600 },
    terminal: { width: 800, height: 500, minWidth: 500, minHeight: 300 },
    music: { width: 1000, height: 700, minWidth: 600, minHeight: 400 },
    settings: { width: 800, height: 600, minWidth: 600, minHeight: 400 },
    trash: { width: 600, height: 400, minWidth: 400, minHeight: 300 }
  }
  
  return sizes[appId] || { width: 800, height: 600, minWidth: 400, minHeight: 300 }
}

// 鼠标移动事件监听
const handleMouseMove = (event: MouseEvent) => {
  if (hoveredIndex.value !== -1) {
    updateDockItemScales(event.clientX)
  }
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})

// 定义事件
const emit = defineEmits<{
  'app-click': [app: App]
}>()
</script>

<style scoped>
.dock-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.dock {
  display: flex;
  align-items: end;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dock-item {
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom center;
}

.app-icon {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.dock-item:hover .app-icon {
  transform: translateY(-2px);
}

.dock-item.active .app-icon {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.running-indicator {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

.app-tooltip {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  backdrop-filter: blur(10px);
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dock-container {
    bottom: 10px;
  }
  
  .dock {
    padding: 6px 12px;
    gap: 6px;
  }
  
  .app-icon {
    width: 48px;
    height: 48px;
  }
  
}

@media (max-width: 480px) {
  .dock {
    padding: 4px 8px;
    gap: 4px;
  }
  
  .app-icon {
    width: 40px;
    height: 40px;
  }
  
}
</style>
