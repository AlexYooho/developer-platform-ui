<template>
  <div class="photos-app">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="app-title">相册</h2>
        <div class="photo-count">{{ photos.length }} 张照片</div>
      </div>
      
      <div class="toolbar-right">
        <button @click="showUploadDialog" class="upload-btn">
          📷 添加照片
        </button>
        <button @click="toggleViewMode" class="view-mode-btn" :title="viewMode === 'grid' ? '列表视图' : '网格视图'">
          {{ viewMode === 'grid' ? '☰' : '⊞' }}
        </button>
      </div>
    </div>

    <!-- 照片网格 -->
    <div class="photos-container" @click="hideContextMenu">
      <div v-if="photos.length === 0" class="empty-photos">
        <div class="empty-icon"></div>
        <div class="empty-text">还没有照片</div>
        <div class="empty-hint">点击"添加照片"按钮来添加您的第一张照片</div>
        <button @click="showUploadDialog" class="empty-add-btn">添加照片</button>
      </div>
      
      <div v-else class="photos-grid" :class="{ 'list-view': viewMode === 'list' }">
        <div 
          v-for="photo in photos" 
          :key="photo.id"
          class="photo-item"
          :class="{ selected: selectedPhotos.includes(photo.id) }"
          @click="selectPhoto(photo.id)"
          @dblclick="openPhotoViewer(photo)"
          @contextmenu.prevent="showContextMenu($event, photo)">
          <div class="photo-thumbnail">
            <img :src="photo.url" :alt="photo.name" @load="onImageLoad" @error="onImageError">
            <div class="photo-overlay">
              <div class="photo-actions">
                <button @click.stop="openPhotoViewer(photo)" class="action-btn view-btn" title="查看">
                  👁️
                </button>
                <button @click.stop="startRename(photo)" class="action-btn rename-btn" title="重命名">
                  ✏️
                </button>
                <button @click.stop="deletePhoto(photo)" class="action-btn delete-btn" title="删除">
                  🗑️
                </button>
              </div>
            </div>
          </div>
          <div class="photo-info">
            <div class="photo-name" v-if="!photo.isRenaming" @dblclick.stop="startRename(photo)">
              {{ photo.name }}
            </div>
            <input 
              v-else
              v-model="photo.newName"
              @blur="finishRename(photo)"
              @keyup.enter="finishRename(photo)"
              @keyup.escape="cancelRename(photo)"
              class="rename-input"
              @click.stop>
            <div class="photo-meta">
              {{ formatFileSize(photo.size) }} • {{ formatDate(photo.dateAdded) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="showContextMenuFlag" 
         class="context-menu"
         :style="contextMenuStyle"
         @click.stop>
      <div class="menu-item" @click="openPhotoFromMenu(contextMenuItem!)">
        <span class="menu-icon">👁️</span>
        查看照片
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="startRename(contextMenuItem!)">
        <span class="menu-icon">✏️</span>
        重命名
      </div>
      <div class="menu-item delete" @click="deletePhoto(contextMenuItem!)">
        <span class="menu-icon">🗑️</span>
        删除
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="showPhotoInfo(contextMenuItem!)">
        <span class="menu-icon">ℹ️</span>
        显示简介
      </div>
    </div>

    <!-- 照片查看器 -->
    <div v-if="showViewer" class="photo-viewer" @click="closeViewer">
      <div class="viewer-content" @click.stop>
        <div class="viewer-header">
          <div class="viewer-title">{{ currentPhoto?.name }}</div>
          <div class="viewer-controls">
            <button @click="zoomOut" class="control-btn" title="缩小">🔍-</button>
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="control-btn" title="放大">🔍+</button>
            <button @click="resetZoom" class="control-btn" title="适应窗口">⊞</button>
            <button @click="closeViewer" class="control-btn close-btn" title="关闭">✕</button>
          </div>
        </div>
        <div class="viewer-body">
          <div class="image-container" 
               @wheel="handleWheel"
               @mousedown="startPan"
               @mousemove="handlePan"
               @mouseup="endPan"
               @mouseleave="endPan">
            <img 
              :src="currentPhoto?.url" 
              :alt="currentPhoto?.name"
              :style="imageStyle"
              draggable="false">
          </div>
        </div>
        <div class="viewer-footer">
          <button @click="previousPhoto" :disabled="currentPhotoIndex === 0" class="nav-btn">
            ← 上一张
          </button>
          <span class="photo-counter">
            {{ currentPhotoIndex + 1 }} / {{ photos.length }}
          </span>
          <button @click="nextPhoto" :disabled="currentPhotoIndex === photos.length - 1" class="nav-btn">
            下一张 →
          </button>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <div v-if="showUploadFlag" class="upload-dialog" @click="hideUploadDialog">
      <div class="upload-content" @click.stop>
        <div class="upload-header">
          <h3>添加照片</h3>
          <button @click="hideUploadDialog" class="close-btn">✕</button>
        </div>
        <div class="upload-body">
          <div class="upload-area" @click="triggerFileInput">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击选择照片文件</div>
            <div class="upload-hint">支持 JPG、PNG、GIF 格式</div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            multiple 
            @change="handleFileUpload" 
            style="display: none;">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

interface Photo {
  id: string
  name: string
  url: string
  size: number
  dateAdded: Date
  width?: number
  height?: number
  isRenaming?: boolean
  newName?: string
}

// 响应式数据
const photos = ref<Photo[]>([
  {
    id: '1',
    name: '风景照片.jpg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InNreSIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4N0NFRUIiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNFMEY2RkYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNza3kpIi8+PHBvbHlnb24gcG9pbnRzPSIwLDIwMCA0MDAsMjAwIDQwMCwxNTAgMzAwLDEwMCAyMDAsMTIwIDEwMCwxNDAgMCwxODAiIGZpbGw9IiM0Q0FGNTASCZ8L3BvbHlnb24+PGNpcmNsZSBjeD0iMzIwIiBjeT0iODAiIHI9IjMwIiBmaWxsPSIjRkZENzAwIi8+PHRleHQgeD0iMjAwIiB5PSIyNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPumjjuaZr+eXp+eJhzwvdGV4dD48L3N2Zz4=',
    size: 2048000,
    dateAdded: new Date('2024-01-15'),
    width: 400,
    height: 300
  },
  {
    id: '2',
    name: '城市夜景.jpg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9Im5pZ2h0IiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzJDM0U1MCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAwMDUxNCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI25pZ2h0KSIvPjxyZWN0IHg9IjUwIiB5PSIxNTAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxQTFBMUEiLz48cmVjdCB4PSIxMjAiIHk9IjEyMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEzMCIgZmlsbD0iIzFBMUExQSIvPjxyZWN0IHg9IjIyMCIgeT0iMTAwIiB3aWR0aD0iNzAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMUExQTFBIi8+PHJlY3QgeD0iMzEwIiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMxQTFBMUEiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjE3MCIgcj0iMyIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9IjE0NSIgY3k9IjE0NSIgcj0iMyIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9IjI1NSIgY3k9IjEyNSIgcj0iMyIgZmlsbD0iI0ZGRDcwMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7ln47luILlpJzmma88L3RleHQ+PC9zdmc+',
    size: 3072000,
    dateAdded: new Date('2024-01-12'),
    width: 400,
    height: 300
  },
  {
    id: '3',
    name: '花朵特写.jpg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImZsb3dlciIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkY2QkJBIi8+PHN0b3Agb2Zmc2V0PSI3MCUiIHN0b3AtY29sb3I9IiNGRjk5Q0QiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkM5REQiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJENUEyNyIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9InVybCgjZmxvd2VyKSIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iMjAiIGZpbGw9IiNGRkQ3MDAiLz48ZWxsaXBzZSBjeD0iMTUwIiBjeT0iMTUwIiByeD0iMzAiIHJ5PSIxNSIgZmlsbD0iI0ZGNkJCQSIgdHJhbnNmb3JtPSJyb3RhdGUoLTMwIDIwMCAxNTApIi8+PGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE1MCIgcng9IjMwIiByeT0iMTUiIGZpbGw9IiNGRjZCQkEiIHRyYW5zZm9ybT0icm90YXRlKDMwIDIwMCAxNTApIi8+PGVsbGlwc2UgY3g9IjIwMCIgY3k9IjEwMCIgcng9IjE1IiByeT0iMzAiIGZpbGw9IiNGRjZCQkEiLz48ZWxsaXBzZSBjeD0iMjAwIiBjeT0iMjAwIiByeD0iMTUiIHJ5PSIzMCIgZmlsbD0iI0ZGNkJCQSIvPjx0ZXh0IHg9IjIwMCIgeT0iMjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7oirHmnLXnibnlhpk8L3RleHQ+PC9zdmc+',
    size: 1536000,
    dateAdded: new Date('2024-01-10'),
    width: 400,
    height: 300
  }
])

const selectedPhotos = ref<string[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const showContextMenuFlag = ref(false)
const contextMenuStyle = ref({})
const contextMenuItem = ref<Photo | null>(null)

// 照片查看器
const showViewer = ref(false)
const currentPhoto = ref<Photo | null>(null)
const currentPhotoIndex = ref(0)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)

// 上传对话框
const showUploadFlag = ref(false)
const fileInput = ref<HTMLInputElement>()

// 计算属性
const imageStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
  cursor: isPanning.value ? 'grabbing' : 'grab'
}))

