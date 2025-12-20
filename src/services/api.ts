import { post, get, put, del, uploadFile as uploadFileRequest, request } from '@/utils/request'
import { ElMessage } from 'element-plus'
import type { UserRole, OperationLog, AuditRecord, Registration, RegistrationStatus } from '@/types'

/**
 * 登录请求参数
 */
export interface LoginParams {
  account: string
  password: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  userId: string
  role: UserRole
  token: string
  refreshToken?: string
  name?: string
  phone?: string
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordParams {
  oldPwd: string
  newPwd: string
  confirmPwd: string
  name: string
  phone: string
}

/**
 * 审核请求参数
 */
export interface ReviewParams {
  id: string
  reviewerId: string
  reviewerName: string
  comment?: string
}

/**
 * API 基础路径配置
 */
const API_BASE = '/api'
const FILE_BASE_URL = (import.meta.env.VITE_FILE_BASE_URL as string | undefined) || 'http://c369ec45.natappfree.cc'

/**
 * 将后端返回的角色映射为前端角色类型
 * @param backendRole 后端返回的角色
 * @returns 前端角色类型
 */
function mapBackendRoleToFrontendRole(backendRole: string): UserRole {
  // 后端角色映射：reviewer -> approval, logger -> logaudit
  if (backendRole === 'reviewer') {
    return 'approval'
  } else if (backendRole === 'logger') {
    return 'logaudit'
  } else if (backendRole === 'admin' || backendRole === 'user') {
    return backendRole as UserRole
  }
  // 如果角色不匹配，默认返回用户角色
  return 'user'
}

/**
 * 认证相关接口
 */
export const authApi = {
  /**
   * 用户登录
   * @param account 账号
   * @param password 密码
   * @returns 登录结果，包含用户ID、角色和令牌
   */
  login: async (account: string, password: string): Promise<LoginResponse | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/login/`, {
        account,
        password
      })

      // 后端返回格式：
      // {
      //   "code": 200,
      //   "message": "登录成功",
      //   "is_locked": false,
      //   "remaining_attempts": 5,
      //   "access_token": "...",
      //   "refresh": "...",
      //   "role": "admin"
      // }

      if (!response) {
        return null
      }

      // 类型断言：后端返回的数据结构
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loginData = response as any

      // 检查 code 是否为 200（登录成功）
      if (loginData.code === 200) {
        // 检查是否有 access_token
        const accessToken = loginData.access_token || loginData.accessToken || loginData.token
        if (!accessToken) {
          return null
        }

        // 检查是否有 role（后端必须返回角色）
        if (!loginData.role) {
          console.error('登录失败：后端未返回角色信息')
          return null
        }

        // 获取 refresh token
        const refreshToken = loginData.refresh || loginData.refreshToken || loginData.refresh_token

        // 将后端角色映射为前端角色类型
        const userRole = mapBackendRoleToFrontendRole(loginData.role)

        // 构建登录结果
        const result: LoginResponse = {
          userId: account, // 使用账号作为 userId
          role: userRole,
          token: accessToken,
          refreshToken: refreshToken,
          name: loginData.name || loginData.username || '',
          phone: loginData.phone || loginData.telephone || ''
        }

        return result
      } else {
        // code 不是 200，登录失败
        return null
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      return null
    }
  },

  /**
   * 修改密码
   * @param userId 用户ID（不需要传入，从 token 中获取）
   * @param params 修改密码参数
   * @returns 是否修改成功
   */
  changePassword: async (userId: string, params: ChangePasswordParams): Promise<boolean> => {
    try {
      // 构建请求数据，使用后端要求的字段名
      const requestData = {
        old_password: params.oldPwd,
        new_password: params.newPwd,
        modifier_name: params.name, // 注意：字段名是 modifier_name，不是 name
        modifier_contact: params.phone // 注意：字段名是 modifier_contact，不是 phone
      }
      console.log('[changePassword] 提交数据:', JSON.stringify(requestData, null, 2))

      // 使用 POST 方法，接口路径：/api/change-password/
      // 注意：不需要传入 user_id，用户ID从 token 中获取
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/change-password/`, requestData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[changePassword] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Change password error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 登出
   * @param refreshToken 刷新令牌（从登录时获取）
   * @returns 是否登出成功
   */
  logout: async (refreshToken?: string): Promise<boolean> => {
    try {
      if (!refreshToken) {
        console.warn('[logout] 未提供 refresh token，尝试从 localStorage 获取')
        const { getRefreshToken } = await import('@/utils/storage')
        const storedToken = getRefreshToken()
        refreshToken = storedToken || undefined
      }

      if (!refreshToken) {
        console.warn('[logout] 未找到 refresh token，直接返回成功')
        return true
      }

      console.log('[logout] 提交数据:', JSON.stringify({ refresh: refreshToken }, null, 2))
      // 使用 POST 方法，接口路径：/api/logout/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/logout/`, {
        refresh: refreshToken
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[logout] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Logout error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      // 即使接口调用失败，也返回 true，确保前端可以正常登出
      return true
    }
  }
}

/**
 * 文件上传响应数据
 */
export interface UploadFileResponse {
  success: boolean
  message: string
  data: {
    file_name: string
    original_name: string
    file_url: string
  }
}

/**
 * 文件上传接口
 */
export const uploadApi = {
  /**
   * 上传文件（通用接口）
   * @param file 文件对象
   * @param category 类别（vocal, instrumental, dance, opera, recitation 等）
   * @returns 上传结果，包含文件URL
   */
  uploadFile: async (file: File | Blob, category: string = 'vocal'): Promise<string | null> => {
    const requestUpload = async (targetUrl: string): Promise<string | null> => {
      console.log('[uploadFile] 上传文件:', {
        fileName: file instanceof File ? file.name : 'Blob',
        fileSize: file.size,
        category,
        uploadUrl: targetUrl
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await uploadFileRequest<any>(targetUrl, file)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      console.log('[uploadFile] ========== 上传接口响应 ==========')
      console.log('[uploadFile] 原始响应对象:', response)
      console.log('[uploadFile] 响应数据结构:', {
        code: result.code,
        message: result.message,
        data: result.data
      })
      console.log('[uploadFile] 完整响应JSON:', JSON.stringify(result, null, 2))

      const responseData = result.data || {}
      let fileUrl = responseData.file_url || responseData.url

      if (!fileUrl && responseData.filename) {
        const normalizedBase = FILE_BASE_URL.endsWith('/')
          ? FILE_BASE_URL.slice(0, -1)
          : FILE_BASE_URL
        fileUrl = `${normalizedBase}/${responseData.filename}`
        console.warn('[uploadFile] 响应缺少 file_url，已根据 filename 构造 URL:', fileUrl)
      }

      if (result.code === 200 && fileUrl) {
        console.log('[uploadFile] ✅ 上传成功')
        console.log('[uploadFile] 文件URL:', fileUrl)
        const fileName = file instanceof File ? file.name : 'unknown'
        console.log('[uploadFile] 模拟后端响应格式:', {
          success: true,
          message: '文件上传成功',
          data: {
            file_name: responseData.file_name || fileName,
            original_name: responseData.original_name || fileName,
            file_url: fileUrl
          }
        })
        console.log('[uploadFile] ================================')
        return fileUrl
      } else if (fileUrl) {
        console.log('[uploadFile] ✅ 上传成功（兼容格式）')
        console.log('[uploadFile] 文件URL:', fileUrl)
        console.log('[uploadFile] ================================')
        return fileUrl
      }

      console.error('[uploadFile] ❌ 上传响应格式异常')
      console.error('[uploadFile] 响应数据:', result)
      console.error('[uploadFile] ================================')
      ElMessage.error('文件上传失败：响应格式异常，未找到 file_url')
      return null
    }

    // 统一使用 /api/vocal/upload/ 作为所有类别的上传接口
    const uploadUrl = `${API_BASE}/vocal/upload/`

    try {
      const result = await requestUpload(uploadUrl)
      if (result) {
        return result
      }
      ElMessage.error('文件上传失败：服务器未返回有效URL')
      return null
    } catch (error: unknown) {
      console.error('[uploadFile] 上传失败:', error)
      // 错误已经在 requestUpload 中处理并显示，这里只需要返回 null
      return null
    }
  }
}

/**
 * 报名相关接口
 */
export const registrationApi = {
  /**
   * 获取所有报名记录
   * @param status 审核状态（可选）
   * @returns 报名记录列表
   */
  getRegistrations: async (status?: RegistrationStatus): Promise<Registration[]> => {
    try {
      const params = status ? { status } : {}
      const response = await get<Registration[]>(`${API_BASE}/registrations/`, params)
      return response.data || []
    } catch (error) {
      console.error('Get registrations error:', error)
      return []
    }
  },

  /**
   * 获取待审核报名记录
   * @returns 待审核报名记录列表
   */
  getPendingRegistrations: async (): Promise<Registration[]> => {
    return registrationApi.getRegistrations('pending')
  },

  /**
   * 提交报名（通用接口）
   * @param data 报名数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitRegistration: async (data: any): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/registrations/submit/`, data)
      return response.data?.success || false
    } catch (error) {
      console.error('Submit registration error:', error)
      return false
    }
  },

  /**
   * 提交器乐报名
   * @param data 器乐报名数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitInstrumental: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitInstrumental] 提交数据:', JSON.stringify(data, null, 2))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/instrumental/registrations/`, data)
      // 类型断言：后端返回格式可能是 { code: 200, ... } 或 { success: true, ... }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit instrumental registration error:', error)
      // 详细错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交舞蹈报名
   * @param data 舞蹈报名数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitDance: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitDance] 提交数据:', JSON.stringify(data, null, 2))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/dance/registrations/`, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit dance registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交书法作品报名
   * @param data 书法表单数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitCalligraphy: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitCalligraphy] 提交数据:', JSON.stringify(data, null, 2))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/calligraphy/calligraphy-registrations/`, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit calligraphy registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交戏曲报名
   * @param data 戏曲报名数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitOpera: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitOpera] 提交数据:', JSON.stringify(data, null, 2))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/opera/registrations/`, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit opera registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交绘画作品报名
   * @param data 绘画表单数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitPainting: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitPainting] 提交数据:', JSON.stringify(data, null, 2))
      // 注意：绘画接口路径是 /painting/api/registrations/，不是 /api/painting/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>('/painting/api/registrations/', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit painting registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交声乐报名
   * @param data 声乐报名数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitVocal: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitVocal] 提交数据:', JSON.stringify(data, null, 2))
      // 注意：声乐接口路径是 /api/vocal/api/registrations/（有两个api）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/vocal/api/registrations/`, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit vocal registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交设计作品报名
   * @param data 设计作品表单数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitDesign: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitDesign] 提交数据:', JSON.stringify(data, null, 2))
      // 注意：设计接口路径是 /design/api/registrations/，不是 /api/design/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>('/design/api/registrations/', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit design registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交摄影作品报名
   * @param data 摄影作品表单数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitPhotography: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitPhotography] 提交数据:', JSON.stringify(data, null, 2))
      // 注意：摄影接口路径是 /photography/api/photography-registrations/，不是 /api/photography/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>('/photography/api/photography-registrations/', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit photography registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 提交微电影作品报名
   * @param data 微电影作品表单数据
   * @returns 是否提交成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitMicrofilm: async (data: any): Promise<boolean> => {
    try {
      console.log('[submitMicrofilm] 提交数据:', JSON.stringify(data, null, 2))
      // 注意：微电影接口路径是 /micro-film/api/registrations/，不是 /api/micro-film/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>('/micro-film/api/registrations/', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      if (result.code === 200 || result.success === true) {
        return true
      }
      return false
    } catch (error: unknown) {
      console.error('Submit microfilm registration error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
        console.error('错误请求数据:', axiosError.config?.data)
      }
      return false
    }
  },

  /**
   * 审核通过
   * @param params 审核参数
   * @returns 是否审核成功
   */
  approve: async (params: ReviewParams): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/registrations/approve/`, params)
      return response.data?.success || false
    } catch (error) {
      console.error('Approve error:', error)
      return false
    }
  },

  /**
   * 审核驳回
   * @param params 审核参数（必须包含 comment）
   * @returns 是否审核成功
   */
  reject: async (params: ReviewParams & { comment: string }): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/registrations/reject/`, params)
      return response.data?.success || false
    } catch (error) {
      console.error('Reject error:', error)
      return false
    }
  },

