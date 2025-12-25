<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>戏曲作品报名表</span>
        </div>
      </template>
      <div class="intro-text">
        含戏曲、校园短剧、小品、歌舞剧、音乐剧等。人数不超过12人，（含伴奏），演出时间不超过12分钟。
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
                <el-option label="戏曲" value="opera" />
                <el-option label="校园短剧" value="campus-drama" />
                <el-option label="小品" value="sketch" />
                <el-option label="歌舞剧" value="musical-drama" />
                <el-option label="音乐剧" value="musical" />
                <el-option label="其他" value="other" />
              </el-select>
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
            <el-form-item label="作品名称" prop="workName">
              <el-input v-model="baseForm.workName" placeholder="请输入作品名称" />
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
            <el-form-item label="是否为原创" prop="isOriginal">
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
        upload-category="opera"
        tip="支持：音频、视频、图片、PDF等多种格式。每个节目的材料以本地打包提交，文件大小不宜超过100MB。"
      />
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-4">
      <template #header><div class="ef-card-title"><span>报名花名册</span></div></template>
      <div class="ef-sec-watermark">4</div>
      <TeacherBlock v-model:rows="teachers" :readonly="readonly" />
      <MemberBlock class="ef-mt16" v-model:rows="members" :readonly="readonly" />
      <RosterBlock class="ef-mt16" title="学生伴奏" :columns="memberColumns" v-model:rows="studentAccomp" :readonly="readonly" />
      <RosterBlock class="ef-mt16" title="老师伴奏" :columns="teacherColumns" v-model:rows="teacherAccomp" :readonly="readonly" />
    </el-card>
    <div class="notice">
      <div class="notice-content">
        <p style="color: red">请仔细阅读报名须知，确认无误后勾选报名须知，即可进行报名。</p>
        <el-row :gutter="34">
          <el-col :span="12">
            <el-form-item prop="notice">
              <template #label>
                <span>报名须知</span>
                <el-link
                  type="primary"
                  :underline="false"
                  @click.prevent="downloadNotice"
                  style="margin-left: 8px; font-size: 14px;"
                >
                  （点击下载）
                </el-link>
              </template>
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

<script lang="ts" setup name="OperaRegistrationForm">
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { calculateTotalMemberCount, checkMemberLimit, getMemberLimitInfo } from '@/utils/memberLimit'
import TeacherBlock from '@/components/TeacherBlock.vue'
import MemberBlock from '@/components/MemberBlock.vue'
import RosterBlock from '@/components/RosterBlock.vue'
import FileUploadBlock from '@/components/FileUploadBlock.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { commonRules } from '@/composables/useForm'
import { teacherColumns, memberColumns } from '@/composables/useRosterColumns'
import { registrationApi } from '@/services/api'

