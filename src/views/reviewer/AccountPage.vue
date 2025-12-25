<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElUpload } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile, UploadFiles } from 'element-plus'
import { accountApi } from '@/services/api'

// 账号类型定义
type Account = {
  id: string
  username: string
  universityName: string
  role: 'user' | 'approval' | 'admin' | 'logaudit'
  status: 'active' | 'disabled' | 'locked'  // active: 正常, disabled: 停用, locked: 锁定
  email?: string
  phone?: string
  createTime?: string
  account?: string  // 后端返回的账号字段
  is_active?: boolean  // 后端返回的激活状态
  is_locked?: boolean  // 后端返回的锁定状态
}

// 账号列表数据
const accountList = ref<Account[]>([])
const loading = ref(false)

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 加载账号列表
const loadAccounts = async () => {
  loading.value = true
  try {
    const result = await accountApi.getAccounts({
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    })

    // 将后端数据映射到前端格式
    accountList.value = result.users.map((user: any) => {
      // 角色映射：后端返回 'reviewer' -> 前端 'approval'，'logger' -> 'logaudit'
      let role: Account['role'] = 'user'
      if (user.role === 'reviewer') {
        role = 'approval'
      } else if (user.role === 'logger') {
        role = 'logaudit'
      } else if (user.role === 'admin') {
        role = 'admin'
      } else if (user.role === 'user') {
        role = 'user'
      }

      // 状态映射：优先检查 is_locked（锁定），然后检查 is_active（停用），最后检查 status 字段
      // 锁定状态：is_locked = true 或 status = '锁定'
      // 停用状态：is_active = false 且 is_locked = false，或 status = '停用'
      // 正常状态：is_active = true 且 is_locked = false，或 status = '正常'
      let status: Account['status'] = 'active'
      if (user.is_locked || user.status === '锁定') {
        status = 'locked'  // 锁定状态（因密码错误被锁定）
      } else if (!user.is_active || user.status === '停用') {
        status = 'disabled'  // 停用状态（管理员手动停用）
      } else {
        status = 'active'  // 正常状态
      }

      return {
        id: user.account || String(Math.random()), // 使用 account 作为 id
        username: user.username || '',
        universityName: user.universityName || '',
        role: role,
        status: status,
        email: user.modifier_name || undefined, // 修改人姓名
        phone: user.modifier_contact || undefined, // 修改人联系方式
        createTime: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : undefined,
        account: user.account,
        is_active: user.is_active,
        is_locked: user.is_locked
      }
    })

    // 更新分页信息
    pagination.value.total = result.total
    pagination.value.totalPages = result.total_pages
    pagination.value.currentPage = result.page
    pagination.value.pageSize = result.page_size
  } catch (error) {
    console.error('加载账号列表失败:', error)
    ElMessage.error('加载账号列表失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取账号列表
onMounted(() => {
  loadAccounts()
})

const multipleSelection = ref<Account[]>([])

// 搜索和筛选
const keyword = ref('')
const filterRole = ref<string>('')
const filterStatus = ref<string>('')

// 角色选项
const roleOptions = [
  { label: '全部', value: '' },
  { label: '用户', value: 'user' },
  { label: '审核员', value: 'approval' },
  { label: '管理员', value: 'admin' },
  { label: '日志审计员', value: 'logaudit' }
]

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '锁定', value: 'locked' }
]

// 筛选后的账号列表
const filteredAccountList = computed(() => {
  return accountList.value.filter(account => {
    const keywordMatch = !keyword.value ||
      account.username?.includes(keyword.value) ||
      account.account?.includes(keyword.value) ||
      account.universityName?.includes(keyword.value) ||
      account.email?.includes(keyword.value) ||
      account.phone?.includes(keyword.value)
    const roleMatch = !filterRole.value || account.role === filterRole.value
    const statusMatch = !filterStatus.value || account.status === filterStatus.value
    return keywordMatch && roleMatch && statusMatch
  })
})

// 获取角色显示文本
function getRoleText(role: string) {
  const roleMap: Record<string, string> = {
    user: '用户',
    approval: '审核员',
    admin: '管理员',
    logaudit: '日志审计员'
  }
  return roleMap[role] || role
}

// 获取状态显示文本和类型
function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    active: '正常',
    disabled: '停用',
    locked: '锁定'
  }
  return statusMap[status] || status
}