  /**
   * 获取报名统计
   * @param regionFilter 地区筛选（可选）
   * @returns 统计信息
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStats: async (regionFilter?: string): Promise<any> => {
    try {
      console.log('[getStats] 请求报名统计数据', regionFilter ? `地区: ${regionFilter}` : '')
      const params = regionFilter ? { region: regionFilter } : {}
      // 接口路径：/api/registrations/stats/
      // 直接使用 axios 获取原始响应，确保能正确解析数据
      const axios = (await import('axios')).default
      const { getUserToken } = await import('@/utils/storage')
      try {
        const token = getUserToken()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse = await axios.get(`${API_BASE}/registrations/stats/`, {
          params,
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        })
        console.log('[getStats] 原始响应数据:', rawResponse.data)
        console.log('[getStats] 原始响应数据类型:', typeof rawResponse.data)

        // 处理原始响应数据
        let statsData: any = null

        // 如果后端返回的是对象，检查 data 字段
        if (rawResponse.data && typeof rawResponse.data === 'object') {
          // 检查是否有 success 字段和 data 字段
          if (rawResponse.data.success === true && rawResponse.data.data && typeof rawResponse.data.data === 'object') {
            statsData = rawResponse.data.data
            console.log('[getStats] ✅ 从 rawResponse.data.data 提取统计数据（success格式）')
            console.log('[getStats] 统计数据内容:', statsData)
            return statsData
          }

          // 如果 data 字段直接包含统计字段
          if (rawResponse.data.data && typeof rawResponse.data.data === 'object' && ('total_count' in rawResponse.data.data || 'approved_count' in rawResponse.data.data)) {
            statsData = rawResponse.data.data
            console.log('[getStats] ✅ 从 rawResponse.data.data 提取统计数据')
            console.log('[getStats] 统计数据内容:', statsData)
            return statsData
          }

          // 如果原始响应本身包含统计字段
          if ('total_count' in rawResponse.data || 'approved_count' in rawResponse.data || 'rejected_count' in rawResponse.data || 'pending_count' in rawResponse.data) {
            statsData = rawResponse.data
            console.log('[getStats] ✅ rawResponse.data 本身就是统计数据对象')
            console.log('[getStats] 统计数据内容:', statsData)
            return statsData
          }

          console.log('[getStats] rawResponse.data 的 keys:', Object.keys(rawResponse.data))
        }

        console.warn('[getStats] 无法从原始响应中提取统计数据')
        return {}
      } catch (error) {
        console.error('[getStats] 直接请求失败，尝试使用 get 函数:', error)
        // 如果直接请求失败，回退到使用 get 函数
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await get<any>(`${API_BASE}/registrations/stats/`, params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = response as any
        console.log('[getStats] get函数返回的响应:', result)

        // 处理 get 函数返回的数据（响应拦截器处理后的格式）
        if (result && typeof result === 'object') {
          // 检查 result 本身是否就是统计数据对象
          if ('total_count' in result || 'approved_count' in result || 'rejected_count' in result || 'pending_count' in result) {
            console.log('[getStats] ✅ result 本身就是统计数据对象')
            return result
          }

          // 检查 result 是否有 code 字段和 data 字段
          if ('code' in result && result.data && typeof result.data === 'object') {
            if ('total_count' in result.data || 'approved_count' in result.data || 'rejected_count' in result.data || 'pending_count' in result.data) {
              console.log('[getStats] ✅ 从 result.data 提取统计数据（code格式）')
              return result.data
            }
          }

          // 检查 result.data 字段
          if (result.data && typeof result.data === 'object' && ('total_count' in result.data || 'approved_count' in result.data)) {
            console.log('[getStats] ✅ 从 result.data 提取统计数据')
            return result.data
          }
        }

        console.warn('[getStats] get函数返回的数据格式不符合预期')
        return {}
      }
    } catch (error: unknown) {
      console.error('Get stats error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return {}
    }
  },

  /**
   * 获取各大学报名状态统计
   * @returns 各大学统计数据列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUniversityStats: async (): Promise<any[]> => {
    try {
      console.log('[getUniversityStats] 请求各大学报名状态统计数据')
      // 接口路径：/api/registrations/admin/university-stats/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/registrations/admin/university-stats/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getUniversityStats] 响应数据:', JSON.stringify(result, null, 2))

      // 处理响应格式：{ success: true, message: "...", data: [...] }
      if (result && typeof result === 'object') {
        // 如果 result.data 是数组
        if (Array.isArray(result.data)) {
          console.log('[getUniversityStats] ✅ 从 result.data 提取数据，数量:', result.data.length)
          return result.data
        }

        // 如果 result.data.data 是数组（双重嵌套）
        if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
          console.log('[getUniversityStats] ✅ 从 result.data.data 提取数据，数量:', result.data.data.length)
          return result.data.data
        }

        // 如果 result.success === true && result.data 是数组
        if (result.success === true && Array.isArray(result.data)) {
          console.log('[getUniversityStats] ✅ 从 result.data 提取数据（success格式），数量:', result.data.length)
          return result.data
        }
      }

      // 如果 result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getUniversityStats] ✅ result 本身就是数组，数量:', result.length)
        return result
      }

      console.warn('[getUniversityStats] ❌ 响应格式不符合预期，返回空数组')
      return []
    } catch (error: unknown) {
      console.error('Get university stats error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  }
}

/**
 * 日志相关接口
 */
export const logApi = {
  /**
   * 获取操作日志列表
   * @param params 查询参数
   * @param params.month 月份（格式：YYYY-MM，如：2025-11）
   * @param params.user_type 用户类型（user, approval, admin, logaudit）
   * @returns 操作日志列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogs: async (params?: { month?: string; user_type?: string }): Promise<any[]> => {
    try {
      console.log('[getLogs] 请求操作日志列表:', params)

      // 构建查询参数
      const queryParams: Record<string, string> = {}
      if (params?.month) {
        queryParams.month = params.month
      }
      if (params?.user_type) {
        queryParams.user_type = params.user_type
      }

      // 构建查询字符串
      const queryString = new URLSearchParams(queryParams).toString()
      const url = queryString
        ? `${API_BASE}/logs/list/?${queryString}`
        : `${API_BASE}/logs/list/`

      // 直接使用 axios 获取原始响应，绕过响应拦截器，查看后端实际返回的数据
      const axios = (await import('axios')).default
      const { getUserToken } = await import('@/utils/storage')
      try {
        const token = getUserToken()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse = await axios.get(url, {
          params: queryParams,
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        })
        console.log('[getLogs] 原始响应数据:', rawResponse.data)
        console.log('[getLogs] 原始响应数据类型:', typeof rawResponse.data)
        console.log('[getLogs] 原始响应数据是否为数组:', Array.isArray(rawResponse.data))

        // 处理原始响应数据
        let logsData: any[] = []

        // 如果后端返回的是数组
        if (Array.isArray(rawResponse.data)) {
          logsData = rawResponse.data
          console.log('[getLogs] ✅ 后端直接返回数组，数量:', logsData.length)
          return logsData
        }

        // 如果后端返回的是对象
        if (rawResponse.data && typeof rawResponse.data === 'object') {
          // 检查是否有 data 字段
          if (Array.isArray(rawResponse.data.data)) {
            logsData = rawResponse.data.data
            console.log('[getLogs] ✅ 从 rawResponse.data.data 提取数组，数量:', logsData.length)
            return logsData
          }

          // 检查是否有 success 字段
          if (rawResponse.data.success === true && Array.isArray(rawResponse.data.data)) {
            logsData = rawResponse.data.data
            console.log('[getLogs] ✅ 从 rawResponse.data.data 提取数组（success格式），数量:', logsData.length)
            return logsData
          }

          // 检查其他可能的数组字段
          const possibleArrayFields = ['list', 'items', 'records', 'results', 'logs']
          for (const field of possibleArrayFields) {
            if (Array.isArray(rawResponse.data[field])) {
              logsData = rawResponse.data[field]
              console.log(`[getLogs] ✅ 从 rawResponse.data.${field} 提取数组，数量:`, logsData.length)
              return logsData
            }
          }

          console.log('[getLogs] rawResponse.data 的 keys:', Object.keys(rawResponse.data))
        }

        console.warn('[getLogs] 无法从原始响应中提取日志数组')
        return []
      } catch (error) {
        console.error('[getLogs] 直接请求失败，尝试使用 request:', error)
        // 如果直接请求失败，回退到使用 request
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosResponse = await request.get(url, { params: queryParams })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = axiosResponse as any
        console.log('[getLogs] request.get 响应:', result)

        // 处理响应拦截器处理后的数据
        if (result && typeof result === 'object' && 'code' in result) {
          if (result.data === undefined) {
            console.warn('[getLogs] result.data 是 undefined，可能是响应拦截器处理问题')
            return []
          }
        }

        // 继续原有的处理逻辑
        if (result && typeof result === 'object' && 'code' in result && result.data) {
          if (Array.isArray(result.data)) {
            return result.data
          }
        }

        return []
      }

      // 如果 result 是 undefined 或 null，直接返回空数组
      if (!result) {
        console.warn('[getLogs] result 是 undefined 或 null，返回空数组')
        return []
      }

      // 响应拦截器处理流程：
      // 后端返回: { success: true, message: "...", data: [...] }
      // 响应拦截器转换: { code: 200, message: "...", data: [...] }
      // get函数返回: res.data，即 { code: 200, message: "...", data: [...] }
      // 所以 result 应该是 { code: 200, data: [...] } 格式

      // 情况1: result 有 code 字段，从 result.data 提取数组
      if (result && typeof result === 'object' && 'code' in result && result.data) {
        if (Array.isArray(result.data)) {
          console.log('[getLogs] ✅ 从 result.data 提取数据（code格式），数量:', result.data.length)
          return result.data
        }
        // 如果 result.data 是对象，可能有嵌套的 data 字段
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log('[getLogs] ✅ 从 result.data.data 提取数据（嵌套data），数量:', result.data.data.length)
          return result.data.data
        }
      }

      // 情况2: result.data 是数组（直接格式）
      if (result && typeof result === 'object' && Array.isArray(result.data)) {
        console.log('[getLogs] ✅ 从 result.data 提取数据，数量:', result.data.length)
        return result.data
      }

      // 情况3: result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getLogs] ✅ result 本身就是数组，数量:', result.length)
        return result
      }

      // 情况4: 尝试查找其他可能的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'logs', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            console.log(`[getLogs] ✅ 从 result.${field} 提取数据，数量:`, result[field].length)
            return result[field]
          }
        }
      }

      console.warn('[getLogs] 响应格式不符合预期，返回空数组')
      console.warn('[getLogs] 响应结构:', {
        isArray: Array.isArray(result),
        hasData: !!result?.data,
        dataIsArray: Array.isArray(result?.data),
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
      })
      return []
    } catch (error: unknown) {
      console.error('Get logs error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 获取所有操作日志（保留兼容性）
   * @returns 操作日志列表
   */
  getOperationLogs: async (): Promise<OperationLog[]> => {
    try {
      const response = await get<OperationLog[]>(`${API_BASE}/logs/`)
      return response.data || []
    } catch (error) {
      console.error('Get operation logs error:', error)
      return []
    }
  },

  /**
   * 获取日志统计
   * @returns 日志统计信息
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogStats: async (): Promise<any> => {
    try {
      const response = await get(`${API_BASE}/logs/stats/`)
      return response.data || {}
    } catch (error) {
      console.error('Get log stats error:', error)
      return {}
    }
  },

  /**
   * 按月份删除日志
   * @param month 月份（格式：YYYY-MM，如：2025-10）
   * @returns 是否删除成功
   */
  deleteLogs: async (month: string): Promise<boolean> => {
    try {
      console.log('[deleteLogs] 请求删除日志，月份:', month)

      // 将月份格式从 YYYY-MM 转换为 YYYY/MM
      const monthPath = month.replace('-', '/')
      const url = `${API_BASE}/logs/delete/${monthPath}/`

      console.log('[deleteLogs] 删除接口URL:', url)

      // 使用 DELETE 方法
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await del<any>(url)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[deleteLogs] 删除响应:', result)

      // 处理响应格式
      if (result && typeof result === 'object') {
        // 检查是否有 success 字段
        if (result.success === true || result.code === 200) {
          console.log('[deleteLogs] ✅ 删除成功')
          return true
        }
        // 检查 data 字段中是否有 success
        if (result.data && (result.data.success === true || result.data.code === 200)) {
          console.log('[deleteLogs] ✅ 删除成功（data格式）')
          return true
        }
      }

      console.warn('[deleteLogs] 删除响应格式不符合预期')
      return false
    } catch (error: unknown) {
      console.error('Delete logs error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return false
    }
  }
}

/**
 * 审核相关接口
 */
export const reviewApi = {
  /**
   * 获取所有报名数据（统一接口）
   * @param programType 节目类型（可选，如：'vocal', 'dance', 'instrumental'）
   * @returns 报名记录列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAllRegistrations: async (programType?: string): Promise<any[]> => {
    try {
      const params = programType ? { program_type: programType } : {}
      // 接口路径：/api/registrations/all/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/registrations/all/`, params)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理响应格式：{ success: true, data: [...] } 或 { code: 200, data: [...] }
      if (result && Array.isArray(result.data)) {
        return result.data
      }

      // 如果响应拦截器已经处理，result.data 可能是对象
      if (result && result.data && typeof result.data === 'object' && result.data.success === true && Array.isArray(result.data.data)) {
        return result.data.data
      }

      // 原始响应格式
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.data)) {
        return result.data
      }

      // result 本身就是数组
      if (Array.isArray(result)) {
        return result
      }

      return []
    } catch (error: unknown) {
      console.error('Get all registrations error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 获取用户统计数据
   * @returns 用户统计数据列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserStats: async (): Promise<any[]> => {
    try {
      console.log('[getUserStats] 请求用户统计数据')
      // 接口路径：/api/review/user-stats/（根据Django URL配置，只有一个api）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/review/user-stats/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getUserStats] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      if (result.success === true && Array.isArray(result.data)) {
        return result.data
      }
      return []
    } catch (error: unknown) {
      console.error('Get user stats error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 获取声乐报名列表
   * @returns 声乐报名记录列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getVocalRegistrations: async (): Promise<any[]> => {
    try {
      // 接口路径：/api/vocal/api/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/vocal/api/registrations/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 宽松处理响应格式，忽略多余字段
      // 情况1: result.data 是数组（标准格式：{ code: 200, msg: "...", data: [...] }）
      if (result && Array.isArray(result.data)) {
        return result.data
      }

      // 情况2: result.results.data 是数组（分页格式：{ count: 3, results: { code: 200, data: [...] } }）
      if (result && result.results && typeof result.results === 'object' && Array.isArray(result.results.data)) {
        return result.results.data
      }

      // 情况3: result 本身就是数组
      if (Array.isArray(result)) {
        return result
      }

      // 情况4: result.data 存在但不是数组，尝试查找其他可能的数组字段
      if (result && result.data && typeof result.data === 'object') {
        // 尝试查找常见的数组字段
        const possibleArrayFields = ['list', 'items', 'records', 'results']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result.data[field])) {
            return result.data[field]
          }
        }
      }

      // 情况5: 检查 result 中是否有直接的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            return result[field]
          }
        }
      }

      return []
    } catch (error: unknown) {
      console.error('Get vocal registrations error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 获取舞蹈报名列表
   * @returns 舞蹈报名记录列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDanceRegistrations: async (): Promise<any[]> => {
    try {
      // 使用统一接口：/api/registrations/all/?program_type=dance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/registrations/all/`, { program_type: 'dance' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理新的响应格式：{ success: true, message: "...", data: [...] }
      // 响应拦截器可能已经处理了响应，所以 result 可能是 { code: 200, message: "...", data: {...} }
      // 或者直接是 { success: true, message: "...", data: [...] }

      // 情况1: result.data 是数组（标准格式：{ success: true, message: "...", data: [...] } 或 { code: 200, data: {...} }）
      if (result && Array.isArray(result.data)) {
        return result.data
      }

      // 情况2: result.data 是对象，包含 success 和 data 字段（响应拦截器未处理的情况）
      if (result && result.data && typeof result.data === 'object' && result.data.success === true && Array.isArray(result.data.data)) {
        return result.data.data
      }

      // 情况3: result 本身包含 success 和 data 字段（原始响应格式）
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.data)) {
        return result.data
      }

      // 情况4: result 本身就是数组
      if (Array.isArray(result)) {
        return result
      }

      // 情况5: result.data 存在但不是数组，尝试查找其他可能的数组字段
      if (result && result.data && typeof result.data === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result.data[field])) {
            return result.data[field]
          }
        }
      }

      // 情况6: 检查 result 中是否有直接的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            return result[field]
          }
        }
      }

      return []
    } catch (error: unknown) {
      console.error('Get dance registrations error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 获取审核记录列表
   * @returns 审核记录列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getReviewRecords: async (): Promise<any[]> => {
    try {
      // 接口路径：/api/review/reviews/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/review/reviews/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理后端返回格式：{ data: [{ id, object_id, content_type, status, ... }] }
      if (result && Array.isArray(result.data)) {
        return result.data
      }

      // 如果响应拦截器已经处理，检查 result.data
      if (result && result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
        return result.data.data
      }

      // 如果 result.data 是对象且包含 data 数组
      if (result && result.data && typeof result.data === 'object' && result.data.success === true && Array.isArray(result.data.data)) {
        return result.data.data
      }

      // 原始响应格式：{ success: true, data: [...] }
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.data)) {
        return result.data
      }

      // 如果 result 本身就是数组
      if (Array.isArray(result)) {
        return result
      }

      return []
    } catch (error: unknown) {
      console.error('Get review records error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 根据 content_type 和 object_id 查询单个报名详情
   * @param contentType 内容类型（如 "vocalregistration", "danceregistration", "instrumentalregistration"）
   * @param objectId 报名记录ID
   * @returns 报名详情数据
   */
  getRegistrationDetail: async (contentType: string, objectId: number): Promise<any | null> => {
    try {
      // 将 content_type 映射为 program_type
      const contentTypeMap: Record<string, string> = {
        'vocalregistration': 'vocal',
        'danceregistration': 'dance',
        'instrumentalregistration': 'instrumental',
        'operaregistration': 'opera',
        'recitationregistration': 'recitation',
        'calligraphyregistration': 'calligraphy',
        'paintingregistration': 'painting',
        'designregistration': 'design',
        'photographyregistration': 'photography',
        'microfilmregistration': 'microfilm'
      }

      const programType = contentTypeMap[contentType.toLowerCase()] || ''
      if (!programType) {
        console.error('[getRegistrationDetail] 不支持的 content_type:', contentType)
        return null
      }

      // 根据不同的 program_type 调用不同的接口
      let response: any
      if (programType === 'vocal') {
        // 声乐：/api/vocal/api/registrations/{id}/
        response = await get<any>(`${API_BASE}/vocal/api/registrations/${objectId}/`)
      } else if (programType === 'dance') {
        // 舞蹈：/api/dance/api/registrations/{id}/ 或 /api/registrations/all/?program_type=dance&id={id}
        // 先尝试直接查询接口
        try {
          response = await get<any>(`${API_BASE}/dance/api/registrations/${objectId}/`)
        } catch (error) {
          // 如果失败，尝试从列表接口中查找
          const allData = await reviewApi.getAllRegistrations('dance')
          const detail = allData.find((item: any) => item.id === objectId)
          if (detail) {
            return detail
          }
          throw error
        }
      } else if (programType === 'instrumental') {
        // 器乐：/api/instrumental/api/registrations/{id}/
        response = await get<any>(`${API_BASE}/instrumental/api/registrations/${objectId}/`)
      } else {
        // 其他类型：使用统一接口查询列表，然后根据 ID 过滤
        const allData = await reviewApi.getAllRegistrations(programType)
        const detail = allData.find((item: any) => item.id === objectId)
        return detail || null
      }

      // 处理响应格式
      const result = response as any
      if (result && result.data) {
        return result.data
      }
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        return result
      }
      return null
    } catch (error: unknown) {
      console.error('Get registration detail error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return null
    }
  },

  /**
   * 获取器乐报名列表
   * @returns 器乐报名记录列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getInstrumentalRegistrations: async (): Promise<any[]> => {
    try {
      console.log('[getInstrumentalRegistrations] 请求器乐报名列表')
      // 接口路径：/api/instrumental/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/instrumental/registrations/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getInstrumentalRegistrations] 响应数据:', JSON.stringify(result, null, 2))

      // 宽松处理响应格式，忽略多余字段
      // 情况1: result.data 是数组（标准格式：{ code: 200, msg: "...", data: [...] }）
      if (result && Array.isArray(result.data)) {
        console.log('[getInstrumentalRegistrations] 从 result.data 提取数据，数量:', result.data.length)
        return result.data
      }

      // 情况2: result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getInstrumentalRegistrations] result 本身就是数组，数量:', result.length)
        return result
      }

      // 情况3: result.data 存在但不是数组，尝试查找其他可能的数组字段
      if (result && result.data && typeof result.data === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result.data[field])) {
            console.log(`[getInstrumentalRegistrations] 从 result.data.${field} 提取数据，数量:`, result.data[field].length)
            return result.data[field]
          }
        }
      }

      // 情况4: 检查 result 中是否有直接的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            console.log(`[getInstrumentalRegistrations] 从 result.${field} 提取数据，数量:`, result[field].length)
            return result[field]
          }
        }
      }

      // 如果都不匹配，记录警告但尝试返回空数组
      console.warn('[getInstrumentalRegistrations] 响应格式不符合预期，返回空数组')
      console.warn('[getInstrumentalRegistrations] 响应结构:', {
        isArray: Array.isArray(result),
        hasData: !!result?.data,
        dataIsArray: Array.isArray(result?.data),
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
      })
      return []
    } catch (error: unknown) {
      console.error('Get instrumental registrations error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)
      }
      return []
    }
  },

  /**
   * 审核操作（通过或驳回）- 单个记录
   * @param recordId 审核记录ID（reviewId，不是报名记录ID）
   * @param action 操作类型：'approve' | 'reject'
   * @param rejectionReason 驳回理由（驳回时必填）
   * @returns 是否操作成功
   */
  reviewAction: async (recordId: string | number, action: 'approve' | 'reject', rejectionReason?: string): Promise<boolean> => {
    try {
      console.log('[reviewAction] 提交单个审核操作:', { recordId, action, rejectionReason })

      // 确保 record_id 是数字类型
      const numericRecordId = typeof recordId === 'string' ? parseInt(recordId, 10) : recordId
      if (isNaN(Number(numericRecordId))) {
        console.error('[reviewAction] 无效的记录ID:', recordId)
        throw new Error('无效的记录ID')
      }

      const requestData: {
        record_id: number
        action: string
        reason?: string
      } = {
        record_id: Number(numericRecordId),
        action: action
      }

      // 如果是驳回操作，需要提供驳回理由（使用 reason 字段）
      if (action === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
          console.error('[reviewAction] 驳回操作必须提供驳回理由')
          return false
        }
        requestData.reason = rejectionReason.trim()
      }

      console.log('[reviewAction] 请求数据:', JSON.stringify(requestData, null, 2))

      // 接口路径：/api/review/review-action/（注意：不是 /api/review/api/review-action/）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/review/review-action/`, requestData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[reviewAction] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      // 响应拦截器会将 { success: true, message: "...", data: {...} } 转换为 { code: 200, message: "...", data: {...} }
      // 所以这里主要检查 code === 200 或 success === true
      if (result.code === 200 || result.success === true || (result.data && result.data.success === true)) {
        console.log('[reviewAction] 审核操作成功')
        // 如果响应中有 message，可以在这里记录（但不在 API 层显示，由调用方决定是否显示）
        if (result.message) {
          console.log('[reviewAction] 成功消息:', result.message)
        }
        return true
      }
      console.error('[reviewAction] 审核操作失败: 响应异常', result)
      return false
    } catch (error: unknown) {
      console.error('Review action error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)

        // 处理400和404错误，提取错误信息
        if ((response?.status === 400 || response?.status === 404) && response?.data) {
          // 后端可能返回 { success: false, message: '...' } 格式
          const errorMessage = response.data.message || response.data.detail || response.data.msg || '审核操作失败'
          // 抛出包含错误信息的异常，让调用方可以处理
          throw new Error(errorMessage)
        }
      }
      throw error
    }
  },

  /**
   * 批量审核操作（通过或驳回）
   * @param recordIds 报名记录ID数组
   * @param action 操作类型：'approve' | 'reject'
   * @param rejectionReason 驳回理由（驳回时必填）
   * @returns 是否操作成功
   */
  batchReviewAction: async (recordIds: (string | number)[], action: 'approve' | 'reject', rejectionReason?: string): Promise<boolean> => {
    try {
      console.log('[batchReviewAction] 提交批量审核操作:', { recordIds, action, rejectionReason })

      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        console.error('[batchReviewAction] 记录ID数组不能为空')
        return false
      }

      // 转换为数字数组
      const numericIds = recordIds.map(id => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id
        return isNaN(Number(numId)) ? null : numId
      }).filter((id): id is number => id !== null)

      if (numericIds.length === 0) {
        console.error('[batchReviewAction] 没有有效的记录ID')
        return false
      }

      const requestData: {
        action: string
        record_ids: number[]
        reason?: string
      } = {
        action: action,
        record_ids: numericIds
      }

      // 如果是驳回操作，需要提供驳回理由（使用 reason 字段）
      if (action === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
          console.error('[batchReviewAction] 驳回操作必须提供驳回理由')
          return false
        }
        requestData.reason = rejectionReason.trim()
      }