// 表单结构可后期针对戏曲作品优化
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
  idNo?: string
  nation?: string
  major?: string
  majorName?: string
  region?: string
  school?: string
  dept?: string
  studentNo?: string
  studentId?: string
  age?: number | string
  phone?: string
  grade?: string
}
interface SubmitPayload {
  base: BaseForm
  intro: string
  files: FileItem[]
  rosters: {
    teachers: RosterItem[]
    members: RosterItem[]
    studentAccomp: RosterItem[]
    teacherAccomp: RosterItem[]
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
  minutes: [
    { required: true, message: '请输入作品时长（分钟）', trigger: 'blur' },
    { type: 'number', min: 0, message: '分钟数不能小于0', trigger: 'blur' }
  ],
  workName: [
    { required: true, message: '请输入作品名称', trigger: 'blur' }
  ],
  count: [
    { required: true, message: '请输入表演人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数不能小于1', trigger: 'blur' }
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
const accepts = '.mp3,.wav,.mp4,.mov,.pdf,.jpg,.jpeg,.png'
const fileList = ref<FileItem[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUploadBlock>>()

const teachers = ref<RosterItem[]>([])
const members = ref<RosterItem[]>([])
const studentAccomp = ref<RosterItem[]>([])
const teacherAccomp = ref<RosterItem[]>([])
/**
 * 构建 API 数据
 * @param workFile 文件URL（暂存时可以为空或默认值）
 * @param status 状态：'draft' 暂存 或 'pending' 提交
 */
const buildApiData = (workFile: string, status: 'draft' | 'pending') => {
  // 转换并合并指导教师和老师伴奏到 guide_teachers
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const teacherAccompanistsData = transformTeacherAccompanists(teacherAccomp.value)
  const allGuideTeachers = [...guideTeachersData, ...teacherAccompanistsData]

  // 转换并合并参演学生和学生伴奏到 participants
  const participantsData = transformParticipants(members.value)
  const studentAccompanistsData = transformStudentAccompanists(studentAccomp.value)
  const allParticipants = [...participantsData, ...studentAccompanistsData]

  return {
    work_file: workFile,
    work_title: baseForm.workName || '',
    performance_type: mapPerformanceType(baseForm.performanceType),
    duration_minutes: baseForm.minutes || 0,
    duration_seconds: baseForm.seconds || 0,
    performer_count: baseForm.count || allParticipants.length || 1,
    contact_name: baseForm.contact || '',
    contact_phone: baseForm.phone || '',
    contact_address: baseForm.address || '',
    group_type: mapGroupType(baseForm.group),
    is_original: baseForm.isOriginal || false,
    work_description: intro.value || '',
    status,
    guide_teachers: allGuideTeachers,
    participants: allParticipants
  }
}

const onSave = async () => {
  // 表单验证
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  // 暂存时不需要上传文件，使用默认值
  const workFile = 'https://example.com/sample_opera_video.mp4'

  // 构建 API 数据，status 为 'draft'
  const apiData = buildApiData(workFile, 'draft')

  // 调用后端接口暂存
  try {
    const success = await registrationApi.submitOpera(apiData)
    if (success) {
      ElMessage.success('表单已暂存成功')
      // 同时保存到 localStorage 作为备份
      try {
        const saveData = {
          base: baseForm,
          intro: intro.value,
          files: fileList.value,
          rosters: {
            teachers: teachers.value,
            members: members.value,
            studentAccomp: studentAccomp.value,
            teacherAccomp: teacherAccomp.value
          }
        }
        localStorage.setItem('operaFormDraft', JSON.stringify(saveData))
      } catch (error) {
        console.error('保存本地记录失败:', error)
      }
    } else {
      ElMessage.error('暂存失败，请重试')
    }
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请稍后再试')
  }
}
const route = useRoute()

// 实时人数限制检查 - 检查输入框中的数值
const memberLimitInfo = computed(() => {
  const routeName = route.name as string
  // 根据表演形式（戏曲、校园短剧、小品等）获取对应的人数限制
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

const normalizeEthnicity = (value?: string) => {
  const nation = String(value || '').trim()
  if (!nation) return '汉族'
  return nation === '汉' ? '汉族' : nation
}

// 性别映射：前端值 → 后端中文值
const mapGender = (gender?: string): string => {
  if (gender === 'female') return '女'
  if (gender === 'male') return '男'
  return '男' // 默认值
}

// 年级映射：前端值 → 后端中文值
const mapGrade = (grade?: string): string => {
  const gradeMap: Record<string, string> = {
    'freshman': '大一',
    'sophomore': '大二',
    'junior': '大三',
    'senior': '大四',
    'grade5': '大五',
    'grade6': '大六',
    'grade7': '大七',
    'grade8': '大八',
    'master1': '研一',
    'master2': '研二',
    'master3': '研三',
    'master4': '研四',
    'phd1': '博一',
    'phd2': '博二',
    'phd3': '博三'
  }
  // 如果已经是中文格式，直接返回
  if (grade && !gradeMap[grade]) {
    return grade
  }
  return gradeMap[grade || ''] || '大二'
}

// 专业类别映射：前端值 → 后端中文值
const mapMajorCategory = (major?: string): string => {
  if (major === 'art') return '艺术类'
  if (major === 'non-art') return '非艺术类'
  // 如果已经是中文格式，直接返回
  if (major && (major === '艺术类' || major === '非艺术类')) {
    return major
  }
  return '艺术类' // 默认值
}

// 转换指导教师数据（role: "instructor"）
const transformGuideTeachers = (rows: RosterItem[]) => {
  return rows
    .filter(item => item.name && String(item.name).trim())
    .map(item => ({
      name: String(item.name || '').trim(),
      id_card_number: String(item.idNo || '').trim() || '000000000000000000',
      ethnicity: normalizeEthnicity(item.nation),
      age: Number(item.age) || 35,
      gender: mapGender(item.gender), // 转换为中文：'男' 或 '女'
      region: String(item.region || '').trim() || '北京市',
      school_name: String(item.school || '').trim() || '未填写',
      department: String(item.org || item.dept || '').trim() || '未填写',
      phone: String(item.phone || '').trim() || '13800000000',
      role: 'instructor' // 指导老师
    }))
}

// 转换老师伴奏数据（role: "accompanist"）
const transformTeacherAccompanists = (rows: RosterItem[]) => {
  return rows
    .filter(item => item.name && String(item.name).trim())
    .map(item => ({
      name: String(item.name || '').trim(),
      id_card_number: String(item.idNo || '').trim() || '000000000000000000',
      ethnicity: normalizeEthnicity(item.nation),
      age: Number(item.age) || 35,
      gender: mapGender(item.gender), // 转换为中文：'男' 或 '女'
      region: String(item.region || '').trim() || '北京市',
      school_name: String(item.school || '').trim() || '未填写',
      department: String(item.org || item.dept || '').trim() || '未填写',
      phone: String(item.phone || '').trim() || '13800000000',
      role: 'accompanist' // 伴奏老师
    }))
}

// 转换参演学生数据（role: "performer"）
const transformParticipants = (rows: RosterItem[]) => {
  return rows
    .filter(item => item.name && String(item.name).trim())
    .map(item => ({
      name: String(item.name || '').trim(),
      id_card_number: String(item.idNo || '').trim() || '000000000000000000',
      ethnicity: normalizeEthnicity(item.nation),
      age: Number(item.age) || 20,
      gender: mapGender(item.gender), // 转换为中文：'男' 或 '女'
      region: String(item.region || '').trim() || '北京市',
      school_name: String(item.school || '').trim() || '未填写',
      department: String(item.dept || '').trim() || '未填写',
      grade: mapGrade(item.grade), // 转换为中文：'大一'、'大二' 等
      major_category: mapMajorCategory(item.major), // 转换为中文：'艺术类' 或 '非艺术类'
      major_name: String(item.majorName || item.major || '').trim() || '表演',
      student_id: String(item.studentId || item.studentNo || '').trim() || '20200001',
      phone: String(item.phone || '').trim() || '13800000000',
      role: 'performer' // 参演学生
    }))
}

// 转换学生伴奏数据（role: "accompanist"）
const transformStudentAccompanists = (rows: RosterItem[]) => {
  return rows
    .filter(item => item.name && String(item.name).trim())
    .map(item => ({
      name: String(item.name || '').trim(),
      id_card_number: String(item.idNo || '').trim() || '000000000000000000',
      ethnicity: normalizeEthnicity(item.nation),
      age: Number(item.age) || 20,
      gender: mapGender(item.gender), // 转换为中文：'男' 或 '女'
      region: String(item.region || '').trim() || '北京市',
      school_name: String(item.school || '').trim() || '未填写',
      department: String(item.dept || '').trim() || '未填写',
      grade: mapGrade(item.grade), // 转换为中文：'大一'、'大二' 等
      major_category: mapMajorCategory(item.major), // 转换为中文：'艺术类' 或 '非艺术类'
      major_name: String(item.majorName || item.major || '').trim() || '表演',
      student_id: String(item.studentId || item.studentNo || '').trim() || '20200001',
      phone: String(item.phone || '').trim() || '13800000000',
      role: 'accompanist' // 学生伴奏
    }))
}

const mapPerformanceType = (type: string) => {
  const map: Record<string, string> = {
    'opera': 'opera',
    'campus-drama': 'campus_drama',
    'sketch': 'sketch',
    'musical-drama': 'musical_drama',
    'musical': 'musical',
    'other': 'other'
  }
  return map[type] || 'opera'
}

const mapGroupType = (group: string) => {
  const map: Record<string, string> = {
    group1: 'amateur',
    group2: 'professional'
  }
  return map[group] || 'amateur'
}

// 下载报名须知
const downloadNotice = () => {
  try {
    // 创建下载链接，直接指向 public 目录下的文件
    const link = document.createElement('a')
    link.href = '/报名须知.pdf'
    link.download = '报名须知.pdf'
    link.target = '_blank'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('下载成功')
  } catch (error: unknown) {
    console.error('下载报名须知失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
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
  const rosters = { teachers: teachers.value, members: members.value, studentAccomp: studentAccomp.value, teacherAccomp: teacherAccomp.value }
  const totalCount = calculateTotalMemberCount(rosters)
  const routeName = route.name as string

  const passed = await checkMemberLimit(routeName, totalCount)
  if (!passed) {
    return
  }

  // 转换并合并指导教师和老师伴奏到 guide_teachers
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const teacherAccompanistsData = transformTeacherAccompanists(teacherAccomp.value)
  const allGuideTeachers = [...guideTeachersData, ...teacherAccompanistsData]

  // 转换并合并参演学生和学生伴奏到 participants
  const participantsData = transformParticipants(members.value)
  const studentAccompanistsData = transformStudentAccompanists(studentAccomp.value)
  const allParticipants = [...participantsData, ...studentAccompanistsData]

  if (allParticipants.length === 0) {
    ElMessage.warning('请至少添加一个参赛人员')
    return
  }

  // 先上传文件
  let workFile = 'https://example.com/sample_opera_video.mp4'
  if (fileList.value.length > 0) {
    try {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (uploadedUrls && uploadedUrls.length > 0 && uploadedUrls[0]) {
        workFile = uploadedUrls[0]
      } else {
        ElMessage.error('文件上传失败，请重试')
        return
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      ElMessage.error('文件上传失败，请重试')
      return
    }
  }

  // 构建 API 数据，status 为 'pending'
  const apiData = buildApiData(workFile, 'pending')

  try {
    console.log('[OperaSubmit] payload:', JSON.stringify(apiData, null, 2))
    const success = await registrationApi.submitOpera(apiData)
    if (success) {
      ElMessage.success('提交成功')
      const payload: SubmitPayload = {
        base: baseForm,
        intro: intro.value,
        files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
        rosters
      }
      try {
        const submitData = {
          ...payload,
          submitTime: new Date().toLocaleString('zh-CN'),
          status: '待审核'
        }
        localStorage.setItem('operaFormDraft', JSON.stringify(submitData))
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
