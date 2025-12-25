<template>
  <div class="finder-app">
    <div class="finder-toolbar">
      <div class="toolbar-buttons">
        <button class="toolbar-btn" title="后退">←</button>
        <button class="toolbar-btn" title="前进">→</button>
        <button class="toolbar-btn" title="上级目录">↑</button>
      </div>
      <div class="path-bar">
        <span class="path-item">桌面</span>
        <span class="path-separator">></span>
        <span class="path-item">文档</span>
      </div>
      <div class="view-controls">
        <button class="view-btn active" title="列表视图">☰</button>
        <button class="view-btn" title="图标视图">⊞</button>
      </div>
    </div>
    
    <div class="finder-content">
      <div class="sidebar">
        <div class="sidebar-section">
          <h4>收藏夹</h4>
          <div class="sidebar-item active">
            <span class="item-icon">📁</span>
            <span class="item-name">桌面</span>
          </div>
          <div class="sidebar-item">
            <span class="item-icon">📄</span>
            <span class="item-name">文档</span>
          </div>
          <div class="sidebar-item">
            <span class="item-icon">⬇️</span>
            <span class="item-name">下载</span>
          </div>
          <div class="sidebar-item">
            <span class="item-icon">🖼️</span>
            <span class="item-name">图片</span>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h4>设备</h4>
          <div class="sidebar-item">
            <span class="item-icon">💾</span>
            <span class="item-name">Macintosh HD</span>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="file-list">
          <div class="file-item" v-for="file in files" :key="file.name">
            <span class="file-icon">{{ file.icon }}</span>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-details">{{ file.size }} - {{ file.date }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const files = ref([
  { name: '项目文档.pdf', icon: '📄', size: '2.3 MB', date: '今天 14:30' },
  { name: '设计图', icon: '📁', size: '--', date: '昨天 16:45' },
  { name: '截图.png', icon: '🖼️', size: '1.8 MB', date: '昨天 10:20' },
  { name: '代码备份.zip', icon: '📦', size: '15.6 MB', date: '12月23日' },
  { name: '会议记录.docx', icon: '📝', size: '456 KB', date: '12月22日' },
  { name: '演示文稿.pptx', icon: '📊', size: '8.2 MB', date: '12月21日' }
])
</script>

<style scoped>
.finder-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.finder-toolbar {
  height: 40px;
  background: #e8e8e8;
  border-bottom: 1px solid #d0d0d0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
}

.toolbar-buttons {
  display: flex;
  gap: 4px;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #c0c0c0;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #e0e0e0;
}

.path-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.path-item {
  color: #333;
  cursor: pointer;
}

.path-item:hover {
  text-decoration: underline;
}

.path-separator {
  color: #999;
}

.view-controls {
  display: flex;
  gap: 2px;
}

.view-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #c0c0c0;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #e0e0e0;
}

.view-btn.active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}

.finder-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: #f0f0f0;
  border-right: 1px solid #d0d0d0;
  padding: 12px 8px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h4 {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  margin: 0 0 8px 8px;
  font-weight: 600;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sidebar-item.active {
  background: #007AFF;
  color: white;
}

.item-icon {
  font-size: 14px;
}

.item-name {
  flex: 1;
}

.main-content {
  flex: 1;
  background: white;
  overflow-y: auto;
}

.file-list {
  padding: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: #f0f8ff;
}

.file-icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.file-details {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .sidebar {
    width: 150px;
  }
  
  .path-bar {
    display: none;
  }
}
</style>
