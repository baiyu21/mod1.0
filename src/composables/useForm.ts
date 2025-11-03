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

/**
 * 验证中文姓名
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validateChineseName = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const name = String(value).trim()
  if (!name) {
    callback(new Error('请输入姓名'))
    return
  }
  // 验证是否为中文（允许中文、少数民族姓名中的点等）
  const chineseNamePattern = /^[\u4e00-\u9fa5·]+$/
  if (!chineseNamePattern.test(name)) {
    callback(new Error('姓名必须为中文'))
    return
  }
  if (name.length < 2 || name.length > 20) {
    callback(new Error('姓名长度应在2-20个字符之间'))
    return
  }
  callback()
}

/**
 * 验证手机号（11位数字）
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validatePhone = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const phone = String(value).trim()
  if (!phone) {
    callback(new Error('请输入手机号'))
    return
  }
  // 验证11位数字，且以1开头
  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(phone)) {
    callback(new Error('请输入正确的11位手机号'))
    return
  }
  callback()
}

/**
 * 验证身份证号（18位）
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validateIdNumber = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const idNo = String(value).trim()
  if (!idNo) {
    callback(new Error('请输入身份证号'))
    return
  }
  // 验证18位身份证号（15位旧身份证号暂不支持）
  const idPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  if (!idPattern.test(idNo)) {
    callback(new Error('请输入正确的18位身份证号'))
    return
  }
  callback()
}

/**
 * 验证邮箱（可选）
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validateEmail = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const email = String(value).trim()
  if (!email) {
    callback() // 邮箱为可选字段
    return
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    callback(new Error('请输入正确的邮箱地址'))
    return
  }
  callback()
}

/**
 * 验证年龄（1-150）
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validateAge = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const age = Number(value)
  if (!value && value !== 0) {
    callback(new Error('请输入年龄'))
    return
  }
  if (isNaN(age) || age < 1 || age > 150) {
    callback(new Error('年龄应在1-150之间'))
    return
  }
  callback()
}

/**
 * 验证学号（数字和字母组合，6-20位）
 * @param rule 验证规则对象
 * @param value 输入值
 * @param callback 回调函数
 */
const validateStudentNo = (rule: unknown, value: string | number, callback: (error?: Error) => void) => {
  const studentNo = String(value).trim()
  if (!studentNo) {
    callback() // 学号为可选字段
    return
  }
  if (studentNo.length < 6 || studentNo.length > 20) {
    callback(new Error('学号长度应在6-20个字符之间'))
    return
  }
  const studentNoPattern = /^[A-Za-z0-9]+$/
  if (!studentNoPattern.test(studentNo)) {
    callback(new Error('学号只能包含字母和数字'))
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
  ] as FormRule[],

  /**
   * 联系人姓名（中文）
   */
  contactName: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' as const },
    { validator: validateChineseName, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 手机号（11位数字）
   */
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' as const },
    { validator: validatePhone, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 身份证号（18位）
   */
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' as const },
    { validator: validateIdNumber, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 邮箱（可选）
   */
  email: [
    { validator: validateEmail, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 姓名（中文，用于花名册）
   */
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' as const },
    { validator: validateChineseName, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 年龄
   */
  age: [
    { validator: validateAge, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 学号（可选）
   */
  studentNo: [
    { validator: validateStudentNo, trigger: 'blur' as const }
  ] as FormRule[],

  /**
   * 地址（必填，最少5个字符）
   */
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' as const },
    { min: 5, message: '地址长度不能少于5个字符', trigger: 'blur' as const }
  ] as FormRule[]
}