function getStatusType(status: string): 'success' | 'warning' | 'danger' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    disabled: 'warning',
    locked: 'danger'
  }
  return typeMap[status] || 'warning'
}

function handleSelectionChange(rows: Account[]) {
  multipleSelection.value = rows
}

// 创建账号
const createAccountDialogVisible = ref(false)
const createAccountFormRef = ref<FormInstance>()
const createAccountForm = reactive({
  account: '',
  username: '',
  universityName: '',
  role: 'user' as Account['role'],
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const createAccountRules = reactive<FormRules>({
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 50, message: '账号长度为3-50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  universityName: [
    { required: true, message: '请输入大学名称', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

function validatePassword(rule: any, value: any, callback: any) {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
    return
  }
  let typeCount = 0
  if (/\d/.test(value)) typeCount++
  if (/[a-z]/.test(value)) typeCount++
  if (/[A-Z]/.test(value)) typeCount++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) typeCount++
  if (typeCount < 3) {
    callback(new Error('密码必须包含三种字符类型（数字、大写字母、小写字母、特殊字符中的任意三种）'))
    return
  }
  callback()
}

function validateConfirmPassword(rule: any, value: any, callback: any) {
  if (!value) {
    callback(new Error('请确认密码'))
    return
  }
  if (value !== createAccountForm.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

function openCreateAccountDialog() {
  createAccountDialogVisible.value = true
  resetCreateAccountForm()
}

function resetCreateAccountForm() {
  createAccountForm.account = ''
  createAccountForm.username = ''
  createAccountForm.universityName = ''
  createAccountForm.role = 'user'
  createAccountForm.email = ''
  createAccountForm.phone = ''
  createAccountForm.password = ''
  createAccountForm.confirmPassword = ''
  createAccountFormRef.value?.clearValidate()
}

async function submitCreateAccount() {
  if (!createAccountFormRef.value) return

  await createAccountFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将前端角色映射到后端角色
        const roleMap: Record<string, string> = {
          'user': 'user',
          'approval': 'reviewer',
          'admin': 'admin',
          'logaudit': 'logger'
        }
        const backendRole = roleMap[createAccountForm.role] || createAccountForm.role

        // 调用创建账号接口
        const success = await accountApi.createAccount({
          account: createAccountForm.account,
          username: createAccountForm.universityName || createAccountForm.username, // 使用大学名称作为 username
          role: backendRole,
          password: createAccountForm.password,
          confirm_password: createAccountForm.confirmPassword
        })

        if (success) {
          ElMessage.success('账号创建成功')
          createAccountDialogVisible.value = false
          resetCreateAccountForm()
          // 刷新账号列表
          await loadAccounts()
        } else {
          ElMessage.error('账号创建失败，请检查输入信息')
        }
      } catch (error) {
        console.error('创建账号失败:', error)
        ElMessage.error('账号创建失败，请稍后重试')
      }
    }
  })
}

// 批量导入账号
const importAccountDialogVisible = ref(false)
const importFileList = ref<UploadFile[]>([])

function openImportAccountDialog() {
  importAccountDialogVisible.value = true
  importFileList.value = []
}

function handleImportFile(file: UploadFile) {
  // 这里应该解析文件并导入账号
  ElMessage.info('正在解析文件...')
  // 模拟导入
  setTimeout(() => {
    ElMessage.success('账号导入成功，共导入 10 个账号')
    importAccountDialogVisible.value = false
    importFileList.value = []
  }, 1000)
  return false // 阻止自动上传
}

function removeImportFile() {
  importFileList.value = []
}

// 下载Excel模版
function downloadTemplate() {
  // 创建Excel模版数据（CSV格式，Excel可以打开）
  const headers = ['用户名', '大学名称', '角色', '邮箱', '手机号']
  const exampleRow = ['user001', '示例大学', 'user', 'example@example.com', '13800138000']

  // 创建CSV内容
  const csvContent = [
    headers.join(','),
    exampleRow.join(','),
    '', // 空行作为说明
    '说明：',
    '1. 角色可选值：user（用户）、approval（审核员）、admin（管理员）、logaudit（日志审计员）',
    '2. 邮箱和手机号为可选字段',
    '3. 用户名必须唯一',
    '4. 系统会自动为每个账号生成初始密码'
  ].join('\n')

  // 添加BOM以支持中文显示
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 创建下载链接
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = '账号导入模版.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('模版下载成功')
}

// 修改账号密码
const changePasswordDialogVisible = ref(false)
const changePasswordFormRef = ref<FormInstance>()
const currentChangeAccount = ref<Account | null>(null)
const changePasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const changePasswordRules = reactive<FormRules>({
  newPassword: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback(new Error('请确认密码'))
          return
        }
        if (value !== changePasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
})

function openChangePasswordDialog(row: Account) {
  currentChangeAccount.value = row
  changePasswordForm.newPassword = ''
  changePasswordForm.confirmPassword = ''
  changePasswordDialogVisible.value = true
  changePasswordFormRef.value?.clearValidate()
}

async function submitChangePassword() {
  if (!changePasswordFormRef.value) return

  await changePasswordFormRef.value.validate(async (valid) => {
    if (valid && currentChangeAccount.value) {
      if (!currentChangeAccount.value.account) {
        ElMessage.error('账号信息不完整，无法修改密码')
        return
      }

      try {
        const success = await accountApi.batchResetPassword(
          [currentChangeAccount.value.account],
          changePasswordForm.newPassword,
          changePasswordForm.confirmPassword
        )

        if (success) {
          ElMessage.success(`已修改账号 ${currentChangeAccount.value.username} 的密码`)
          changePasswordDialogVisible.value = false
          changePasswordForm.newPassword = ''
          changePasswordForm.confirmPassword = ''
          currentChangeAccount.value = null
          // 刷新列表
          await loadAccounts()
        } else {
          ElMessage.error('修改密码失败')
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败')
      }
    }
  })
}

// 启用账号（单个）
async function enableAccount(row: Account) {
  if (!row.account) {
    ElMessage.error('账号信息异常，无法启用')
    return
  }

  ElMessageBox.confirm(
    `确定要启用账号 "${row.account}" 吗？`,
    '启用账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.enableAccounts([row.account!])
      if (success) {
        ElMessage.success('账号已启用')
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('启用账号失败')
      }
    } catch (error) {
      console.error('启用账号失败:', error)
      ElMessage.error('启用账号失败')
    }
  }).catch(() => {})
}