// 照片选择
const selectPhoto = (id: string) => {
  const index = selectedPhotos.value.indexOf(id)
  if (index > -1) {
    selectedPhotos.value.splice(index, 1)
  } else {
    selectedPhotos.value.push(id)
  }
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

// 照片查看器
const openPhotoViewer = (photo: Photo) => {
  currentPhoto.value = photo
  currentPhotoIndex.value = photos.value.findIndex(p => p.id === photo.id)
  showViewer.value = true
  resetZoom()
}

const closeViewer = () => {
  showViewer.value = false
  currentPhoto.value = null
  resetZoom()
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
    currentPhoto.value = photos.value[currentPhotoIndex.value] || null
    resetZoom()
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
    currentPhoto.value = photos.value[currentPhotoIndex.value] || null
    resetZoom()
  }
}

// 缩放控制
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// 拖拽控制
const startPan = (event: MouseEvent) => {
  isPanning.value = true
  lastPanX.value = event.clientX
  lastPanY.value = event.clientY
}

const handlePan = (event: MouseEvent) => {
  if (!isPanning.value) return
  
  const deltaX = event.clientX - lastPanX.value
  const deltaY = event.clientY - lastPanY.value
  
  panX.value += deltaX / zoomLevel.value
  panY.value += deltaY / zoomLevel.value
  
  lastPanX.value = event.clientX
  lastPanY.value = event.clientY
}

