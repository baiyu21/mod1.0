<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { reviewApi } from '@/services/api'

type Registration = {
  id: string | number  // 支持字符串或数字类型，用于与审核记录的 object_id 匹配
  accountId: string  // 报名账号ID（同一大学使用同一账号）
  accountName: string // 账号名称（通常是大学名称）
  workName: string  // 节目名称
  name: string
  school: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string  // 驳回理由
  reviewId?: number  // 审核记录ID（用于审核操作，与报名记录ID不同）
  reviewer?: string  // 审核人
  reviewTime?: string  // 审核时间
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
  // 完整花名册数据（用于详情展示）
  guideTeachers?: Array<{
    id?: number
    name: string
    id_card?: string
    ethnicity?: string
    age?: number
    gender?: string
    region?: string
    school_name?: string
    department?: string
    contact_phone?: string
    identity?: string  // "teacher" | "conductor"
    role?: string
  }>
  participants?: Array<{
    id?: number
    name: string
    id_card?: string
    ethnicity?: string
    age?: number
    gender?: string
    region?: string
    school_name?: string
    department?: string
    grade?: string
    major_category?: string
    major_name?: string
    student_id?: string
    contact_phone?: string
  }>
  // 上传文件（显示文件名列表）
  files?: Array<{ name: string; size?: number; type?: string; url?: string }>  // 上传的文件
  // 原始数据（用于详情展示）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any  // 保存原始后端数据
}

const keyword = ref('')
const filterStatus = ref<string>('')
const filterType = ref<string>('')
const multipleSelection = ref<Registration[]>([])
const loading = ref(false)

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
const registrationDetailVisible = ref(false)
const currentDetail = ref<Registration | null>(null)
const rejectReasonDialogVisible = ref(false)
const rejectReason = ref('')
const currentRejectAccount = ref<string | number | null>(null)  // 当前要驳回的节目ID
const batchRejectReasonDialogVisible = ref(false)
const batchRejectReason = ref('')

const list = ref<Registration[]>([])
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

  // 从第一个参与者或第一个老师获取学校名称
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName

  // 节目名称：优先使用曲目1，其次曲目2，最后使用描述
  const workName =
    record?.song1_title ||
    record?.work_title ||
    record?.performance_title ||
    record?.song2_title ||
    record?.performance_description ||
    `声乐节目-${index + 1}`

  const files = []
  if (record?.performance_video) {
    files.push({
      name: '表演视频',
      type: 'video',
      size: undefined,
      url: record.performance_video
    })
  }

  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({
        name: file?.name || '附件',
        type: file?.type,
        size: file?.size,
        url: file?.url
      })
    })
  }

  // 获取指导老师（identity === "teacher"）
  const instructor = teachers.find((t: { identity?: string }) => t.identity === 'teacher')
  // 获取指挥（identity === "conductor"）
  const conductor = teachers.find((t: { identity?: string }) => t.identity === 'conductor')

  return {
    id: record?.id ?? index + 1, // 使用数字类型的 id，与审核记录的 object_id 匹配
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
    // 保存完整花名册数据
    guideTeachers: teachers.length > 0 ? teachers : undefined,
    participants: participants.length > 0 ? participants : undefined,
    files: files.length > 0 ? files : undefined,
    // 保存原始数据
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

  // 从第一个参与者或第一个老师获取学校名称
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName

  // 作品名称
  const workName = record?.work_title || record?.performance_title || record?.work_description || `舞蹈作品-${index + 1}`

  const files = []
  if (record?.work_file) {
    files.push({
      name: '作品文件',
      type: 'file',
      size: undefined,
      url: record.work_file
    })
  }
  if (record?.work_file_url) {
    files.push({
      name: '作品文件',
      type: 'file',
      size: undefined,
      url: record.work_file_url
    })
  }

  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({
        name: file?.name || '附件',
        type: file?.type,
        size: file?.size,
        url: file?.url
      })
    })
  }

  // 获取指导老师
  const instructor = teachers.find((t: { identity?: string }) =>
    t.identity === '指导教师' || t.identity === 'teacher' || t.identity === 'instructor'
  )

  return {
    id: record?.id ?? index + 1, // 使用数字类型的 id，与审核记录的 object_id 匹配
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
    // 保存完整花名册数据（用于统计）
    guideTeachers: teachers.length > 0 ? teachers : undefined,
    participants: participants.length > 0 ? participants : undefined,
    files: files.length > 0 ? files : undefined,
    // 保存原始数据
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

  // 从第一个参与者或第一个老师获取学校名称
  const schoolName = firstParticipant?.school_name || firstTeacher?.school_name || record?.school_name || accountName

  // 作品名称
  const workName = record?.work_title || record?.performance_title || record?.work_description || `器乐作品-${index + 1}`

  const files = []
  if (record?.work_file) {
    files.push({
      name: '作品文件',
      type: 'file',
      size: undefined,
      url: record.work_file
    })
  }
  if (record?.work_file_url) {
    files.push({
      name: '作品文件',
      type: 'file',
      size: undefined,
      url: record.work_file_url
    })
  }

  if (Array.isArray(record?.attachments)) {
    record.attachments.forEach((file: { name?: string; size?: number; type?: string; url?: string }) => {
      files.push({
        name: file?.name || '附件',
        type: file?.type,
        size: file?.size,
        url: file?.url
      })
    })
  }

  // 获取指导老师（identity === "teacher" 或 "指导教师"）
  const instructor = teachers.find((t: { identity?: string }) =>
    t.identity === 'teacher' || t.identity === '指导教师' || t.identity === 'instructor'
  )
  // 获取指挥（如果有 conductor 字段）
  const conductor = record?.conductor

  return {
    id: record?.id ?? index + 1, // 使用数字类型的 id，与审核记录的 object_id 匹配
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
    // 保存完整花名册数据（用于统计）
    guideTeachers: teachers.length > 0 ? teachers : undefined,
    participants: participants.length > 0 ? participants : undefined,
    files: files.length > 0 ? files : undefined,
    // 保存原始数据
    rawData: record
  }
}

