import { ref } from 'vue'

export interface MenuPosition {
  x: number
  y: number
}

export function useContextMenu() {
  const visible = ref(false)
  const position = ref<MenuPosition>({ x: 0, y: 0 })

  const showMenu = (event: MouseEvent) => {
    event.preventDefault()
    
    // 直接使用鼠标相对于视口的坐标
    let x = event.clientX
    let y = event.clientY
    
    // 菜单尺寸估算（用于边界检测）
    const menuWidth = 120
    const menuHeight = 120
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 边界检测 - 如果菜单会超出右边界，向左调整
    if (x + menuWidth > viewportWidth) {
      x = x - menuWidth
    }
    
    // 边界检测 - 如果菜单会超出下边界，向上调整
    if (y + menuHeight > viewportHeight) {
      y = y - menuHeight
    }
    
    // 确保不会超出左边界和上边界
    x = Math.max(10, x)
    y = Math.max(10, y)
    
    position.value = { x, y }
    visible.value = true
  }

  const hideMenu = () => {
    visible.value = false
  }

  return {
    visible,
    position,
    showMenu,
    hideMenu
  }
}