      // 接口路径：/api/review/review-action/（注意：不是 /api/review/api/review-action/）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/review/review-action/`, requestData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[batchReviewAction] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      if (result.code === 200 || result.success === true || (result.data && result.data.success === true)) {
        console.log('[batchReviewAction] 批量审核操作成功')
        return true
      }
      console.error('[batchReviewAction] 批量审核操作失败: 响应异常', result)
      return false
    } catch (error: unknown) {
      console.error('Batch review action error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axiosError = error as any
        const response = axiosError.response
        console.error('错误状态码:', response?.status)
        console.error('错误响应数据:', response?.data)

        // 处理400错误，提取错误信息
        if (response?.status === 400 && response?.data) {
          const errorMessage = response.data.message || response.data.detail || '批量审核操作失败'
          // 抛出包含错误信息的异常，让调用方可以处理
          throw new Error(errorMessage)
        }
      }
      throw error
    }
  }
}

/**
 * 审计相关接口
 */
export const auditApi = {
  /**
   * 获取所有审计记录
   * @returns 审计记录列表
   */
  getAuditRecords: async (): Promise<AuditRecord[]> => {
    try {
      const response = await get<AuditRecord[]>(`${API_BASE}/audit/`)
      return response.data || []
    } catch (error) {
      console.error('Get audit records error:', error)
      return []
    }
  }
}