// 单独加载声乐报名（保留以备将来使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadVocalRegistrations = async () => {
  loading.value = true
  try {
    const data = await reviewApi.getVocalRegistrations()
    if (Array.isArray(data)) {
      list.value = data.map((item, index) => mapVocalRegistration(item, index))
    } else {
      list.value = []
    }
  } catch (error) {
    console.error('[ApprovalPage] 获取声乐报名列表失败:', error)
    ElMessage.error('加载声乐报名数据失败，请稍后重试')
    list.value = []
  } finally {
    loading.value = false
    multipleSelection.value = []
  }
}

// 单独加载舞蹈报名（保留以备将来使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadDanceRegistrations = async () => {
  loading.value = true
  try {
    const data = await reviewApi.getDanceRegistrations()
    if (Array.isArray(data)) {
      const danceList = data.map((item, index) => mapDanceRegistration(item, index))
      list.value = [...list.value, ...danceList]
    }
  } catch (error) {
    console.error('[ApprovalPage] 获取舞蹈报名列表失败:', error)
    ElMessage.error('加载舞蹈报名数据失败，请稍后重试')
  } finally {
    loading.value = false
    multipleSelection.value = []
  }
}

// 匹配审核记录与报名记录
/**
 * 将 content_type 映射为报名类型
 * @param contentType 后端返回的 content_type（如 "vocalregistration"）
 * @returns 报名类型（如 "vocal"）
 */
function mapContentTypeToProgramType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'vocalregistration': 'vocal',
    'danceregistration': 'dance',
    'instrumentalregistration': 'instrumental',
    'operaregistration': 'opera',
    'recitationregistration': 'recitation',
    'calligraphyregistration': 'calligraphy',
    'paintingregistration': 'painting',
    'designregistration': 'design',
    'photographyregistration': 'photography',
    'microfilmregistration': 'microfilm'
  }
  return typeMap[contentType.toLowerCase()] || ''
}

/**
 * 将报名类型映射为 content_type
 * @param programType 报名类型（如 "vocal"）
 * @returns content_type（如 "vocalregistration"）
 */
function mapProgramTypeToContentType(programType: string): string {
  const typeMap: Record<string, string> = {
    'vocal': 'vocalregistration',
    'dance': 'danceregistration',
    'instrumental': 'instrumentalregistration',
    'opera': 'operaregistration',
    'recitation': 'recitationregistration',
    'calligraphy': 'calligraphyregistration',
    'painting': 'paintingregistration',
    'design': 'designregistration',
    'photography': 'photographyregistration',
    'microfilm': 'microfilmregistration'
  }
  return typeMap[programType.toLowerCase()] || ''
}

