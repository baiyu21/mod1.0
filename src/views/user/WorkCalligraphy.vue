<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { InfoFilled, UploadFilled } from '@element-plus/icons-vue'
import RosterBlock from '@/components/RosterBlock.vue'
import { commonRules } from '@/composables/useForm'

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
const accepts = '.jpg,.jpeg,.png,.pdf'

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

// 表单引用和验证规则
const formRef = ref<FormInstance>()
const formRules: FormRules = {
  contact: commonRules.contactName,
  phone: commonRules.phone,
  address: commonRules.address,
  tutor: commonRules.contactName
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
    localStorage.setItem('calligraphyFormDraft', JSON.stringify(saveData))
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
  await formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整的表单信息')
      return
    }
  }).catch(() => {
    ElMessage.warning('请填写完整的表单信息')
    return
  })

  // TODO: 实现提交逻辑
  ElMessage.success('提交成功')
}
</script>

<template>
  <div class="ef-form">
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title">
          <el-icon><InfoFilled /></el-icon>
          <span>书法作品提交</span>
        </div>
      </template>
      <div class="intro-text">学生艺术作品需提交400以内的创作说明（包括作品主题简介和创作过程介绍）。<br>
      书法：书体不限，尺寸不超过四尺宣纸（69cmX138cm对开）</div>
    </el-card>

    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>作品信息</span></div></template>
      <div class="ef-sec-watermark">1</div>
      <el-form ref="formRef" :model="baseForm" :rules="formRules" label-width="120px" class="ef-base-form">
        <!-- 作品信息区 -->
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
                <el-option label="书法" value="calligraphy" />
                <el-option label="篆刻" value="seal-carving" />
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

        <!-- 联系信息区 -->
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
      <el-upload
        v-model:file-list="fileList"
        class="ef-upload-block"
        drag
        :auto-upload="false"
        :limit="6"
        :accept="accepts"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽到此处或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 jpg/png/pdf，建议单张≥2000px。</div>
        </template>
      </el-upload>
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
