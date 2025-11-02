// 表单验证规则类型
type FormRule = {
  required?: boolean
  message?: string
  trigger?: 'blur' | 'change'
  min?: number
  max?: number
  validator?: (rule: unknown, value: string | number, callback: (error?: Error) => void) => void
}

// 密码验证函数：至少6位且包含三种字符类型（数字、大写字母、小写字母、特殊字符中的任意三种）
const validatePasswordStrength = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const password = String(value)

  if (!password) {
    callback(new Error('请输入密码'))
    return
  }

  // 验证长度至少6位
  if (password.length < 6) {
    callback(new Error('密码长度不能少于6位'))
    return
  }

  // 验证字符类型（至少三种）
  let typeCount = 0
  if (/\d/.test(password)) typeCount++        // 数字
  if (/[a-z]/.test(password)) typeCount++      // 小写字母
  if (/[A-Z]/.test(password)) typeCount++      // 大写字母
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) typeCount++  // 特殊字符

  if (typeCount < 3) {
    callback(new Error('密码必须包含三种字符类型（数字、大写字母、小写字母、特殊字符中的任意三种）'))
    return
  }

  callback()
}

// 通用表单验证规则
export const commonRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' as const },
    { min: 3, max: 20, message: '账号长度在 3 到 20 个字符', trigger: 'blur' as const }
  ] as FormRule[],

  password: (min: number = 6) => [
    { required: true, message: '请输入密码', trigger: 'blur' as const },
    { min, message: `密码长度不能少于 ${min} 个字符`, trigger: 'blur' as const },
    { validator: validatePasswordStrength, trigger: 'blur' as const }
  ] as FormRule[]
}