/**
 * 匹配审核记录
 * @param registration 报名记录
 * @param reviewRecords 审核记录列表
 * @returns 匹配的审核记录或 null
 */
function matchReviewRecord(registration: Registration, reviewRecords: any[]): any | null {
  // 获取报名记录的 ID（数字类型）
  let registrationId: number
  if (typeof registration.id === 'string') {
    // 如果是字符串，尝试提取数字部分（如 "vocal-1" -> 1）
    const numMatch = registration.id.match(/\d+/)
    registrationId = numMatch ? parseInt(numMatch[0], 10) : NaN
  } else {
    registrationId = registration.id as number
  }

  // 如果 ID 无效，返回 null
  if (isNaN(registrationId) || registrationId === null || registrationId === undefined) {
    return null
  }

  // 获取报名类型对应的 content_type
  // 从 registration.type 中提取类型（如 "声乐报名" -> "vocal"）
  let programType = ''
  if (registration.type?.includes('声乐')) {
    programType = 'vocal'
  } else if (registration.type?.includes('器乐')) {
    programType = 'instrumental'
  } else if (registration.type?.includes('舞蹈')) {
    programType = 'dance'
  } else if (registration.type?.includes('戏曲')) {
    programType = 'opera'
  } else if (registration.type?.includes('朗诵')) {
    programType = 'recitation'
  } else {
    // 尝试从 rawData 或其他字段获取类型
    programType = registration.rawData?.program_type || ''
  }

  const expectedContentType = mapProgramTypeToContentType(programType)

  // 根据 object_id 和 content_type 匹配
  const matched = reviewRecords.find((review: any) => {
    // object_id 必须匹配（都是数字类型）
    const reviewObjectId = typeof review.object_id === 'string'
      ? parseInt(review.object_id, 10)
      : review.object_id

    const idMatch = reviewObjectId === registrationId

    // content_type 必须匹配
    const contentTypeMatch = expectedContentType && (
      review.content_type === expectedContentType ||
      review.content_type?.toLowerCase() === expectedContentType.toLowerCase()
    )

    return idMatch && (contentTypeMatch || !expectedContentType) // 如果无法确定类型，只匹配 ID
  })

  if (matched) {
    return matched
  }

  // 如果没找到，尝试只匹配 object_id（可能 content_type 不匹配或无法确定类型）
  const matchedById = reviewRecords.find((review: any) => {
    const reviewObjectId = typeof review.object_id === 'string'
      ? parseInt(review.object_id, 10)
      : review.object_id
    return reviewObjectId === registrationId
  })

  return matchedById || null
}

