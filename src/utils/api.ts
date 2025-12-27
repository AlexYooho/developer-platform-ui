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

  // 获取会话消息
  getMessages: (targetId: string | number) => {
    return http.get(`/message-module/api/message/PRIVATE_MESSAGE/loadMessage/WEB/${targetId}`)
  }
}

// 导出所有 API
export default {
  sso: ssoApi,
  message: messageApi
}
