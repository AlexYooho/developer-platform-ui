import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
}

// 扩展 axios 请求配置类型
declare module 'axios' {
  interface AxiosRequestConfig {
    showLoading?: boolean
    showError?: boolean
  }
}

class HttpClient {
  private instance: AxiosInstance
  private loading: boolean = false

  constructor(baseURL?: string) {
    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:9009',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 设置请求拦截器
    this.setupRequestInterceptors()
    // 设置响应拦截器
    this.setupResponseInterceptors()
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        // 显示加载状态
        if (config.showLoading !== false) {
          this.showLoading()
        }

        // 添加认证 token
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          }
        }

        console.log('🚀 请求发送:', config)
        return config
      },
      (error) => {
        this.hideLoading()
        console.error('❌ 请求错误:', error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        this.hideLoading()
        console.log('✅ 响应成功:', response)

        const { data } = response
        
        // 根据业务状态码处理
        if (data.code === 200 || data.code === 0) {
          return response
        } else if (data.code === 401) {
          // 未授权，清除 token 并跳转登录
          this.handleUnauthorized()
          return Promise.reject(new Error(data.message || '未授权'))
        } else {
          // 其他业务错误
          const error = new Error(data.message || '请求失败')
          this.handleError(error, response.config)
          return Promise.reject(error)
        }
      },
      (error: AxiosError) => {
        this.hideLoading()
        console.error('❌ 响应错误:', error)

        let message = '网络错误'
        
        if (error.response) {
          // 服务器响应错误
          const status = error.response.status
          switch (status) {
            case 400:
              message = '请求参数错误'
              break
            case 401:
              message = '未授权，请重新登录'
              this.handleUnauthorized()
              break
            case 403:
              message = '拒绝访问'
              break
            case 404:
              message = '请求地址不存在'
              break
            case 500:
              message = '服务器内部错误'
              break
            case 502:
              message = '网关错误'
              break
            case 503:
              message = '服务不可用'
              break
            default:
              message = `请求失败 (${status})`
          }
        } else if (error.request) {
          // 请求发送失败
          message = '网络连接失败'
        }

        const customError = new Error(message)
        this.handleError(customError, error.config)
        return Promise.reject(customError)
      }
    )
  }

  /**
   * 获取认证 token
   */
  private getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  /**
   * 处理未授权
   */
  private handleUnauthorized(): void {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    // 这里可以添加跳转到登录页的逻辑
    // window.location.href = '/login'
  }

  /**
   * 显示加载状态
   */
  private showLoading(): void {
    if (!this.loading) {
      this.loading = true
      // 这里可以显示全局 loading 组件
      console.log('🔄 加载中...')
    }
  }

  /**
   * 隐藏加载状态
   */
  private hideLoading(): void {
    if (this.loading) {
      this.loading = false
      // 这里可以隐藏全局 loading 组件
      console.log('✨ 加载完成')
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error, config?: AxiosRequestConfig): void {
    if (config?.showError !== false) {
      // 这里可以显示错误提示
      console.error('💥 错误提示:', error.message)
      // 可以集成 Element Plus 的 Message 组件
      // ElMessage.error(error.message)
    }
  }

  /**
   * GET 请求
   */
  public async get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, {
      params,
      ...config
    })
    return response.data
  }

  /**
   * POST 请求
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  /**
   * PUT 请求
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  /**
   * DELETE 请求
   */
  public async delete<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, {
      params,
      ...config
    })
    return response.data
  }

  /**
   * PATCH 请求
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config)
    return response.data
  }

  /**
   * 上传文件
   */
  public async upload<T = any>(
    url: string,
    file: File | FormData,
    config?: RequestConfig & {
      onUploadProgress?: (progressEvent: any) => void
    }
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
    return response.data
  }

  /**
   * 下载文件
   */
  public download(
    url: string,
    params?: any,
    filename?: string
  ): Promise<void> {
    return this.instance.get(url, {
      params,
      responseType: 'blob'
    }).then((response) => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }

  /**
   * 取消请求
   */
  public cancelRequest(message?: string): void {
    // 可以实现请求取消逻辑
    console.log('🚫 取消请求:', message)
  }
}

// 创建默认实例
const http = new HttpClient()

// 创建SSO专用实例
const ssoHttp = new HttpClient(
  import.meta.env.VITE_SSO_BASE_URL || 'http://127.0.0.1:9009'
)

// 导出实例和类
export { HttpClient, ssoHttp }
export default http
