<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { reviewApi } from '@/services/api'

type Registration = {
  id: string
  accountId: string  // 报名账号ID（同一大学使用同一账号）
  accountName: string // 账号名称（通常是大学名称）
  workName: string  // 节目名称
  name: string
  school: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string  // 驳回理由
  phone?: string
  email?: string
  // 用户报名表单字段（通用字段）
  contact?: string  // 联系人
  address?: string  // 地址
  intro?: string  // 简介
  // 演奏类字段
  performanceType?: string  // 表演形式
  minutes?: number  // 时长（分）
  seconds?: number  // 时长（秒）
  isOriginal?: boolean  // 是否原创
  group?: string  // 组别
  song1?: string  // 曲目1
  song2?: string  // 曲目2
  song1HasChinese?: boolean  // 曲目1是否中文作品
  song2HasChinese?: boolean  // 曲目2是否中文作品
  song1IsOriginal?: boolean  // 曲目1是否原创
  song2IsOriginal?: boolean  // 曲目2是否原创
  chorusCount?: number  // 合唱人数
  pianoAccompanist?: string  // 钢琴伴奏
  leader?: string  // 领队
  tutor?: string  // 指导教师
  // 美育改革创新字段
  caseName?: string  // 案例名称
  leaderName?: string  // 负责人姓名
  leaderTitle?: string  // 负责人职称
  caseCode?: string  // 案例代码
  submitUnit?: string  // 报送单位
  leaderUnit?: string  // 负责人单位
  leaderPhone?: string  // 负责人电话
  category?: string  // 类别（选题方向）
  // 花名册（简化显示，只显示数量）
  teachersCount?: number  // 教师数量
  membersCount?: number  // 成员数量
  accompCount?: number  // 伴奏数量
  // 上传文件（显示文件名列表）
  files?: Array<{ name: string; size?: number; type?: string; url?: string }>  // 上传的文件
  // 原始数据（用于详情展示）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any  // 保存原始后端数据
}

const keyword = ref('')
const filterType = ref<string>('')
const registrationDetailVisible = ref(false)
const currentDetail = ref<Registration | null>(null)
const loading = ref(false)

// 导出功能
const exportMaterialType = ref<string>('')
const materialTypeOptions = [
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
  { label: 'PDF', value: 'pdf' },
]

