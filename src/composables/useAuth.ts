import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { LoginForm, ChangePasswordForm, UserRole } from '@/types'
import { authenticate, changePassword as changePasswordService } from '@/services'

/**
 * 认证相关组合式函数
 * @returns 认证相关的方法和状态
 */
export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  // 登录状态
  const loading = ref(false)
  const loginForm = ref<LoginForm>({
    username: '',
    password: ''
  })

  // 修改密码状态
  const changePasswordVisible = ref(false)
  const changePasswordLoading = ref(false)
  const changePasswordForm = ref<ChangePasswordForm>({
    oldPwd: '',
    newPwd: '',
    confirmPwd: '',
    name: '',
    phone: ''
  })

  // 计算属性
  const isLoggedIn = computed(() => !!userStore.role)
  const currentUser = computed(() => ({
    userId: userStore.userId,
    role: userStore.role,
    permissions: userStore.permissions
  }))

  /**
   * 登录
   * @param form 登录表单
   */
  const login = async (form: LoginForm) => {
    if (!form.username || !form.password) {
      ElMessage.warning('请输入账号和密码')
      return false
    }

    loading.value = true
    try {
      const authResult = await authenticate(form.username, form.password)
      
      if (authResult && authResult.token) {
        // 登录成功：有 token 且不为空
        userStore.login({
          userId: authResult.userId || form.username,
          role: authResult.role,
          token: authResult.token
        })
        ElMessage.success('登录成功')

        // 根据角色跳转到不同端
        const roleRoutes: Record<UserRole, string> = {
          'user': '/user',
          'approval': '/approval',
          'admin': '/admin',
          'logaudit': '/logaudit'
        }
        const targetRoute = roleRoutes[authResult.role]
        if (targetRoute) {
          router.replace(targetRoute)
        } else {
          console.error('未知的用户角色，无法跳转:', authResult.role)
          ElMessage.error('未知的用户角色，无法跳转')
        }
        return true
      } else {
        // 登录失败：没有返回结果或没有 token
        ElMessage.error('账号或密码错误')
        return false
      }
    } catch (error) {
      ElMessage.error('登录失败，请稍后再试')
      console.error('Login error:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    userStore.logout()
    router.replace('/login')
    ElMessage.success('已退出登录')
  }

  /**
   * 打开修改密码对话框
   */
  const openChangePassword = () => {
    changePasswordVisible.value = true
  }

  /**
   * 关闭修改密码对话框
   */
  const closeChangePassword = () => {
    changePasswordVisible.value = false
    changePasswordForm.value = {
      oldPwd: '',
      newPwd: '',
      confirmPwd: '',
      name: '',
      phone: ''
    }
  }

  /**
   * 提交修改密码
   */
  const submitChangePassword = async () => {
    const form = changePasswordForm.value

    // 验证必填项
    if (!form.oldPwd || !form.newPwd || !form.confirmPwd || !form.name || !form.phone) {
      ElMessage.warning('请填写完整信息')
      return
    }

    // 验证新密码和确认密码一致
    if (form.newPwd !== form.confirmPwd) {
      ElMessage.error('两次输入的密码不一致')
      return
    }

    // 验证新密码长度
    if (form.newPwd.length < 6) {
      ElMessage.error('新密码长度不能少于6位')
      return
    }

    // 验证新密码强度：至少包含三种字符类型（数字、大写字母、小写字母、特殊字符中的任意三种）
    let typeCount = 0
    if (/\d/.test(form.newPwd)) typeCount++        // 数字
    if (/[a-z]/.test(form.newPwd)) typeCount++      // 小写字母
    if (/[A-Z]/.test(form.newPwd)) typeCount++      // 大写字母
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.newPwd)) typeCount++  // 特殊字符

    if (typeCount < 3) {
      ElMessage.error('新密码必须包含三种字符类型（数字、大写字母、小写字母、特殊字符中的任意三种）')
      return
    }

    // 验证旧密码和新密码不能相同
    if (form.oldPwd === form.newPwd) {
      ElMessage.error('新密码不能与旧密码相同')
      return
    }

    // 验证手机号格式（简单验证）
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(form.phone)) {
      ElMessage.error('请输入正确的手机号码')
      return
    }

    if (!userStore.userId) {
      ElMessage.error('用户信息异常，请重新登录')
      return
    }

    changePasswordLoading.value = true
    try {
      const success = await changePasswordService(
        userStore.userId,
        form.oldPwd,
        form.newPwd,
        form.name,
        form.phone
      )

      if (success) {
        ElMessage.success('密码修改成功')
        closeChangePassword()
      } else {
        ElMessage.error('旧密码错误，修改失败')
      }
    } catch (error) {
      ElMessage.error('修改密码失败，请稍后再试')
      console.error('Change password error:', error)
    } finally {
      changePasswordLoading.value = false
    }
  }

  /**
   * 检查是否有权限
   */
  const hasPermission = (permission: string): boolean => {
    return userStore.hasPermission(permission)
  }

  /**
   * 检查是否有角色
   */
  const hasRole = (roles: UserRole[]): boolean => {
    return userStore.hasRole(roles)
  }

  /**
   * 重置登录表单
   */
  const resetLoginForm = () => {
    loginForm.value = {
      username: '',
      password: ''
    }
  }

  return {
    // 状态
    loading,
    loginForm,
    changePasswordVisible,
    changePasswordLoading,
    changePasswordForm,

    // 计算属性
    isLoggedIn,
    currentUser,

    // 方法
    login,
    logout,
    openChangePassword,
    closeChangePassword,
    submitChangePassword,
    hasPermission,
    hasRole,
    resetLoginForm
  }
}