/**
 * 账号管理相关接口
 */
export const accountApi = {
  /**
   * 获取账号列表
   * @param params 查询参数（可选）
   * @returns 账号列表和分页信息
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAccounts: async (params?: { page?: number; page_size?: number }): Promise<{
    users: any[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> => {
    try {
      // 接口路径：/api/admin/users/search/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/admin/users/search/`, params)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理后端返回格式：{ success: true, users: [...], total, page_size, page, total_pages }
      if (result && result.success === true && Array.isArray(result.users)) {
        return {
          users: result.users,
          total: result.total || result.users.length,
          page: result.page || 1,
          page_size: result.page_size || result.users.length,
          total_pages: result.total_pages || 1
        }
      }

      // 如果响应拦截器已经处理，检查 result.data
      if (result && result.data && result.data.success === true && Array.isArray(result.data.users)) {
        return {
          users: result.data.users,
          total: result.data.total || result.data.users.length,
          page: result.data.page || 1,
          page_size: result.data.page_size || result.data.users.length,
          total_pages: result.data.total_pages || 1
        }
      }

      // 如果 result.data 是数组（响应拦截器可能将整个响应包装在 data 中）
      if (result && result.data && typeof result.data === 'object' && result.data.success === true && Array.isArray(result.data.users)) {
        return {
          users: result.data.users,
          total: result.data.total || result.data.users.length,
          page: result.data.page || 1,
          page_size: result.data.page_size || result.data.users.length,
          total_pages: result.data.total_pages || 1
        }
      }

      // 如果 result.users 直接是数组
      if (result && Array.isArray(result.users)) {
        return {
          users: result.users,
          total: result.total || result.users.length,
          page: result.page || 1,
          page_size: result.page_size || result.users.length,
          total_pages: result.total_pages || 1
        }
      }

      return {
        users: [],
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0
      }
    } catch (error) {
      console.error('Get accounts error:', error)
      return {
        users: [],
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0
      }
    }
  },

  /**
   * 创建账号
   * @param data 账号数据
   * @returns 是否创建成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAccount: async (data: any): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/accounts/`, data)
      return response.data?.success || false
    } catch (error) {
      console.error('Create account error:', error)
      return false
    }
  },

  /**
   * 更新账号
   * @param id 账号ID
   * @param data 账号数据
   * @returns 是否更新成功
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAccount: async (id: string, data: any): Promise<boolean> => {
    try {
      const response = await put<{ success: boolean }>(`${API_BASE}/accounts/${id}/`, data)
      return response.data?.success || false
    } catch (error) {
      console.error('Update account error:', error)
      return false
    }
  },

  /**
   * 删除账号
   * @param id 账号ID
   * @returns 是否删除成功
   */
  deleteAccount: async (id: string): Promise<boolean> => {
    try {
      const response = await del<{ success: boolean }>(`${API_BASE}/accounts/${id}/`)
      return response.data?.success || false
    } catch (error) {
      console.error('Delete account error:', error)
      return false
    }
  },

  /**
   * 启用账号（单个或批量）
   * @param accounts 账号数组
   * @returns 是否操作成功
   */
  enableAccounts: async (accounts: string[]): Promise<boolean> => {
    try {
      // 接口路径：/api/admin/users/enable/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/admin/users/enable/`, {
        accounts: accounts
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理后端返回格式：{ success: true, message: "..." } 或 { code: 200, ... }
      if (result && (result.success === true || result.code === 200)) {
        return true
      }
      return false
    } catch (error) {
      console.error('Enable accounts error:', error)
      return false
    }
  },

  /**
   * 停用/锁定账号（单个或批量）
   * @param accounts 账号数组
   * @returns 是否操作成功
   */
  disableAccounts: async (accounts: string[]): Promise<boolean> => {
    try {
      // 接口路径：/api/admin/users/lock/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/admin/users/lock/`, {
        accounts: accounts
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理后端返回格式：{ success: true, message: "..." } 或 { code: 200, ... }
      if (result && (result.success === true || result.code === 200)) {
        return true
      }
      return false
    } catch (error) {
      console.error('Disable accounts error:', error)
      return false
    }
  },

  /**
   * 解锁账号（单个或批量）- 解开因密码错误被锁定的账号
   * @param accounts 账号数组
   * @returns 是否操作成功
   */
  unlockAccounts: async (accounts: string[]): Promise<boolean> => {
    try {
      // 接口路径：/api/admin/users/unlock/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/admin/users/unlock/`, {
        accounts: accounts
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any

      // 处理后端返回格式：{ success: true, message: "..." } 或 { code: 200, ... }
      if (result && (result.success === true || result.code === 200)) {
        return true
      }
      return false
    } catch (error) {
      console.error('Unlock accounts error:', error)
      return false
    }
  }
}


