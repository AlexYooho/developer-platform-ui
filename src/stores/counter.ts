import { ref } from 'vue'
import { defineStore } from 'pinia'

// 示例 store - 可以根据需要修改或删除
export const useAppStore = defineStore('app', () => {
  const appName = ref('开发者平台')
  
  return { appName }
})
