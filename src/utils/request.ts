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
        // 调试：打印请求信息（仅开发环境）
        if (import.meta.env.DEV) {
          // 只显示相对路径，不显示完整 URL
          const urlPath = config.url?.replace(/^https?:\/\/[^/]+/, '') || config.url
          console.log('[Request] 请求路径:', urlPath)
          console.log('[Request] 请求方法:', config.method)
          console.log('[Request] Token 已添加:', token ? `${token.substring(0, 20)}...` : '无')
          console.log('[Request] Authorization Header:', config.headers.Authorization ? `${config.headers.Authorization.substring(0, 30)}...` : '无')
        }
      } else {
        console.warn('[Request] 未找到 token，请求可能失败:', config.url)
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
          // 成功：返回整个响应对象，保留所有字段（users, total, page 等）
          return res
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
      return Promise.reject(error)
    }
  )

  return instance
}

// 默认实例（可根据环境变量配置 baseURL）
// 开发环境：强制使用空字符串，让请求通过 Vite 代理（避免 CORS 问题）
// 生产环境：使用环境变量或默认完整 URL
const baseURL = import.meta.env.DEV
  ? '' // 开发环境使用相对路径，通过 Vite 代理
  : (import.meta.env.VITE_API_BASE_URL || 'http://a8c69486.natappfree.cc') // 生产环境使用完整 URL
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
  // 响应拦截器已经返回了处理后的数据，直接返回（不再提取 .data）
  return request.get<ApiResponse<T>>(url, { params, ...config }).then((res) => res)
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