// 节目类型选项（用户端的12个类型）
const typeOptions = [
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

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 后端数据转换
function mapBackendStatus(status: string | undefined | null): Registration['status'] {
  const value = typeof status === 'string' ? status.toLowerCase() : ''
  if (['approved', 'pass', 'passed', '已通过'].includes(value)) {
    return 'approved'
  }
  if (['rejected', 'reject', '已驳回', 'failed'].includes(value)) {
    return 'rejected'
  }
  return 'pending'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVocalRegistration(record: Record<string, any>, index: number): Registration {
  const accountId = record?.account || record?.account_id || record?.user_account || record?.created_by?.toString() || `account-${index + 1}`
  const accountName = record?.account_name || record?.username || record?.school_name || accountId
  const participants = Array.isArray(record?.participants) ? record.participants : []
  const teachers = Array.isArray(record?.guide_teachers) ? record.guide_teachers : []
  const firstParticipant = participants.length > 0 ? participants[0] : null
  const firstTeacher = teachers.length > 0 ? teachers[0] : null
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName
  const workName = record?.song1_title || record?.work_title || record?.performance_title || record?.song2_title || record?.performance_description || `声乐节目-${index + 1}`

  const files = []
  if (record?.performance_video) {
    files.push({ name: '表演视频', type: 'video', size: undefined, url: record.performance_video })
  }
  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({ name: file?.name || '附件', type: file?.type, size: file?.size, url: file?.url })
    })
  }

  const instructor = teachers.find((t: { identity?: string }) => t.identity === 'teacher')
  const conductor = teachers.find((t: { identity?: string }) => t.identity === 'conductor')

  return {
    id: String(record?.id ?? record?.uuid ?? `${accountId}-${index + 1}`),
    accountId,
    accountName,
    workName,
    name: firstParticipant?.name || record?.contact_name || accountName,
    school: schoolName,
    type: '声乐报名',
    status: mapBackendStatus(record?.status),
    rejectReason: record?.rejection_reason || undefined,
    phone: record?.contact_phone || firstParticipant?.contact_phone || firstParticipant?.phone,
    email: record?.contact_email || '',
    contact: record?.contact_name,
    address: record?.contact_address,
    intro: record?.performance_description || record?.work_description,
    performanceType: record?.performance_type,
    minutes: Number(record?.duration_minutes ?? 0),
    seconds: Number(record?.duration_seconds ?? 0),
    isOriginal: Boolean(record?.song1_is_original ?? record?.is_original ?? false),
    group: record?.group_type,
    song1: record?.song1_title,
    song2: record?.song2_title,
    song1HasChinese: record?.song1_is_chinese,
    song2HasChinese: record?.song2_is_chinese,
    song1IsOriginal: record?.song1_is_original,
    song2IsOriginal: record?.song2_is_original,
    chorusCount: record?.performer_count,
    pianoAccompanist: record?.piano_accompaniment,
    leader: conductor?.name || record?.leader_name,
    tutor: instructor?.name,
    teachersCount: teachers.length || undefined,
    membersCount: participants.length || undefined,
    files: files.length > 0 ? files : undefined,
    rawData: record
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDanceRegistration(record: Record<string, any>, index: number): Registration {
  const accountId = record?.account || record?.account_id || record?.user_account || record?.created_by?.toString() || `account-${index + 1}`
  const accountName = record?.account_name || record?.username || record?.school_name || accountId
  const participants = Array.isArray(record?.participants) ? record.participants : []
  const teachers = Array.isArray(record?.guide_teachers) ? record.guide_teachers : []
  const firstParticipant = participants.length > 0 ? participants[0] : null
  const firstTeacher = teachers.length > 0 ? teachers[0] : null
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName
  const workName = record?.work_title || record?.performance_title || record?.work_description || `舞蹈作品-${index + 1}`

  const files = []
  if (record?.work_file) {
    files.push({ name: '作品文件', type: 'file', size: undefined, url: record.work_file })
  }
  if (record?.work_file_url) {
    files.push({ name: '作品文件', type: 'file', size: undefined, url: record.work_file_url })
  }
  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({ name: file?.name || '附件', type: file?.type, size: file?.size, url: file?.url })
    })
  }

  const instructor = teachers.find((t: { identity?: string }) =>
    t.identity === '指导教师' || t.identity === 'teacher' || t.identity === 'instructor'
  )

  return {
    id: String(record?.id ?? record?.uuid ?? `${accountId}-${index + 1}`),
    accountId,
    accountName,
    workName,
    name: firstParticipant?.name || record?.contact_name || accountName,
    school: schoolName,
    type: '舞蹈报名',
    status: mapBackendStatus(record?.status),
    rejectReason: record?.rejection_reason || undefined,
    phone: record?.contact_phone || firstParticipant?.phone || firstParticipant?.contact_phone,
    email: record?.contact_email || '',
    contact: record?.contact_name,
    address: record?.contact_address,
    intro: record?.work_description || record?.performance_description,
    performanceType: record?.performance_type,
    minutes: Number(record?.duration_minutes ?? 0),
    seconds: Number(record?.duration_seconds ?? 0),
    isOriginal: Boolean(record?.is_original ?? false),
    group: record?.group_type,
    chorusCount: record?.performer_count,
    tutor: instructor?.name,
    teachersCount: teachers.length || undefined,
    membersCount: participants.length || undefined,
    files: files.length > 0 ? files : undefined,
    rawData: record
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInstrumentalRegistration(record: Record<string, any>, index: number): Registration {
  const accountId = record?.account || record?.account_id || record?.user_account || record?.created_by?.toString() || `account-${index + 1}`
  const accountName = record?.account_name || record?.username || record?.school_name || accountId
  const participants = Array.isArray(record?.participants) ? record.participants : []
  const teachers = Array.isArray(record?.guide_teachers) ? record.guide_teachers : []
  const firstParticipant = participants.length > 0 ? participants[0] : null
  const firstTeacher = teachers.length > 0 ? teachers[0] : null
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName
  const workName = record?.work_title || record?.performance_title || record?.work_description || `器乐作品-${index + 1}`

  const files = []
  if (record?.work_file) {
    files.push({ name: '作品文件', type: 'file', size: undefined, url: record.work_file })
  }
  if (record?.work_file_url) {
    files.push({ name: '作品文件', type: 'file', size: undefined, url: record.work_file_url })
  }
  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({ name: file?.name || '附件', type: file?.type, size: file?.size, url: file?.url })
    })
  }

  const instructor = teachers.find((t: { identity?: string }) =>
    t.identity === 'teacher' || t.identity === '指导教师' || t.identity === 'instructor'
  )
  const conductor = record?.conductor

  return {
    id: String(record?.id ?? record?.uuid ?? `${accountId}-${index + 1}`),
    accountId,
    accountName,
    workName,
    name: firstParticipant?.name || record?.contact_name || accountName,
    school: schoolName,
    type: '器乐报名',
    status: mapBackendStatus(record?.status),
    rejectReason: record?.rejection_reason || undefined,
    phone: record?.contact_phone || firstParticipant?.phone || firstParticipant?.contact_phone,
    email: record?.contact_email || '',
    contact: record?.contact_name,
    address: record?.contact_address,
    intro: record?.work_description || record?.performance_description,
    performanceType: record?.performance_type,
    minutes: Number(record?.duration_minutes ?? 0),
    seconds: Number(record?.duration_seconds ?? 0),
    isOriginal: Boolean(record?.is_original ?? false),
    group: record?.group_type,
    chorusCount: record?.performer_count,
    leader: conductor?.conductor_name || conductor?.name || record?.leader_name,
    tutor: instructor?.name,
    teachersCount: teachers.length || undefined,
    membersCount: participants.length || undefined,
    files: files.length > 0 ? files : undefined,
    rawData: record
  }
}

