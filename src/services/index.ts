/**
 * 统一服务入口
 * 根据环境变量 VITE_USE_MOCK 决定使用 mock 数据还是真实接口
 *
 * 使用方式：
 * - 开发环境使用 mock：VITE_USE_MOCK=true（或未设置，默认使用 mock）
 * - 生产环境使用真实接口：VITE_USE_MOCK=false
 */

// 是否使用 mock 数据（可通过环境变量控制）
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 根据配置选择使用 mock 还是真实接口
if (USE_MOCK) {
  // 使用 mock 数据
  console.log('[Services] Using MOCK data')
} else {
  // 使用真实接口
  console.log('[Services] Using REAL API')
}

// 导出认证相关接口
import type { UserRole } from '@/types'

export const authenticate = async (
  username: string,
  password: string
): Promise<{ userId: string; role: UserRole; token: string } | null> => {
  if (USE_MOCK) {
    const { authenticate: mockAuthenticate } = await import('./mock')
    return mockAuthenticate(username, password)
  } else {
    const { authApi } = await import('./api')
    const result = await authApi.login(username, password)
    if (result) {
      return {
        userId: result.userId,
        role: result.role,
        token: result.token
      }
    }
    return null
  }
}

// 导出修改密码接口
export const changePassword = async (
  username: string,
  oldPassword: string,
  newPassword: string,
  name: string,
  phone: string
): Promise<boolean> => {
  if (USE_MOCK) {
    const { changePassword: mockChangePassword } = await import('./mock')
    return mockChangePassword(username, oldPassword, newPassword, name, phone)
  } else {
    const { authApi } = await import('./api')
    return authApi.changePassword(username, {
      oldPwd: oldPassword,
      newPwd: newPassword,
      confirmPwd: newPassword,
      name,
      phone
    })
  }
}

// 导出其他接口（按需导入，保持与 mock.ts 相同的接口）
export * from './mock'

// 导出真实接口（供需要直接调用真实接口的场景使用）
export { authApi, registrationApi, logApi, auditApi, accountApi } from './api'

