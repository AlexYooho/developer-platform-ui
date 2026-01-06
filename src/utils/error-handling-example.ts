/**
 * 完整的错误处理示例
 * 展示如何处理HTTP 500错误的完整流程
 */

import http from './http'
import type { ApiResponse } from './http'

// ================================
// 错误处理流程说明
// ================================

/*
当后端返回 code: 500 时的处理流程：

1. 后端响应: { code: 500, msg: "服务器内部错误", data: null }

2. http.ts 响应拦截器:
   - 检查到 response.code !== 200
   - 创建 Error 对象: new Error(data.msg || '请求失败')
   - 执行 Promise.reject(error)

3. 在组件中的 catch 块:
   - 捕获到 Error 对象
   - error.message = "服务器内部错误"
   - 显示给用户
*/

// ================================
// 实际使用示例
// ================================

/**
 * 撤回消息的完整错误处理示例
 */
export async function withdrawMessageExample(
  messageId: string, 
  targetId: number, 
  type: number,
  showAlert: (msg: string) => Promise<void>
) {
  try {
    // 调用API
    const response = await http.post<ApiResponse<any>>(
      `/api/messages/withdraw/${type}`, 
      {
        message_id: messageId,
        target_id: targetId
      }
    )
    
    // 注意：如果后端返回 code: 500，代码不会执行到这里
    // 因为 http.ts 的响应拦截器会抛出异常
    
    console.log('撤回成功:', response.data)
    return { success: true, data: response.data }
    
  } catch (error) {
    // 这里会捕获到 http.ts 抛出的错误
    
    console.error('撤回消息失败:', error)
    
    let errorMessage = '撤回失败，请稍后重试'
    
    if (error instanceof Error) {
      // 从 http.ts 抛出的错误，message 就是后端的 msg 字段
      errorMessage = error.message
      
      // 可以根据错误信息进行更细致的处理
      if (error.message.includes('服务器内部错误')) {
        errorMessage = '服务器繁忙，请稍后重试'
      } else if (error.message.includes('权限')) {
        errorMessage = '没有权限执行此操作'
      } else if (error.message.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接'
      }
    }
    
    // 显示错误提示
    await showAlert(errorMessage)
    
    return { success: false, error: errorMessage }
  }
}

// ================================
// 在Vue组件中的使用方式
// ================================

/*
// 在 ChatMain.vue 中使用

const recallMessage = async (message: Message) => {
  try {
    const data = {
      message_id: message.id,
      target_id: props.activeContact?.target_id,
    }
    
    const response = await api.message.withdrawMessage(props.activeContact!.type, data)
    
    // 成功处理
    message.isRecalled = true
    message.messageContent = '你撤回了一条消息'
    
  } catch (error) {
    // 错误处理
    let errorMessage = '撤回失败'
    
    if (error instanceof Error) {
      // 这里的 error.message 就是后端返回的 msg 字段
      errorMessage = error.message
      
      // 可以根据具体错误信息定制提示
      if (error.message.includes('500') || error.message.includes('服务器')) {
        errorMessage = '服务器繁忙，请稍后重试'
      }
    }
    
    await alert(errorMessage)
  }
}
*/

// ================================
// 不同错误场景的处理示例
// ================================

/**
 * 处理不同HTTP状态码的示例
 */
export function getErrorMessage(error: any): string {
  if (!(error instanceof Error)) {
    return '操作失败，请稍后重试'
  }
  
  const message = error.message.toLowerCase()
  
  // 根据错误信息判断具体情况
  if (message.includes('500') || message.includes('服务器内部错误')) {
    return '服务器繁忙，请稍后重试'
  }
  
  if (message.includes('400') || message.includes('参数错误')) {
    return '请求参数有误，请检查后重试'
  }
  
  if (message.includes('401') || message.includes('未授权')) {
    return '登录已过期，请重新登录'
  }
  
  if (message.includes('403') || message.includes('权限')) {
    return '没有权限执行此操作'
  }
  
  if (message.includes('404') || message.includes('不存在')) {
    return '请求的资源不存在'
  }
  
  if (message.includes('timeout') || message.includes('超时')) {
    return '请求超时，请检查网络连接'
  }
  
  if (message.includes('network') || message.includes('网络')) {
    return '网络连接失败，请检查网络设置'
  }
  
  // 直接返回后端的错误信息
  return error.message || '操作失败，请稍后重试'
}

// ================================
// 简化的错误处理包装器
// ================================

/**
 * 简化的API调用包装器
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  operation: string = '操作'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await apiCall()
    return { success: true, data }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.error(`${operation}失败:`, error)
    return { success: false, error: errorMessage }
  }
}

// 使用示例
/*
const result = await safeApiCall(
  () => api.message.withdrawMessage(type, data),
  '撤回消息'
)

if (result.success) {
  // 成功处理
  message.isRecalled = true
  message.messageContent = '你撤回了一条消息'
} else {
  // 错误处理
  await alert(result.error!)
}
*/