// 匹配审核记录与报名记录
function matchReviewRecord(registration: Registration, reviewRecords: any[]): any | null {
  const typeMap: Record<string, string> = {
    '声乐报名': '声乐',
    '器乐报名': '器乐',
    '舞蹈报名': '舞蹈',
    '戏曲报名': '戏曲',
    '朗诵报名': '朗诵'
  }

  const programType = typeMap[registration.type] || registration.type.replace('报名', '').replace('作品', '')
  const workName = registration.workName || registration.rawData?.work_title || ''

  let matched = reviewRecords.find((review: any) => {
    const reviewProgramType = review.program_type || ''
    const reviewProgramName = review.program_name || ''
    const typeMatch = reviewProgramType === programType || reviewProgramType.toLowerCase() === programType.toLowerCase()
    const nameMatch = reviewProgramName.includes(workName) || workName.includes(reviewProgramName) || reviewProgramName === workName
    return typeMatch && nameMatch
  })

  if (!matched && registration.rawData?.created_at) {
    const submitTime = new Date(registration.rawData.created_at).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')

    matched = reviewRecords.find((review: any) => {
      const reviewProgramType = review.program_type || ''
      const typeMatch = reviewProgramType === programType || reviewProgramType.toLowerCase() === programType.toLowerCase()
      const timeMatch = review.submit_time && review.submit_time.includes(submitTime.split(' ')[0])
      return typeMatch && timeMatch
    })
  }

  return matched || null
}

const list = ref<Registration[]>([])

