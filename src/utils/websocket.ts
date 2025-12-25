/**
 * WebSocket工具类 - 用于与Java-Netty后端建立WebSocket连接
 * 支持自动重连、心跳检测、消息队列等功能
 */

export interface WebSocketMessage {
  type: string
  data: any
  timestamp?: number
  id?: string
}

export interface WebSocketConfig {
  url: string
  protocols?: string | string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  heartbeatMessage?: string
  debug?: boolean
}

export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void
  onMessage?: (message: WebSocketMessage, event: MessageEvent) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onReconnect?: (attempt: number) => void
  onMaxReconnectAttemptsReached?: () => void
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private handlers: WebSocketEventHandlers = {}
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnecting = false
  private isDestroyed = false

  constructor(config: WebSocketConfig) {
    this.config = {
      protocols: [],
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatMessage: JSON.stringify({ type: 'ping', data: 'heartbeat' }),
      debug: false,
      ...config
    }
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new Error('WebSocket客户端已被销毁'))
        return
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('WebSocket正在连接中'))
        return
      }

      this.isConnecting = true
      this.log('开始连接WebSocket:', this.config.url)

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols)
        this.setupEventListeners(resolve, reject)
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(resolve: () => void, reject: (error: any) => void) {
    if (!this.ws) return

    this.ws.onopen = (event) => {
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.log('WebSocket连接成功')
      
      // 发送队列中的消息
      this.flushMessageQueue()
      
      // 启动心跳
      this.startHeartbeat()
      
      this.handlers.onOpen?.(event)
      resolve()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.log('收到消息:', message)
        
        // 处理心跳响应
        if (message.type === 'pong') {
          this.log('收到心跳响应')
          return
        }
        
        this.handlers.onMessage?.(message, event)
      } catch (error) {
        this.log('解析消息失败:', error)
        // 如果不是JSON格式，直接传递原始数据
        const message: WebSocketMessage = {
          type: 'raw',
          data: event.data,
          timestamp: Date.now()
        }
        this.handlers.onMessage?.(message, event)
      }
    }

    this.ws.onclose = (event) => {
      this.isConnecting = false
      this.stopHeartbeat()
      this.log('WebSocket连接关闭:', event.code, event.reason)
      
      this.handlers.onClose?.(event)
      
      // 如果不是主动关闭且未达到最大重连次数，则尝试重连
      if (!this.isDestroyed && event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect()
      } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        this.log('达到最大重连次数，停止重连')
        this.handlers.onMaxReconnectAttemptsReached?.()
      }
    }

    this.ws.onerror = (event) => {
      this.isConnecting = false
      this.log('WebSocket连接错误:', event)
      this.handlers.onError?.(event)
      reject(event)
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    this.log(`准备第${this.reconnectAttempts}次重连，${this.config.reconnectInterval}ms后执行`)
    
    this.reconnectTimer = window.setTimeout(() => {
      this.handlers.onReconnect?.(this.reconnectAttempts)
      this.connect().catch((error) => {
        this.log('重连失败:', error)
      })
    }, this.config.reconnectInterval)
  }

  /**
   * 发送消息
   */
  send(message: WebSocketMessage): boolean {
    if (this.isDestroyed) {
      this.log('WebSocket客户端已被销毁，无法发送消息')
      return false
    }

    // 添加时间戳和ID
    const messageWithMeta = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      id: message.id || this.generateMessageId()
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(messageWithMeta)
        this.ws.send(messageStr)
        this.log('发送消息:', messageWithMeta)
        return true
      } catch (error) {
        this.log('发送消息失败:', error)
        return false
      }
    } else {
      // 连接未建立，将消息加入队列
      this.messageQueue.push(messageWithMeta)
      this.log('连接未建立，消息已加入队列:', messageWithMeta)
      
      // 如果没有在连接中，尝试连接
      if (!this.isConnecting) {
        this.connect().catch((error) => {
          this.log('自动连接失败:', error)
        })
      }
      
      return false
    }
  }

  /**
   * 发送队列中的消息
   */
  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      if (message) {
        try {
          const messageStr = JSON.stringify(message)
          this.ws.send(messageStr)
          this.log('发送队列消息:', message)
        } catch (error) {
          this.log('发送队列消息失败:', error)
          break
        }
      }
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(this.config.heartbeatMessage)
          this.log('发送心跳')
        } catch (error) {
          this.log('发送心跳失败:', error)
        }
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 设置事件处理器
   */
  on<K extends keyof WebSocketEventHandlers>(event: K, handler: WebSocketEventHandlers[K]) {
    this.handlers[event] = handler
  }

  /**
   * 移除事件处理器
   */
  off<K extends keyof WebSocketEventHandlers>(event: K) {
    delete this.handlers[event]
  }

  /**
   * 关闭连接
   */
  close(code?: number, reason?: string) {
    this.isDestroyed = true
    
    // 清理定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    
    // 关闭WebSocket连接
    if (this.ws) {
      this.ws.close(code || 1000, reason || '主动关闭')
      this.ws = null
    }
    
    // 清空消息队列
    this.messageQueue = []
    
    this.log('WebSocket客户端已关闭')
  }

  /**
   * 获取连接状态
   */
  get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.ws ? this.ws.readyState === WebSocket.OPEN : false
  }

  /**
   * 获取重连次数
   */
  get reconnectCount(): number {
    return this.reconnectAttempts
  }

  /**
   * 获取队列中的消息数量
   */
  get queueSize(): number {
    return this.messageQueue.length
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 日志输出
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args)
    }
  }
}

/**
 * 创建WebSocket客户端实例
 */
export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config)
}

/**
 * WebSocket连接状态枚举
 */
export const WebSocketReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const

export default WebSocketClient
