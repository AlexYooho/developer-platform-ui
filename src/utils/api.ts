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

// 导出所有 API
export default {
  sso: ssoApi
}
