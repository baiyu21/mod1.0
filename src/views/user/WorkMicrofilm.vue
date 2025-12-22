<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import RosterBlock from '@/components/RosterBlock.vue'
import FileUploadBlock from '@/components/FileUploadBlock.vue'
import { commonRules } from '@/composables/useForm'
import { registrationApi } from '@/services/api'

interface BaseForm {
  title: string
  contact: string
  address: string
  videoMinutes: number
  videoSeconds: number
  tutor1: string
  tutor2: string
  tutor3: string
  phone: string
  createAt: string | null
  group: string
  notice: boolean
}

const baseForm = reactive<BaseForm>({
  title: '',
  contact: '',
  address: '',
  videoMinutes: 0,
  videoSeconds: 0,
  tutor1: '',
  tutor2: '',
  tutor3: '',
  phone: '',
  createAt: null,
  group: '',
  notice: false
})
const authorIntro = ref('')
const creationIntro = ref('')

interface FileItem {
  name: string
  size: number
  type?: string
}

const fileList = ref<FileItem[]>([])
const fileUploadRef = ref<InstanceType<typeof FileUploadBlock>>()
const accepts = '.mp4,.mov,.mkv,.avi,.mp3,.wav,.jpg,.png,.pdf'

// 作者信息表格
type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}

type RosterItem = Record<string, string | number | null>

const authorColumns: Column[] = [
  { prop: 'name', label: '作者姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '所在院系', width: 180 },
  { prop: 'majorType', label: '专业类别', width: 160, type: 'select', options: [{ label:'艺术类', value:'art' }, { label:'非艺术类', value:'non-art' }] },
  { prop: 'major', label: '专业名称', width: 160 },
  { prop: 'studentNo', label: '学号', width: 140 },
  { prop: 'phone', label: '联系方式', width: 160 }
]

const authors = ref<RosterItem[]>([])

// Props
defineProps<{ readonly?: boolean }>()

// 表单引用和验证规则
const formRef = ref<FormInstance>()
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入作品名称', trigger: 'blur' }
  ],
  videoMinutes: [
    { required: true, message: '请输入视频时长（分钟）', trigger: 'blur' },
    { type: 'number', min: 0, message: '分钟数不能小于0', trigger: 'blur' }
  ],
  createAt: [
    { required: true, message: '请选择创作时间', trigger: 'change' }
  ],
  group: [
    { required: true, message: '请选择组别', trigger: 'change' }
  ],
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address,
  tutor1: commonRules.contactName,
  tutor2: commonRules.contactName,
  tutor3: commonRules.contactName
}

