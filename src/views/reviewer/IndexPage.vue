<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import { registrationApi, accountApi, reviewApi } from '@/services/api'
import { useUserStore } from '@/stores/user'

// 后端返回的大学统计数据
interface UniversityStat {
  account: string
  username: string
  total_registrations: number
  approved: number
  rejected: number
  pending: number
}

// 按大学统计的数据
type UniversityStats = {
  university: string  // 大学名称
  accountId: string    // 账号ID
  total: number        // 总报名数
  passed: number       // 已通过
  rejected: number     // 已驳回
  pending: number      // 待审核
}

const loading = ref(false)
const universityStatsData = ref<UniversityStat[]>([])
const overallStats = ref<{
  total_count: number
  approved_count: number
  rejected_count: number
  pending_count: number
  draft_count: number
}>({
  total_count: 0,
  approved_count: 0,
  rejected_count: 0,
  pending_count: 0,
  draft_count: 0
})

// 将后端返回的大学统计数据转换为前端显示格式
const universityStats = computed(() => {
  return universityStatsData.value.map(item => {
    return {
      university: item.username || item.account, // username 对应大学名字，如果没有则显示账号
      accountId: item.account, // account 对应账号
      total: item.total_registrations,
      passed: item.approved,
      rejected: item.rejected,
      pending: item.pending,
    }
  })
})

// 标记是否已加载整体统计数据
const overallStatsLoaded = ref(false)

// 整体统计数据（优先使用API返回的整体统计数据）
const summaryStats = computed(() => {
  // 如果已经加载了整体统计数据，优先使用API返回的数据（即使为0也要显示）
  if (overallStatsLoaded.value) {
    return {
      total: overallStats.value.total_count,
      passed: overallStats.value.approved_count,
      rejected: overallStats.value.rejected_count,
      pending: overallStats.value.pending_count,
    }
  }

  // 否则从各大学统计数据汇总
  const total = universityStats.value.reduce((sum, u) => sum + u.total, 0)
  const passed = universityStats.value.reduce((sum, u) => sum + u.passed, 0)
  const rejected = universityStats.value.reduce((sum, u) => sum + u.rejected, 0)
  const pending = universityStats.value.reduce((sum, u) => sum + u.pending, 0)

  return {
    total,
    passed,
    rejected,
    pending,
  }
})

// 信息汇总统计数据（用于表格）
const summaryTableData = computed(() => [
  {
    category: '总计',
    total: summaryStats.value.total,
    passed: summaryStats.value.passed,
    rejected: summaryStats.value.rejected,
    pending: summaryStats.value.pending,
  },
])

const keyword = ref('')
const filteredUniversities = computed(() => {
  return universityStats.value.filter(u =>
    u.university.includes(keyword.value)
  )
})

// 获取状态标签类型
function getStatusType(status: '已通过' | '已驳回' | '待审核') {
  switch (status) {
    case '已通过':
      return 'success'
    case '已驳回':
      return 'danger'
    case '待审核':
      return 'warning'
    default:
      return 'info'
  }
}

// 导出报名表相关
const selectedUser = ref('')
const selectedCategory = ref('')
const userList = ref<any[]>([])
const userListLoading = ref(false)
const userStore = useUserStore()

// 判断是否是管理员（只有管理员才能使用用户筛选功能）
const isAdmin = computed(() => userStore.role === 'admin')

// 节目类型选项（用户端的12个类型）
const categoryOptions = [
  { label: '全部', value: '' },
  { label: '声乐报名', value: '声乐报名' },
  { label: '器乐报名', value: '器乐报名' },
  { label: '舞蹈报名', value: '舞蹈报名' },
  { label: '戏曲报名', value: '戏曲报名' },
  { label: '朗诵报名', value: '朗诵报名' },
  { label: '书法作品', value: '书法作品' },
  { label: '绘画作品', value: '绘画作品' },
  { label: '设计作品', value: '设计作品' },
  { label: '摄影作品', value: '摄影作品' },
  { label: '微电影作品', value: '微电影作品' },
  { label: '艺术实践工作坊报名', value: '艺术实践工作坊报名' },
  { label: '美育改革创新优秀案例申报', value: '美育改革创新优秀案例申报' }
]

// 将前端类别选项值映射到后端 program_type 值
function mapCategoryToProgramType(category: string): string | null {
  const categoryMap: Record<string, string> = {
    '声乐报名': 'vocal',
    '器乐报名': 'instrumental',
    '舞蹈报名': 'dance',
    '戏曲报名': 'opera',
    '书法作品': 'calligraphy',
    '绘画作品': 'painting',
    '设计作品': 'design',
    '摄影作品': 'photography',
    '微电影作品': 'micro_film',
    '艺术实践工作坊报名': 'workshop'
  }
  return categoryMap[category] || null
}

