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
      <el-form :model="baseForm" label-width="120px" :disabled="readonly" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="案例名称">
              <el-input v-model="baseForm.caseName" placeholder="请输入案例名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人姓名">
              <el-input v-model="baseForm.leaderName" placeholder="请输入负责人姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="负责人职称">
              <el-input v-model="baseForm.leaderTitle" placeholder="请输入负责人职称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱">
              <el-input v-model="baseForm.email" type="email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="案例代码">
              <el-input v-model="baseForm.caseCode" placeholder="请输入案例代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报送单位">
              <el-input v-model="baseForm.submitUnit" placeholder="请输入报送单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="负责人单位">
              <el-input v-model="baseForm.leaderUnit" placeholder="请输入负责人单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人电话">
              <el-input v-model="baseForm.leaderPhone" placeholder="请输入负责人电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="类别（选题方向）">
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
      <el-button type="primary" size="large" @click="onSubmit">提交报名表</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup name="AestheticInnovationForm">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, UploadFilled } from '@element-plus/icons-vue'

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
    localStorage.setItem('aestheticInnovationFormDraft', JSON.stringify(saveData))
    ElMessage.success('表单已暂存成功')
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请重试')
  }
}
const onSubmit = () => {
  const payload: SubmitPayload = {
    base: baseForm,
    intro: intro.value,
    files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
    rosters: { teachers: teachers.value, members: members.value, accomp: accomp.value }
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
