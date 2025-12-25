
<script lang="ts" setup name="VoiceRegistrationForm">
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import TeacherBlock from '@/components/TeacherBlock.vue'
import MemberBlock from '@/components/MemberBlock.vue'
import ConductorBlock from '@/components/ConductorBlock.vue'
import FileUploadBlock from '@/components/FileUploadBlock.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { calculateTotalMemberCount, checkMemberLimit, getMemberLimitInfo } from '@/utils/memberLimit'
import { useTips } from '@/composables/useTips'
import { commonRules } from '@/composables/useForm'
import { registrationApi } from '@/services/api'

// 定义类型接口
interface BaseForm {
  performanceType: 'chorus' | 'ensemble' | 'solo'
  minutes: number
  seconds: number
  song1: string
  song2: string
  song1HasChinese: boolean
  song1IsOriginal: boolean
  song2HasChinese: boolean
  song2IsOriginal: boolean
  contact: string
  phone: string
  address: string
  group: string
  leader: string
  tutor: string
  notice: boolean
  chorusCount?: number
  pianoAccompanist?: 'teacher' | 'student' | ''
}

interface FileItem {
  name: string
  size: number
  type?: string
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
  majorType?: string
  region?: string
  school?: string
  dept?: string
  instrument?: string
  studentNo?: string
  age?: number
  grade?: string
}

interface SubmitPayload {
  base: BaseForm & { durationSec: number }
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
  minutes: [
    { required: true, message: '请输入作品时长（分钟）', trigger: 'blur' },
    { type: 'number', min: 0, message: '分钟数不能小于0', trigger: 'blur' }
  ],
  seconds: [
    { required: true, message: '请输入作品时长（秒）', trigger: 'blur' },
    { type: 'number', min: 0, max: 59, message: '秒数应在0-59之间', trigger: 'blur' }
  ],
  chorusCount: [
    { required: true, message: '请输入人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数不能小于1', trigger: 'blur' }
  ],
  song1: [
    { required: true, message: '请输入曲目1名称', trigger: 'blur' }
  ],
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address
}

/* ---- 基础信息 ---- */
const baseForm = reactive<BaseForm>({
  performanceType: 'chorus',
  minutes: 0,
  seconds: 0,
  song1: '',
  song2: '',
  song1HasChinese: true,
  song1IsOriginal: false,
  song2HasChinese: true,
  song2IsOriginal: false,
  contact: '',
  phone: '',
  address: '',
  group: '',
  leader: '',
  tutor: '',
  notice: false,
  chorusCount: undefined,
  pianoAccompanist: ''
})

/* ---- 简介 ---- */
const intro = ref('')

