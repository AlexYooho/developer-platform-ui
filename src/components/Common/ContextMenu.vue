<template>
  <Teleport to="body">
    <div 
      v-if="visible" 
      class="context-menu"
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
      @click.stop
    >
      <div 
        v-for="item in menuItems" 
        :key="item.key"
        class="menu-item" 
        @click="handleItemClick(item)"
      >
        <component :is="item.icon" v-if="item.icon" />
        <svg v-else-if="item.iconPath" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="item.iconPath" />
        </svg>
        {{ item.label }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Teleport } from 'vue'

export interface ContextMenuItem {
  key: string
  label: string
  icon?: any // Vue组件
  iconPath?: string // SVG路径
  action: () => void
  disabled?: boolean
}

interface Props {
  visible: boolean
  position: { x: number; y: number }
  menuItems: ContextMenuItem[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理菜单项点击
const handleItemClick = (item: ContextMenuItem) => {
  if (!item.disabled) {
    item.action()
  }
  emit('close')
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (props.visible) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 120px;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item svg {
  width: 16px;
  height: 16px;
  color: #6c757d;
}

.menu-item.disabled {
  color: #adb5bd;
  cursor: not-allowed;
}

.menu-item.disabled:hover {
  background: transparent;
}
</style>