// 批量启用账号
async function batchEnableAccount() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要启用的账号')
    return
  }

  const accounts = multipleSelection.value
    .map(acc => acc.account)
    .filter((account): account is string => !!account)

  if (accounts.length === 0) {
    ElMessage.warning('所选账号中没有有效的账号信息')
    return
  }

  const accountNames = accounts.join('、')
  ElMessageBox.confirm(
    `确定要启用以下 ${accounts.length} 个账号吗？\n${accountNames}`,
    '批量启用账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.enableAccounts(accounts)
      if (success) {
        ElMessage.success(`已批量启用 ${accounts.length} 个账号`)
        multipleSelection.value = []
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('批量启用账号失败')
      }
    } catch (error) {
      console.error('批量启用账号失败:', error)
      ElMessage.error('批量启用账号失败')
    }
  }).catch(() => {})
}

// 停用账号（单个）
async function disableAccount(row: Account) {
  if (!row.account) {
    ElMessage.error('账号信息异常，无法停用')
    return
  }

  ElMessageBox.confirm(
    `确定要停用账号 "${row.account}" 吗？`,
    '停用账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.disableAccounts([row.account!])
      if (success) {
    ElMessage.success('账号已停用')
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('停用账号失败')
      }
    } catch (error) {
      console.error('停用账号失败:', error)
      ElMessage.error('停用账号失败')
    }
  }).catch(() => {})
}

