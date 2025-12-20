<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>器乐作品报名表</span>
        </div>
      </template>
      <div class="intro-text">
        合奏：乐队人数不超过65人，指挥1人（鼓励本校教师担任），演出时间不超过9分钟，鼓励演奏中国作品。<br />
        小合奏或重奏：人数不超过12人，不设指挥，演出时间不超过6分钟。
      </div>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-1">
      <template #header><div class="ef-card-title"><span>作品信息</span></div></template>
      <div class="ef-sec-watermark">1</div>
      <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="120px" :disabled="readonly" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="表演形式" prop="performanceType">
              <el-select v-model="baseForm.performanceType" placeholder="请选择" style="width: 100%">
                <el-option label="合奏" value="ensemble" />
                <el-option label="小合奏" value="small-ensemble" />
                <el-option label="重奏" value="chamber" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="表演人数" prop="count">
              <el-input v-model.number="baseForm.count" type="number" min="1" placeholder="请输入表演人数" />
              <!-- 人数限制提示 -->
              <div v-if="memberLimitInfo.maxCount !== undefined && baseForm.count" class="member-limit-tip-input" :class="{ 'limit-exceeded': isExceededLimit }">
                <el-alert
                  v-if="isExceededLimit"
                  type="error"
                  :closable="false"
                  show-icon
                  :title="`当前人数为 ${baseForm.count}人，超过了最大人数限制 ${memberLimitInfo.maxCount}人，请减少人数后再提交`"
                />
                <div v-else class="limit-info">
                  当前人数：<strong>{{ baseForm.count }}人</strong> / 最大人数：<strong>{{ memberLimitInfo.maxCount }}人</strong>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="作品名称" prop="workName">
              <el-input v-model="baseForm.workName" placeholder="请输入作品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作品时长" prop="minutes">
              <div class="ef-duration">
                <el-input v-model.number="baseForm.minutes" type="number" min="0" style="width:80px" />
                <span class="ef-unit">分</span>
                <el-input v-model.number="baseForm.seconds" type="number" min="0" max="59" style="width:80px" />
                <span class="ef-unit">秒</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="是否为本次参演原创" prop="isOriginal">
              <el-radio-group v-model="baseForm.isOriginal">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="ef-contact-section">
          <h4 class="ef-section-title">联系信息</h4>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系人姓名" prop="contact">
                <el-input v-model="baseForm.contact" placeholder="请输入中文姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人电话" prop="phone">
                <el-input v-model="baseForm.phone" placeholder="请输入11位手机号" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系地址" prop="address">
                <el-input v-model="baseForm.address" placeholder="请输入详细地址（至少5个字符）" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="组别" prop="group">
                <el-select v-model="baseForm.group" placeholder="请选择" style="width: 100%">
                  <el-option label="甲组(非专业组)" value="group1" />
                  <el-option label="乙组（专业组）" value="group2" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-2">
      <template #header>
        <div class="ef-card-title">
          <span>作品简介</span>
          <span class="ef-desc-tip">（最多 200 字）</span>
        </div>
      </template>
      <div class="ef-sec-watermark">2</div>
      <el-input v-model="intro" type="textarea" :rows="7" maxlength="200" show-word-limit placeholder="请填写作品简介" :disabled="readonly" />
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-3">
      <template #header><div class="ef-card-title"><span>上传作品</span></div></template>
      <div class="ef-sec-watermark">3</div>
      <FileUploadBlock
        ref="fileUploadRef"
        v-model="fileList"
        :accept="accepts"
        :limit="6"
        :readonly="readonly"
        :upload-category="'instrumental'"
        tip="音频、乐谱、图片、视频等多格式支持，所有作品资料请合规提交。"
      />
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-4">
      <template #header><div class="ef-card-title"><span>报名花名册</span></div></template>
      <div class="ef-sec-watermark">4</div>
      <TeacherBlock v-model:rows="teachers" :readonly="readonly" />
      <MemberBlock class="ef-mt16" v-model:rows="members" :readonly="readonly" />

    </el-card>
    <div class="notice">
      <div class="notice-content">
        <p style="color: red">请仔细阅读报名须知，确认无误后勾选报名须知，即可进行报名。</p>
        <el-row :gutter="34">
          <el-col :span="12">
            <el-form-item label="报名须知" prop="notice">
              <el-checkbox v-model="baseForm.notice" required>我已仔细阅读并同意报名须知</el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="ef-actions">
      <el-button size="large" @click="onSave" :disabled="readonly">暂存</el-button>
      <el-button type="primary" size="large" @click="onSubmit" :disabled="readonly || !baseForm.notice">提交报名表</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup name="InstrumentalRegistrationForm">
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { calculateTotalMemberCount, checkMemberLimit, getMemberLimitInfo } from '@/utils/memberLimit'
import TeacherBlock from '@/components/TeacherBlock.vue'
import MemberBlock from '@/components/MemberBlock.vue'
import FileUploadBlock, { type FileItem as UploadFileItem } from '@/components/FileUploadBlock.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { commonRules } from '@/composables/useForm'
import { registrationApi } from '@/services/api'

