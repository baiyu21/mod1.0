<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>美育改革创新优秀案例申报</span>
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
            <el-form-item label="案例名称" prop="caseName">
              <el-input v-model="baseForm.caseName" placeholder="请输入案例名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人姓名" prop="leaderName">
              <el-input v-model="baseForm.leaderName" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="负责人职称" prop="leaderTitle">
              <el-input v-model="baseForm.leaderTitle" placeholder="请输入负责人职称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="baseForm.email" type="email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="案例代码" prop="caseCode">
              <el-input v-model="baseForm.caseCode" placeholder="请输入案例代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报送单位" prop="submitUnit">
              <el-input v-model="baseForm.submitUnit" placeholder="请输入报送单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="负责人单位" prop="leaderUnit">
              <el-input v-model="baseForm.leaderUnit" placeholder="请输入负责人单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人电话" prop="leaderPhone">
              <el-input v-model="baseForm.leaderPhone" placeholder="请输入11位手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="类别（选题方向）" prop="category">
              <el-select v-model="baseForm.category" placeholder="请选择" style="width: 100%">
                <el-option label="高校美育教师队伍建设" value="teacher-team" />
                <el-option label="高校公共艺术课程建设与教学改革" value="public-art-course" />
                <el-option label="高校专业艺术人才培养模式改革创新" value="talent-training" />
                <el-option label="高校艺术师范教育教学改革" value="normal-education" />
                <el-option label="高校中华优秀传统文化艺术传承创新" value="cultural-heritage" />
                <el-option label="高校学生艺术社团及实践工作坊建设" value="student-org" />
                <el-option label="协同育人机制构建" value="collaborative-education" />
                <el-option label="高校校园文化育人" value="campus-culture" />
                <el-option label="高校美育服务社会路径及实施" value="social-service" />
                <el-option label="高校美育保障机制构建" value="guarantee-mechanism" />
                <el-option label="高校美育评价体系建设" value="evaluation-system" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-card shadow="never" class="ef-section-card sec-2">
      <template #header><div class="ef-card-title"><span>上传案例正文</span></div></template>
      <div class="ef-sec-watermark">2</div>
      <FileUploadBlock
        ref="fileUploadRef"
        v-model="fileList"
        :accept="accepts"
        :limit="6"
        :readonly="readonly"
        tip="支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。"
      />
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

<script lang="ts" setup name="AestheticInnovationForm">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import FileUploadBlock from '@/components/FileUploadBlock.vue'
import { commonRules } from '@/composables/useForm'
import { registrationApi } from '@/services/api'

interface BaseForm {
  caseName: string
  leaderName: string
  leaderTitle: string
  email: string
  caseCode: string
  submitUnit: string
  leaderUnit: string
  leaderPhone: string
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
  caseName: [
    { required: true, message: '请输入案例名称', trigger: 'blur' }
  ],
  leaderTitle: [
    { required: true, message: '请输入负责人职称', trigger: 'blur' }
  ],
  caseCode: [
    { required: true, message: '请输入案例代码', trigger: 'blur' }
  ],
  submitUnit: [
    { required: true, message: '请输入报送单位', trigger: 'blur' }
  ],
  leaderUnit: [
    { required: true, message: '请输入负责人单位', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择类别（选题方向）', trigger: 'change' }
  ],
  leaderName: commonRules.contactName,
  leaderPhone: commonRules.phone,
  email: commonRules.email
}

const baseForm = reactive<BaseForm>({
  caseName: '',
  leaderName: '',
  leaderTitle: '',
  email: '',
  caseCode: '',
  submitUnit: '',
  leaderUnit: '',
  leaderPhone: '',
  category: '',
  notice: false
})
const intro = ref('')
const accepts = '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
const fileList = ref<FileItem[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUploadBlock>>()

const teachers = ref<RosterItem[]>([])
const members = ref<RosterItem[]>([])
const accomp = ref<RosterItem[]>([])
/**
 * 构建 API 数据
 * @param status 状态：'draft' 暂存 或 'pending' 提交
 */
const buildApiData = (status: 'draft' | 'pending') => {
  return {
    program_type: 'aesthetic_innovation',
    base: baseForm,
    intro: intro.value,
    files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
    rosters: {
      teachers: teachers.value,
      members: members.value,
      accomp: accomp.value
    },
    status
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

  // 构建 API 数据，status 为 'draft'
  const apiData = buildApiData('draft')

  // 调用后端接口暂存
  try {
    const success = await registrationApi.submitRegistration(apiData)
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
        localStorage.setItem('aestheticInnovationFormDraft', JSON.stringify(saveData))
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

  // 先上传文件
  if (fileList.value.length > 0) {
    try {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (!uploadedUrls || uploadedUrls.length === 0) {
        ElMessage.error('文件上传失败，请重试')
        return
      }
      ElMessage.success('文件上传成功')
    } catch (error) {
      console.error('文件上传失败:', error)
      ElMessage.error('文件上传失败，请重试')
      return
    }
  }

  // 构建 API 数据，status 为 'pending'
  const apiData = buildApiData('pending')

  // 调用后端接口提交
  try {
    const success = await registrationApi.submitRegistration(apiData)
    if (success) {
      ElMessage.success('提交成功')
      const payload: SubmitPayload = {
        base: baseForm,
        intro: intro.value,
        files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
        rosters: { teachers: teachers.value, members: members.value, accomp: accomp.value }
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
