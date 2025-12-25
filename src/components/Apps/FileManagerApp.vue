<template>
  <div class="file-manager">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="goBack" :disabled="!canGoBack" class="nav-btn">
          ← 返回
        </button>
        <button @click="goForward" :disabled="!canGoForward" class="nav-btn">
          前进 →
        </button>
        <button @click="goUp" :disabled="isAtRoot" class="nav-btn">
          ↑ 上级
        </button>
      </div>
      
      <div class="path-bar">
        <span class="path-item" 
              v-for="(part, index) in pathParts" 
              :key="index"
              @click="navigateToPath(index)">
          {{ part || '根目录' }}
          <span v-if="index < pathParts.length - 1" class="path-separator">/</span>
        </span>
      </div>
      
      <div class="toolbar-right">
        <button @click="showCreateMenu = !showCreateMenu" class="create-btn">
          + 新建
        </button>
        <button @click="refreshCurrentFolder" class="refresh-btn">
          🔄
        </button>
      </div>
    </div>

    <!-- 新建菜单 -->
    <div v-if="showCreateMenu" class="create-menu" @click.stop>
      <div class="menu-item" @click="createFolder">
        📁 新建文件夹
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="createFile('txt')">
        📄 文本文件 (.txt)
      </div>
      <div class="menu-item" @click="createFile('docx')">
        📝 Word文档 (.docx)
      </div>
      <div class="menu-item" @click="createFile('xlsx')">
        📊 Excel表格 (.xlsx)
      </div>
      <div class="menu-item" @click="createFile('pdf')">
        📋 PDF文档 (.pdf)
      </div>
    </div>

    <!-- 文件网格 -->
    <div class="file-grid" @click="showCreateMenu = false; hideContextMenu()">
      <div v-if="currentItems.length === 0" class="empty-folder">
        <div class="empty-icon">📂</div>
        <div class="empty-text">此文件夹为空</div>
        <div class="empty-hint">点击"新建"按钮创建文件或文件夹</div>
      </div>
      
      <div v-for="item in currentItems" 
           :key="item.id" 
           class="file-item"
           :class="{ selected: selectedItems.includes(item.id) }"
           @click="selectItem(item.id)"
           @dblclick="openItem(item)"
           @contextmenu.prevent="showContextMenu($event, item)">
        <div class="file-icon-container">
          <div class="file-icon-large" :class="getFileIcon(item)"></div>
        </div>
        <div class="file-name-container">
          <div class="file-name" 
               v-if="!item.isRenaming"
               @dblclick.stop="startRename(item)">
            {{ item.name }}
          </div>
          <input v-else
                 v-model="item.newName"
                 @blur="finishRename(item)"
                 @keyup.enter="finishRename(item)"
                 @keyup.escape="cancelRename(item)"
                 class="rename-input"
                 ref="renameInput"
                 @click.stop>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="showContextMenuFlag" 
         class="context-menu"
         :style="contextMenuStyle"
         @click.stop>
      <div class="menu-item" @click="openItemFromMenu(contextMenuItem!)">
        <span class="menu-icon">📂</span>
        {{ contextMenuItem?.type === 'folder' ? '打开文件夹' : '打开文件' }}
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="startRename(contextMenuItem!)">
        <span class="menu-icon">✏️</span>
        重命名
      </div>
      <div class="menu-item delete" @click="deleteItem(contextMenuItem!)">
        <span class="menu-icon">🗑️</span>
        删除
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="showItemInfo(contextMenuItem!)">
        <span class="menu-icon">ℹ️</span>
        显示简介
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span>{{ currentItems.length }} 个项目</span>
      <span v-if="selectedItems.length > 0">
        已选择 {{ selectedItems.length }} 个项目
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  size: number
  modified: Date
  path: string
  isRenaming?: boolean
  newName?: string
}

// 响应式数据
const currentPath = ref('')
const pathHistory = ref<string[]>([''])
const historyIndex = ref(0)
const showCreateMenu = ref(false)
const selectedItems = ref<string[]>([])
const showContextMenuFlag = ref(false)
const contextMenuStyle = ref({})
const contextMenuItem = ref<FileItem | null>(null)