// 导出盖章报名表对话框
type StampedFormItem = {
  id: string
  name: string
  school: string
  type: string
}

const exportStampedDialogVisible = ref(false)
const multipleSelection = ref<StampedFormItem[]>([])
const stampedList = ref<StampedFormItem[]>([
  { id: '1', name: '张三', school: 'A大学', type: 'A类' },
  { id: '2', name: '李四', school: 'B大学', type: 'B类' },
  { id: '3', name: '王五', school: 'A大学', type: 'A类' },
])

function handleStampedSelectionChange(rows: StampedFormItem[]) {
  multipleSelection.value = rows
}

function batchExportStamped() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要导出的报名表')
    return
  }
  ElMessage.success(`已批量导出 ${multipleSelection.value.length} 份盖章报名表`)
  exportStampedDialogVisible.value = false
  multipleSelection.value = []
}

function singleExportStamped(id: string) {
  ElMessage.success(`已导出ID为 ${id} 的盖章报名表`)
}

// 导出所有报名表
function exportAllRegistrationForms() {
  const userInfo = selectedUser.value
    ? userList.value.find(u => u.account === selectedUser.value)
    : null
  const userLabel = userInfo ? (userInfo.username || userInfo.account) : '全部'

  ElMessage.success(`正在导出${selectedUser.value ? `用户"${userLabel}"的` : ''}所有报名表...`)
  // TODO: 实现导出逻辑，传递 selectedUser.value 和 selectedCategory.value
}

// 导出选中类别报名表（支持按用户和按类型导出）
async function exportSelectedCategoryForms() {
  // 检查是否选择了用户或类别
  if (!selectedUser.value && !selectedCategory.value) {
    ElMessage.warning('请至少选择用户或类别')
    return
  }

  try {
    let blob: Blob
    let fileName = '报名材料'

    // 优先按用户导出（如果选择了用户）
    if (selectedUser.value) {
      const userInfo = userList.value.find(u => u.account === selectedUser.value)
      if (!userInfo) {
        ElMessage.error('用户信息不完整，无法导出')
        return
      }

      // 尝试获取用户ID：优先使用 id，其次使用 user_id，最后尝试将 account 转换为数字
      let userId: number | undefined
      if (userInfo.id && typeof userInfo.id === 'number') {
        userId = userInfo.id
      } else if (userInfo.user_id && typeof userInfo.user_id === 'number') {
        userId = userInfo.user_id
      } else if (userInfo.account && !isNaN(Number(userInfo.account))) {
        userId = Number(userInfo.account)
      }

      if (!userId) {
        ElMessage.error('无法获取用户ID，请检查用户信息')
        return
      }

      const userLabel = userInfo.username || userInfo.account
      fileName = `报名材料_用户_${userLabel}`

      ElMessage.info(`正在导出用户"${userLabel}"的报名材料...`)

      // 调用按用户导出接口
      blob = await reviewApi.exportMaterials({
        export_type: 'user',
        user_id: userId
      })
    } else if (selectedCategory.value) {
      // 按节目类型导出
      const programType = mapCategoryToProgramType(selectedCategory.value)

      if (!programType) {
        ElMessage.warning('该类别暂不支持导出，请选择其他类别')
        return
      }

      const categoryLabel = categoryOptions.find((opt) => opt.value === selectedCategory.value)?.label || ''
      fileName = `报名材料_类别_${categoryLabel}`

      ElMessage.info(`正在导出${categoryLabel}的报名材料...`)

      // 调用按节目类型导出接口
      blob = await reviewApi.batchExportByProgramType({
        program_type: programType
      })
    } else {
      ElMessage.warning('请至少选择用户或类别')
      return
    }

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 从响应头获取文件名，如果没有则使用默认文件名
    // 注意：由于是 blob 响应，可能需要从 Content-Disposition 头获取文件名
    // 这里先使用默认文件名，后续可以根据实际响应调整
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    link.download = `${fileName}_${timestamp}.zip`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error: unknown) {
    console.error('导出失败:', error)
    let errorMessage = '导出失败，请稍后重试'

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as Error).message
    }

    ElMessage.error(errorMessage)
  }
}

// 导出盖章报名表
function exportStampedForms() {
  exportStampedDialogVisible.value = true
}

// 上传盖章报名表相关
type UploadFile = {
  name?: string
  raw?: File
  [key: string]: unknown
}

const uploadFileList = ref<UploadFile[]>([])

// 上传文件处理
function handleUploadFile(file: UploadFile) {
  uploadFileList.value.push(file.raw ? file : file)
  return false // 阻止自动上传
}

// 删除文件
function handleRemoveFile(file: UploadFile) {
  const fileName = file.name || file.raw?.name
  const index = uploadFileList.value.findIndex((f: UploadFile) => {
    const fName = f.name || f.raw?.name
    return fName === fileName
  })
  if (index > -1) {
    uploadFileList.value.splice(index, 1)
  }
}