interface BaseForm {
  performanceType: string
  workName: string
  minutes: number
  seconds: number
  isOriginal: boolean
  contact: string
  phone: string
  address: string
  group: string
  notice: boolean
  count?: number
}
interface FileItem {
  name: string
  size: number
  type?: string
  url?: string
}
interface RosterItem {
  name?: string
  gender?: 'male' | 'female'
  title?: string
  org?: string
  phone?: string
  idNo?: string
  nation?: string
  major?: string
  majorName?: string // 专业名称（与专业类别区分）
  region?: string
  school?: string
  dept?: string
  age?: number | string
  grade?: string
  studentId?: string
  studentNo?: string // 兼容学号字段
}
interface SubmitPayload {
  base: BaseForm
  intro: string
  files: FileItem[]
  rosters: {
    teachers: RosterItem[]
    members: RosterItem[]
    accomp: RosterItem[]
  }
}
defineProps<{ readonly?: boolean }>()
const emit = defineEmits<{ (e: 'submit', payload: SubmitPayload): void }>()

// 表单引用和验证规则
const formRef = ref<FormInstance>()
const formRules: FormRules = {
  performanceType: [
    { required: true, message: '请选择表演形式', trigger: 'change' }
  ],
  count: [
    { required: true, message: '请输入表演人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数不能小于1', trigger: 'blur' }
  ],
  workName: [
    { required: true, message: '请输入作品名称', trigger: 'blur' }
  ],
  minutes: [
    { required: true, message: '请输入作品时长（分钟）', trigger: 'blur' },
    { type: 'number', min: 0, message: '分钟数不能小于0', trigger: 'blur' }
  ],
  isOriginal: [
    { required: true, message: '请选择是否为原创', trigger: 'change' }
  ],
  group: [
    { required: true, message: '请选择组别', trigger: 'change' }
  ],
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address
}