/* ---- 上传 ---- */
const accepts = '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
const fileList = ref<FileItem[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUploadBlock>>()

/* ---- 花名册：列定义已封装到各个组件内部 ---- */

/* ---- 三个表数据 ---- */
const teachers = ref<RosterItem[]>([])
const members = ref<RosterItem[]>([])
const accomp = ref<RosterItem[]>([])

/**
 * 构建 API 数据
 * @param performanceVideo 视频URL（暂存时可以为空或默认值）
 * @param status 状态：'draft' 暂存 或 'pending' 提交
 */
const buildApiData = (performanceVideo: string, status: 'draft' | 'pending') => {
  // 转换花名册数据
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const conductorsData = transformConductors(accomp.value)
  const allGuideTeachers = [...guideTeachersData, ...conductorsData]
  const participantsData = transformParticipants(members.value)

  return {
    performance_type: mapPerformanceType(),
    duration_minutes: baseForm.minutes || 0,
    duration_seconds: baseForm.seconds || 0,
    song1_title: baseForm.song1 || '',
    song1_is_original: baseForm.song1IsOriginal || false,
    song1_is_chinese: baseForm.song1HasChinese !== false,
    song2_title: baseForm.song2 || '',
    song2_is_original: baseForm.song2IsOriginal || false,
    song2_is_chinese: baseForm.song2HasChinese !== false,
    contact_name: baseForm.contact || '',
    contact_phone: baseForm.phone || '',
    contact_address: baseForm.address || '',
    group_type: mapGroupType(baseForm.group),
    performer_count: baseForm.chorusCount || members.value.length || 1,
    performance_description: intro.value || '',
    piano_accompaniment: baseForm.pianoAccompanist === 'teacher' ? 'teacher' : 'student',
    performance_video: performanceVideo,
    status,
    guide_teachers: allGuideTeachers,
    participants: participantsData
  }
}

/* ---- 行为：暂存 / 提交 ---- */
const onSave = async () => {
  // 表单验证
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  // 转换花名册数据
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const conductorsData = transformConductors(accomp.value)
  const allGuideTeachers = [...guideTeachersData, ...conductorsData]
  const participantsData = transformParticipants(members.value)

  // 暂存时不需要上传文件，使用默认值
  const performanceVideo = 'https://example.com/sample_vocal_video.mp4'

  // 构建 API 数据，status 为 'draft'
  const apiData = buildApiData(performanceVideo, 'draft')

  // 调用后端接口暂存
  try {
    const success = await registrationApi.submitVocal(apiData)
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
            accomp: accomp.value
          }
        }
        localStorage.setItem('voiceFormDraft', JSON.stringify(saveData))
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
// 重置功能待商议
// const onReset = () => {
//   baseForm.performanceType = 'chorus'
//   baseForm.minutes = 0
//   baseForm.seconds = 0
//   baseForm.song1 = ''
//   baseForm.song2 = ''
//   baseForm.song1HasChinese = true
//   baseForm.song1IsOriginal = false
//   baseForm.song2HasChinese = true
//   baseForm.song2IsOriginal = false
//   baseForm.contact = ''
//   baseForm.phone = ''
//   baseForm.address = ''
//   baseForm.group = ''
//   baseForm.leader = ''
//   baseForm.tutor = ''
//   baseForm.notice = false
//   baseForm.chorusCount = undefined
//   intro.value = ''
//   fileList.value = []
//   teachers.value = []
//   members.value = []
//   accomp.value = []
// }

const route = useRoute()

// 使用提示词composable
const { pageTip, pageUploadTip } = useTips()

// 实时人数限制检查 - 检查输入框中的数值
const memberLimitInfo = computed(() => {
  const routeName = route.name as string
  // 对于声乐报名，根据表演形式（合唱、小合唱/表演唱、独唱）获取对应的人数限制
  const categoryValue = baseForm.performanceType === 'chorus' ? 'chorus' :
                        baseForm.performanceType === 'ensemble' ? 'ensemble' :
                        baseForm.performanceType === 'solo' ? 'solo' : undefined
  return getMemberLimitInfo(routeName, categoryValue)
})

const isExceededLimit = computed(() => {
  const { maxCount } = memberLimitInfo.value
  if (maxCount === undefined || !baseForm.chorusCount) {
    return false
  }
  return baseForm.chorusCount > maxCount
})

// 组别映射
const mapGroupType = (group: string) => {
  const map: Record<string, string> = {
    group1: 'amateur',
    group2: 'professional'
  }
  return map[group] || 'amateur'
}

// 表演形式映射（声乐统一为 "staged"）
const mapPerformanceType = () => {
  return 'staged'
}

// 转换指导教师数据（identity: "teacher"）
const transformGuideTeachers = (teachers: RosterItem[]) => {
  return teachers
    .filter(teacher => teacher.name && String(teacher.name).trim())
    .map(teacher => {
      const nationValue = String(teacher.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      return {
        name: String(teacher.name || '').trim(),
        id_card: String(teacher.idNo || '').trim() || '000000000000000000',
        ethnicity: ethnicity,
        age: Number(teacher.age) || 35,
        gender: teacher.gender === 'male' ? 'male' : (teacher.gender === 'female' ? 'female' : 'male'),
        region: String(teacher.region || '').trim() || '未填写',
        school_name: String(teacher.school || '').trim() || '未填写',
        department: String(teacher.org || teacher.dept || '').trim() || '未填写',
        contact_phone: String(teacher.phone || '').trim() || '13800000000',
        identity: 'teacher'
      }
    })
}

// 转换指挥数据（identity: "conductor"）
const transformConductors = (conductors: RosterItem[]) => {
  return conductors
    .filter(conductor => conductor.name && String(conductor.name).trim())
    .map(conductor => {
      const nationValue = String(conductor.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      return {
        name: String(conductor.name || '').trim(),
        id_card: String(conductor.idNo || '').trim() || '000000000000000000',
        ethnicity: ethnicity,
        age: Number(conductor.age) || 35,
        gender: conductor.gender === 'male' ? 'male' : (conductor.gender === 'female' ? 'female' : 'male'),
        region: String(conductor.region || '').trim() || '未填写',
        school_name: String(conductor.school || '').trim() || '未填写',
        department: String(conductor.dept || '').trim() || '未填写',
        contact_phone: String(conductor.phone || '').trim() || '13800000000',
        identity: 'conductor'
      }
    })
}

// 转换参演学生数据
const transformParticipants = (members: RosterItem[]) => {
  return members
    .filter(member => member.name && String(member.name).trim())
    .map(member => {
      const nationValue = String(member.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      return {
        name: String(member.name || '').trim(),
        id_card: String(member.idNo || '').trim() || '000000000000000000',
        ethnicity: ethnicity,
        age: Number(member.age) || 20,
        gender: member.gender === 'male' ? 'male' : (member.gender === 'female' ? 'female' : 'male'),
        region: String(member.region || '').trim() || '未填写',
        school_name: String(member.school || '').trim() || '未填写',
        department: String(member.dept || '').trim() || '未填写',
        grade: String(member.grade || '').trim() || '大三',
        major_category: String(member.majorType || '').trim() || '艺术',
        major_name: String(member.major || '').trim() || '声乐表演',
        student_id: String(member.studentNo || '').trim() || '20200001',
        contact_phone: String(member.phone || '').trim() || '13800000000'
      }
    })
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
  const rosters = { teachers: teachers.value, members: members.value, accomp: accomp.value }
  const totalCount = calculateTotalMemberCount(rosters)
  const routeName = route.name as string

  const passed = await checkMemberLimit(routeName, totalCount)
  if (!passed) {
    return
  }

  // 转换花名册数据
  const guideTeachersData = transformGuideTeachers(teachers.value)
  const conductorsData = transformConductors(accomp.value)
  // 合并指导教师和指挥到 guide_teachers 数组
  const allGuideTeachers = [...guideTeachersData, ...conductorsData]

  const participantsData = transformParticipants(members.value)

  if (participantsData.length === 0) {
    ElMessage.warning('请至少添加一个参演学生')
    return
  }

  // 先上传文件
  let performanceVideo = 'https://example.com/sample_vocal_video.mp4'
  if (fileList.value.length > 0) {
    try {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (uploadedUrls && uploadedUrls.length > 0 && uploadedUrls[0]) {
        performanceVideo = uploadedUrls[0]
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

  // 构建 API 数据，status 为 'pending'（传入已转换的数据避免重复转换）
  const apiData = buildApiData(performanceVideo, 'pending')

  try {
    console.log('[VocalSubmit] payload:', JSON.stringify(apiData, null, 2))
    const success = await registrationApi.submitVocal(apiData)
    if (success) {
      ElMessage.success('提交成功')
      const payload: SubmitPayload = {
        base: { ...baseForm, durationSec: baseForm.minutes * 60 + baseForm.seconds },
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
        localStorage.setItem('vocalFormDraft', JSON.stringify(submitData))
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

<template>
  <div class="voice-form">
    <!-- 顶部说明 -->
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>声乐作品报名表</span>
        </div>
      </template>
      <div class="intro-text" v-html="pageTip.replace(/\n/g, '<br />')"></div>
    </el-card>

    <!-- 1 基础信息 -->
    <el-card shadow="never" class="section-card sec-1">
      <template #header><div class="card-title"><span>作品信息</span></div></template>
      <div class="sec-watermark">1</div>

      <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="120px" :disabled="readonly" class="base-form">
        <!-- 表演形式和时长 -->
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="表演形式" prop="performanceType">
              <el-select v-model="baseForm.performanceType" placeholder="请选择" style="width: 100%">
                <el-option label="合唱" value="chorus" />
                <el-option label="小合唱/表演唱" value="ensemble" />
                <el-option label="独唱" value="solo" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作品时长" prop="minutes">
              <div class="duration">
                <el-input v-model.number="baseForm.minutes" type="number" min="0" style="width:80px" />
                <span class="unit">分</span>
                <el-input v-model.number="baseForm.seconds" type="number" min="0" max="59" style="width:80px" prop="seconds" />
                <span class="unit">秒</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 人数（合唱或小合唱时显示） -->
        <el-row :gutter="24" v-if="baseForm.performanceType === 'chorus' || baseForm.performanceType === 'ensemble'">
          <el-col :span="12">
            <el-form-item :label="baseForm.performanceType === 'chorus' ? '合唱人数' : '小合唱人数'" prop="chorusCount">
              <el-input
                v-model.number="baseForm.chorusCount"
                type="number"
                min="1"
                :placeholder="baseForm.performanceType === 'chorus' ? '请输入合唱人数' : '请输入小合唱人数'"
              />
              <!-- 人数限制提示 -->
              <div v-if="memberLimitInfo.maxCount !== undefined && baseForm.chorusCount" class="member-limit-tip-input" :class="{ 'limit-exceeded': isExceededLimit }">
                <el-alert
                  v-if="isExceededLimit"
                  type="error"
                  :closable="false"
                  show-icon
                  :title="`当前人数为 ${baseForm.chorusCount}人，超过了最大人数限制 ${memberLimitInfo.maxCount}人，请减少人数后再提交`"
                />
                <div v-else class="limit-info">
                  当前人数：<strong>{{ baseForm.chorusCount }}人</strong> / 最大人数：<strong>{{ memberLimitInfo.maxCount }}人</strong>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 曲目信息 -->
        <div class="song-section">
          <h4 class="section-title">曲目信息</h4>

          <!-- 曲目1 -->
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="曲目1" prop="song1" required>
                <el-input v-model="baseForm.song1" placeholder="请输入曲目名称" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否中文作品">
                <el-radio-group v-model="baseForm.song1HasChinese">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否原创作品">
                <el-radio-group v-model="baseForm.song1IsOriginal">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 曲目2 -->
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="曲目2（可选）">
                <el-input v-model="baseForm.song2" placeholder="若只演唱一首可留空" />
              </el-form-item>
            </el-col>
            <el-col :span="8" v-if="baseForm.song2">
              <el-form-item label="是否中文作品">
                <el-radio-group v-model="baseForm.song2HasChinese">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8" v-if="baseForm.song2">
              <el-form-item label="是否原创作品">
                <el-radio-group v-model="baseForm.song2IsOriginal">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 联系信息 -->
        <div class="contact-section">
          <h4 class="section-title">联系信息</h4>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact">
                <el-input v-model="baseForm.contact" placeholder="请输入中文姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
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
              <el-form-item label="组别">
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

    <!-- 2 作品简介 -->
    <el-card shadow="never" class="section-card sec-2">
      <template #header>
        <div class="card-title">
          <span>作品简介</span>
          <span class="desc-tip">（最多 200 字）</span>
        </div>
      </template>
      <div class="sec-watermark">2</div>
      <el-input v-model="intro" type="textarea" :rows="7" maxlength="200" show-word-limit placeholder="请填写作品简介" :disabled="readonly" />
    </el-card>

    <!-- 3 上传作品 -->
    <el-card shadow="never" class="section-card sec-3">
      <template #header><div class="card-title"><span>上传作品</span></div></template>
      <div class="sec-watermark">3</div>
      <FileUploadBlock
        ref="fileUploadRef"
        v-model="fileList"
        :accept="accepts"
        :limit="6"
        :readonly="readonly"
        upload-category="vocal"
        upload-class="upload-block"
      >
        <template #tip>
          <div class="el-upload__tip">
            {{ pageUploadTip }}
          </div>
        </template>
      </FileUploadBlock>
    </el-card>

    <!-- 4 花名册 -->
    <el-card shadow="never" class="section-card sec-4">
      <template #header><div class="card-title"><span>报名花名册</span></div></template>
      <div class="sec-watermark">4</div>
      <TeacherBlock v-model:rows="teachers" :readonly="readonly" />
      <MemberBlock class="mt16" v-model:rows="members" :readonly="readonly" />
      <ConductorBlock class="mt16" v-model:rows="accomp" :readonly="readonly" />

      <!-- 钢琴伴奏选择 -->
      <div class="mt16" style="padding: 16px 0; border-top: 1px solid #f0f0f0;">
        <el-form-item label="钢琴伴奏" label-width="120px">
          <el-select
            v-model="baseForm.pianoAccompanist"
            placeholder="请选择"
            style="width: 200px"
            :disabled="readonly"
          >
            <el-option label="老师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
      </div>
    </el-card>

    <!-- 用户阅读须知区 -->
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
    <!-- 操作区 -->
    <div class="actions">
      <el-button size="large" @click="onSave" :disabled="readonly">暂存</el-button>
      <el-button type="primary" size="large" @click="onSubmit" :disabled="readonly || !baseForm.notice">提交报名表</el-button>
    </div>
  </div>
</template>
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

.voice-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标题 */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;

  .desc-tip {
    color: #909399;
    font-weight: 400;
    margin-left: 8px;
  }
}

.intro-card .intro-text {
  color: #666;
  line-height: 1.7;
}

/* 区块卡片 + 背景水印数字 */
.section-card {
  position: relative;
  overflow: hidden;

  .sec-watermark {
    position: absolute;
    right: 24px;
    top: 12px;
    font-size: 160px;
    line-height: 1;
    font-weight: 800;
    color: rgba(64, 158, 255, 0.12);
    user-select: none;
    pointer-events: none;
  }
}

.base-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  // 标签文字左对齐
  :deep(.el-form-item__label) {
    text-align: left !important;
    justify-content: flex-start;

    // 为所有 label 添加星号占位（包括非必填字段）
    &::before {
      content: '*';
      color: transparent; // 非必填字段使用透明星号占位
      margin-right: 4px;
      display: inline-block;
      width: 8px; // 固定宽度保持对齐
    }

    // 必填字段显示红色星号
    &.is-required::before {
      color: var(--el-color-danger);
    }
  }
}

.duration {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  .unit {
    color: #606266;
    font-size: 14px;
  }
}

.song-section,
.contact-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upload-block {
  width: 420px;
}

.mt16 {
  margin-top: 16px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

/* 小屏适配 */
@media (max-width: 1024px) {
  .upload-block {
    width: 100%;
  }
}
</style>
