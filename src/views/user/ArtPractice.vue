<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>艺术实践工作坊报名</span>
        </div>
      </template>
      <div class="intro-text">
        群舞：人数不超过36人，演出时间不超过7分钟。
      </div>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-1">
      <template #header><div class="ef-card-title"><span>作品信息</span></div></template>
      <div class="ef-sec-watermark">1</div>
      <el-form :model="baseForm" label-width="120px" :disabled="readonly" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="项目名称">
              <el-input v-model="baseForm.projectName" placeholder="请输入项目名称" />
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
            <el-form-item label="联系人职务">
              <el-input v-model="baseForm.contactPosition" placeholder="请输入联系人职务" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人姓名" prop="contact">
              <el-input v-model="baseForm.contact" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="联系人单位">
              <el-input v-model="baseForm.contactUnit" placeholder="请输入联系人单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系地址" prop="address">
              <el-input v-model="baseForm.address" placeholder="请输入详细地址（至少5个字符）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="baseForm.email" type="email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别">
              <el-select v-model="baseForm.category" placeholder="请选择" style="width: 100%">
                <el-option label="艺术与科技" value="art-tech" />
                <el-option label="艺术与校园" value="art-campus" />
                <el-option label="艺术与生活" value="art-life" />
                <el-option label="艺术与美丽乡村" value="art-village" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-2">
      <template #header>
        <div class="ef-card-title">
          <span>参展人员</span>
        </div>
      </template>
      <div class="ef-sec-watermark">2</div>
      <RosterBlock title="参展人员" :columns="participantColumns" v-model:rows="participants" :readonly="readonly" />
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-3">
      <template #header>
        <div class="ef-card-title">
          <span>项目简介</span>
        </div>
      </template>
      <div class="ef-sec-watermark">3</div>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="工作坊项目简介">
            <el-input v-model="projectIntro" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="请填写工作坊项目简介" :disabled="readonly" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设计思路和特色描述">
            <el-input v-model="designThoughts" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="请填写设计思路和特色描述" :disabled="readonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="展区设计方案">
            <el-input v-model="exhibitionDesign" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="请填写展区设计方案" :disabled="readonly" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-4">
      <template #header><div class="ef-card-title"><span>上传工作坊视频</span></div></template>
      <div class="ef-sec-watermark">4</div>
      <el-upload
        v-model:file-list="fileList"
        class="ef-upload-block"
        drag
        multiple
        :auto-upload="false"
        :limit="6"
        :disabled="readonly"
        :accept="accepts"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。
          </div>
        </template>
      </el-upload>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-5">
      <template #header><div class="ef-card-title"><span>指导教师</span></div></template>
      <div class="ef-sec-watermark">5</div>
      <RosterBlock title="指导教师" :columns="teacherColumns" v-model:rows="teachers" :readonly="readonly" />
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

<script lang="ts" setup name="ArtPracticeForm">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import RosterBlock from '@/components/RosterBlock.vue'
import { InfoFilled, UploadFilled } from '@element-plus/icons-vue'
import { commonRules } from '@/composables/useForm'

interface BaseForm {
  projectName: string
  phone: string
  contactPosition: string
  contact: string
  contactUnit: string
  address: string
  email: string
  category: string
  notice: boolean
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
  projectIntro: string
  designThoughts: string
  exhibitionDesign: string
  files: FileItem[]
  rosters: {
    participants: RosterItem[]
    teachers: RosterItem[]
  }
}
defineProps<{ readonly?: boolean }>()
const emit = defineEmits<{ (e: 'submit', payload: SubmitPayload): void }>()

// 表单引用和验证规则
const formRef = ref<FormInstance>()
const formRules: FormRules = {
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address,
  email: commonRules.email
}

const baseForm = reactive<BaseForm>({
  projectName: '',
  phone: '',
  contactPosition: '',
  contact: '',
  contactUnit: '',
  address: '',
  email: '',
  category: '',
  notice: false
})
const projectIntro = ref('')
const designThoughts = ref('')
const exhibitionDesign = ref('')
const accepts = '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
const fileList = ref<FileItem[]>([])
type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}
const participantColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'phone', label: '联系方式', width: 160 },
  { prop: 'unit', label: '单位', width: 160 },
  { prop: 'position', label: '职务', width: 140 }
]
const teacherColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'org', label: '所在院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
const participants = ref<RosterItem[]>([])
const teachers = ref<RosterItem[]>([])
const onSave = () => {
  const saveData = {
    base: baseForm,
    projectIntro: projectIntro.value,
    designThoughts: designThoughts.value,
    exhibitionDesign: exhibitionDesign.value,
    files: fileList.value,
    rosters: {
      participants: participants.value,
      teachers: teachers.value
    }
  }
  try {
    localStorage.setItem('artPracticeFormDraft', JSON.stringify(saveData))
    ElMessage.success('表单已暂存成功')
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请重试')
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

  const payload: SubmitPayload = {
    base: baseForm,
    projectIntro: projectIntro.value,
    designThoughts: designThoughts.value,
    exhibitionDesign: exhibitionDesign.value,
    files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
    rosters: { participants: participants.value, teachers: teachers.value }
  }
  emit('submit', payload)
}
</script>

<style lang="scss" scoped>
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
