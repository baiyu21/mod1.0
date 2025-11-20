// 存储工具函数
// Storage Utility Functions

type UserRole = 'user' | 'approval' | 'admin' | 'logaudit'

// 用户ID存储键
const USER_ID_KEY = 'user_id'
const USER_ROLE_KEY = 'user_role'
const USER_TOKEN_KEY = 'user_token'
const USER_REFRESH_TOKEN_KEY = 'user_refresh_token'
const USER_PERMISSIONS_KEY = 'user_permissions'

// 获取用户ID
export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

// 设置用户ID
export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

// 获取用户角色
export function getUserRole(): UserRole | null {
  const role = localStorage.getItem(USER_ROLE_KEY)
  return role as UserRole | null
}

// 设置用户角色
export function setUserRole(role: UserRole): void {
  localStorage.setItem(USER_ROLE_KEY, role)
}

// 获取用户令牌
export function getUserToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY)
}

// 设置用户令牌
export function setUserToken(token: string): void {
  localStorage.setItem(USER_TOKEN_KEY, token)
}

// 获取刷新令牌
export function getRefreshToken(): string | null {
  return localStorage.getItem(USER_REFRESH_TOKEN_KEY)
}

// 设置刷新令牌
export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem(USER_REFRESH_TOKEN_KEY, refreshToken)
}

// 获取用户权限
export function getUserPermissions(): string[] {
  const permissions = localStorage.getItem(USER_PERMISSIONS_KEY)
  return permissions ? JSON.parse(permissions) : []
}

// 设置用户权限
export function setUserPermissions(permissions: string[]): void {
  localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions))
}

// 清空用户存储
export function clearUserStorage(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(USER_TOKEN_KEY)
  localStorage.removeItem(USER_REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_PERMISSIONS_KEY)
}