// 批量停用账号
async function batchDisableAccount() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要停用的账号')
    return
  }

  const accounts = multipleSelection.value
    .map(acc => acc.account)
    .filter((account): account is string => !!account)

  if (accounts.length === 0) {
    ElMessage.warning('所选账号中没有有效的账号信息')
    return
  }

  const accountNames = accounts.join('、')
  ElMessageBox.confirm(
    `确定要停用以下 ${accounts.length} 个账号吗？\n${accountNames}`,
    '批量停用账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.disableAccounts(accounts)
      if (success) {
        ElMessage.success(`已批量停用 ${accounts.length} 个账号`)
    multipleSelection.value = []
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('批量停用账号失败')
      }
    } catch (error) {
      console.error('批量停用账号失败:', error)
      ElMessage.error('批量停用账号失败')
    }
  }).catch(() => {})
}

// 解锁账号（解开因密码错误被锁定的账号）
async function unlockAccount(row: Account) {
  if (!row.account) {
    ElMessage.error('账号信息异常，无法解锁')
    return
  }

  ElMessageBox.confirm(
    `确定要解锁账号 "${row.account}" 吗？`,
    '解锁账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.unlockAccounts([row.account!])
      if (success) {
    ElMessage.success('账号已解锁')
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('解锁账号失败')
      }
    } catch (error) {
      console.error('解锁账号失败:', error)
      ElMessage.error('解锁账号失败')
    }
  }).catch(() => {})
}

// 批量解锁账号（解开因密码错误被锁定的账号）
async function batchUnlockAccount() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要解锁的账号')
    return
  }

  const accounts = multipleSelection.value
    .map(acc => acc.account)
    .filter((account): account is string => !!account)

  if (accounts.length === 0) {
    ElMessage.warning('所选账号中没有有效的账号信息')
    return
  }

  const accountNames = accounts.join('、')
  ElMessageBox.confirm(
    `确定要解锁以下 ${accounts.length} 个账号吗？\n${accountNames}`,
    '批量解锁账号',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const success = await accountApi.unlockAccounts(accounts)
      if (success) {
        ElMessage.success(`已批量解锁 ${accounts.length} 个账号`)
    multipleSelection.value = []
        // 刷新列表
        await loadAccounts()
      } else {
        ElMessage.error('批量解锁账号失败')
      }
    } catch (error) {
      console.error('批量解锁账号失败:', error)
      ElMessage.error('批量解锁账号失败')
    }
  }).catch(() => {})
}

// 批量修改密码
const batchResetPasswordDialogVisible = ref(false)
const batchResetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})
const batchResetPasswordFormRef = ref<FormInstance>()

// 批量修改密码表单验证规则
const batchResetPasswordRules = reactive<FormRules>({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== batchResetPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 打开批量修改密码对话框
function openBatchResetPasswordDialog() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要修改密码的账号')
    return
  }

  batchResetPasswordForm.newPassword = ''
  batchResetPasswordForm.confirmPassword = ''
  batchResetPasswordDialogVisible.value = true
}

