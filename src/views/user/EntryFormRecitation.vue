<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>朗诵作品报名表</span>
        </div>
      </template>
      <div class="intro-text">
        作品文体不限，须使用普通话，人数不超过8人（含伴奏，学生不作道具设置，不得伴舞），演出时间不超过5分钟。
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
                <el-option label="朗诵" value="group-dance" />
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
        v-model="fileList"
        :accept="accepts"
        :limit="6"
        :readonly="readonly"
        tip="支持多媒体、文档、图片等多种格式，最终材料请合理打包并控制文件大小。"
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

<script lang="ts" setup name="RecitationRegistrationForm">
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
const accepts = '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
const fileList = ref<FileItem[]>([])

const teachers = ref<RosterItem[]>([])
const members = ref<RosterItem[]>([])
const studentAccomp = ref<RosterItem[]>([])
const teacherAccomp = ref<RosterItem[]>([])
const onSave = () => {
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
  try {
    localStorage.setItem('recitationFormDraft', JSON.stringify(saveData))
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
  // 根据表演形式获取对应的人数限制
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

const onSubmit = async () => {
  // 检查是否已同意报名须知
  if (!baseForm.notice) {
    ElMessage.warning('请先阅读并同意报名须知')
    return
  }

  // 表单验证
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整的表单信息')
      return
    }
  }).catch(() => {
    ElMessage.warning('请填写完整的表单信息')
    return
  })

  // 检查人数限制
  const rosters = { teachers: teachers.value, members: members.value, studentAccomp: studentAccomp.value, teacherAccomp: teacherAccomp.value }
  const totalCount = calculateTotalMemberCount(rosters)
  const routeName = route.name as string

  const passed = await checkMemberLimit(routeName, totalCount)
  if (!passed) {
    return
  }

  const payload: SubmitPayload = {
    base: baseForm,
    intro: intro.value,
    files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
    rosters
  }
  emit('submit', payload)
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
