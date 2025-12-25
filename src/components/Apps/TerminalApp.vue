<template>
  <div class="terminal-app">
    <div class="terminal-header">
      <div class="terminal-tabs">
        <div class="tab active">
          <span>bash</span>
          <button class="tab-close">×</button>
        </div>
        <button class="new-tab">+</button>
      </div>
    </div>
    
    <div class="terminal-content" ref="terminalRef" @click="focusInput">
      <div class="terminal-output">
        <div v-for="(line, index) in outputLines" :key="index" class="output-line">
          <span v-if="line.type === 'prompt'" class="prompt">{{ line.content }}</span>
          <span v-else-if="line.type === 'command'" class="command">{{ line.content }}</span>
          <span v-else class="output">{{ line.content }}</span>
        </div>
      </div>
      
      <div class="terminal-input-line">
        <span class="prompt">{{ currentPrompt }}</span>
        <input
          ref="inputRef"
          v-model="currentInput"
          class="terminal-input"
          @keydown="handleKeydown"
          @keyup="handleKeyup"
          spellcheck="false"
        />
        <span class="cursor" :class="{ blink: showCursor }">█</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'

interface OutputLine {
  type: 'prompt' | 'command' | 'output' | 'error'
  content: string
}

const terminalRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const currentInput = ref('')
const currentPrompt = ref('user@macbook-pro:~ $ ')
const showCursor = ref(true)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

const outputLines = reactive<OutputLine[]>([
  { type: 'output', content: 'Last login: Thu Dec 25 15:30:42 on ttys000' },
  { type: 'output', content: 'Welcome to macOS Terminal' },
  { type: 'output', content: '' }
])

// 光标闪烁
let cursorInterval: number
onMounted(() => {
  cursorInterval = window.setInterval(() => {
    showCursor.value = !showCursor.value
  }, 500)
  
  // 自动聚焦输入框
  focusInput()
})

const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    executeCommand()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    navigateHistory(-1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    navigateHistory(1)
  } else if (event.key === 'Tab') {
    event.preventDefault()
    // 简单的自动补全
    autoComplete()
  }
}

const handleKeyup = () => {
  // 重置光标闪烁
  showCursor.value = true
}

const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return
  
  const newIndex = historyIndex.value + direction
  if (newIndex >= -1 && newIndex < commandHistory.value.length) {
    historyIndex.value = newIndex
    currentInput.value = newIndex === -1 ? '' : (commandHistory.value[newIndex] || '')
  }
}

const autoComplete = () => {
  const commands = ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'chmod', 'chown']
  const input = currentInput.value.trim()
  
  if (input) {
    const matches = commands.filter(cmd => cmd.startsWith(input))
    if (matches.length === 1) {
      currentInput.value = matches[0] + ' '
    }
  }
}

const executeCommand = () => {
  const command = currentInput.value.trim()
  
  if (command) {
    // 添加到历史记录
    commandHistory.value.unshift(command)
    if (commandHistory.value.length > 100) {
      commandHistory.value.pop()
    }
  }
  
  // 显示命令
  outputLines.push({ type: 'prompt', content: currentPrompt.value })
  outputLines.push({ type: 'command', content: command })
  
  // 执行命令
  if (command) {
    processCommand(command)
  } else {
    outputLines.push({ type: 'output', content: '' })
  }
  
  // 重置输入
  currentInput.value = ''
  historyIndex.value = -1
  
  // 滚动到底部
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}

const processCommand = (command: string) => {
  const [cmd, ...args] = command.split(' ')
  
  switch (cmd?.toLowerCase()) {
    case 'help':
      outputLines.push({ type: 'output', content: '可用命令:' })
      outputLines.push({ type: 'output', content: '  help     - 显示帮助信息' })
      outputLines.push({ type: 'output', content: '  clear    - 清空终端' })
      outputLines.push({ type: 'output', content: '  ls       - 列出文件' })
      outputLines.push({ type: 'output', content: '  pwd      - 显示当前目录' })
      outputLines.push({ type: 'output', content: '  date     - 显示当前时间' })
      outputLines.push({ type: 'output', content: '  whoami   - 显示当前用户' })
      outputLines.push({ type: 'output', content: '  echo     - 输出文本' })
      break
      
    case 'clear':
      outputLines.splice(0, outputLines.length)
      break
      
    case 'ls':
      outputLines.push({ type: 'output', content: 'Desktop     Documents   Downloads   Pictures' })
      outputLines.push({ type: 'output', content: 'Movies      Music       Public      Applications' })
      break
      
    case 'pwd':
      outputLines.push({ type: 'output', content: '/Users/user' })
      break
      
    case 'date':
      outputLines.push({ type: 'output', content: new Date().toString() })
      break
      
    case 'whoami':
      outputLines.push({ type: 'output', content: 'user' })
      break
      
    case 'echo':
      outputLines.push({ type: 'output', content: args.join(' ') })
      break
      
    case '':
      outputLines.push({ type: 'output', content: '' })
      break
      
    default:
      outputLines.push({ type: 'error', content: `command not found: ${cmd || ''}` })
      break
  }
  
  outputLines.push({ type: 'output', content: '' })
}
</script>

<style scoped>
.terminal-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.terminal-header {
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
  padding: 8px 12px;
}

.terminal-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab {
  background: #3d3d3d;
  border: 1px solid #4d4d4d;
  border-radius: 4px 4px 0 0;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
}

.tab.active {
  background: #1e1e1e;
  border-bottom-color: #1e1e1e;
}

.tab-close {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.tab-close:hover {
  background: #ff5f57;
  color: white;
}

.new-tab {
  background: #3d3d3d;
  border: 1px solid #4d4d4d;
  border-radius: 4px;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-tab:hover {
  background: #4d4d4d;
  color: white;
}

.terminal-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  cursor: text;
}

.terminal-output {
  margin-bottom: 4px;
}

.output-line {
  margin-bottom: 2px;
  word-wrap: break-word;
}

.prompt {
  color: #00ff00;
  font-weight: bold;
}

.command {
  color: #ffffff;
}

.output {
  color: #cccccc;
}

.error {
  color: #ff6b6b;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  position: relative;
}

.terminal-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  flex: 1;
  margin-left: 4px;
  caret-color: transparent;
}

.cursor {
  color: #ffffff;
  animation: none;
  margin-left: 2px;
}

.cursor.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 滚动条样式 */
.terminal-content::-webkit-scrollbar {
  width: 8px;
}

.terminal-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.terminal-content::-webkit-scrollbar-thumb {
  background: #4d4d4d;
  border-radius: 4px;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  background: #5d5d5d;
}
</style>