const endPan = () => {
  isPanning.value = false
}

// 右键菜单
const showContextMenu = (event: MouseEvent, photo: Photo) => {
  event.preventDefault()
  contextMenuItem.value = photo
  showContextMenuFlag.value = true
  
  const photosAppEl = (event.currentTarget as HTMLElement).closest('.photos-app') as HTMLElement
  const rect = photosAppEl.getBoundingClientRect()
  
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const menuWidth = 160
  const menuHeight = 120
  
  let finalX = x
  let finalY = y
  
  if (x + menuWidth > rect.width) {
    finalX = rect.width - menuWidth - 10
  }
  
  if (y + menuHeight > rect.height) {
    finalY = rect.height - menuHeight - 10
  }
  
  finalX = Math.max(10, finalX)
  finalY = Math.max(10, finalY)
  
  contextMenuStyle.value = {
    left: `${finalX}px`,
    top: `${finalY}px`
  }
}

const hideContextMenu = () => {
  showContextMenuFlag.value = false
  contextMenuItem.value = null
}

const openPhotoFromMenu = (photo: Photo) => {
  hideContextMenu()
  openPhotoViewer(photo)
}

// 重命名功能
const startRename = (photo: Photo) => {
  hideContextMenu()
  photo.isRenaming = true
  photo.newName = photo.name
  nextTick(() => {
    const input = document.querySelector('.rename-input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const finishRename = (photo: Photo) => {
  if (photo.newName && photo.newName.trim() !== '') {
    photo.name = photo.newName.trim()
  }
  photo.isRenaming = false
  photo.newName = undefined
}

const cancelRename = (photo: Photo) => {
  photo.isRenaming = false
  photo.newName = undefined
}

// 删除照片
const deletePhoto = (photo: Photo) => {
  hideContextMenu()
  const shouldDelete = confirm(`确定要删除照片 "${photo.name}" 吗？\n\n此操作无法撤销。`)
  
  if (shouldDelete) {
    const index = photos.value.findIndex(p => p.id === photo.id)
    if (index > -1) {
      photos.value.splice(index, 1)
    }
    
    const selectedIndex = selectedPhotos.value.indexOf(photo.id)
    if (selectedIndex > -1) {
      selectedPhotos.value.splice(selectedIndex, 1)
    }
    
    showMessage(`已删除照片 "${photo.name}"`, 'success')
  }
}

// 显示照片信息
const showPhotoInfo = (photo: Photo) => {
  const modal = document.createElement('div')
  modal.className = 'info-modal'
  modal.innerHTML = `
    <div class="info-modal-backdrop" onclick="this.parentElement.remove()">
      <div class="info-modal-content" onclick="event.stopPropagation()">
        <div class="info-modal-header">
          <h3>${photo.name}</h3>
          <button onclick="this.closest('.info-modal').remove()">×</button>
        </div>
        <div class="info-modal-body">
          <div class="info-item">
            <span class="info-label">文件大小：</span>
            <span class="info-value">${formatFileSize(photo.size)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">尺寸：</span>
            <span class="info-value">${photo.width} × ${photo.height} 像素</span>
          </div>
          <div class="info-item">
            <span class="info-label">添加时间：</span>
            <span class="info-value">${formatDate(photo.dateAdded)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">格式：</span>
            <span class="info-value">JPEG</span>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  hideContextMenu()
}

// 上传功能
const showUploadDialog = () => {
  showUploadFlag.value = true
}

const hideUploadDialog = () => {
  showUploadFlag.value = false
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newPhoto: Photo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: e.target?.result as string,
            size: file.size,
            dateAdded: new Date(),
            width: 400, // 实际应用中需要获取真实尺寸
            height: 300
          }
          photos.value.push(newPhoto)
        }
        reader.readAsDataURL(file)
      }
    })
  }
  
  hideUploadDialog()
  target.value = ''
}

// 辅助函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const onImageLoad = (event: Event) => {
  // 图片加载成功处理
}

const onImageError = (event: Event) => {
  // 图片加载失败处理
  console.error('图片加载失败')
}

const showMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// 全局点击处理
const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.context-menu')) {
    hideContextMenu()
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (showViewer.value) {
    switch (event.key) {
      case 'Escape':
        closeViewer()
        break
      case 'ArrowLeft':
        previousPhoto()
        break
      case 'ArrowRight':
        nextPhoto()
        break
      case '+':
      case '=':
        zoomIn()
        break
      case '-':
        zoomOut()
        break
      case '0':
        resetZoom()
        break
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.photos-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FBFBFD;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(246, 246, 246, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.photo-count {
  font-size: 13px;
  color: #86868B;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.upload-btn, .view-mode-btn {
  padding: 6px 12px;
  border: 1px solid #007AFF;
  background: #007AFF;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn:hover, .view-mode-btn:hover {
  background: #0056CC;
}

.view-mode-btn {
  background: #6c757d;
  border-color: #6c757d;
  min-width: 32px;
}

.view-mode-btn:hover {
  background: #545b62;
}

.photos-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-photos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #86868B;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #E5E5EA 0%, #D1D1D6 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon::before {
  content: '📷';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1d1d1f;
}

.empty-hint {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 16px;
}

.empty-add-btn {
  padding: 8px 16px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.empty-add-btn:hover {
  background: #0056CC;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.photos-grid.list-view {
  grid-template-columns: 1fr;
}

.photo-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.photo-item.selected {
  border: 2px solid #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.photo-thumbnail {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.photo-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.photo-item:hover .photo-thumbnail img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.delete-btn:hover {
  background: #FF3B30;
  color: white;
}

.photo-info {
  padding: 12px;
}

.photo-name {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 4px;
  word-break: break-all;
}

.photo-meta {
  font-size: 12px;
  color: #86868B;
}

.rename-input {
  border: 2px solid #007AFF;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 14px;
  outline: none;
  background: #fff;
  width: 100%;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

/* 右键菜单样式 */
.context-menu {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  min-width: 160px;
  padding: 6px;
  font-size: 13px;
  animation: contextMenuFadeIn 0.15s ease;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  color: #1d1d1f;
  font-weight: 400;
}

.menu-icon {
  width: 16px;
  text-align: center;
  margin-right: 8px;
  font-size: 12px;
}

.menu-item:hover {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.menu-item.delete:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 6px;
}

/* 照片查看器样式 */
.photo-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-content {
  width: 90vw;
  height: 90vh;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.viewer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.viewer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  padding: 6px 12px;
  border: 1px solid #D1D1D6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f8f9fa;
}

.close-btn {
  background: #FF3B30;
  border-color: #FF3B30;
  color: white;
}

.close-btn:hover {
  background: #D32F2F;
}

.zoom-level {
  font-size: 12px;
  color: #86868B;
  min-width: 40px;
  text-align: center;
}

.viewer-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease;
}

.viewer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #007AFF;
  background: #007AFF;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #0056CC;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #D1D1D6;
  border-color: #D1D1D6;
}

.photo-counter {
  font-size: 13px;
  color: #86868B;
}

/* 上传对话框样式 */
.upload-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.upload-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.upload-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #86868B;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.upload-body {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #D1D1D6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #007AFF;
  background: rgba(0, 122, 255, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #86868B;
}

/* 提示消息样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.toast-success {
  background: rgba(52, 199, 89, 0.9);
  border: 1px solid rgba(52, 199, 89, 0.3);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* 信息模态框样式 */
.info-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.info-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.info-modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.info-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.info-modal-header button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #86868B;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.info-modal-header button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.info-modal-body {
  padding: 16px 20px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #86868B;
  min-width: 80px;
  font-size: 13px;
}

.info-value {
  color: #1d1d1f;
  font-size: 13px;
  word-break: break-all;
}

/* 滚动条样式 */
.photos-container::-webkit-scrollbar {
  width: 8px;
}

.photos-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.photos-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.photos-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