const loadAllRegistrations = async () => {
  loading.value = true
  list.value = []
  try {
    // 并行加载所有类型的报名数据和审核记录
    // 使用统一接口 /api/registrations/all/?program_type=xxx 分别获取各类型报名详情
    // 使用 /api/review/reviews/ 获取审核状态
    const [vocalData, danceData, instrumentalData, reviewRecords] = await Promise.all([
      reviewApi.getAllRegistrations('vocal').catch(err => {
        console.error('[ApprovalPage] 获取声乐报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('dance').catch(err => {
        console.error('[ApprovalPage] 获取舞蹈报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('instrumental').catch(err => {
        console.error('[ApprovalPage] 获取器乐报名列表失败:', err)
        return []
      }),
      reviewApi.getReviewRecords().catch(err => {
        console.error('[ApprovalPage] 获取审核记录列表失败:', err)
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
      let matchedCount = 0
      let unmatchedCount = 0

      allRegistrations.forEach((registration) => {
        const matchedReview = matchReviewRecord(registration, reviewRecords)
        if (matchedReview) {
          // 确保 matchedReview.id 存在且有效
          if (matchedReview.id === undefined || matchedReview.id === null) {
            unmatchedCount++
            return
          }

          // 更新审核记录ID（用于审核操作）
          const reviewId = typeof matchedReview.id === 'number' ? matchedReview.id : Number(matchedReview.id)
          registration.reviewId = reviewId

          // 更新状态（审核记录的状态优先级更高）
          if (matchedReview.status) {
            const reviewStatus = matchedReview.status.toLowerCase()
            if (reviewStatus === 'approved') {
              registration.status = 'approved'
            } else if (reviewStatus === 'rejected') {
              registration.status = 'rejected'
              registration.rejectReason = matchedReview.rejection_reason || matchedReview.reason || ''
            } else if (reviewStatus === 'pending') {
              registration.status = 'pending'
            }
          }

          // 更新审核信息
          if (matchedReview.reviewer) {
            registration.reviewer = matchedReview.reviewer
          }
          if (matchedReview.updated_at) {
            registration.reviewTime = matchedReview.updated_at
          }

          matchedCount++
        } else {
          unmatchedCount++
        }
      })
    } else {
      console.warn('[ApprovalPage] 审核记录列表为空或格式错误')
    }

    list.value = allRegistrations
  } catch (error) {
    console.error('[ApprovalPage] 加载报名列表失败:', error)
    ElMessage.error('加载报名数据失败，请稍后重试')
    list.value = []
  } finally {
    loading.value = false
    multipleSelection.value = []
  }
}

onMounted(() => {
  loadAllRegistrations()
})

// 筛选后的报名列表（按节目显示）
const filteredRegistrations = computed(() => {
  return list.value.filter(item => {
    const hit = item.accountName.includes(keyword.value) || item.workName.includes(keyword.value)
    const statusOk = !filterStatus.value || item.status === filterStatus.value
    const typeOk = !filterType.value || item.type === filterType.value
    return hit && statusOk && typeOk
  })
})

function handleSelectionChange(rows: Registration[]) {
  multipleSelection.value = rows
}

function viewRegistrationDetail(row: Registration) {
  currentDetail.value = row
  registrationDetailVisible.value = true
}

// 审核通过（按节目）
async function approveRegistration(id: string | number) {
  console.log('[approveRegistration] 开始审核，前端ID:', id)
  console.log('[approveRegistration] 当前列表记录数:', list.value.length)
  console.log('[approveRegistration] 列表中的所有记录:', list.value.map(r => ({
    id: r.id,
    workName: r.workName,
    type: r.type,
    reviewId: r.reviewId,
    status: r.status
  })))

  // 通过ID查找（支持字符串和数字类型）
  const registration = list.value.find(r => {
    // 如果都是数字，直接比较
    if (typeof r.id === 'number' && typeof id === 'number') {
      return r.id === id
    }
    // 如果都是字符串，直接比较
    if (typeof r.id === 'string' && typeof id === 'string') {
      return r.id === id
    }
    // 如果类型不同，转换为字符串比较
    return String(r.id) === String(id)
  })

  if (!registration) {
    ElMessage.warning('该记录不存在')
    console.error('[approveRegistration] 未找到记录，ID:', id)
    console.error('[approveRegistration] 可用记录ID列表:', list.value.map(r => r.id))
    return
  }

  console.log('[approveRegistration] 找到的记录:', {
    id: registration.id,
    workName: registration.workName,
    type: registration.type,
    status: registration.status,
    reviewId: registration.reviewId,
    reviewIdType: typeof registration.reviewId,
    reviewIdValue: registration.reviewId
  })

  if (registration.status !== 'pending') {
    ElMessage.warning('该记录已审核，无法重复操作')
    return
  }

  // 必须使用审核记录ID（reviewId），审核操作需要审核记录的ID
  if (registration.reviewId === undefined || registration.reviewId === null) {
    ElMessage.error('无法获取审核记录ID，请刷新页面后重试')
    console.error('[approveRegistration] ❌ 缺少审核记录ID:', {
      frontendId: id,
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      workName: registration.workName,
      type: registration.type,
      registrationObject: JSON.stringify(registration, null, 2)
    })
    // 刷新列表数据，确保状态同步
    await loadAllRegistrations()
    return
  }

  // 确保 reviewId 是数字类型
  let numericRecordId: number
  if (typeof registration.reviewId === 'number') {
    numericRecordId = registration.reviewId
  } else if (typeof registration.reviewId === 'string') {
    numericRecordId = Number(registration.reviewId)
  } else {
    numericRecordId = Number(registration.reviewId)
  }

  if (isNaN(numericRecordId) || numericRecordId <= 0) {
    ElMessage.error('审核记录ID格式错误')
    console.error('[approveRegistration] ❌ 无效的审核记录ID:', {
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      numericRecordId,
      isNaN: isNaN(numericRecordId)
    })
    return
  }

  try {
    console.log('[approveRegistration] ✅ 准备调用审核接口:', {
      recordId: numericRecordId,
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      registrationType: registration.type,
      workName: registration.workName
    })
    // 使用审核记录ID（reviewId），不需要传递 program_type
    const success = await reviewApi.reviewAction(numericRecordId, 'approve')
    if (success) {
      // 更新本地状态
      list.value = list.value.map(i =>
        i.id === id ? { ...i, status: 'approved', rejectReason: undefined } : i
      )
      ElMessage.success('审核通过成功')
      // 可选：刷新列表数据以确保状态同步（如果需要从服务器获取最新状态）
      // await loadAllRegistrations()
    } else {
      ElMessage.error('审核操作失败，请稍后重试')
    }
  } catch (error) {
    console.error('[ApprovalPage] 审核通过失败:', error)
    // 处理已知的错误信息
    if (error instanceof Error) {
      const errorMessage = error.message
      // 检查是否是记录不存在的错误
      if (errorMessage.includes('审核记录不存在') || errorMessage.includes('记录不存在')) {
        ElMessage.error('审核记录不存在，请刷新页面后重试')
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else if (errorMessage.includes('已审核') || errorMessage.includes('无法重复操作')) {
        ElMessage.warning(errorMessage)
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else {
        ElMessage.error(errorMessage || '审核操作失败，请稍后重试')
      }
    } else {
      ElMessage.error('审核操作失败，请稍后重试')
    }
  }
}

// 打开驳回理由填写对话框
function openRejectReasonDialog(id: string | number) {
  currentRejectAccount.value = id
  rejectReason.value = ''
  rejectReasonDialogVisible.value = true
}

// 提交单个节目驳回
async function submitReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }
  if (!currentRejectAccount.value) return

  console.log('[submitReject] 开始驳回，前端ID:', currentRejectAccount.value)
  console.log('[submitReject] 当前列表记录数:', list.value.length)

  const registration = list.value.find(r => r.id === currentRejectAccount.value)
  if (!registration) {
    ElMessage.warning('该记录不存在')
    console.error('[submitReject] 未找到记录，ID:', currentRejectAccount.value)
    rejectReasonDialogVisible.value = false
    rejectReason.value = ''
    currentRejectAccount.value = null
    return
  }

  console.log('[submitReject] 找到的记录:', {
    id: registration.id,
    workName: registration.workName,
    type: registration.type,
    status: registration.status,
    reviewId: registration.reviewId,
    reviewIdType: typeof registration.reviewId,
    reviewIdValue: registration.reviewId
  })

  if (registration.status !== 'pending') {
    ElMessage.warning('该记录已审核，无法重复操作')
    rejectReasonDialogVisible.value = false
    rejectReason.value = ''
    currentRejectAccount.value = null
    return
  }

  // 必须使用审核记录ID（reviewId），审核操作需要审核记录的ID
  if (registration.reviewId === undefined || registration.reviewId === null) {
    ElMessage.error('无法获取审核记录ID，请刷新页面后重试')
    console.error('[submitReject] ❌ 缺少审核记录ID:', {
      frontendId: currentRejectAccount.value,
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      workName: registration.workName,
      type: registration.type,
      registrationObject: JSON.stringify(registration, null, 2)
    })
    // 刷新列表数据，确保状态同步
    await loadAllRegistrations()
    rejectReasonDialogVisible.value = false
    rejectReason.value = ''
    currentRejectAccount.value = null
    return
  }

  // 确保 reviewId 是有效的数字
  let numericRecordId: number
  if (typeof registration.reviewId === 'number') {
    numericRecordId = registration.reviewId
  } else if (typeof registration.reviewId === 'string') {
    numericRecordId = Number(registration.reviewId)
  } else {
    numericRecordId = Number(registration.reviewId)
  }

  if (isNaN(numericRecordId) || numericRecordId <= 0) {
    ElMessage.error('审核记录ID格式错误')
    console.error('[submitReject] ❌ 无效的审核记录ID:', {
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      numericRecordId,
      isNaN: isNaN(numericRecordId)
    })
    return
  }

  try {
    console.log('[submitReject] ✅ 准备调用审核接口:', {
      recordId: numericRecordId,
      reviewId: registration.reviewId,
      reviewIdType: typeof registration.reviewId,
      registrationType: registration.type,
      workName: registration.workName
    })
    // 使用审核记录ID（reviewId），不需要传递 program_type
    const success = await reviewApi.reviewAction(numericRecordId, 'reject', rejectReason.value.trim())
    if (success) {
      // 更新本地状态
      list.value = list.value.map(i =>
        i.id === currentRejectAccount.value
          ? { ...i, status: 'rejected', rejectReason: rejectReason.value.trim() }
          : i
      )
      ElMessage.success('已驳回')
      rejectReasonDialogVisible.value = false
      rejectReason.value = ''
      currentRejectAccount.value = null
    } else {
      ElMessage.error('驳回操作失败，请稍后重试')
    }
  } catch (error) {
    console.error('[ApprovalPage] 驳回失败:', error)
    // 处理已知的错误信息
    if (error instanceof Error) {
      const errorMessage = error.message
      // 检查是否是记录不存在的错误
      if (errorMessage.includes('审核记录不存在') || errorMessage.includes('记录不存在')) {
        ElMessage.error('审核记录不存在，请刷新页面后重试')
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else if (errorMessage.includes('已审核') || errorMessage.includes('无法重复操作')) {
        ElMessage.warning(errorMessage)
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else {
        ElMessage.error(errorMessage || '驳回操作失败，请稍后重试')
      }
    } else {
      ElMessage.error('驳回操作失败，请稍后重试')
    }
  }
}

// 打开批量驳回理由填写对话框
function openBatchRejectReasonDialog() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要审核的节目')
    return
  }
  const workNames = multipleSelection.value.map(r => r.workName)

  ElMessageBox.confirm(
    `确定要驳回以下 ${multipleSelection.value.length} 个节目的报名吗？\n节目：${workNames.join('、')}`,
    '批量驳回',
    {
      confirmButtonText: '填写驳回理由',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true,
    }
  ).then(() => {
    batchRejectReason.value = ''
    batchRejectReasonDialogVisible.value = true
  }).catch(() => {})
}

// 提交批量驳回
async function submitBatchReject() {
  if (!batchRejectReason.value.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }

  const pendingRegistrations = multipleSelection.value.filter(r => r.status === 'pending')
  if (pendingRegistrations.length === 0) {
    ElMessage.warning('所选记录中没有待审核的记录')
    return
  }

  try {
    // 提取所有待审核记录的ID
    const recordIds: (string | number)[] = []
    const validRegistrations: Registration[] = []

    pendingRegistrations.forEach((registration) => {
      // 必须使用审核记录ID（reviewId），审核操作需要审核记录的ID
      if (registration.reviewId && !isNaN(Number(registration.reviewId))) {
        recordIds.push(Number(registration.reviewId))
        validRegistrations.push(registration)
      } else {
        console.warn('[submitBatchReject] 缺少审核记录ID，跳过该记录:', {
          id: registration.id,
          reviewId: registration.reviewId,
          workName: registration.workName,
          type: registration.type
        })
      }
    })

    if (recordIds.length === 0) {
      ElMessage.error('没有有效的记录ID')
      return
    }

    // 使用批量接口提交驳回
    const success = await reviewApi.batchReviewAction(recordIds, 'reject', batchRejectReason.value.trim())

    if (success) {
      // 更新本地状态
      const ids = new Set(validRegistrations.map(r => r.id))
      list.value = list.value.map(i =>
        ids.has(i.id) && i.status === 'pending'
          ? { ...i, status: 'rejected', rejectReason: batchRejectReason.value.trim() }
          : i
      )

      ElMessage.success(`已批量驳回 ${recordIds.length} 个节目的报名`)
      batchRejectReasonDialogVisible.value = false
      batchRejectReason.value = ''
      multipleSelection.value = []
    } else {
      ElMessage.error('批量驳回操作失败，请稍后重试')
    }
  } catch (error) {
    console.error('[ApprovalPage] 批量驳回失败:', error)
    // 处理已知的错误信息
    if (error instanceof Error) {
      const errorMessage = error.message
      if (errorMessage.includes('已审核') || errorMessage.includes('无法重复操作')) {
        ElMessage.warning(errorMessage)
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else {
        ElMessage.error(errorMessage || '批量驳回操作失败，请稍后重试')
      }
    } else {
      ElMessage.error('批量驳回操作失败，请稍后重试')
    }
  }
}

// 批量审核通过（按节目）
async function batchApprove() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要审核的节目')
    return
  }

  const pendingRegistrations = multipleSelection.value.filter(r => r.status === 'pending')
  if (pendingRegistrations.length === 0) {
    ElMessage.warning('所选记录中没有待审核的记录')
    return
  }

  try {
    // 提取所有待审核记录的ID
    const recordIds: (string | number)[] = []
    const validRegistrations: Registration[] = []

    pendingRegistrations.forEach((registration) => {
      // 必须使用审核记录ID（reviewId），审核操作需要审核记录的ID
      if (registration.reviewId && !isNaN(Number(registration.reviewId))) {
        recordIds.push(Number(registration.reviewId))
        validRegistrations.push(registration)
      } else {
        console.warn('[batchApprove] 缺少审核记录ID，跳过该记录:', {
          id: registration.id,
          reviewId: registration.reviewId,
          workName: registration.workName,
          type: registration.type
        })
      }
    })

    if (recordIds.length === 0) {
      ElMessage.error('没有有效的记录ID')
      return
    }

    // 使用批量接口提交审核
    const success = await reviewApi.batchReviewAction(recordIds, 'approve')

    if (success) {
      // 更新本地状态
      const ids = new Set(validRegistrations.map(r => r.id))
      list.value = list.value.map(i =>
        ids.has(i.id) && i.status === 'pending'
          ? { ...i, status: 'approved', rejectReason: undefined }
          : i
      )

      ElMessage.success(`已批量通过 ${recordIds.length} 个节目的报名`)
      multipleSelection.value = []
    } else {
      ElMessage.error('批量审核操作失败，请稍后重试')
    }
  } catch (error) {
    console.error('[ApprovalPage] 批量审核通过失败:', error)
    // 处理已知的错误信息
    if (error instanceof Error) {
      const errorMessage = error.message
      if (errorMessage.includes('已审核') || errorMessage.includes('无法重复操作')) {
        ElMessage.warning(errorMessage)
        // 刷新列表数据，确保状态同步
        await loadAllRegistrations()
      } else {
        ElMessage.error(errorMessage || '批量审核操作失败，请稍后重试')
      }
    } else {
      ElMessage.error('批量审核操作失败，请稍后重试')
    }
  }
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
</script>

<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审核报名</span>
          <div class="filters">
            <el-input
              v-model="keyword"
              placeholder="搜索大学名称或节目名称"
              clearable
              style="max-width: 260px"
            />
            <el-select v-model="filterStatus" clearable placeholder="请选择审核状态（全部）" style="width: 220px">
              <el-option label="全部" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            <el-select v-model="filterType" clearable placeholder="请选择节目类型（全部）" style="width: 220px">
              <el-option label="全部" value="" />
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-button type="success" @click="batchApprove">批量审核通过</el-button>
            <el-button type="danger" @click="openBatchRejectReasonDialog">批量审核不通过</el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="filteredRegistrations"
        @selection-change="handleSelectionChange"
        stripe
        row-key="id"
        v-loading="loading"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="accountName" label="大学名称" min-width="200" />
        <el-table-column prop="workName" label="节目名" min-width="200" />
        <el-table-column prop="type" label="节目类型" min-width="180" />
        <el-table-column prop="accountId" label="账号ID" min-width="150" />
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
        <el-table-column label="审核状态/操作" width="220" fixed="right">
          <template #default="{ row }">
            <!-- 待审核状态：显示操作按钮 -->
            <template v-if="row.status === 'pending'">
              <el-button
                size="small"
                type="success"
                @click="approveRegistration(row.id)"
              >
                通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="openRejectReasonDialog(row.id)"
              >
                驳回
              </el-button>
            </template>
            <!-- 已审核状态：显示状态标签 -->
            <template v-else>
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
      </el-table>
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
                <el-icon style="margin-left: 4px;"><Link /></el-icon>
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

    <!-- 驳回理由填写弹窗 -->
    <el-dialog
      v-model="rejectReasonDialogVisible"
      title="填写驳回理由"
      width="600px"
      @close="rejectReason = ''; currentRejectAccount = null"
    >
      <el-form>
        <el-form-item label="驳回理由" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="5"
            placeholder="请详细填写驳回理由"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectReasonDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确定驳回</el-button>
      </template>
    </el-dialog>

    <!-- 批量驳回理由填写弹窗 -->
    <el-dialog
      v-model="batchRejectReasonDialogVisible"
      title="填写批量驳回理由"
      width="600px"
      @close="batchRejectReason = ''"
    >
      <el-form>
        <el-form-item label="驳回理由" required>
          <el-input
            v-model="batchRejectReason"
            type="textarea"
            :rows="5"
            placeholder="请填写驳回理由，该理由将应用于所有选中的账号"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRejectReasonDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitBatchReject">确定批量驳回</el-button>
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

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>


