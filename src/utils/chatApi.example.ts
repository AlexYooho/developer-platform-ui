/**
 * 聊天应用中的HTTP使用示例
 * 基于您的实际业务场景
 */

import http from './http'
import type { ApiResponse } from './http'

// ================================
// 消息相关API示例
// ================================

/**
 * 获取消息列表
 */
export async function getMessages(targetId: number) {
  try {
    const response = await http.get<ApiResponse<Array<{
      id: string
      is_sent: boolean
      send_id: number
      receiver_id: number
      message_content: string
      message_content_type: number
      send_time: string
      // ... 其他字段
    }>>>('/api/messages', {
      params: { target_id: targetId },
      showLoading: true
    })

    // 检查业务状态码
    if (response.code === 200) {
      return response.data
    } else {
      throw new Error(response.msg || '获取消息失败')
    }
  } catch (error) {
    console.error('获取消息失败:', error)
    throw error
  }
}

/**
 * 发送消息
 */
export async function sendMessage(type: number, messageData: {
  target_id: number
  message_main_type: number
  message_content_type: number
  message_content: string
  terminal_type: number
}) {
  try {
    const response = await http.post<ApiResponse<{
      id: string
      is_sent: boolean
      send_id: number
      receiver_id: number
      message_content: string
      send_time: string
    }>>(`/api/messages/send/${type}`, messageData, {
      showLoading: true
    })

    if (response.code === 200) {
      console.log('消息发送成功:', response.data)
      return response.data
    } else {
      // 处理不同的错误情况
      let errorMessage = '发送失败'
      switch (response.code) {
        case 400:
          errorMessage = '消息内容不能为空'
          break
        case 403:
          errorMessage = '没有发送权限'
          break
        case 500:
          errorMessage = response.msg || '服务器错误，请稍后重试'
          break
        default:
          errorMessage = response.msg || '发送失败'
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    throw error
  }
}

/**
 * 撤回消息
 */
export async function withdrawMessage(type: number, data: {
  message_id: string
  target_id: number
}) {
  try {
    const response = await http.post<ApiResponse<any>>(
      `/api/messages/withdraw/${type}`, 
      data,
      { showLoading: true }
    )

    if (response.code === 200) {
      console.log('消息撤回成功')
      return response.data
    } else {
      // 处理撤回失败的情况
      let errorMessage = '撤回失败'
      switch (response.code) {
        case 403:
          errorMessage = '消息发送时间超过2分钟，无法撤回'
          break
        case 404:
          errorMessage = '消息不存在或已被删除'
          break
        case 409:
          errorMessage = '消息已被撤回'
          break
        case 500:
          errorMessage = response.msg || '服务器错误，请稍后重试'
          console.error('撤回消息服务器错误:', {
            code: response.code,
            message: response.msg,
            messageId: data.message_id,
            targetId: data.target_id,
            timestamp: new Date().toISOString()
          })
          break
        default:
          errorMessage = response.msg || '撤回失败'
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    // 处理网络错误
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('请求超时，请稍后重试')
      } else if (error.message.includes('Network Error')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
    console.error('撤回消息网络错误:', error)
    throw error
  }
}

// ================================
// 会话相关API示例
// ================================

/**
 * 获取会话列表
 */
export async function getConversationList() {
  try {
    const response = await http.get<ApiResponse<Array<{
      id: number
      target_id: number
      conv_type: number
      name: string
      head_image: string
      last_msg_content: string
      last_msg_time: string
      unread_count: number
    }>>>('/api/conversations', {
      showLoading: true
    })

    if (response.code === 200) {
      return response.data
    } else {
      throw new Error(response.msg || '获取会话列表失败')
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    throw error
  }
}

// ================================
// 在Vue组件中的实际使用
// ================================

/*
// 在 ChatMain.vue 中使用撤回消息
const recallMessage = async (message: Message) => {
  try {
    const data = {
      message_id: message.id,
      target_id: props.activeContact?.target_id,
    }
    
    // 调用API
    await withdrawMessage(props.activeContact!.type, data)
    
    // 成功后更新UI
    message.isRecalled = true
    message.messageContent = '你撤回了一条消息'
    
  } catch (error) {
    // 显示错误提示
    if (error instanceof Error) {
      await alert(error.message)
    } else {
      await alert('撤回失败，请稍后重试')
    }
  }
}
*/

/*
// 在 ChatApp.vue 中使用发送消息
const handleSendMessage = async (data: { text: string; type: string }) => {
  if (!activeContact.value) return

  try {
    const sendData = {
      target_id: 2,
      message_main_type: activeContact.value.type,
      message_content_type: 0,
      message_content: data.text,
      terminal_type: 0
    }
    
    // 调用API发送消息
    const result = await sendMessage(activeContact.value.type, sendData)
    
    // 成功后添加到消息列表
    const newMessage: Message = {
      id: result.id,
      isSent: result.is_sent,
      sendId: result.send_id,
      receiverId: result.receiver_id,
      messageContent: result.message_content,
      // ... 其他字段
    }
    
    messages.push(newMessage)
    
  } catch (error) {
    console.error('发送消息失败:', error)
    // 显示错误提示给用户
  }
}
*/

// ================================
// 错误处理最佳实践
// ================================

/**
 * 通用的API调用包装器
 */
export async function safeApiCall<T>(
  apiFunction: () => Promise<T>,
  errorMessage: string = '操作失败'
): Promise<T | null> {
  try {
    return await apiFunction()
  } catch (error) {
    console.error(errorMessage, error)
    
    // 根据错误类型提供不同的处理
    if (error instanceof Error) {
      // 可以在这里集成你的通知系统
      // showNotification(error.message, 'error')
      console.error('错误详情:', error.message)
    }
    
    return null
  }
}

// 使用示例
/*
const result = await safeApiCall(
  () => getMessages(targetId),
  '获取消息失败'
)

if (result) {
  // 处理成功结果
  console.log('获取到消息:', result)
} else {
  // 处理失败情况
  console.log('获取消息失败，使用默认数据')
}
*/