const baseForm = reactive<BaseForm>({
  performanceType: '',
  workName: '',
  minutes: 0,
  seconds: 0,
  isOriginal: false,
  contact: '',
  phone: '',
  address: '',
  group: '',
  notice: false,
  count: undefined
})
const intro = ref('')
const accepts = '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
const fileList = ref<UploadFileItem[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUploadBlock>>()

const teachers = ref<RosterItem[]>([])
const members = ref<RosterItem[]>([])
const accomp = ref<RosterItem[]>([])
const onSave = () => {
  const saveData = {
    base: baseForm,
    intro: intro.value,
    files: fileList.value,
    rosters: {
      teachers: teachers.value,
      members: members.value,
      accomp: accomp.value
    }
  }
  try {
    localStorage.setItem('instrumentFormDraft', JSON.stringify(saveData))
    ElMessage.success('表单已暂存成功')
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请重试')
  }
}
const route = useRoute()

// 实时人数限制检查 - 检查输入框中的数值
const memberLimitInfo = computed(() => {
  const routeName = route.name as string
  // 根据表演形式（合奏、小合奏、重奏）获取对应的人数限制
  const categoryValue = baseForm.performanceType || undefined
  return getMemberLimitInfo(routeName, categoryValue)
})

const isExceededLimit = computed(() => {
  const { maxCount } = memberLimitInfo.value
  if (maxCount === undefined || !baseForm.count) {
    return false
  }
  return baseForm.count > maxCount
})

/**
 * 转换花名册数据为后端格式 - 指导教师
 * 注意：如果前端没有输入框但后端需要，使用默认值
 */
const transformGuideTeachers = (teachers: RosterItem[]) => {
  console.log('[transformGuideTeachers] 原始数据:', teachers)
  console.log('[transformGuideTeachers] 原始数据长度:', teachers.length)

  // 详细检查每条记录
  teachers.forEach((teacher, index) => {
    console.log(`[transformGuideTeachers] 教师 ${index} 的完整数据:`, JSON.parse(JSON.stringify(teacher)))
    console.log(`[transformGuideTeachers] 教师 ${index} 的所有键:`, Object.keys(teacher || {}))
  })

  const result = teachers
    .filter(teacher => {
      // 尝试多种可能的字段名
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameValue = teacher.name || (teacher as any).姓名 || (teacher as any).Name || ''
      const hasName = nameValue && String(nameValue).trim()
      console.log('[transformGuideTeachers] 过滤检查:', {
        name: teacher.name,
        nameValue,
        hasName,
        allKeys: Object.keys(teacher || {})
      })
      return hasName
    }) // 只包含有姓名的记录
    .map(teacher => {
      // 处理民族字段：如果输入的是"汉"，转换为"汉族"
      const nationValue = String(teacher.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      const transformed = {
        name: String(teacher.name || '').trim(),
        id_card_number: String(teacher.idNo || '').trim() || '000000000000000000', // 默认身份证号
        ethnicity: ethnicity, // 确保是"汉族"而不是"汉"
        age: Number(teacher.age) || 35, // 默认年龄35岁（教师）
        gender: teacher.gender === 'male' ? 'male' : (teacher.gender === 'female' ? 'female' : 'male'), // 默认男性
        region: String(teacher.region || '').trim() || '北京市', // 默认地区
        school_name: String(teacher.school || '').trim() || '未填写', // 默认学校
        department: String(teacher.org || teacher.dept || '').trim() || '未填写', // 默认部门
        phone: String(teacher.phone || '').trim() || '13800000000' // 默认手机号
      }
      return transformed
    })
  console.log('[transformGuideTeachers] 转换后数据:', result)
  return result
}

/**
 * 转换参赛人员数据为后端格式
 * 注意：如果前端没有输入框但后端需要，使用默认值
 */
const transformParticipants = (members: RosterItem[]) => {
  console.log('[transformParticipants] 原始数据:', members)
  console.log('[transformParticipants] 原始数据长度:', members.length)

  // 详细检查每条记录
  members.forEach((member, index) => {
    console.log(`[transformParticipants] 成员 ${index} 的完整数据:`, JSON.parse(JSON.stringify(member)))
    console.log(`[transformParticipants] 成员 ${index} 的所有键:`, Object.keys(member || {}))
  })

  const result = members
    .filter(member => {
      // 尝试多种可能的字段名
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameValue = member.name || (member as any).姓名 || (member as any).Name || ''
      const hasName = nameValue && String(nameValue).trim()
      console.log('[transformParticipants] 过滤检查:', {
        name: member.name,
        nameValue,
        hasName,
        allKeys: Object.keys(member || {})
      })
      return hasName
    }) // 只包含有姓名的记录
    .map(member => {
      // 处理民族字段：如果输入的是"汉"，转换为"汉族"
      const nationValue = String(member.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      const transformed = {
        name: String(member.name || '').trim(),
        id_card_number: String(member.idNo || '').trim() || '000000000000000000', // 默认身份证号
        ethnicity: ethnicity, // 确保是"汉族"而不是"汉"
        age: Number(member.age) || 20, // 默认年龄20岁（学生）
        gender: member.gender === 'male' ? 'male' : (member.gender === 'female' ? 'female' : 'male'), // 默认男性
        region: String(member.region || '').trim() || '北京市', // 默认地区
        school_name: String(member.school || '').trim() || '未填写', // 默认学校
        department: String(member.dept || '').trim() || '未填写', // 默认部门
        grade: String(member.grade || '').trim() || '大四', // 默认年级
        major_category: String(member.major || '').trim() || '艺术', // 默认专业类别
        major_name: String(member.majorName || member.major || '').trim() || '未填写', // 专业名称（优先使用 majorName，如果没有则使用 major）
        student_id: String(member.studentId || member.studentNo || '').trim() || '20200001', // 默认学号
        phone: String(member.phone || '').trim() || '13800000000' // 默认手机号
      }
      return transformed
    })
  console.log('[transformParticipants] 转换后数据:', result)
  return result
}

/**
 * 映射表演形式
 */
const mapPerformanceType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'ensemble': 'ensemble',
    'small-ensemble': 'small_ensemble',
    'chamber': 'chamber',
    'solo': 'solo'
  }
  return typeMap[type] || type
}

/**
 * 映射组别
 */
const mapGroupType = (group: string): string => {
  const groupMap: Record<string, string> = {
    'group1': 'amateur',
    'group2': 'professional'
  }
  return groupMap[group] || group
}

const onSubmit = async () => {
  // 检查是否已同意报名须知
  if (!baseForm.notice) {
    ElMessage.warning('请先阅读并同意报名须知')
    return
  }

  // 表单验证
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  // 检查人数限制
  const rosters = { teachers: teachers.value, members: members.value, accomp: accomp.value }
  const totalCount = calculateTotalMemberCount(rosters)
  const routeName = route.name as string

  const passed = await checkMemberLimit(routeName, totalCount)
  if (!passed) {
    return
  }

  // 检查花名册数据
  console.log('[onSubmit] 原始花名册数据:', {
    teachers: teachers.value,
    members: members.value,
    teachersCount: teachers.value.length,
    membersCount: members.value.length
  })

  // 详细检查每条记录
  if (teachers.value.length > 0) {
    console.log('[onSubmit] 第一条教师数据详情:', JSON.parse(JSON.stringify(teachers.value[0])))
    console.log('[onSubmit] 第一条教师数据的所有键:', Object.keys(teachers.value[0] || {}))
  }
  if (members.value.length > 0) {
    console.log('[onSubmit] 第一条成员数据详情:', JSON.parse(JSON.stringify(members.value[0])))
    console.log('[onSubmit] 第一条成员数据的所有键:', Object.keys(members.value[0] || {}))
  }

  // 转换花名册数据
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const participantsData = transformParticipants(members.value)

  console.log('[onSubmit] 转换后的花名册数据:', {
    guideTeachers: guideTeachersData,
    participants: participantsData,
    guideTeachersCount: guideTeachersData.length,
    participantsCount: participantsData.length
  })

  // 验证花名册数据（至少需要有一个参赛人员）
  if (participantsData.length === 0) {
    ElMessage.warning('请至少添加一个参赛人员')
    return
  }

  // 上传文件并获取URL（使用组件提供的方法）
  let workFile = 'https://example.com/path/to/your/file.mp3' // 默认文件URL

  if (fileList.value.length > 0) {
    // 使用组件提供的方法获取第一个文件的URL
    const firstFileUrl = fileUploadRef.value?.getFirstFileUrl()

    if (firstFileUrl) {
      // 如果文件已有URL（已上传），直接使用
      workFile = firstFileUrl
      console.log('[onSubmit] 使用已有文件URL:', workFile)
    } else {
      // 需要上传文件
      console.log('[onSubmit] 开始上传文件...')
      ElMessage.info('正在上传文件，请稍候...')

      // 使用组件提供的方法上传所有文件
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()

      if (uploadedUrls && uploadedUrls.length > 0 && uploadedUrls[0]) {
        workFile = uploadedUrls[0] // 使用第一个文件的URL
        console.log('[onSubmit] 文件上传成功，URL:', workFile)
      } else {
        ElMessage.error('文件上传失败，请重试')
        return
      }
    }
  }

  // 严格按照后端接口要求的字段格式构建数据
  const apiData = {
    work_file: workFile,
    work_title: baseForm.workName || '',
    performance_type: mapPerformanceType(baseForm.performanceType),
    duration_minutes: baseForm.minutes || 0,
    duration_seconds: baseForm.seconds || 0,
    performer_count: baseForm.count || members.value.length || 1,
    contact_name: baseForm.contact || '',
    contact_phone: baseForm.phone || '',
    contact_address: baseForm.address || '',
    group_type: mapGroupType(baseForm.group),
    is_original: baseForm.isOriginal || false,
    work_description: intro.value || '',
    status: 'draft',
    guide_teachers: guideTeachersData,
    participants: participantsData,
    conductor: {
      conductor_choice: '学生指挥' // 默认值，如果前端有输入框可以修改
    }
  }

  console.log('[onSubmit] 提交的完整数据:', JSON.stringify(apiData, null, 2))

  // 调用后端接口
  try {
    const success = await registrationApi.submitInstrumental(apiData)
    if (success) {
      ElMessage.success('提交成功')

      // 保存到 localStorage 作为已提交的记录
      const payload: SubmitPayload = {
        base: baseForm,
        intro: intro.value,
        files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
        rosters
      }
      try {
        const submitData = {
          base: payload.base,
          intro: payload.intro,
          files: payload.files,
          rosters: payload.rosters,
          submitTime: new Date().toLocaleString('zh-CN'),
          status: '待审核'
        }
        localStorage.setItem('instrumentFormDraft', JSON.stringify(submitData))
      } catch (error) {
        console.error('保存本地记录失败:', error)
      }

      emit('submit', payload)
    } else {
      ElMessage.error('提交失败，请重试')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请稍后再试')
  }
}
</script>

<style lang="scss" scoped>
.member-limit-tip-input {
  margin-top: 8px;

  .limit-info {
    color: #606266;
    font-size: 12px;
    line-height: 1.5;

    strong {
      color: #303133;
      font-weight: 600;
    }
  }
}

.notice {
  margin-top: 32px;
}
.notice-content {
  border: 1px solid #f56c6c;
  border-radius: 4px;
  padding: 24px;
  background: #fdf6f6;
}
</style>
