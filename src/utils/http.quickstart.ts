/**
 * HTTP客户端快速上手示例
 * 最简单的使用方式
 */

import http from './http'

// ================================
// 1. 最简单的GET请求
// ================================
async function simpleGet() {
  const response = await http.get('/api/users/123')
  console.log(response.data)
}

// ================================
// 2. 最简单的POST请求
// ================================
async function simplePost() {
  const response = await http.post('/api/messages/send', {
    content: 'Hello World',
    target_id: 2
  })
  console.log(response.data)
}

// ================================
// 3. 带错误处理的请求
// ================================
async function requestWithErrorHandling() {
  try {
    const response = await http.post('/api/messages/withdraw', {
      message_id: '123',
      target_id: 2
    })
    
    // 检查业务状态码
    if (response.code === 200) {
      console.log('操作成功')
    } else {
      console.error('操作失败:', response.msg)
    }
  } catch (error) {
    console.error('网络错误:', error)
  }
}

// ================================
// 4. 您当前的撤回消息场景
// ================================
async function withdrawMessageExample(messageId: string, targetId: number, type: number) {
  try {
    // 发起请求
    const response = await http.post(`/api/messages/withdraw/${type}`, {
      message_id: messageId,
      target_id: targetId
    })
    
    // 处理响应
    if (response.code === 200) {
      console.log('撤回成功')
      return true
    } else {
      // 处理业务错误（如 code: 500）
      console.error('撤回失败:', response.msg)
      alert(response.msg || '撤回失败')
      return false
    }
  } catch (error) {
    // 处理网络错误
    console.error('网络错误:', error)
    alert('网络错误，请稍后重试')
    return false
  }
}

// ================================
// 5. 在Vue组件中的使用
// ================================
/*
// 直接在您的 ChatMain.vue 中使用：

const recallMessage = async (message: Message) => {
  try {
    const response = await http.post(`/api/messages/withdraw/${props.activeContact!.type}`, {
      message_id: message.id,
      target_id: props.activeContact?.target_id,
    })
    
    if (response.code === 200) {
      // 成功
      message.isRecalled = true
      message.messageContent = '你撤回了一条消息'
    } else {
      // 业务错误（如 code: 500）
      alert(response.msg || '撤回失败')
    }
  } catch (error) {
    // 网络错误
    console.error('撤回失败:', error)
    alert('网络错误，请稍后重试')
  }
}
*/

export {
  simpleGet,
  simplePost,
  requestWithErrorHandling,
  withdrawMessageExample
}
