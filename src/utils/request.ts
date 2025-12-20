import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { getUserToken, clearUserStorage } from './storage'

/**
 * 请求响应数据结构
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 创建 axios 实例
 * @param baseURL 基础 URL
 * @returns axios 实例
 */
function createAxiosInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 30000, // 30秒超时
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器：添加 token
  instance.interceptors.request.use(
    (config) => {
      const token = getUserToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      console.error('Request error:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器：统一处理响应和错误
  instance.interceptors.response.use(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (response: AxiosResponse<any>) => {
      const res = response.data

      // 如果后端返回的数据有 code 字段，按业务状态码处理
      if (res && typeof res === 'object' && 'code' in res) {
        // 根据后端返回的 code 判断请求是否成功
        // code === 200 或 0 表示成功
        if (res.code === 200 || res.code === 0) {
          return res
        } else {
          // 业务错误：显示错误信息
          ElMessage.error(res.message || '请求失败')
          return Promise.reject(new Error(res.message || '请求失败'))
        }
      }

      // 如果后端返回的数据有 success 字段，按 success 字段处理
      if (res && typeof res === 'object' && 'success' in res) {
        if (res.success === true) {
          // 成功：返回统一格式 { code: 200, message: "...", data: [...] }
          return {
            code: 200,
            message: res.message || 'success',
            data: res.data
          }
        } else {
          // 失败：显示错误信息
          ElMessage.error(res.message || '请求失败')
          return Promise.reject(new Error(res.message || '请求失败'))
        }
      }

      // 如果后端直接返回数据（没有 code 或 success 字段），直接返回
      // 这种情况通常表示请求成功
      return { code: 200, message: 'success', data: res }
    },
    (error) => {
      // HTTP 错误处理
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || error.message

        switch (status) {
          case 400:
            // 400错误：请求参数错误，显示详细错误信息
            const errorData = error.response.data
            const errorDetails = errorData?.detail || errorData?.errors || errorData?.message || message
            console.error('400 错误详情:', {
              status: error.response.status,
              data: errorData,
              url: error.config?.url,
              method: error.config?.method,
              requestData: error.config?.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : null
            })
            ElMessage.error(`请求参数错误: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails}`)
            break
          case 401:
            // 未授权：清除 token 并跳转到登录页
            ElMessage.error('登录已过期，请重新登录')
            clearUserStorage()
            window.location.href = '/login'
            break
          case 403:
            ElMessage.error('没有权限访问')
            break
          case 404:
            // 404错误：检查后端是否返回了具体的错误消息
            const notFoundData = error.response.data
            const notFoundMessage = notFoundData?.message || notFoundData?.detail || '请求的资源不存在'
            console.error('404 错误详情:', {
              status: error.response.status,
              data: notFoundData,
              url: error.config?.url,
              method: error.config?.method,
              requestData: error.config?.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : null
            })
            // 不在这里显示错误消息，让调用方处理（因为可能需要在特定位置显示）
            // ElMessage.error(notFoundMessage)
            break
          case 500:
            // 服务器内部错误，显示更详细的错误信息
            const errorDetail = error.response.data?.detail || error.response.data?.message || '服务器内部错误，请查看控制台获取详细信息'
            ElMessage.error(`服务器错误: ${errorDetail}`)
            console.error('500 错误详情:', {
              status: error.response.status,
              data: error.response.data,
              url: error.config?.url,
              method: error.config?.method,
              params: error.config?.data
            })
            break
          default:
            ElMessage.error(message || `请求失败 (${status})`)
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        ElMessage.error('网络错误，请检查网络连接')
      } else {
        // 其他错误
        ElMessage.error(error.message || '请求失败')
      }

      return Promise.reject(error)
    }
  )

  return instance
}

// 默认实例（可根据环境变量配置 baseURL）
// 开发环境和生产环境都直接使用完整 URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://c369ec45.natappfree.cc'
export const request = createAxiosInstance(baseURL)

/**
 * 通用请求方法
 * @param config 请求配置
 * @returns Promise<ApiResponse<T>>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiRequest<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request(config) as Promise<ApiResponse<T>>
}

/**
 * GET 请求
 * @param url 请求地址
 * @param params 请求参数
 * @param config 额外配置
 * @returns Promise<ApiResponse<T>>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get<T = any>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request.get<ApiResponse<T>>(url, { params, ...config }).then((res) => res.data)
}

/**
 * POST 请求
 * @param url 请求地址
 * @param data 请求数据
 * @param config 额外配置
 * @returns Promise<ApiResponse<T>>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function post<T = any>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  // 响应拦截器已经返回了处理后的数据，直接返回
  return request.post<ApiResponse<T>>(url, data, config).then((res) => res)
}

/**
 * PUT 请求
 * @param url 请求地址
 * @param data 请求数据
 * @param config 额外配置
 * @returns Promise<ApiResponse<T>>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function put<T = any>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request.put<ApiResponse<T>>(url, data, config).then((res) => res.data)
}

/**
 * DELETE 请求
 * @param url 请求地址
 * @param config 额外配置
 * @returns Promise<ApiResponse<T>>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request.delete<ApiResponse<T>>(url, config).then((res) => res.data)
}

/**
 * 文件上传请求
 * @param url 请求地址
 * @param file 文件对象（File 或 Blob）
 * @param config 额外配置
 * @returns Promise<ApiResponse<T>>
 * @description 文件上传接口可能返回 { success: true, data: { file_url } } 格式，需要特殊处理
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function uploadFile<T = any>(
  url: string,
  file: File | Blob,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const formData = new FormData()
  formData.append('file', file)

  return request.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then((res) => {
    // 文件上传接口可能返回 { success: true, data: { file_url } } 格式
    // 响应拦截器会将没有 code 字段的响应包装为 { code: 200, data: 原始响应 }
    // 所以这里需要检查 data 中是否包含 success 字段
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = res as any

    // 如果响应拦截器已经包装了，data 字段会包含原始响应
    if (responseData.data && typeof responseData.data === 'object' && 'success' in responseData.data) {
      // 提取原始响应中的 data 字段
      const originalData = responseData.data
      return {
        code: originalData.success ? 200 : 400,
        message: originalData.message || (originalData.success ? 'success' : 'failed'),
        data: originalData.data
      } as ApiResponse<T>
    }

    // 如果响应中直接有 success 字段（响应拦截器未处理的情况）
    if (responseData.success !== undefined && !('code' in responseData)) {
      return {
        code: responseData.success ? 200 : 400,
        message: responseData.message || (responseData.success ? 'success' : 'failed'),
        data: responseData.data
      } as ApiResponse<T>
    }

    return res
  })
}

