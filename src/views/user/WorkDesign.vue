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
  length: number | string
  width: number | string
  tutor: string
  phone: string
  createAt: string | null
  formType: string
  group: string
  notice: boolean
}

const baseForm = reactive<BaseForm>({
  title: '',
  contact: '',
  address: '',
  length: '',
  width: '',
  tutor: '',
  phone: '',
  createAt: null,
  formType: '',
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
const accepts = '.jpg,.jpeg,.png,.pdf,.mp4'

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
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address,
  tutor: commonRules.contactName
}

// 组别映射：前端值 → 后端中文值
const mapGroupType = (group: string): string => {
  const map: Record<string, string> = {
    'group1': '甲组',      // 甲组(非专业组) → 甲组
    'group2': '乙组'       // 乙组（专业组） → 乙组
  }
  return map[group] || '甲组'
}

// 作品形式映射：前端值 → 后端中文值
const mapArtForm = (formType: string): string => {
  const map: Record<string, string> = {
    'graphic-design': '平面设计',
    '3d-design': '立体设计'
  }
  return map[formType] || '平面设计'
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
// 只传入后端需要的字段，如果前端有但后端不需要的字段不传入
// 如果后端需要但前端没有的字段，使用默认值
const transformAuthors = (rows: RosterItem[]): Record<string, string>[] => {
  return rows
    .filter(row => row.name && String(row.name).trim())
    .map(row => {
      // 只构建后端需要的字段
      const authorData: Record<string, string> = {
        name: String(row.name || '').trim()
      }

      // id_card_number: 后端必需，如果前端没有则使用默认值
      const idNo = String(row.idNo || '').trim()
      authorData.id_card_number = idNo || '000000000000000000'

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
      authorData.major_name = major || '设计专业'

      // student_id: 后端必需，如果前端没有则使用默认值
      const studentNo = String(row.studentNo || '').trim()
      authorData.student_id = studentNo || '20200001'

      // phone: 后端必需，如果前端没有则使用默认值
      const phone = String(row.phone || '').trim()
      authorData.phone = phone || '13800000000'

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
    localStorage.setItem('designFormDraft', JSON.stringify(saveData))
    ElMessage.success('表单已暂存成功')
  } catch (error) {
    console.error('暂存失败:', error)
    ElMessage.error('暂存失败，请重试')
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
  let workPhoto = 'https://example.com/sample_design_photo.jpg'
  if (fileList.value.length > 0) {
    const firstFileUrl = fileUploadRef.value?.getFirstFileUrl()
    if (firstFileUrl) {
      workPhoto = firstFileUrl
    } else {
      ElMessage.info('正在上传文件，请稍候...')
      const uploadedUrls = await fileUploadRef.value?.uploadAllFiles()
      if (uploadedUrls && uploadedUrls.length > 0 && uploadedUrls[0]) {
        workPhoto = uploadedUrls[0]
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
    instructor_name: String(baseForm.tutor || '').trim(),

    // 联系信息
    contact_name: String(baseForm.contact || '').trim(),
    contact_phone: String(baseForm.phone || '').trim(),
    contact_address: String(baseForm.address || '').trim(),

    // 作品详情
    creation_date: String(baseForm.createAt || '').trim(), // YYYY-MM-DD 格式
    work_length: String(baseForm.length || '0').trim(), // 字符串格式，如 "50.5"
    work_width: String(baseForm.width || '0').trim(), // 字符串格式，如 "30.2"
    art_form: mapArtForm(baseForm.formType), // 中文："平面设计" 或 "立体设计"
    group_type: mapGroupType(baseForm.group), // 中文："甲组" 或 "乙组"

    // 文件
    work_photo: workPhoto, // 作品照片URL

    // 简介
    author_biography: String(authorIntro.value || '').trim(),
    creation_description: String(creationIntro.value || '').trim(),

    // 作者数组
    authors: authorsData
  }

  try {
    console.log('[DesignSubmit] payload:', JSON.stringify(apiData, null, 2))
    const success = await registrationApi.submitDesign(apiData)
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
          category: '设计作品',
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
          <span>设计作品提交</span>
        </div>
      </template>
      <div class="intro-text">学生艺术作品需提交400以内的创作说明（包括作品主题简介和创作过程介绍）。<br>
      含平面设计和立体设计，平面设计作品尺寸不超过对开（54cmX78cm）<br>
      立体设计作品尺寸不超过50cm（长）X50cm（宽）X50cm（高）</div>
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>作品信息</span></div></template>
      <div class="ef-sec-watermark">1</div>
      <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="120px" class="ef-base-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="作品名称">
              <el-input v-model="baseForm.title" placeholder="请输入作品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指导教师" prop="tutor">
              <el-input v-model="baseForm.tutor" placeholder="请输入中文姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="作品长度">
              <el-input v-model="baseForm.length" type="number" placeholder="单位(cm)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作品宽度">
              <el-input v-model="baseForm.width" type="number" placeholder="单位(cm)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="创作时间">
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
            <el-form-item label="作品形式">
              <el-select v-model="baseForm.formType" placeholder="请选择" style="width: 100%">
                <el-option label="平面设计" value="graphic-design" />
                <el-option label="立体设计" value="3d-design" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="组别">
              <el-select v-model="baseForm.group" placeholder="请选择" style="width: 100%">
                <el-option label="甲组(非专业组)" value="group1" />
                <el-option label="乙组（专业组）" value="group2" />
              </el-select>
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
            <el-col :span="24">
              <el-form-item label="联系地址" prop="address">
                <el-input v-model="baseForm.address" placeholder="请输入详细地址（至少5个字符）" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
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
      <template #header><div class="ef-card-title"><span>上传作品</span></div></template>
      <div class="ef-sec-watermark">3</div>
      <FileUploadBlock
        ref="fileUploadRef"
        v-model="fileList"
        :accept="accepts"
        :limit="10"
        :readonly="readonly"
        upload-category="design"
        tip="支持 jpg/png/pdf/mp4，建议提供效果图与说明文档。"
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