// 加载所有报名数据
const loadAllRegistrations = async () => {
  loading.value = true
  try {
    // 并行加载所有类型的报名数据和审核记录
    const [vocalData, danceData, instrumentalData, reviewRecords] = await Promise.all([
      reviewApi.getAllRegistrations('vocal').catch(err => {
        console.error('[StatisticsPage] 获取声乐报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('dance').catch(err => {
        console.error('[StatisticsPage] 获取舞蹈报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('instrumental').catch(err => {
        console.error('[StatisticsPage] 获取器乐报名列表失败:', err)
        return []
      }),
      reviewApi.getReviewRecords().catch(err => {
        console.error('[StatisticsPage] 获取审核记录列表失败:', err)
        return []
      })
    ])

    const allRegistrations: Registration[] = []

    // 处理声乐报名数据
    if (Array.isArray(vocalData)) {
      allRegistrations.push(...vocalData.map((item, index) => mapVocalRegistration(item, index)))
    }

    // 处理舞蹈报名数据
    if (Array.isArray(danceData)) {
      allRegistrations.push(...danceData.map((item, index) => mapDanceRegistration(item, index)))
    }

    // 处理器乐报名数据
    if (Array.isArray(instrumentalData)) {
      allRegistrations.push(...instrumentalData.map((item, index) => mapInstrumentalRegistration(item, index)))
    }

    // 匹配审核记录并更新状态
    if (Array.isArray(reviewRecords) && reviewRecords.length > 0) {
      allRegistrations.forEach((registration) => {
        const matchedReview = matchReviewRecord(registration, reviewRecords)
        if (matchedReview) {
          // 更新状态（审核记录的状态优先级更高）
          if (matchedReview.status) {
            const reviewStatus = matchedReview.status.toLowerCase()
            if (reviewStatus === 'approved') {
              registration.status = 'approved'
            } else if (reviewStatus === 'rejected') {
              registration.status = 'rejected'
              registration.rejectReason = matchedReview.rejection_reason || matchedReview.reason
            } else if (reviewStatus === 'pending') {
              registration.status = 'pending'
            }
          }
        }
      })
    }

    list.value = allRegistrations
  } catch (error) {
    console.error('[StatisticsPage] 加载报名列表失败:', error)
    ElMessage.error('加载报名数据失败，请稍后重试')
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllRegistrations()
})

// 筛选后的报名列表（按节目显示）
const filteredRegistrations = computed(() => {
  return list.value.filter(item => {
    const hit = item.accountName.includes(keyword.value) || item.workName.includes(keyword.value)
    const typeOk = !filterType.value || item.type === filterType.value
    return hit && typeOk
  })
})

// 分页后的数据
const paginatedRegistrations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRegistrations.value.slice(start, end)
})

// 总条数
const total = computed(() => filteredRegistrations.value.length)

// 分页改变
function handlePageChange(page: number) {
  currentPage.value = page
}

// 每页条数改变
function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

function viewRegistrationDetail(row: Registration) {
  currentDetail.value = row
  registrationDetailVisible.value = true
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  }
  return statusMap[status] || status
}