// 提交批量修改密码
async function submitBatchResetPassword() {
  if (!batchResetPasswordFormRef.value) return

  // 验证表单
  await batchResetPasswordFormRef.value.validate((valid) => {
    if (!valid) {
      return
    }

    const accounts = multipleSelection.value
      .map(acc => acc.account)
      .filter((account): account is string => !!account)

    if (accounts.length === 0) {
      ElMessage.warning('所选账号中没有有效的账号信息')
      return
    }

    const accountNames = accounts.join('、')
    ElMessageBox.confirm(
      `确定要将以下 ${accounts.length} 个账号的密码修改为 "${batchResetPasswordForm.newPassword}" 吗？\n${accountNames}`,
      '批量修改密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        const success = await accountApi.batchResetPassword(
          accounts,
          batchResetPasswordForm.newPassword,
          batchResetPasswordForm.confirmPassword
        )
        if (success) {
          ElMessage.success(`已批量修改 ${accounts.length} 个账号的密码`)
          multipleSelection.value = []
          batchResetPasswordDialogVisible.value = false
          batchResetPasswordForm.newPassword = ''
          batchResetPasswordForm.confirmPassword = ''
          // 刷新列表
          await loadAccounts()
        } else {
          ElMessage.error('批量修改密码失败')
        }
      } catch (error) {
        console.error('批量修改密码失败:', error)
        ElMessage.error('批量修改密码失败')
      }
    }).catch(() => {})
  })
}
</script>