// 组别映射：前端值 → 后端值
const mapGroup = (group: string): string => {
  const map: Record<string, string> = {
    'group1': 'group_a',  // 甲组(非专业组) → group_a
    'group2': 'group_b'   // 乙组（专业组） → group_b
  }
  return map[group] || 'group_a'
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

// 转换作者数据
// 注意：微电影的作者字段名与其他作品类不同
// author_name（不是 name）、id_number（不是 id_card_number）、contact_info（不是 phone）
const transformAuthors = (rows: RosterItem[]): Record<string, string>[] => {
  return rows
    .filter(row => row.name && String(row.name).trim())
    .map(row => {
      // 只构建后端需要的字段，注意字段名不同
      const authorData: Record<string, string> = {
        author_name: String(row.name || '').trim() // 注意：字段名是 author_name
      }

      // id_number: 后端必需，注意字段名是 id_number（不是 id_card_number）
      const idNo = String(row.idNo || '').trim()
      authorData.id_number = idNo || '000000000000000000'

      // region: 后端必需，如果前端没有则使用默认值
      const region = String(row.region || '').trim()
      authorData.region = region || '未填写'

      // school_name: 后端必需，如果前端没有则使用默认值
      const school = String(row.school || '').trim()
      authorData.school_name = school || '未填写'

      // department: 后端必需，如果前端没有则使用默认值
      const dept = String(row.dept || '').trim()
      authorData.department = dept || '未填写'

      // major_category: 后端必需，如果前端没有则使用默认值
      authorData.major_category = mapMajorCategory(row.majorType as string)

      // major_name: 后端必需，如果前端没有则使用默认值
      const major = String(row.major || '').trim()
      authorData.major_name = major || '数字媒体艺术'

      // student_id: 后端必需，如果前端没有则使用默认值
      const studentNo = String(row.studentNo || '').trim()
      authorData.student_id = studentNo || '20200001'

      // contact_info: 后端必需，注意字段名是 contact_info（不是 phone）
      const phone = String(row.phone || '').trim()
      authorData.contact_info = phone || '13800000000'

      // 只返回后端需要的字段，不传入前端有但后端不需要的字段
      return authorData
    })
}

// 暂存功能
const onSave = () => {
  const saveData = {
    base: baseForm,
    authorIntro: authorIntro.value,
    creationIntro: creationIntro.value,
    files: fileList.value,
    authors: authors.value
  }
  try {
    localStorage.setItem('microfilmFormDraft', JSON.stringify(saveData))
    ElMessage.success('表单已暂存成功')
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请重试')
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

// 提交功能
const onSubmit = async () => {
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

  // 转换作者数据
  const authorsData = transformAuthors(authors.value)

  if (authorsData.length === 0) {
    ElMessage.warning('请至少添加一个作者')
    return
  }

  // 处理文件上传
  let microFilmVideo = 'https://example.com/sample_microfilm_video.mp4'
  if (fileList.value.length > 0) {
    const firstFileUrl = fileUploadRef.value?.getFirstFileUrl()
    if (firstFileUrl) {
      microFilmVideo = firstFileUrl
    } else {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (uploadedUrls && uploadedUrls.length > 0 && uploadedUrls[0]) {
        microFilmVideo = uploadedUrls[0]
      } else {
        ElMessage.error('文件上传失败，请重试')
        return
      }
    }
  }

  // 构建接口数据（严格按照后端字段要求）
  const apiData = {
    // 作品基本信息
    work_title: String(baseForm.title || '').trim(),
    instructor_1: String(baseForm.tutor1 || '').trim(),
    instructor_2: String(baseForm.tutor2 || '').trim(),
    instructor_3: String(baseForm.tutor3 || '').trim(), // 可以为空字符串

    // 联系信息
    contact_name: String(baseForm.contact || '').trim(),
    contact_phone: String(baseForm.phone || '').trim(),
    contact_address: String(baseForm.address || '').trim(),

    // 作品详情
    creation_date: String(baseForm.createAt || '').trim(), // YYYY-MM-DD 格式
    video_duration_minutes: Number(baseForm.videoMinutes) || 0,
    video_duration_seconds: Number(baseForm.videoSeconds) || 0,
    group: mapGroup(baseForm.group), // "group_a" 或 "group_b"

    // 文件
    micro_film_video: microFilmVideo, // 微电影视频URL

    // 简介
    author_profile: String(authorIntro.value || '').trim(), // 注意：字段名是 author_profile
    creation_description: String(creationIntro.value || '').trim(),

    // 作者数组
    authors: authorsData
  }

  try {
    console.log('[MicrofilmSubmit] payload:', JSON.stringify(apiData, null, 2))
    const success = await registrationApi.submitMicrofilm(apiData)
    if (success) {
      ElMessage.success('提交成功')
      // 保存到 localStorage
      const submitData = {
        base: baseForm,
        authorIntro: authorIntro.value,
        creationIntro: creationIntro.value,
        files: fileList.value.map(f => ({ name: f.name, size: f.size, type: f.type })),
        authors: authors.value,
        submitTime: new Date().toLocaleString('zh-CN'),
        status: '待审核'
      }
      try {
        const existingRecords = JSON.parse(localStorage.getItem('registrationRecords') || '[]')
        existingRecords.push({
          id: Date.now(),
          category: '微电影作品',
          data: submitData
        })
        localStorage.setItem('registrationRecords', JSON.stringify(existingRecords))
      } catch (error) {
        console.error('保存记录失败:', error)
      }
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
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>微电影作品提交</span>
        </div>
      </template>
      <div class="intro-text">学生艺术作品需提交400以内的创作说明（包括作品主题简介和创作过程介绍）。<br>
      片长不超过15分钟，视频统一采用MPG2格式，作者须保留MOV或AVI格式视频文件。</div>
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>作品信息</span></div></template>
      <div class="ef-sec-watermark">1</div>
      <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="120px" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="作品名称" prop="title">
              <el-input v-model="baseForm.title" placeholder="请输入作品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人姓名" prop="contact">
              <el-input v-model="baseForm.contact" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="联系地址" prop="address">
              <el-input v-model="baseForm.address" placeholder="请输入详细地址（至少5个字符）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="视频时长" prop="videoMinutes">
              <div class="ef-duration">
                <el-input v-model.number="baseForm.videoMinutes" type="number" min="0" style="width:80px" />
                <span class="ef-unit">分</span>
                <el-input v-model.number="baseForm.videoSeconds" type="number" min="0" max="59" style="width:80px" />
                <span class="ef-unit">秒</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="指导教师1" prop="tutor1">
              <el-input v-model="baseForm.tutor1" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指导教师2" prop="tutor2">
              <el-input v-model="baseForm.tutor2" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="指导教师3" prop="tutor3">
              <el-input v-model="baseForm.tutor3" placeholder="请输入中文姓名" />
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
            <el-form-item label="创作时间" prop="createAt">
              <el-date-picker
                v-model="baseForm.createAt"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
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
      </el-form>
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>作品简介</span></div></template>
      <div class="ef-sec-watermark">2</div>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-input
            v-model="authorIntro"
            type="textarea"
            :rows="6"
            maxlength="300"
            show-word-limit
            placeholder="作者简介"
          />
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="creationIntro"
            type="textarea"
            :rows="6"
            maxlength="500"
            show-word-limit
            placeholder="创作简介（包括作品主题简介和创作过程介绍）"
          />
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>上传作品与物料</span></div></template>
      <div class="ef-sec-watermark">3</div>
      <FileUploadBlock
        ref="fileUploadRef"
        v-model="fileList"
        :accept="accepts"
        :limit="10"
        :readonly="readonly"
        upload-category="microfilm"
        tip="支持 mp4/mov 等视频，及海报、剧照、脚本PDF等。"
        upload-text="拖拽到此处或 <em>点击上传</em>"
      />
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>作者信息</span></div></template>
      <div class="ef-sec-watermark">4</div>
      <RosterBlock title="作者信息" :columns="authorColumns" v-model:rows="authors" />
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
