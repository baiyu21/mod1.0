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
      <el-form :model="baseForm" label-width="120px" :disabled="readonly" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="表演形式">
              <el-select v-model="baseForm.performanceType" placeholder="请选择" style="width: 100%">
                <el-option label="群舞" value="group-dance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作品时长">
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
            <el-form-item label="作品名称">
              <el-input v-model="baseForm.workName" placeholder="请输入作品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="表演人数">
              <el-input v-model.number="baseForm.count" type="number" min="1" placeholder="请输入表演人数" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="是否为原创">
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
              <el-form-item label="联系人姓名">
                <el-input v-model="baseForm.contact" placeholder="联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人电话">
                <el-input v-model="baseForm.phone" placeholder="手机号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系地址">
                <el-input v-model="baseForm.address" placeholder="联系地址" />
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
    <el-card shadow="never" class="ef-section-card sec-4">
      <template #header><div class="ef-card-title"><span>报名花名册</span></div></template>
      <div class="ef-sec-watermark">4</div>
      <RosterBlock title="指导教师" :columns="teacherColumns" v-model:rows="teachers" :readonly="readonly" />
      <RosterBlock class="ef-mt16" title="参赛人员" :columns="memberColumns" v-model:rows="members" :readonly="readonly" />
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

<script lang="ts" setup name="DanceRegistrationForm">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import RosterBlock from '@/components/RosterBlock.vue'
import { InfoFilled, UploadFilled } from '@element-plus/icons-vue'

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
type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}
const teacherColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'title', label: '职称/专业', width: 160 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'org', label: '所属院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
const memberColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'major', label: '专业类别', width: 160 },
  { prop: 'grade', label: '年级', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '所在院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
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
