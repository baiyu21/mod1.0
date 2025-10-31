// 用户角色类型
export type UserRole = 'user' | 'approval' | 'admin' | 'logaudit'

// 用户接口
export interface User {
  userId: string
  role: UserRole
  token: string
  permissions: string[]
}

// 登录表单接口
export interface LoginForm {
  username: string
  password: string
}

// 修改密码表单接口
export interface ChangePasswordForm {
  oldPwd: string
  newPwd: string
  confirmPwd: string
  name: string
  phone: string
}

// 路由元信息
export interface RouteMeta {
  roles?: UserRole[]
  requiresAuth?: boolean
  layout?: string
}

// 操作日志接口
export interface OperationLog {
  id: string
  userId: string
  userName: string
  action: string // 操作类型：登录、提交、删除、修改等
  module: string // 模块：报名、审核、用户管理等
  description: string // 操作描述
  ip?: string // IP地址
  timestamp: string // 操作时间
  result: 'success' | 'failed' // 操作结果
}

// 审计记录接口
export interface AuditRecord {
  id: string
  auditorId: string // 审计员ID
  auditorName: string // 审计员姓名
  action: string // 审计操作：删除日志、查看日志等
  targetType: 'log' | 'record' // 目标类型
  targetId: string // 目标ID
  targetContent: string // 目标内容（如删除的日志ID列表）
  timestamp: string // 审计时间
  description: string // 审计描述
}

// 报名记录状态
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | ''

// 报名记录接口
export interface Registration {
  id: string
  workName: string // 作品名称（节目名称）
  category: string // 报名类别（声乐、器乐、舞蹈等）（节目类型）
  submitterName: string // 提交人姓名
  submitTime: string // 提交时间
  status: RegistrationStatus // 审核状态
  reviewer?: string // 审核人
  reviewTime?: string // 审核时间
  reviewComment?: string // 审核意见
  school?: string // 学校名称
  region?: string // 所在地区
  contactName?: string // 联系人姓名
  contactPhone?: string // 联系方式
  description?: string // 简介
}