// 文件系统模拟
const fileSystem = ref<Record<string, FileItem[]>>({
  '': [
    {
      id: '1',
      name: '文档',
      type: 'folder',
      size: 0,
      modified: new Date('2024-01-15'),
      path: '文档'
    },
    {
      id: '2',
      name: '下载',
      type: 'folder',
      size: 0,
      modified: new Date('2024-01-10'),
      path: '下载'
    },
    {
      id: '3',
      name: '示例文档.txt',
      type: 'file',
      extension: 'txt',
      size: 1024,
      modified: new Date('2024-01-12'),
      path: '示例文档.txt'
    }
  ],
  '文档': [],
  '下载': []
})

// 计算属性
const currentItems = computed(() => {
  return fileSystem.value[currentPath.value] || []
})

const pathParts = computed(() => {
  return currentPath.value ? currentPath.value.split('/') : ['']
})

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < pathHistory.value.length - 1)
const isAtRoot = computed(() => currentPath.value === '')

// 导航方法
const navigateTo = (path: string) => {
  if (path !== currentPath.value) {
    // 清除前进历史
    pathHistory.value = pathHistory.value.slice(0, historyIndex.value + 1)
    pathHistory.value.push(path)
    historyIndex.value++
    currentPath.value = path
  }
  selectedItems.value = []
  showCreateMenu.value = false
}

