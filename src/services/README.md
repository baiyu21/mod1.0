# 接口服务说明

## 文件结构

```
services/
├── index.ts      # 统一服务入口（根据环境变量自动切换 mock/真实接口）
├── api.ts        # 真实接口封装（对接后端 API）
├── mock.ts       # Mock 数据服务（开发测试用）
└── README.md     # 本说明文档
```

## 使用方式

### 1. 环境变量配置

在项目根目录创建 `.env` 或 `.env.local` 文件：

```env
# 是否使用 Mock 数据
# true: 使用 mock 数据（默认）
# false: 使用真实接口
VITE_USE_MOCK=true

# API 基础 URL（当使用真实接口时）
VITE_API_BASE_URL=http://g97bda64.natappfree.cc
```

### 2. 在代码中使用

```typescript
// 从统一入口导入（推荐）
import { authenticate, changePassword } from '@/services'

// 或者直接导入真实接口（如果需要）
import { authApi, registrationApi } from '@/services/api'
```

### 3. 接口切换

- **开发阶段**：设置 `VITE_USE_MOCK=true`，使用 mock 数据，无需后端支持
- **对接阶段**：设置 `VITE_USE_MOCK=false`，使用真实接口，自动切换到后端 API

## 接口列表

### 认证相关（authApi）

- `login(account, password)` - 用户登录
- `changePassword(userId, params)` - 修改密码
- `logout()` - 登出

### 报名相关（registrationApi）

- `getRegistrations(status?)` - 获取报名记录
- `getPendingRegistrations()` - 获取待审核记录
- `submitRegistration(data)` - 提交报名
- `approve(params)` - 审核通过
- `reject(params)` - 审核驳回
- `getStats(regionFilter?)` - 获取统计信息

### 日志相关（logApi）

- `getOperationLogs()` - 获取操作日志
- `getLogStats()` - 获取日志统计
- `deleteLogs(logIds, auditorId, auditorName)` - 批量删除日志

### 审计相关（auditApi）

- `getAuditRecords()` - 获取审计记录

### 账号管理（accountApi）

- `getAccounts()` - 获取账号列表
- `createAccount(data)` - 创建账号
- `updateAccount(id, data)` - 更新账号
- `deleteAccount(id)` - 删除账号

## 账号角色映射

根据接口注意事项文档，各角色对应的账号：

- **用户端**：`user` 角色，账号：`tsy1`，密码：`Tsy123456`
- **管理员端**：`admin` 角色，账号：`tsy2`，密码：`Tsy123456`
- **审核端**：`approval` 角色，账号：`tsy3`，密码：`Tsy123456`
- **日志端**：`logaudit` 角色，账号：`tsy4`，密码：`Tsy123456`

## 注意事项

1. **请求拦截器**：自动添加 `Authorization` 头（Bearer Token）
2. **响应拦截器**：统一处理错误和业务状态码
3. **错误处理**：401 错误会自动清除 token 并跳转登录页
4. **类型安全**：所有接口都有完整的 TypeScript 类型定义

## 开发规范

根据代码规范要求：
- `services/` 目录：调用接口，输出原始数据，不做业务逻辑
- 业务逻辑应在 `composables/` 中处理
- 所有接口函数都需要添加清晰的注释说明

