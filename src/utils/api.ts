import http, { ssoHttp } from './http'

// SSO认证相关接口
export const ssoApi = {
  // SSO登录
  login: (data: { account: string; password: string }) => {
    return ssoHttp.post('/sso-module/api/sso/login', data)
  },

  // SSO注册（如果有的话）
  register: (data: { account: string; password: string; confirmPassword?: string }) => {
    return ssoHttp.post('/sso-module/api/sso/register', data)
  },

  // SSO登出
  logout: () => {
    return ssoHttp.post('/sso-module/api/sso/logout')
  },

  // 刷新token
  refreshToken: (refreshToken: string) => {
    return ssoHttp.post('/sso-module/api/sso/refresh', { refreshToken })
  },

  // 验证token
  validateToken: (token: string) => {
    return ssoHttp.post('/sso-module/api/sso/validate', { token })
  }
}

// 消息模块相关接口
export const messageApi = {
  // 获取会话列表
  getConversationList: () => {
    return http.get('/message-module/api/conversation/list')
  },

  // 拉取消息
  getMessages: (targetId: string | number) => {
    return http.get(`/message-module/api/message/0/loadMessage/WEB/${targetId}`)
  },

  // 发送消息
  sendMessage: (conversationType: number, data: {}) => {
    return http.post(`/message-module/api/message/${conversationType}/send`, data)
  },

  // 撤回消息
  withdrawMessage: (conversationType: number, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/withdraw`, data)
  },

  // 消息已读
  readMessage: (conversationType: number, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/read`, data)
  },

  // 删除消息
  deleteMessage: (conversationType: number, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/remove`, data)
  },

  // 回复消息
  replyMessage: (conversationType: number, messageId: string, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/reply/${messageId}`, data)
  },

  // 收藏消息
  collectMessage: (conversationType: number, messageId: string, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/collect/${messageId}`, data)
  },

  // 转发消息
  forwardMessage: (conversationType: number, messageId: string, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/forward/${messageId}`, data)
  },

  // 点赞消息
  likeMessage: (conversationType: number,messageId: string, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/like/${messageId}`, data)
  },

  // 取消点赞消息
  unlikeMessage: (conversationType: number, messageId: string, data: {}) =>{
    return http.post(`/message-module/api/message/${conversationType}/unlike/${messageId}`, data)
  }
}

// 好友模块相关接口
export const friendApi = {
  // 获取好友详情
  getFriendDetailInfo: (friendId: string | number) => {
    return http.get(`/friend-module/api/friend/${friendId}`)
  },
  // 获取好友列表
  getFriendList: () => {
    return http.get('/friend-module/api/friend/list')
  }
}

// 导出所有 API
export default {
  sso: ssoApi,
  message: messageApi,
  friend: friendApi
}
