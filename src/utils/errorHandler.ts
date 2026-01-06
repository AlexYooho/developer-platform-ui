/**
 * 简化版错误处理工具
 * 专门处理HTTP请求的错误情况
 */

/**
 * 处理API调用错误的通用函数
 */
export function handleApiError(error: any): string {
  
  // 如果是Error对象，直接使用message
  if (error instanceof Error) {
    return error.message
  }
  
  // 如果是字符串，直接返回
  if (typeof error === 'string') {
    return error
  }
  
  // 如果是对象且有message属性
  if (error && typeof error === 'object' && error.message) {
    return error.message
  }
  
  // 默认错误信息
  return `操作失败，请稍后重试`
}

/**
 * 为特定操作创建错误处理函数
 */
export function createErrorHandler() {
  return (error: any): string => {
    return handleApiError(error)
  }
}

// 预定义的错误处理器
export const ErrorHandlers = {
  convert: createErrorHandler()
}