function getStatusType(status: string) {
  const typeMap: Record<string, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return typeMap[status] || 'info'
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 打开文件链接
function openFileUrl(url: string) {
  if (url) {
    window.open(url, '_blank')
  }
}

// 导出报名信息
function exportRegistrationInfo() {
  ElMessage.success('已导出报名信息Excel表格')
}

// 导出报名材料
function exportMaterials() {
  if (!exportMaterialType.value) {
    ElMessage.warning('请先选择材料类型')
    return
  }

  const typeName = materialTypeOptions.find(opt => opt.value === exportMaterialType.value)?.label || '材料'
  ElMessage.success(`已导出${typeName}材料`)
}
</script>

<template>
  <div>
    <!-- 导出功能按钮区域 -->
    <el-card class="mb20">
      <template #header>
        <div class="card-header">
          <span>导出功能</span>
        </div>
      </template>
      <div class="export-actions">
        <el-select
          v-model="exportMaterialType"
          placeholder="选择材料类型"
          style="width: 150px"
          clearable
        >
          <el-option
            v-for="option in materialTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-button type="primary" :icon="Download" @click="exportRegistrationInfo">
          导出报名信息
        </el-button>
        <el-button type="success" :icon="Download" @click="exportMaterials">
          导出报名材料
        </el-button>

      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <div class="filters">
            <el-input
              v-model="keyword"
              placeholder="搜索大学名称或节目名称"
              clearable
              style="max-width: 260px"
            />
            <el-select
              v-model="filterType"
              clearable
              placeholder="请选择节目类型（全部）"
              style="width: 220px"
              teleported
              :popper-options="{
                placement: 'bottom-start',
                modifiers: [
                  {
                    name: 'offset',
                    options: { offset: [0, 4] }
                  },
                  {
                    name: 'computeStyles',
                    options: {
                      gpuAcceleration: false,
                      adaptive: false
                    }
                  }
                ]
              }"
            >
              <el-option label="全部" value="" />
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <span>报名统计</span>
        </div>
      </template>
      <el-table
        :data="paginatedRegistrations"
        stripe
        row-key="id"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="80" :index="(index: number) => (currentPage - 1) * pageSize + index + 1" />
        <el-table-column prop="accountName" label="大学名称" min-width="200" />
        <el-table-column prop="workName" label="节目名" min-width="200" />
        <el-table-column prop="type" label="节目类型" min-width="180" />
        <el-table-column prop="accountId" label="账号ID" min-width="150" />
        <el-table-column prop="status" label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejectReason" label="驳回理由" min-width="250">
          <template #default="{ row }">
            <span v-if="row.rejectReason" style="color: #F56C6C">
              {{ row.rejectReason }}
            </span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="查看详情" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewRegistrationDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 单个报名详情弹窗 -->
    <el-dialog
      v-model="registrationDetailVisible"
      title="报名详细信息"
      width="800px"
      v-if="currentDetail"
    >
      <!-- 基本信息 -->
      <el-descriptions :column="2" border title="基本信息">
        <el-descriptions-item label="ID">{{ currentDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="大学名称">{{ currentDetail.accountName }}</el-descriptions-item>
        <el-descriptions-item label="节目名">{{ currentDetail.workName }}</el-descriptions-item>
        <el-descriptions-item label="账号ID">{{ currentDetail.accountId }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ currentDetail.school }}</el-descriptions-item>
        <el-descriptions-item label="节目类型">{{ currentDetail.type }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentDetail.status)" size="small">
            {{ getStatusText(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDetail.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentDetail.email || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.contact" label="联系人">{{ currentDetail.contact }}</el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.address" label="地址">{{ currentDetail.address }}</el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.rejectReason" label="驳回理由" :span="2">
          <span style="color: #F56C6C">{{ currentDetail.rejectReason }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 演奏类报名详情 -->
      <template v-if="['声乐报名', '器乐报名', '舞蹈报名', '戏曲报名', '朗诵报名'].includes(currentDetail.type)">
        <el-descriptions :column="2" border title="作品信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.performanceType" label="表演形式">
            {{ currentDetail.performanceType }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.minutes !== undefined && currentDetail.seconds !== undefined" label="作品时长">
            {{ currentDetail.minutes }}分{{ currentDetail.seconds }}秒
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.isOriginal !== undefined" label="是否原创">
            {{ currentDetail.isOriginal ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.group" label="组别">
            {{ currentDetail.group }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.song1" label="曲目1">
            {{ currentDetail.song1 }}
            <span v-if="currentDetail.song1HasChinese !== undefined">
              （{{ currentDetail.song1HasChinese ? '中文作品' : '非中文作品' }}）
            </span>
            <span v-if="currentDetail.song1IsOriginal !== undefined">
              {{ currentDetail.song1IsOriginal ? '原创作品' : '非原创作品' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.song2" label="曲目2">
            {{ currentDetail.song2 }}
            <span v-if="currentDetail.song2HasChinese !== undefined">
              （{{ currentDetail.song2HasChinese ? '中文作品' : '非中文作品' }}）
            </span>
            <span v-if="currentDetail.song2IsOriginal !== undefined">
              {{ currentDetail.song2IsOriginal ? '原创作品' : '非原创作品' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.chorusCount" label="合唱人数">
            {{ currentDetail.chorusCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.pianoAccompanist" label="钢琴伴奏">
            {{ currentDetail.pianoAccompanist === 'teacher' ? '老师' : currentDetail.pianoAccompanist === 'student' ? '学生' : currentDetail.pianoAccompanist }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leader" label="领队">
            {{ currentDetail.leader }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutor" label="指导教师">
            {{ currentDetail.tutor }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 美育改革创新详情 -->
      <template v-if="currentDetail.type === '美育改革创新优秀案例申报'">
        <el-descriptions :column="2" border title="案例信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.caseName" label="案例名称">
            {{ currentDetail.caseName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.caseCode" label="案例代码">
            {{ currentDetail.caseCode }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderName" label="负责人姓名">
            {{ currentDetail.leaderName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderTitle" label="负责人职称">
            {{ currentDetail.leaderTitle }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.submitUnit" label="报送单位">
            {{ currentDetail.submitUnit }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderUnit" label="负责人单位">
            {{ currentDetail.leaderUnit }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderPhone" label="负责人电话">
            {{ currentDetail.leaderPhone }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.category" label="类别（选题方向）">
            {{ currentDetail.category }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 简介 -->
      <div v-if="currentDetail.intro" style="margin-top: 20px">
        <h4>简介</h4>
        <div style="padding: 12px; background-color: #f5f7fa; border-radius: 4px; white-space: pre-wrap;">
          {{ currentDetail.intro }}
        </div>
      </div>

      <!-- 花名册信息 -->
      <div v-if="currentDetail.teachersCount !== undefined || currentDetail.membersCount !== undefined || currentDetail.accompCount !== undefined" style="margin-top: 20px">
        <h4>花名册信息</h4>
        <el-descriptions :column="3" border>
          <el-descriptions-item v-if="currentDetail.teachersCount !== undefined" label="教师数量">
            {{ currentDetail.teachersCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.membersCount !== undefined" label="成员数量">
            {{ currentDetail.membersCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.accompCount !== undefined" label="伴奏数量">
            {{ currentDetail.accompCount }}人
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 上传文件 -->
      <div v-if="currentDetail.files && currentDetail.files.length > 0" style="margin-top: 20px">
        <h4>上传文件</h4>
        <el-table :data="currentDetail.files" border size="small" max-height="200">
          <el-table-column prop="name" label="文件名" min-width="200">
            <template #default="{ row }">
              <a v-if="row.url" :href="row.url" target="_blank" style="color: #409EFF; text-decoration: none;">
                {{ row.name }}
              </a>
              <span v-else>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="文件类型" width="120">
            <template #default="{ row }">
              {{ row.type || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="文件大小" width="120">
            <template #default="{ row }">
              {{ row.size ? formatFileSize(row.size) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button v-if="row.url" type="primary" size="small" link @click="openFileUrl(row.url)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="registrationDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: visible;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  z-index: 10;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.mb20 {
  margin-bottom: 20px;
}

.export-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

// 修复下拉框对齐问题
:deep(.el-select) {
  .el-select__wrapper {
    position: relative;
  }
}

// 确保下拉菜单浮动在表单上方
:deep(.el-select-dropdown) {
  z-index: 3000 !important;
}

:deep(.program-type-select-dropdown) {
  min-width: 220px !important;
  margin-top: 4px !important;
  z-index: 3000 !important;
}
</style>