const navigateToPath = (index: number) => {
  const newPath = pathParts.value.slice(0, index + 1).join('/').replace(/^\//, '')
  navigateTo(newPath || '')
}

const goBack = () => {
  if (canGoBack.value) {
    historyIndex.value--
    currentPath.value = pathHistory.value[historyIndex.value] || ''
    selectedItems.value = []
  }
}

const goForward = () => {
  if (canGoForward.value) {
    historyIndex.value++
    currentPath.value = pathHistory.value[historyIndex.value] || ''
    selectedItems.value = []
  }
}

const goUp = () => {
  if (!isAtRoot.value) {
    const parentPath = currentPath.value.split('/').slice(0, -1).join('/')
    navigateTo(parentPath)
  }
}

// 文件操作方法
const createFolder = () => {
  const newFolder: FileItem = {
    id: Date.now().toString(),
    name: '新建文件夹',
    type: 'folder',
    size: 0,
    modified: new Date(),
    path: currentPath.value ? `${currentPath.value}/新建文件夹` : '新建文件夹'
  }
  
  if (!fileSystem.value[currentPath.value]) {
    fileSystem.value[currentPath.value] = []
  }
  
  fileSystem.value[currentPath.value]!.push(newFolder)
  fileSystem.value[newFolder.path] = []
  
  showCreateMenu.value = false
  
  // 自动开始重命名
  nextTick(() => {
    startRename(newFolder)
  })
}

const createFile = (extension: string) => {
  const fileName = `新建文件.${extension}`
  const newFile: FileItem = {
    id: Date.now().toString(),
    name: fileName,
    type: 'file',
    extension,
    size: 0,
    modified: new Date(),
    path: currentPath.value ? `${currentPath.value}/${fileName}` : fileName
  }
  
  if (!fileSystem.value[currentPath.value]) {
    fileSystem.value[currentPath.value] = []
  }
  
  fileSystem.value[currentPath.value]!.push(newFile)
  showCreateMenu.value = false
  
  // 自动开始重命名
  nextTick(() => {
    startRename(newFile)
  })
}

const openItem = (item: FileItem) => {
  if (item.type === 'folder') {
    navigateTo(item.path)
  } else {
    // 根据文件类型模拟不同的打开方式
    openFile(item)
  }
}

const openFile = (item: FileItem) => {
  const fileType = item.extension || 'unknown'
  
  switch (fileType) {
    case 'txt':
      showTextEditor(item)
      break
    case 'docx':
      showMessage(`正在使用 Microsoft Word 打开 "${item.name}"...`, 'info')
      break
    case 'xlsx':
      showMessage(`正在使用 Microsoft Excel 打开 "${item.name}"...`, 'info')
      break
    case 'pdf':
      showMessage(`正在使用 PDF 阅读器打开 "${item.name}"...`, 'info')
      break
    default:
      showMessage(`正在使用默认应用程序打开 "${item.name}"...`, 'info')
  }
}

const showTextEditor = (item: FileItem) => {
  const editor = document.createElement('div')
  editor.className = 'text-editor-modal'
  editor.innerHTML = `
    <div class="editor-backdrop" onclick="this.parentElement.remove()">
      <div class="editor-content" onclick="event.stopPropagation()">
        <div class="editor-header">
          <h3>${item.name}</h3>
          <div class="editor-controls">
            <button onclick="this.closest('.text-editor-modal').remove()">关闭</button>
          </div>
        </div>
        <div class="editor-body">
          <textarea placeholder="在此输入文本内容..." rows="20" cols="80">这是一个示例文本文件的内容。

您可以在这里编辑文本内容。

文件名：${item.name}
创建时间：${formatDate(item.modified)}</textarea>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(editor)
}

const showMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // 自动消失
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

const selectItem = (id: string) => {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

// 重命名功能
const startRename = (item: FileItem) => {
  hideContextMenu()
  item.isRenaming = true
  item.newName = item.name
  nextTick(() => {
    const input = document.querySelector('.rename-input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const finishRename = (item: FileItem) => {
  if (item.newName && item.newName.trim() !== '') {
    const oldPath = item.path
    item.name = item.newName.trim()
    
    // 更新路径
    if (item.type === 'folder') {
      const newPath = currentPath.value ? `${currentPath.value}/${item.name}` : item.name
      item.path = newPath
      
      // 更新文件系统中的文件夹路径
      if (fileSystem.value[oldPath]) {
        fileSystem.value[newPath] = fileSystem.value[oldPath]!
        delete fileSystem.value[oldPath]
      }
    } else {
      item.path = currentPath.value ? `${currentPath.value}/${item.name}` : item.name
    }
  }
  
  item.isRenaming = false
  item.newName = undefined
}

const cancelRename = (item: FileItem) => {
  item.isRenaming = false
  item.newName = undefined
}

const deleteItem = (item: FileItem) => {
  // 先隐藏菜单，然后显示确认对话框
  hideContextMenu()
  
  // 使用更现代的确认对话框
  const shouldDelete = confirm(`确定要删除 "${item.name}" 吗？\n\n${item.type === 'folder' ? '文件夹及其所有内容将被永久删除。' : '此操作无法撤销。'}`)
  
  if (shouldDelete) {
    const items = fileSystem.value[currentPath.value]
    if (items) {
      const index = items.findIndex(i => i.id === item.id)
      if (index > -1) {
        items.splice(index, 1)
      }
    }
    
    // 如果是文件夹，删除其内容
    if (item.type === 'folder' && fileSystem.value[item.path]) {
      delete fileSystem.value[item.path]
    }
    
    // 从选中列表中移除
    const selectedIndex = selectedItems.value.indexOf(item.id)
    if (selectedIndex > -1) {
      selectedItems.value.splice(selectedIndex, 1)
    }
    
    // 显示删除成功提示
    showMessage(`已删除 "${item.name}"`, 'success')
  }
}

const refreshCurrentFolder = () => {
  // 模拟刷新
  console.log('刷新文件夹:', currentPath.value)
}

// 右键菜单相关方法
const showContextMenu = (event: MouseEvent, item: FileItem) => {
  event.preventDefault()
  contextMenuItem.value = item
  showContextMenuFlag.value = true
  
  // 获取文件管理器容器的位置信息
  const fileManagerEl = (event.currentTarget as HTMLElement).closest('.file-manager') as HTMLElement
  const rect = fileManagerEl.getBoundingClientRect()
  
  // 计算相对于文件管理器容器的位置
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // 菜单尺寸（估算）
  const menuWidth = 160
  const menuHeight = 120
  
  // 获取容器尺寸
  const containerWidth = rect.width
  const containerHeight = rect.height
  
  // 计算最终位置，确保菜单不会超出容器边界
  let finalX = x
  let finalY = y
  
  // 如果菜单会超出右边界，向左调整
  if (x + menuWidth > containerWidth) {
    finalX = containerWidth - menuWidth - 10
  }
  
  // 如果菜单会超出下边界，向上调整
  if (y + menuHeight > containerHeight) {
    finalY = containerHeight - menuHeight - 10
  }
  
  // 确保菜单不会超出左边界和上边界
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

// 添加全局点击监听器来隐藏右键菜单
const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.context-menu')) {
    hideContextMenu()
  }
}

const openItemFromMenu = (item: FileItem) => {
  hideContextMenu()
  openItem(item)
}

const showItemInfo = (item: FileItem) => {
  const info = `文件信息：
名称：${item.name}
类型：${getFileType(item)}
大小：${getFileSize(item)}
修改时间：${formatDate(item.modified)}
路径：${item.path}`
  
  // 创建一个更美观的信息对话框
  const modal = document.createElement('div')
  modal.className = 'info-modal'
  modal.innerHTML = `
    <div class="info-modal-backdrop" onclick="this.parentElement.remove()">
      <div class="info-modal-content" onclick="event.stopPropagation()">
        <div class="info-modal-header">
          <h3>${item.name}</h3>
          <button onclick="this.closest('.info-modal').remove()">×</button>
        </div>
        <div class="info-modal-body">
          <div class="info-item">
            <span class="info-label">类型：</span>
            <span class="info-value">${getFileType(item)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">大小：</span>
            <span class="info-value">${getFileSize(item)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">修改时间：</span>
            <span class="info-value">${formatDate(item.modified)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">路径：</span>
            <span class="info-value">${item.path}</span>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  hideContextMenu()
}

// 辅助方法
const getFileIcon = (item: FileItem): string => {
  // 返回CSS类名而不是emoji，用于自定义图标
  if (item.type === 'folder') return 'folder-icon'
  
  switch (item.extension) {
    case 'txt': return 'txt-icon'
    case 'docx': return 'docx-icon'
    case 'xlsx': return 'xlsx-icon'
    case 'pdf': return 'pdf-icon'
    default: return 'file-icon'
  }
}

const getFileType = (item: FileItem): string => {
  if (item.type === 'folder') return '文件夹'
  
  switch (item.extension) {
    case 'txt': return '文本文档'
    case 'docx': return 'Word 文档'
    case 'xlsx': return 'Excel 工作簿'
    case 'pdf': return 'PDF 文档'
    default: return '文件'
  }
}

const getFileSize = (item: FileItem): string => {
  if (item.type === 'folder') return '-'
  if (item.size === 0) return '0 字节'
  
  const units = ['字节', 'KB', 'MB', 'GB']
  let size = item.size
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
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

onMounted(() => {
  // 初始化
  console.log('文件管理器已加载')
  
  // 添加全局点击监听器
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped>
.file-manager {
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
  align-items: center;
  padding: 12px 16px;
  background: rgba(246, 246, 246, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 12px;
}

.toolbar-left {
  display: flex;
  gap: 4px;
}

.nav-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.path-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
}

.path-item {
  cursor: pointer;
  color: #0066cc;
  transition: color 0.2s;
}

.path-item:hover {
  color: #004499;
  text-decoration: underline;
}

.path-separator {
  margin: 0 4px;
  color: #6c757d;
}

.toolbar-right {
  display: flex;
  gap: 4px;
}

.create-btn, .refresh-btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.create-btn:hover, .refresh-btn:hover {
  background: #0056b3;
}

.refresh-btn {
  background: #6c757d;
  border-color: #6c757d;
}

.refresh-btn:hover {
  background: #545b62;
}

.create-menu {
  position: absolute;
  top: 50px;
  right: 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 180px;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-divider {
  height: 1px;
  background: #e9ecef;
  margin: 4px 0;
}

.file-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 16px;
  align-content: start;
  background: #FBFBFD;
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #86868B;
  grid-column: 1 / -1;
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
  content: '';
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  bottom: 24px;
  background: linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.empty-icon::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 16px;
  width: 24px;
  height: 12px;
  background: linear-gradient(135deg, #F9F9FB 0%, #F2F2F7 100%);
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-bottom: none;
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
  color: #86868B;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  min-height: 100px;
  justify-content: flex-start;
  user-select: none;
}

.file-item:hover {
  background: rgba(0, 122, 255, 0.08);
  transform: translateY(-1px);
}

.file-item.selected {
  background: rgba(0, 122, 255, 0.15);
  border-radius: 8px;
}

.file-item.selected::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #007AFF;
  border-radius: 10px;
  pointer-events: none;
}

.file-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  position: relative;
}

.file-icon-large {
  width: 64px;
  height: 64px;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  border-radius: 8px;
}

.file-item:hover .file-icon-large {
  transform: scale(1.05);
}

.file-name-container {
  width: 100%;
  text-align: center;
  max-width: 80px;
}

.file-name {
  font-size: 11px;
  color: #1d1d1f;
  font-weight: 400;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.8);
}

.file-item.selected .file-name {
  color: #007AFF;
  font-weight: 500;
}

/* macOS风格的文件图标 */
.folder-icon {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  position: relative;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.folder-icon::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 16px;
  background: linear-gradient(135deg, #5BA0F2 0%, #4A90E2 100%);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.folder-icon::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 8px;
  width: 20px;
  height: 8px;
  background: linear-gradient(135deg, #6BB0FF 0%, #5BA0F2 100%);
  border-radius: 4px 4px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: none;
}

.txt-icon {
  background: linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 100%);
  border: 1px solid #D1D1D6;
  border-radius: 6px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.txt-icon::before {
  content: 'TXT';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 600;
  color: #6C6C70;
  letter-spacing: 0.5px;
}

.txt-icon::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #D1D1D6;
  border-radius: 1px;
  box-shadow: 0 6px 0 #D1D1D6, 0 12px 0 #D1D1D6, 0 18px 0 #D1D1D6;
}

.docx-icon {
  background: linear-gradient(135deg, #2B579A 0%, #1E4A8C 100%);
  border-radius: 6px;
  position: relative;
  box-shadow: 0 2px 8px rgba(43, 87, 154, 0.3);
}

.docx-icon::before {
  content: 'W';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 700;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.xlsx-icon {
  background: linear-gradient(135deg, #217346 0%, #1A5F3A 100%);
  border-radius: 6px;
  position: relative;
  box-shadow: 0 2px 8px rgba(33, 115, 70, 0.3);
}

.xlsx-icon::before {
  content: 'X';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: 700;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.pdf-icon {
  background: linear-gradient(135deg, #DC3545 0%, #C82333 100%);
  border-radius: 6px;
  position: relative;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.pdf-icon::before {
  content: 'PDF';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

.pdf-icon::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.file-icon {
  background: linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 100%);
  border: 1px solid #D1D1D6;
  border-radius: 6px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-icon::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #D1D1D6;
  border-radius: 1px;
  box-shadow: 0 6px 0 #D1D1D6, 0 12px 0 #D1D1D6, 0 18px 0 #D1D1D6;
}

.rename-input {
  border: 2px solid #007AFF;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
  outline: none;
  background: #fff;
  width: 100%;
  text-align: center;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  font-weight: 400;
  color: #1d1d1f;
}

/* 右键菜单样式 - macOS风格 */
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

.context-menu .menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  color: #1d1d1f;
  font-weight: 400;
  font-size: 13px;
}

.context-menu .menu-icon {
  width: 16px;
  text-align: center;
  margin-right: 8px;
  font-size: 12px;
}

.context-menu .menu-item:hover {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.context-menu .menu-item.delete:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.context-menu .menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 6px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #6c757d;
}

/* 滚动条样式 */
.file-grid::-webkit-scrollbar {
  width: 8px;
}

.file-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.file-grid::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.file-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
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

/* 文本编辑器模态框 */
.text-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.editor-backdrop {
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

.editor-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 80vw;
  max-width: 800px;
  height: 80vh;
  max-height: 600px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.editor-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.editor-controls button {
  background: #007AFF;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.editor-controls button:hover {
  background: #0056CC;
}

.editor-body {
  flex: 1;
  padding: 16px 20px;
}

.editor-body textarea {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  background: rgba(248, 248, 248, 0.8);
}

.editor-body textarea:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
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

.toast-info {
  background: rgba(0, 122, 255, 0.9);
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.toast-success {
  background: rgba(52, 199, 89, 0.9);
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.toast-warning {
  background: rgba(255, 149, 0, 0.9);
  border: 1px solid rgba(255, 149, 0, 0.3);
}

.toast-error {
  background: rgba(255, 59, 48, 0.9);
  border: 1px solid rgba(255, 59, 48, 0.3);
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
</style>
