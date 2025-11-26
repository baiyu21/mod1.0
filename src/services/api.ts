import { post, get, put, del, uploadFile as uploadFileRequest } from '@/utils/request'
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
const FILE_BASE_URL = (import.meta.env.VITE_FILE_BASE_URL as string | undefined) || 'https://filesystem7777.oss-cn-chengdu.aliyuncs.com'

/**
 * 根据账号前缀映射角色（如果后端不返回 role 字段时使用）
 * @param account 账号
 * @returns 角色类型
 */
function mapAccountToRole(account: string): UserRole {
  if (account.startsWith('tsy1') || account.startsWith('user')) {
    return 'user'
  } else if (account.startsWith('tsy3') || account.startsWith('reviewer')) {
    return 'approval'
  } else if (account.startsWith('tsy2') || account.startsWith('admin')) {
    return 'admin'
  } else if (account.startsWith('tsy4') || account.startsWith('logger')) {
    return 'logaudit'
  }
  return 'user' // 默认返回用户角色
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
      //   "refresh": "..."
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

        // 从 token 中解析用户ID（如果需要）
        // 或者使用 account 作为 userId
        const userId = loginData.user_id || loginData.userId || account

        // 获取 refresh token
        const refreshToken = loginData.refresh || loginData.refreshToken || loginData.refresh_token

        // 构建登录结果
        const result: LoginResponse = {
          userId: userId,
          role: loginData.role || mapAccountToRole(account), // 如果后端不返回 role，根据账号映射
          token: accessToken,
          refreshToken: refreshToken, // 保存 refresh token
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
      const params = regionFilter ? { region: regionFilter } : {}
      const response = await get(`${API_BASE}/registrations/stats/`, params)
      return response.data || {}
    } catch (error) {
      console.error('Get stats error:', error)
      return {}
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(url)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getLogs] 响应数据:', JSON.stringify(result, null, 2))

      // 宽松处理响应格式
      // 情况1: result.data 是数组
      if (result && Array.isArray(result.data)) {
        console.log('[getLogs] 从 result.data 提取数据，数量:', result.data.length)
        return result.data
      }

      // 情况2: result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getLogs] result 本身就是数组，数量:', result.length)
        return result
      }

      // 情况3: 尝试查找其他可能的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'logs']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            console.log(`[getLogs] 从 result.${field} 提取数据，数量:`, result[field].length)
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
   * 批量删除日志
   * @param logIds 日志ID数组
   * @param auditorId 审计员ID
   * @param auditorName 审计员姓名
   * @returns 是否删除成功
   */
  deleteLogs: async (logIds: string[], auditorId: string, auditorName: string): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/logs/delete/`, {
        logIds,
        auditorId,
        auditorName
      })
      return response.data?.success || false
    } catch (error) {
      console.error('Delete logs error:', error)
      return false
    }
  }
}

/**
 * 审核相关接口
 */
export const reviewApi = {
  /**
   * 获取用户统计数据
   * @returns 用户统计数据列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserStats: async (): Promise<any[]> => {
    try {
      console.log('[getUserStats] 请求用户统计数据')
      // 接口路径：/api/review/api/user-stats/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/review/api/user-stats/`)
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
      console.log('[getVocalRegistrations] 请求声乐报名列表')
      // 接口路径：/api/vocal/api/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/vocal/api/registrations/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getVocalRegistrations] 响应数据:', JSON.stringify(result, null, 2))

      // 宽松处理响应格式，忽略多余字段
      // 情况1: result.data 是数组（标准格式：{ code: 200, msg: "...", data: [...] }）
      if (result && Array.isArray(result.data)) {
        console.log('[getVocalRegistrations] 从 result.data 提取数据，数量:', result.data.length)
        return result.data
      }

      // 情况2: result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getVocalRegistrations] result 本身就是数组，数量:', result.length)
        return result
      }

      // 情况3: result.data 存在但不是数组，尝试查找其他可能的数组字段
      if (result && result.data && typeof result.data === 'object') {
        // 尝试查找常见的数组字段
        const possibleArrayFields = ['list', 'items', 'records', 'results']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result.data[field])) {
            console.log(`[getVocalRegistrations] 从 result.data.${field} 提取数据，数量:`, result.data[field].length)
            return result.data[field]
          }
        }
      }

      // 情况4: 检查 result 中是否有直接的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            console.log(`[getVocalRegistrations] 从 result.${field} 提取数据，数量:`, result[field].length)
            return result[field]
          }
        }
      }

      // 如果都不匹配，记录警告但尝试返回空数组
      console.warn('[getVocalRegistrations] 响应格式不符合预期，返回空数组')
      console.warn('[getVocalRegistrations] 响应结构:', {
        isArray: Array.isArray(result),
        hasData: !!result?.data,
        dataIsArray: Array.isArray(result?.data),
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
      })
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
      console.log('[getDanceRegistrations] 请求舞蹈报名列表')
      // 接口路径：/api/dance/registrations/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await get<any>(`${API_BASE}/dance/registrations/`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[getDanceRegistrations] 响应数据:', JSON.stringify(result, null, 2))

      // 宽松处理响应格式，忽略多余字段
      // 情况1: result.data 是数组（标准格式：{ code: 200, msg: "...", data: [...] }）
      if (result && Array.isArray(result.data)) {
        console.log('[getDanceRegistrations] 从 result.data 提取数据，数量:', result.data.length)
        return result.data
      }

      // 情况2: result 本身就是数组
      if (Array.isArray(result)) {
        console.log('[getDanceRegistrations] result 本身就是数组，数量:', result.length)
        return result
      }

      // 情况3: result.data 存在但不是数组，尝试查找其他可能的数组字段
      if (result && result.data && typeof result.data === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result.data[field])) {
            console.log(`[getDanceRegistrations] 从 result.data.${field} 提取数据，数量:`, result.data[field].length)
            return result.data[field]
          }
        }
      }

      // 情况4: 检查 result 中是否有直接的数组字段
      if (result && typeof result === 'object') {
        const possibleArrayFields = ['list', 'items', 'records', 'results', 'data']
        for (const field of possibleArrayFields) {
          if (Array.isArray(result[field])) {
            console.log(`[getDanceRegistrations] 从 result.${field} 提取数据，数量:`, result[field].length)
            return result[field]
          }
        }
      }

      // 如果都不匹配，记录警告但尝试返回空数组
      console.warn('[getDanceRegistrations] 响应格式不符合预期，返回空数组')
      console.warn('[getDanceRegistrations] 响应结构:', {
        isArray: Array.isArray(result),
        hasData: !!result?.data,
        dataIsArray: Array.isArray(result?.data),
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
      })
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
   * 审核操作（通过或驳回）- 单个记录
   * @param recordId 报名记录ID
   * @param action 操作类型：'approve' | 'reject'
   * @param rejectionReason 驳回理由（驳回时必填）
   * @returns 是否操作成功
   */
  reviewAction: async (recordId: string | number, action: 'approve' | 'reject', rejectionReason?: string): Promise<boolean> => {
    try {
      console.log('[reviewAction] 提交单个审核操作:', { recordId, action, rejectionReason })

      const requestData: {
        record_id: string | number
        action: string
        rejection_reason?: string
      } = {
        record_id: recordId,
        action: action
      }

      // 如果是驳回操作，需要提供驳回理由
      if (action === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
          console.error('[reviewAction] 驳回操作必须提供驳回理由')
          return false
        }
        requestData.rejection_reason = rejectionReason.trim()
      }

      // 接口路径：/api/review/api/review-action/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/review/api/review-action/`, requestData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any
      console.log('[reviewAction] 响应数据:', JSON.stringify(result, null, 2))

      // 检查响应格式
      if (result.code === 200 || result.success === true || (result.data && result.data.success === true)) {
        console.log('[reviewAction] 审核操作成功')
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

        // 处理400错误，提取错误信息
        if (response?.status === 400 && response?.data) {
          const errorMessage = response.data.message || response.data.detail || '审核操作失败'
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
        rejection_reason?: string
      } = {
        action: action,
        record_ids: numericIds
      }

      // 如果是驳回操作，需要提供驳回理由
      if (action === 'reject') {
        if (!rejectionReason || !rejectionReason.trim()) {
          console.error('[batchReviewAction] 驳回操作必须提供驳回理由')
          return false
        }
        requestData.rejection_reason = rejectionReason.trim()
      }

      // 接口路径：/api/review/api/review-action/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await post<any>(`${API_BASE}/review/api/review-action/`, requestData)
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
   * @returns 账号列表
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAccounts: async (): Promise<any[]> => {
    try {
      const response = await get(`${API_BASE}/accounts/`)
      return response.data || []
    } catch (error) {
      console.error('Get accounts error:', error)
      return []
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
  }
}


