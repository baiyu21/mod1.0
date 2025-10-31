// 表单验证规则类型
type FormRule = {
  required?: boolean
  message?: string
  trigger?: 'blur' | 'change'
  min?: number
  max?: number
  validator?: (rule: any, value: any, callback: any) => void
}

// 通用表单验证规则
export const commonRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' as const },
    { min: 3, max: 20, message: '账号长度在 3 到 20 个字符', trigger: 'blur' as const }
  ] as FormRule[],
  
  password: (min: number = 6) => [
    { required: true, message: '请输入密码', trigger: 'blur' as const },
    { min, message: `密码长度不能少于 ${min} 个字符`, trigger: 'blur' as const }
  ] as FormRule[]
}