// 提交盖章报名表
function submitStampedForm() {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先上传盖章报名表')
    return
  }
  ElMessage.success('正在提交盖章报名表...')
  // TODO: 实现提交逻辑
}

// 加载整体报名统计数据
const loadOverallStats = async () => {
  try {
    console.log('[IndexPage] 开始加载整体报名统计数据')
    const data = await registrationApi.getStats()
    console.log('[IndexPage] 获取到的整体报名统计数据（原始）:', data)
    console.log('[IndexPage] 数据类型:', typeof data)
    console.log('[IndexPage] 数据是否为对象:', data && typeof data === 'object')

    if (data && typeof data === 'object') {
      const newStats = {
        total_count: Number(data.total_count) || 0,
        approved_count: Number(data.approved_count) || 0,
        rejected_count: Number(data.rejected_count) || 0,
        pending_count: Number(data.pending_count) || 0,
        draft_count: Number(data.draft_count) || 0
      }

      console.log('[IndexPage] 准备更新的统计数据:', newStats)
      overallStats.value = newStats
      // 标记已加载，即使数据为0也要使用API返回的数据
      overallStatsLoaded.value = true
      console.log('[IndexPage] 整体统计数据已更新:', overallStats.value)
      console.log('[IndexPage] summaryStats 计算后的值:', summaryStats.value)
      console.log('[IndexPage] summaryTableData 计算后的值:', summaryTableData.value)
    } else {
      console.warn('[IndexPage] 数据格式不正确，data:', data)
    }
  } catch (error) {
    console.error('[IndexPage] 加载整体报名统计数据失败:', error)
    // 不显示错误提示，因为这只是整体统计，不影响页面主要功能
    overallStatsLoaded.value = false
  }
}

