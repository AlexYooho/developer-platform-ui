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

    <!-- Safari -->
    <svg v-else-if="name === 'safari'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#safariGradient)"/>
      <circle cx="48" cy="48" r="32" fill="#fff" fill-opacity="0.9"/>
      <circle cx="48" cy="48" r="28" fill="none" stroke="#ddd" stroke-width="2"/>
      <path d="M48 20v8M48 68v8M20 48h8M68 48h8" stroke="#666" stroke-width="2"/>
      <path d="M48 32L56 48L48 64L40 48Z" fill="#FF3B30"/>
      <circle cx="48" cy="48" r="4" fill="#fff"/>
      <defs>
        <linearGradient id="safariGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#E3F2FD"/>
          <stop offset="1" stop-color="#BBDEFB"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Chrome -->
    <svg v-else-if="name === 'chrome'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="#fff"/>
      <circle cx="48" cy="48" r="36" fill="url(#chromeGradient)"/>
      <circle cx="48" cy="48" r="16" fill="#4285F4"/>
      <path d="M48 32A16 16 0 0 0 32 48L16 28A36 36 0 0 1 48 12V32Z" fill="#EA4335"/>
      <path d="M64 48A16 16 0 0 0 48 32L68 28A36 36 0 0 1 80 68L64 48Z" fill="#FBBC04"/>
      <path d="M32 48A16 16 0 0 0 48 64L28 68A36 36 0 0 1 16 28L32 48Z" fill="#34A853"/>
      <defs>
        <radialGradient id="chromeGradient" cx="0.5" cy="0.5" r="0.5">
          <stop stop-color="#fff"/>
          <stop offset="1" stop-color="#f0f0f0"/>
        </radialGradient>
      </defs>
    </svg>

    <!-- VS Code -->
    <svg v-else-if="name === 'vscode'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#vscodeGradient)"/>
      <path d="M72 16L48 32L24 16L16 24V72L24 80L48 64L72 80L80 72V24L72 16Z" fill="#fff" fill-opacity="0.9"/>
      <path d="M72 16L48 32V64L72 80L80 72V24L72 16Z" fill="#0078D4"/>
      <path d="M24 16L48 32L36 48L24 32V16Z" fill="#00BCF2"/>
      <path d="M24 80L48 64L36 48L24 64V80Z" fill="#00BCF2"/>
      <defs>
        <linearGradient id="vscodeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0078D4"/>
          <stop offset="1" stop-color="#005A9E"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Terminal -->
    <svg v-else-if="name === 'terminal'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#terminalGradient)"/>
      <rect x="12" y="20" width="72" height="56" rx="4" fill="#1E1E1E"/>
      <circle cx="20" cy="28" r="2" fill="#FF5F57"/>
      <circle cx="28" cy="28" r="2" fill="#FFBD2E"/>
      <circle cx="36" cy="28" r="2" fill="#28CA42"/>
      <path d="M20 40L28 48L20 56" stroke="#00FF00" stroke-width="2" fill="none"/>
      <rect x="32" y="54" width="20" height="2" fill="#00FF00"/>
      <defs>
        <linearGradient id="terminalGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#333"/>
          <stop offset="1" stop-color="#000"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Music -->
    <svg v-else-if="name === 'music'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#musicGradient)"/>
      <circle cx="48" cy="48" r="32" fill="#fff" fill-opacity="0.9"/>
      <path d="M36 32V56C36 60.4 32.4 64 28 64S20 60.4 20 56S23.6 48 28 48C30.2 48 32.2 48.8 33.6 50.2V32H60V44C60 48.4 56.4 52 52 52S44 48.4 44 44S47.6 36 52 36C54.2 36 56.2 36.8 57.6 38.2V32H36Z" fill="url(#musicNote)"/>
      <defs>
        <linearGradient id="musicGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#FF6B6B"/>
          <stop offset="1" stop-color="#FF3B30"/>
        </linearGradient>
        <linearGradient id="musicNote" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#FF3B30"/>
          <stop offset="1" stop-color="#D32F2F"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- System Preferences -->
    <svg v-else-if="name === 'settings'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#settingsGradient)"/>
      <circle cx="48" cy="48" r="32" fill="#fff" fill-opacity="0.9"/>
      <g transform="translate(48,48)">
        <path d="M-6-20L6-20L8-16L16-16L20-6L20 6L16 16L8 16L6 20L-6 20L-8 16L-16 16L-20 6L-20-6L-16-16L-8-16Z" fill="#666"/>
        <circle r="12" fill="#fff"/>
        <circle r="8" fill="#666"/>
      </g>
      <defs>
        <linearGradient id="settingsGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#E0E0E0"/>
          <stop offset="1" stop-color="#BDBDBD"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Trash -->
    <svg v-else-if="name === 'trash'" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#trashGradient)"/>
      <path d="M32 24H64L60 72H36L32 24Z" fill="#fff" fill-opacity="0.9"/>
      <path d="M28 24H68V28H28V24Z" fill="#666"/>
      <path d="M40 20H56V24H40V20Z" fill="#666"/>
      <path d="M40 32V64M48 32V64M56 32V64" stroke="#666" stroke-width="2"/>
      <defs>
        <linearGradient id="trashGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#757575"/>
          <stop offset="1" stop-color="#424242"/>
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
