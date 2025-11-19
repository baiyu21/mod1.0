import { post, get, put, del } from '@/utils/request'
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

        // 构建登录结果
        const result: LoginResponse = {
          userId: userId,
          role: loginData.role || mapAccountToRole(account), // 如果后端不返回 role，根据账号映射
          token: accessToken,
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
   * @param userId 用户ID
   * @param params 修改密码参数
   * @returns 是否修改成功
   */
  changePassword: async (userId: string, params: ChangePasswordParams): Promise<boolean> => {
    try {
      const response = await post<{ success: boolean }>(`${API_BASE}/change-password/`, {
        userId,
        ...params
      })
      return response.data?.success || false
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  },

  /**
   * 登出
   * @returns 是否登出成功
   */
  logout: async (): Promise<boolean> => {
    try {
      await post(`${API_BASE}/logout/`)
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
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
   * 获取所有操作日志
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

