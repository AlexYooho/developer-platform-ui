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
