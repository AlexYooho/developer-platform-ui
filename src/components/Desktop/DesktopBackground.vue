<template>
  <div class="desktop-background">
    <!-- 默认macOS Big Sur风格渐变背景 -->
    <div class="background-gradient"></div>
    
    <!-- 可选：添加动态粒子效果 -->
    <div class="particles" v-if="showParticles">
      <div 
        v-for="i in particleCount" 
        :key="i" 
        class="particle"
        :style="getParticleStyle(i)"
      ></div>
    </div>
    
    <!-- 桌面内容插槽 -->
    <div class="desktop-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  showParticles?: boolean
  particleCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  showParticles: true,
  particleCount: 50
})

// 生成随机粒子样式
const getParticleStyle = (index: number) => {
  const size = Math.random() * 4 + 1
  const left = Math.random() * 100
  const animationDelay = Math.random() * 20
  const animationDuration = Math.random() * 10 + 10
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`
  }
}
</script>

<style scoped>
.desktop-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: -1;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 25%,
    #f093fb 50%,
    #f5576c 75%,
    #4facfe 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float linear infinite;
}

@keyframes float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

.desktop-content {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .particle {
    display: none;
  }
}
</style>