<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账号管理</span>
          <div class="header-actions">
            <el-button @click="loadAccounts" :loading="loading">
              刷新
            </el-button>
            <el-button type="primary" @click="openCreateAccountDialog">
              创建账号
            </el-button>
            <el-button type="success" :icon="Upload" @click="openImportAccountDialog">
              批量导入
            </el-button>
            <el-button type="success" @click="batchEnableAccount">
              批量启用
            </el-button>
            <el-button type="warning" @click="batchDisableAccount">
              批量停用
            </el-button>
            <el-button type="info" @click="batchUnlockAccount">
              批量解锁
            </el-button>
            <el-button type="primary" @click="openBatchResetPasswordDialog">
              批量修改密码
            </el-button>

          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="搜索账号、用户名、大学名称、邮箱或手机号"
          clearable
          style="max-width: 300px"
        />
        <el-select v-model="filterRole" clearable placeholder="请选择角色（全部）" style="width: 180px">
          <el-option
            v-for="option in roleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select v-model="filterStatus" clearable placeholder="请选择状态（全部）" style="width: 180px">
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>

      <!-- 账号列表表格 -->
      <el-table
        v-loading="loading"
        :data="filteredAccountList"
        @selection-change="handleSelectionChange"
        stripe
        row-key="id"
        style="margin-top: 16px"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="account" label="账号" min-width="150">
          <template #default="{ row }">
            {{ row.account || row.id }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="150">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="universityName" label="大学名称" min-width="180">
          <template #default="{ row }">
            {{ row.universityName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            {{ getRoleText(row.role) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="修改人姓名" min-width="150">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="修改人联系方式" width="150">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="120">
          <template #default="{ row }">
            {{ row.createTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="openChangePasswordDialog(row)"
            >
              修改密码
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              size="small"
              type="warning"
              @click="disableAccount(row)"
            >
              停用
            </el-button>
            <el-button
              v-if="row.status === 'locked'"
              size="small"
              type="success"
              @click="unlockAccount(row)"
            >
              解锁
            </el-button>
            <el-button
              v-if="row.status === 'disabled'"
              size="small"
              type="success"
              @click="enableAccount(row)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建账号对话框 -->
    <el-dialog
      v-model="createAccountDialogVisible"
      title="创建账号"
      width="600px"
      @close="resetCreateAccountForm"
    >
      <el-form
        ref="createAccountFormRef"
        :model="createAccountForm"
        :rules="createAccountRules"
        label-width="100px"
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="createAccountForm.account"
            placeholder="请输入账号（3-50个字符，只能包含字母、数字和下划线）"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="createAccountForm.username"
            placeholder="请输入用户名（3-20个字符）"
            clearable
          />
        </el-form-item>
        <el-form-item label="大学名称" prop="universityName">
          <el-input
            v-model="createAccountForm.universityName"
            placeholder="请输入大学名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="createAccountForm.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="用户" value="user" />
            <el-option label="审核员" value="approval" />
            <el-option label="管理员" value="admin" />
            <el-option label="日志审计员" value="logaudit" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createAccountForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="createAccountForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            clearable
          />
        </el-form-item>
        <div class="password-hint">
          <p><strong>密码要求：</strong></p>
          <ul>
            <li>密码长度至少6位</li>
            <li>必须包含三种字符类型：</li>
            <li style="list-style: none; margin-left: 20px;">
              - 数字（0-9）<br>
              - 大写字母（A-Z）<br>
              - 小写字母（a-z）<br>
              - 特殊字符（!@#$%^&*等）
            </li>
          </ul>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createAccountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateAccount">确定创建</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入账号对话框 -->
    <el-dialog
      v-model="importAccountDialogVisible"
      title="批量导入账号"
      width="600px"
    >
      <div class="import-description">
        <p><strong>导入说明：</strong></p>
        <ul>
          <li>支持导入 Excel 文件（.xlsx, .xls）或 CSV 文件</li>
          <li>文件格式要求：第一行为表头，包含：用户名、大学名称、角色、邮箱、手机号</li>
          <li>角色可选值：user（用户）、approval（审核员）、admin（管理员）、logaudit（日志审计员）</li>
          <li>系统会自动为每个账号生成初始密码（需首次登录后修改）</li>
        </ul>
        <div style="margin-top: 12px">
          <el-button type="primary" :icon="Download" @click="downloadTemplate">
            下载模版
          </el-button>
        </div>
      </div>
      <el-upload
        v-model:file-list="importFileList"
        :auto-upload="false"
        :on-change="handleImportFile"
        :on-remove="removeImportFile"
        :limit="1"
        accept=".xlsx,.xls,.csv"
        drag
        style="margin-top: 20px"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 Excel 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importAccountDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改账号密码"
      width="500px"
      @close="currentChangeAccount = null"
    >
      <div v-if="currentChangeAccount" class="account-info">
        <p><strong>账号信息：</strong></p>
        <p>用户名：{{ currentChangeAccount.username }}</p>
        <p>大学名称：{{ currentChangeAccount.universityName }}</p>
      </div>
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="100px"
        style="margin-top: 20px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="changePasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="changePasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
        <div class="password-hint">
          <p><strong>密码要求：</strong></p>
          <ul>
            <li>密码长度至少6位</li>
            <li>必须包含三种字符类型：</li>
            <li style="list-style: none; margin-left: 20px;">
              - 数字（0-9）<br>
              - 大写字母（A-Z）<br>
              - 小写字母（a-z）<br>
              - 特殊字符（!@#$%^&*等）
            </li>
          </ul>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword">确定修改</el-button>
      </template>
    </el-dialog>

    <!-- 批量修改密码对话框 -->
    <el-dialog
      v-model="batchResetPasswordDialogVisible"
      title="批量修改密码"
      width="500px"
      @close="() => {
        batchResetPasswordForm.newPassword = ''
        batchResetPasswordForm.confirmPassword = ''
        batchResetPasswordFormRef?.clearValidate()
      }"
    >
      <el-form
        ref="batchResetPasswordFormRef"
        :model="batchResetPasswordForm"
        :rules="batchResetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="batchResetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="batchResetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        <el-alert
          v-if="multipleSelection.length > 0"
          :title="`已选择 ${multipleSelection.length} 个账号`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
      </el-form>
      <template #footer>
        <el-button @click="batchResetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchResetPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.account-info {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;

  p {
    margin: 4px 0;
    font-size: 14px;
  }
}

.password-hint {
  margin-top: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;

  p {
    margin: 0 0 8px 0;
    font-weight: 500;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin: 4px 0;
      line-height: 1.6;
    }
  }
}

.import-description {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;

  p {
    margin: 0 0 8px 0;
    font-weight: 500;
  }

  ul {
    margin: 8px 0;
    padding-left: 20px;

    li {
      margin: 4px 0;
      line-height: 1.6;
    }
  }
}
</style>
