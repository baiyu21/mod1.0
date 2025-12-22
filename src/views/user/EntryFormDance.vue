<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>舞蹈作品报名表</span>
        </div>
      </template>
      <div class="intro-text">
        群舞：人数不超过36人，演出时间不超过7分钟。
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
                <el-option label="群舞" value="group-dance" />
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
        :upload-category="'dance'"
        tip="支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。"
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

<script lang="ts" setup name="DanceRegistrationForm">
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { calculateTotalMemberCount, checkMemberLimit, getMemberLimitInfo } from '@/utils/memberLimit'
import TeacherBlock from '@/components/TeacherBlock.vue'
import MemberBlock from '@/components/MemberBlock.vue'
import FileUploadBlock, { type FileItem as UploadFileItem } from '@/components/FileUploadBlock.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { commonRules } from '@/composables/useForm'
import { registrationApi, registrationGuideApi } from '@/services/api'

// 表单类型可根据实际舞蹈需求调整，当前基本复用声乐结构
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
interface RosterItem {
  name?: string
  gender?: 'male' | 'female'
  title?: string
  org?: string
  phone?: string
  idNo?: string
  nation?: string
  major?: string
  region?: string
  school?: string
  dept?: string
}
interface SubmitPayload {
  base: BaseForm
  intro: string
  files: UploadFileItem[]
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
    localStorage.setItem('danceFormDraft', JSON.stringify(saveData))
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
  // 根据表演形式（群舞）获取对应的人数限制
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

const mapPerformanceType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'group-dance': 'group',
    'solo-dance': 'solo'
  }
  return typeMap[type] || 'group'
}

const mapGroupType = (group: string): string => {
  const groupMap: Record<string, string> = {
    'group1': 'amateur',
    'group2': 'professional'
  }
  return groupMap[group] || group
}

const transformGuideTeachers = (teachersList: RosterItem[]) => {
  return teachersList
    .filter(teacher => {
      const nameValue = teacher.name || ''
      return nameValue && String(nameValue).trim()
    })
    .map(teacher => {
      const nationValue = String(teacher.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      return {
        name: String(teacher.name || '').trim(),
        id_card_number: String(teacher.idNo || '').trim() || '000000000000000000',
        ethnicity,
        age: Number(teacher.age) || 35,
        gender: teacher.gender === 'male' ? 'male' : (teacher.gender === 'female' ? 'female' : 'female'),
        region: String(teacher.region || '').trim() || '北京市',
        school_name: String(teacher.school || '').trim() || '未填写',
        department: String(teacher.org || teacher.dept || '').trim() || '未填写',
        phone: String(teacher.phone || '').trim() || '13800000000'
      }
    })
}

const transformParticipants = (membersList: RosterItem[]) => {
  return membersList
    .filter(member => {
      const nameValue = member.name || ''
      return nameValue && String(nameValue).trim()
    })
    .map(member => {
      const nationValue = String(member.nation || '').trim()
      const ethnicity = nationValue === '汉' ? '汉族' : (nationValue || '汉族')

      return {
        name: String(member.name || '').trim(),
        id_card_number: String(member.idNo || '').trim() || '000000000000000000',
        ethnicity,
        age: Number(member.age) || 20,
        gender: member.gender === 'male' ? 'male' : (member.gender === 'female' ? 'female' : 'female'),
        region: String(member.region || '').trim() || '北京市',
        school_name: String(member.school || '').trim() || '未填写',
        department: String(member.dept || '').trim() || '未填写',
        grade: String(member.grade || '').trim() || '大二',
        major_category: String(member.major || '').trim() || '艺术类',
        major_name: String(member.major || '').trim() || '舞蹈表演',
        student_id: String(member.studentId || member.studentNo || '').trim() || '20210001',
        phone: String(member.phone || '').trim() || '13800000000'
      }
    })
}

// 下载报名须知
const downloadNotice = async () => {
  try {
    ElMessage.info('正在下载报名须知...')
    const blob = await registrationGuideApi.downloadNotice()

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '报名须知.pdf'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('下载成功')
  } catch (error: unknown) {
    console.error('下载报名须知失败:', error)
    let errorMessage = '下载失败，请稍后重试'

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as Error).message
    }

    ElMessage.error(errorMessage)
  }
}

const onSubmit = async () => {
  if (!baseForm.notice) {
    ElMessage.warning('请先阅读并同意报名须知')
    return
  }

  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请填写完整的表单信息')
    return
  }

  const rosters = { teachers: teachers.value, members: members.value, accomp: accomp.value }
  const totalCount = calculateTotalMemberCount(rosters)
  const routeName = route.name as string

  const passed = await checkMemberLimit(routeName, totalCount)
  if (!passed) {
    return
  }

  const guideTeachersData = transformGuideTeachers(teachers.value)
  const participantsData = transformParticipants(members.value)

  if (participantsData.length === 0) {
    ElMessage.warning('请至少添加一个参赛人员')
    return
  }

  let workFile = 'https://example.com/path/to/your/file.mp3'
  if (fileList.value.length > 0) {
    const firstFileUrl = fileUploadRef.value?.getFirstFileUrl()
    if (firstFileUrl) {
      workFile = firstFileUrl
    } else {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (uploadedUrls && uploadedUrls.length > 0) {
        workFile = uploadedUrls[0]
      } else {
        ElMessage.error('文件上传失败，请重试')
        return
      }
    }
  }

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
    participants: participantsData
  }

  try {
    const success = await registrationApi.submitDance(apiData)
    if (success) {
      ElMessage.success('提交成功')

      const payload: SubmitPayload = {
        base: baseForm,
        intro: intro.value,
        files: fileList.value.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })),
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
        localStorage.setItem('danceFormDraft', JSON.stringify(submitData))
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
