<template>
  <div class="chat-navbar">
    <div class="nav-items">
      <div 
        v-for="item in navItems" 
        :key="item.id"
        class="nav-item"
        :class="{ active: activeTab === item.id }"
        @click="handleNavClick(item.id)"
        :title="item.label"
      >
        <div class="nav-icon">
          <!-- 消息图标 -->
          <svg v-if="item.id === 'messages'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <!-- 通讯录图标 -->
          <svg v-else-if="item.id === 'contacts'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <!-- 朋友圈图标 -->
          <svg v-else-if="item.id === 'moments'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <!-- 钱包图标 -->
          <svg v-else-if="item.id === 'wallet'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NavItem {
  id: string
  label: string
}

interface Props {
  activeTab?: string
}

interface Emits {
  (e: 'tab-change', tabId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'messages'
})

const emit = defineEmits<Emits>()

const navItems: NavItem[] = [
  {
    id: 'messages',
    label: '消息'
  },
  {
    id: 'contacts',
    label: '通讯录'
  },
  {
    id: 'moments',
    label: '朋友圈'
  },
  {
    id: 'wallet',
    label: '钱包'
  }
]

const handleNavClick = (tabId: string) => {
  emit('tab-change', tabId)
}
</script>

<style scoped>
.chat-navbar {
  width: 72px;
  min-width: 72px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  color: #6c757d;
  position: relative;
  background: transparent;
  min-height: 56px;
}

.nav-item:hover {
  background: #e9ecef;
  color: #495057;
  transform: none;
}

.nav-item.active {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #007bff;
  border-radius: 2px 0 0 2px;
}

.nav-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  transition: all 0.2s ease;
}

.nav-item.active .nav-icon {
  background: rgba(255, 255, 255, 0.15);
}

.nav-icon svg {
  width: 22px;
  height: 22px;
  stroke-width: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-navbar {
    width: 64px;
    min-width: 64px;
    padding: 12px 0;
  }
  
  .nav-items {
    gap: 6px;
    padding: 0 6px;
  }
  
  .nav-item {
    padding: 10px 6px;
    gap: 3px;
  }
  
  .nav-icon {
    width: 24px;
    height: 24px;
  }
  
  .nav-icon svg {
    width: 18px;
    height: 18px;
  }
  
  .nav-label {
    font-size: 10px;
  }
}

/* 添加一些细节优化 */
.nav-item:first-child {
  margin-top: 4px;
}

.nav-item:active {
  transform: scale(0.98);
}

/* 确保图标在不同状态下的颜色一致性 */
.nav-item svg {
  color: inherit;
}
</style>