// 加载各大学报名状态统计数据
const loadUniversityStats = async () => {
  try {
    console.log('[IndexPage] 开始加载各大学报名状态统计数据')
    const data = await registrationApi.getUniversityStats()
    console.log('[IndexPage] 获取到的各大学报名状态统计数据:', data)
    universityStatsData.value = data
  } catch (error) {
    console.error('[IndexPage] 加载各大学报名状态统计数据失败:', error)
    ElMessage.error('加载统计数据失败，请稍后重试')
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    // 并行加载整体统计数据和各大学报名状态统计数据
    await Promise.all([
      loadOverallStats(),
      loadUniversityStats()
    ])
  } catch (error) {
    console.error('[IndexPage] 加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载用户列表（只获取 role 为 'user' 的用户）
// 注意：此接口需要管理员权限，审核账号无法访问
const loadUserList = async () => {
  // 只有管理员才能访问用户列表接口
  if (!isAdmin.value) {
    // 审核账号不加载用户列表，静默跳过
    userListLoading.value = false
    return
  }

  userListLoading.value = true
  try {
    const result = await accountApi.getAccounts({ page: 1, page_size: 1000 })
    // 过滤出 role 为 'user' 的用户
    userList.value = result.users.filter((user: any) => user.role === 'user')
  } catch (error) {
    console.error('加载用户列表失败:', error)
    // 不显示错误提示，因为这只是可选功能
  } finally {
    userListLoading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAllData()
  loadUserList()
})

// 导出统计表
function exportStatistics() {
  try {
    // 构建CSV内容
    let csvContent = '\ufeff' // BOM for Excel
    csvContent += '审核端报名统计表\n'
    csvContent += `统计时间：${new Date().toLocaleString('zh-CN')}\n\n`

    // 整体统计
    csvContent += '整体统计\n'
    csvContent += '类别,总报名数,已通过,已驳回,待审核\n'
    summaryTableData.value.forEach(row => {
      csvContent += `${row.category},${row.total},${row.passed},${row.rejected},${row.pending}\n`
    })
    csvContent += '\n'

    // 各大学统计
    csvContent += '各大学统计\n'
    csvContent += '大学名称,账号ID,总报名节目数,已通过,已驳回,待审核\n'
    universityStats.value.forEach(stat => {
      csvContent += `${stat.university},${stat.accountId},${stat.total},${stat.passed},${stat.rejected},${stat.pending}\n`
    })

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `审核端报名统计表_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('导出统计表成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出统计表失败')
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 第一个表单：整体报名信息统计表格 -->
    <el-card class="mb20">
      <template #header>
        <div class="card-header">
          <span>整体报名信息统计</span>
          <el-button type="primary" :icon="Download" @click="exportStatistics" style="margin-left: 20px;padding-left: 10px;">
            导出统计表
          </el-button>
        </div>
      </template>

      <el-table :data="summaryTableData" border stripe v-loading="loading">
        <el-table-column prop="category" label="类别" min-width="120" />
        <el-table-column prop="total" label="总报名数" width="120" align="center" />
        <el-table-column prop="passed" label="已通过" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('已通过')" size="small">
              {{ row.passed }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejected" label="已驳回" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('已驳回')" size="small">
              {{ row.rejected }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pending" label="待审核" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('待审核')" size="small">
              {{ row.pending }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 第二个表单：各大学报名审核状态统计 -->
    <el-card class="mb20">
      <template #header>
        <div class="card-header">
          <span>各大学报名审核状态统计</span>
        </div>
      </template>

      <div class="search-wrapper mb12">
        <el-input
          v-model="keyword"
          placeholder="按大学名称搜索"
          clearable
          style="max-width: 260px"
        />
        <el-button type="primary">搜索</el-button>
      </div>

      <el-table :data="filteredUniversities" border stripe v-loading="loading">
        <el-table-column prop="university" label="大学名称" min-width="180" />
        <el-table-column prop="accountId" label="账号ID" min-width="140" />
        <el-table-column prop="total" label="总报名节目数" width="120" align="center" />
        <el-table-column prop="passed" label="已通过" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('已通过')" size="small">
              {{ row.passed }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejected" label="已驳回" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('已驳回')" size="small">
              {{ row.rejected }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pending" label="待审核" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType('待审核')" size="small">
              {{ row.pending }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 导出报名表卡片 -->
    <el-card class="mb20">
      <template #header>
        <div class="card-header">
          <span>导出报名表</span>
        </div>
      </template>
      <div class="export-section">
        <div class="export-description">
          您可以选择导出所有报名表数据,或按类别导出特定类型的报名表。
        </div>
        <div class="export-actions">
          <el-select
            v-if="isAdmin"
            v-model="selectedUser"
            placeholder="请选择用户 (全部)"
            style="width: 220px"
            clearable
            filterable
            :loading="userListLoading"
          >
            <el-option
              v-for="user in userList"
              :key="user.account"
              :label="user.username || user.account"
              :value="user.account"
            >
              <span>{{ user.username || user.account }}</span>
              <span v-if="user.username && user.account !== user.username" style="color: #909399; margin-left: 8px;">
                ({{ user.account }})
              </span>
            </el-option>
          </el-select>
          <el-select
            v-model="selectedCategory"
            placeholder="请选择节目类型 (全部)"
            style="width: 220px"
            clearable
          >
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button type="primary" :icon="Download" @click="exportAllRegistrationForms">
            导出所有报名表
          </el-button>
          <el-button type="success" :icon="Download" @click="exportSelectedCategoryForms">
            导出选中类别报名表
          </el-button>

          <el-button type="warning" :icon="Download" @click="exportStampedForms">
            导出盖章报名表
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 上传盖章报名表卡片 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>上传盖章报名表</span>
        </div>
      </template>
      <div class="upload-section">
        <el-upload
          :file-list="uploadFileList"
          class="upload-dragger"
          drag
          :auto-upload="false"
          :on-change="handleUploadFile"
          :on-remove="handleRemoveFile"
          :accept="'.pdf,.jpg,.jpeg,.png'"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">将盖章后的报名表拖到此处,或点击上传</div>
        </el-upload>
        <div class="upload-tip">支持:PDF、JPG、PNG格式。请上传已盖章的报名表扫描件或照片。</div>
        <div class="upload-submit">
          <el-button type="primary" :icon="Upload" @click="submitStampedForm">
            提交盖章报名表
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 导出盖章报名表对话框 -->
    <el-dialog
      v-model="exportStampedDialogVisible"
      title="导出盖章报名表"
      width="800px"
    >
      <div style="margin-bottom: 12px">
        <el-button type="primary" @click="batchExportStamped">批量导出</el-button>
      </div>
      <el-table
        :data="stampedList"
        @selection-change="handleStampedSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="school" label="学校" min-width="200" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="singleExportStamped(row.id)">单独导出</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="exportStampedDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.mb20 {
  margin-bottom: 20px;
}

.mb12 {
  margin-bottom: 12px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

// 导出报名表区域样式
.export-section {
  .export-description {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .export-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

// 上传盖章报名表区域样式
.upload-section {
  .upload-dragger {
    width: 100%;
    margin-bottom: 12px;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 40px;
    }

    :deep(.el-icon--upload) {
      font-size: 67px;
      color: #c0c4cc;
      margin: 40px 0 16px;
      line-height: 50px;
    }

    :deep(.el-upload__text) {
      color: #606266;
      font-size: 14px;
      text-align: center;
    }
  }

  .upload-tip {
    color: #909399;
    font-size: 12px;
    margin-bottom: 20px;
    text-align: center;
  }

  .upload-submit {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
