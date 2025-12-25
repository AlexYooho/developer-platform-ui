<template>
  <div class="app-icon-wrapper" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- Chat App -->
    <svg v-if="name === 'chat'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#chatGradient)"/>
      <path d="M20 28c0-4.4 3.6-8 8-8h40c4.4 0 8 3.6 8 8v24c0 4.4-3.6 8-8 8H48l-8 8-8-8H28c-4.4 0-8-3.6-8-8V28z" fill="#fff" fill-opacity="0.95"/>
      <circle cx="36" cy="40" r="3" fill="#00C851"/>
      <circle cx="48" cy="40" r="3" fill="#00C851"/>
      <circle cx="60" cy="40" r="3" fill="#00C851"/>
      <path d="M32 48h32" stroke="#666" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 52h24" stroke="#999" stroke-width="1.5" stroke-linecap="round"/>
      <defs>
        <linearGradient id="chatGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#00D4AA"/>
          <stop offset="1" stop-color="#00A085"/>
        </linearGradient>
      </defs>
    </svg>


    <!-- File Manager -->
    <svg v-else-if="name === 'filemanager'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#filemanagerGradient)"/>
      <!-- 主文件夹 -->
      <path d="M20 28h24l8 8h24c4.4 0 8 3.6 8 8v28c0 4.4-3.6 8-8 8H28c-4.4 0-8-3.6-8-8V36c0-4.4 3.6-8 8-8z" fill="#fff" fill-opacity="0.95"/>
      <path d="M28 44h40v24c0 2.2-1.8 4-4 4H32c-2.2 0-4-1.8-4-4V44z" fill="url(#filemanagerBody)"/>
      <!-- 文件图标 -->
      <rect x="34" y="50" width="6" height="8" rx="1" fill="#fff" fill-opacity="0.9"/>
      <rect x="42" y="50" width="6" height="8" rx="1" fill="#fff" fill-opacity="0.9"/>
      <rect x="50" y="50" width="6" height="8" rx="1" fill="#fff" fill-opacity="0.9"/>
      <rect x="58" y="50" width="6" height="8" rx="1" fill="#fff" fill-opacity="0.9"/>
      <!-- 工具栏 -->
      <rect x="28" y="44" width="40" height="4" fill="url(#toolbarGradient)"/>
      <circle cx="32" cy="46" r="1" fill="#fff" fill-opacity="0.8"/>
      <circle cx="36" cy="46" r="1" fill="#fff" fill-opacity="0.8"/>
      <circle cx="40" cy="46" r="1" fill="#fff" fill-opacity="0.8"/>
      <defs>
        <linearGradient id="filemanagerGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#4FC3F7"/>
          <stop offset="1" stop-color="#29B6F6"/>
        </linearGradient>
        <linearGradient id="filemanagerBody" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#42A5F5"/>
          <stop offset="1" stop-color="#1E88E5"/>
        </linearGradient>
        <linearGradient id="toolbarGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#1976D2"/>
          <stop offset="1" stop-color="#1565C0"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Photos App -->
    <svg v-else-if="name === 'photos'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#photosGradient)"/>
      <!-- 主照片框 -->
      <rect x="16" y="20" width="64" height="48" rx="4" fill="#fff" fill-opacity="0.95"/>
      <path d="M20 24h56v40H20V24z" fill="url(#photosImage)"/>
      <!-- 太阳 -->
      <circle cx="32" cy="36" r="6" fill="#FFD54F"/>
      <!-- 山脉和树木 -->
      <path d="M20 52l16-12 12 8 16-10 16 12v8H20v-6z" fill="#81C784"/>
      <!-- 底部照片堆叠效果 -->
      <rect x="20" y="72" width="56" height="8" rx="2" fill="#fff" fill-opacity="0.8"/>
      <rect x="22" y="74" width="52" height="6" rx="1" fill="#fff" fill-opacity="0.6"/>
      <!-- 相机图标 -->
      <circle cx="72" cy="32" r="8" fill="rgba(255,255,255,0.9)"/>
      <circle cx="72" cy="32" r="5" fill="#666"/>
      <rect x="68" y="28" width="8" height="2" rx="1" fill="rgba(255,255,255,0.9)"/>
      <defs>
        <linearGradient id="photosGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#FF7043"/>
          <stop offset="1" stop-color="#FF5722"/>
        </linearGradient>
        <linearGradient id="photosImage" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#E3F2FD"/>
          <stop offset="1" stop-color="#BBDEFB"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Folder (for desktop icons) -->
    <svg v-else-if="name === 'folder'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#folderGradient)"/>
      <path d="M16 28H40L48 36H80V72H16V28Z" fill="#fff" fill-opacity="0.9"/>
      <path d="M16 36H80V72H16V36Z" fill="url(#folderBody)"/>
      <defs>
        <linearGradient id="folderGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#4FC3F7"/>
          <stop offset="1" stop-color="#29B6F6"/>
        </linearGradient>
        <linearGradient id="folderBody" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#42A5F5"/>
          <stop offset="1" stop-color="#1E88E5"/>
        </linearGradient>
      </defs>
    </svg>


    <!-- Default fallback -->
    <svg v-else viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="#E0E0E0"/>
      <circle cx="48" cy="48" r="20" fill="#BDBDBD"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 48
})
</script>

<style scoped>
.app-icon-wrapper {
  display: inline-block;
}

.app-icon-wrapper svg {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}
</style>
