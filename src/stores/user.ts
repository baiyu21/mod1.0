import { defineStore } from 'pinia'
import type { UserRole } from '@/types'
import {
  getUserId,
  setUserId,
  getUserRole,
  setUserRole,
  getUserToken,
  setUserToken,
  getRefreshToken,
  setRefreshToken,
  getUserPermissions,
  setUserPermissions,
  clearUserStorage
} from '@/utils/storage'

interface UserState {
  userId: string | null
  role: UserRole | null
  token: string | null
  refreshToken: string | null
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: getUserId(),
    role: getUserRole(),
    token: getUserToken(),
    refreshToken: getRefreshToken(),
    permissions: getUserPermissions()
  }),

  actions: {
    login(payload: { userId: string; role: UserRole; token?: string; refreshToken?: string; permissions?: string[] }) {
      this.userId = payload.userId
      this.role = payload.role
      this.token = payload.token ?? 'mock-token'
      this.refreshToken = payload.refreshToken ?? null
      this.permissions = payload.permissions ?? []

      setUserId(payload.userId)
      setUserRole(payload.role)
      setUserToken(this.token)
      if (this.refreshToken) {
        setRefreshToken(this.refreshToken)
      }
      setUserPermissions(this.permissions)
    },

    logout() {
      this.userId = null
      this.role = null
      this.token = null
      this.refreshToken = null
      this.permissions = []

      clearUserStorage()
    },

    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    hasRole(roles: UserRole[]): boolean {
      return this.role ? roles.includes(this.role) : false
    }
  }
})

