/**
 * HTTP客户端使用示例
 * 展示如何在不同场景下使用 http.ts
 */

import http from './http'
import type { ApiResponse } from './http'

// ================================
// 1. 基础 GET 请求示例
// ================================

/**
 * 获取用户信息
 */
export async function getUserInfo(userId: string) {
  try {
    // 基础GET请求
    const response = await http.get<ApiResponse<{
      id: string
      name: string
      email: string
      avatar: string
    }>>(`/api/users/${userId}`)
    
    console.log('用户信息:', response.data)
    return response.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

/**
 * 获取消息列表（带查询参数）
 */
export async function getMessageList(targetId: number, page: number = 1, limit: number = 20) {
  try {
    const response = await http.get<ApiResponse<{
      list: Array<{
        id: string
        content: string
        sendTime: string
      }>
      total: number
    }>>('/api/messages', {
      params: {
        target_id: targetId,
        page,
        limit
      },
      showLoading: true // 显示加载状态
    })
    
    return response.data
  } catch (error) {
    console.error('获取消息列表失败:', error)
    throw error
  }
}

// ================================
// 2. POST 请求示例
// ================================

/**
 * 发送消息
 */
export async function sendMessage(messageData: {
  target_id: number
  message_content: string
  message_content_type: number
}) {
  try {
    const response = await http.post<ApiResponse<{
      id: string
      send_time: string
      message_status: number
    }>>('/api/messages/send', messageData, {
      showLoading: true,
      showError: true // 自动显示错误提示
    })
    
    if (response.code === 200) {
      console.log('消息发送成功:', response.data)
      return response.data
    } else {
      throw new Error(response.msg || '发送失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    throw error
  }
}

/**
 * 用户登录
 */
export async function login(credentials: {
  username: string
  password: string
}) {
  try {
    const response = await http.post<ApiResponse<{
      token: string
      user: {
        id: string
        name: string
        email: string
      }
    }>>('/api/auth/login', credentials)
    
    if (response.code === 200) {
      // 保存token到localStorage
      localStorage.setItem('token', response.data.data.token)
      return response.data.data
    } else {
      throw new Error(response.msg || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

// ================================
// 3. PUT/PATCH 请求示例
// ================================

/**
 * 更新用户信息
 */
export async function updateUserInfo(userId: string, userData: {
  name?: string
  email?: string
  avatar?: string
}) {
  try {
    const response = await http.put<ApiResponse<{
      id: string
      name: string
      email: string
      avatar: string
    }>>(`/api/users/${userId}`, userData, {
      showLoading: true
    })
    
    return response.data
  } catch (error) {
    console.error('更新用户信息失败:', error)
    throw error
  }
}

/**
 * 部分更新消息状态
 */
export async function updateMessageStatus(messageId: string, status: number) {
  try {
    const response = await http.patch<ApiResponse<any>>(
      `/api/messages/${messageId}/status`, 
      { status }
    )
    
    return response.data
  } catch (error) {
    console.error('更新消息状态失败:', error)
    throw error
  }
}

// ================================
// 4. DELETE 请求示例
// ================================

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string) {
  try {
    const response = await http.delete<ApiResponse<any>>(`/api/messages/${messageId}`, {
      showLoading: true
    })
    
    if (response.code === 200) {
      console.log('消息删除成功')
      return true
    } else {
      throw new Error(response.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    throw error
  }
}

// ================================
// 5. 文件上传示例
// ================================

/**
 * 上传头像
 */
export async function uploadAvatar(file: File) {
  try {
    const response = await http.upload<ApiResponse<{
      url: string
      filename: string
      size: number
    }>>('/api/upload/avatar', file, {
      showLoading: true,
      // 可以监听上传进度
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
        console.log(`上传进度: ${progress}%`)
      }
    })
    
    return response.data
  } catch (error) {
    console.error('上传头像失败:', error)
    throw error
  }
}

/**
 * 批量上传文件
 */
export async function uploadMultipleFiles(files: File[]) {
  try {
    const uploadPromises = files.map(file => 
      http.upload<ApiResponse<{ url: string }>>('/api/upload/files', file)
    )
    
    const responses = await Promise.all(uploadPromises)
    return responses.map(res => res.data)
  } catch (error) {
    console.error('批量上传失败:', error)
    throw error
  }
}

// ================================
// 6. 文件下载示例
// ================================

/**
 * 下载文件
 */
export async function downloadFile(fileId: string, filename: string) {
  try {
    await http.download(`/api/files/${fileId}/download`, filename)
    console.log('文件下载成功')
  } catch (error) {
    console.error('文件下载失败:', error)
    throw error
  }
}

// ================================
// 7. 错误处理示例
// ================================

/**
 * 带完整错误处理的API调用
 */
export async function withdrawMessage(messageId: string, targetId: number) {
  try {
    const response = await http.post<ApiResponse<any>>('/api/messages/withdraw', {
      message_id: messageId,
      target_id: targetId
    }, {
      showLoading: true
    })
    
    // 处理业务层面的错误
    if (response.code !== 200) {
      let errorMessage = '撤回失败'
      
      switch (response.code) {
        case 400:
          errorMessage = response.msg || '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          break
        case 403:
          errorMessage = '消息发送时间超过2分钟，无法撤回'
          break
        case 404:
          errorMessage = '消息不存在或已被删除'
          break
        case 500:
          errorMessage = response.msg || '服务器内部错误，请稍后重试'
          console.error('服务器错误详情:', {
            code: response.code,
            message: response.msg,
            messageId,
            targetId,
            timestamp: new Date().toISOString()
          })
          break
        default:
          errorMessage = response.msg || `撤回失败 (错误码: ${response.code})`
      }
      
      throw new Error(errorMessage)
    }
    
    console.log('消息撤回成功')
    return response.data
    
  } catch (error) {
    // 处理网络层面的错误
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('请求超时，请稍后重试')
      } else if (error.message.includes('Network Error')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
    
    console.error('撤回消息失败:', error)
    throw error
  }
}

// ================================
// 8. 在Vue组件中的使用示例
// ================================

/*
// 在Vue组件中使用
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserInfo, sendMessage, uploadAvatar } from '@/utils/http.example'

const userInfo = ref(null)
const loading = ref(false)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    loading.value = true
    const data = await getUserInfo('123')
    userInfo.value = data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 显示错误提示
  } finally {
    loading.value = false
  }
}

// 发送消息
const handleSendMessage = async (content: string) => {
  try {
    const result = await sendMessage({
      target_id: 2,
      message_content: content,
      message_content_type: 0
    })
    console.log('消息发送成功:', result)
  } catch (error) {
    console.error('发送失败:', error)
  }
}

// 上传头像
const handleAvatarUpload = async (file: File) => {
  try {
    const result = await uploadAvatar(file)
    console.log('头像上传成功:', result.url)
  } catch (error) {
    console.error('上传失败:', error)
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>
*/

// ================================
// 9. 请求取消示例
// ================================

/**
 * 可取消的请求
 */
export async function searchUsers(keyword: string, signal?: AbortSignal) {
  try {
    const response = await http.get<ApiResponse<Array<{
      id: string
      name: string
      avatar: string
    }>>>('/api/users/search', {
      params: { keyword },
      signal // 传入取消信号
    })
    
    return response.data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('搜索请求已取消')
      return []
    }
    throw error
  }
}

// 使用取消功能
/*
const controller = new AbortController()

// 发起请求
searchUsers('张三', controller.signal)
  .then(results => console.log('搜索结果:', results))
  .catch(error => console.error('搜索失败:', error))

// 3秒后取消请求
setTimeout(() => {
  controller.abort()
}, 3000)
*/

// ================================
// 10. 批量请求示例
// ================================

/**
 * 批量获取用户信息
 */
export async function getBatchUserInfo(userIds: string[]) {
  try {
    const requests = userIds.map(id => getUserInfo(id))
    const results = await Promise.allSettled(requests)
    
    const successResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
    
    const failedResults = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)
    
    console.log('成功获取:', successResults.length, '失败:', failedResults.length)
    return successResults
  } catch (error) {
    console.error('批量获取用户信息失败:', error)
    throw error
  }
}
