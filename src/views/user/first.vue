<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="ef-form">
    <!-- 顶部说明 -->
    <el-card shadow="never" class="intro-card">
      <template #header>
        <div class="ef-card-title-header">
          <div class="ef-card-title">
            <el-icon><InfoFilled /></el-icon>
            <span>报名数据统计</span>
          </div>
          <el-button type="primary" :icon="Download" @click="exportStatistics">
            导出统计表
          </el-button>
        </div>
      </template>
      <div class="intro-text">
        以下为您提交的报名记录，您可以查看、导出报名表或上传盖章后的报名表。
      </div>
    </el-card>

    <!-- 报名记录表格 -->
    <el-card shadow="never" class="ef-section-card">
      <template #header>
        <div class="ef-card-title">
          <span>报名记录</span>
        </div>
      </template>
      <div class="ef-sec-watermark">1</div>

      <!-- 筛选和搜索工具栏 -->
      <div class="toolbar">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-select
              v-model="filterCategory"
              placeholder="筛选类别"
              clearable
              style="width: 100%"
              @change="handleFilter"
            >
              <el-option label="全部" value="" />
              <el-option label="声乐报名" value="声乐报名" />
              <el-option label="器乐报名" value="器乐报名" />
              <el-option label="舞蹈报名" value="舞蹈报名" />
              <el-option label="戏曲报名" value="戏曲报名" />
              <el-option label="朗诵报名" value="朗诵报名" />
              <el-option label="书法作品" value="书法作品" />
              <el-option label="绘画作品" value="绘画作品" />
              <el-option label="设计作品" value="设计作品" />
              <el-option label="摄影作品" value="摄影作品" />
              <el-option label="微电影作品" value="微电影作品" />
              <el-option label="艺术实践工作坊" value="艺术实践工作坊" />
              <el-option label="美育改革创新案例" value="美育改革创新案例" />
            </el-select>
          </el-col>
          <el-col :span="10">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索作品名称、类别"
              clearable
              @input="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="8">
            <div class="toolbar-info">
              共 {{ totalRecords }} 条记录
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table :data="paginatedRecords" border style="width: 100%" v-loading="loading">
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类别" width="180" />
        <el-table-column prop="workName" label="作品名称" width="200" show-overflow-tooltip />
        <el-table-column prop="submitTime" label="提交时间" width="180" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === '已审核' ? 'success' : row.status === '待审核' ? 'warning' : 'info'"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 导出报名表 -->
    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>导出报名表</span></div></template>
      <div class="ef-sec-watermark">2</div>
      <div class="export-section">
        <p class="export-desc">您可以选择导出所有报名表数据，或按类别导出特定类型的报名表。</p>
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-select v-model="selectedCategory" placeholder="选择类别" style="width: 100%">
              <el-option label="声乐报名" value="vocal" />
              <el-option label="器乐报名" value="instrumental" />
              <el-option label="舞蹈报名" value="dance" />
              <el-option label="戏曲报名" value="opera" />
              <el-option label="朗诵报名" value="recitation" />
              <el-option label="书法作品" value="calligraphy" />
              <el-option label="绘画作品" value="painting" />
              <el-option label="设计作品" value="design" />
              <el-option label="摄影作品" value="photography" />
              <el-option label="微电影作品" value="microfilm" />
              <el-option label="艺术实践工作坊" value="artPractice" />
              <el-option label="美育改革创新案例" value="aestheticInnovation" />
            </el-select>
          </el-col>
          <el-col :span="9">
            <el-button type="primary" size="large" @click="exportAll" :loading="exporting" style="width: 100%">
              <el-icon><Download /></el-icon>
              导出所有报名表
            </el-button>
          </el-col>
          <el-col :span="9">
            <el-button type="success" size="large" @click="exportByCategory" :disabled="!selectedCategory" :loading="exporting" style="width: 100%">
              <el-icon><Download /></el-icon>
              导出选中类别报名表
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 上传盖章报名表 -->
    <el-card shadow="never" class="ef-section-card">
      <template #header><div class="ef-card-title"><span>上传盖章报名表</span></div></template>
      <div class="ef-sec-watermark">3</div>
      <el-upload
        v-model:file-list="sealedFileList"
        class="ef-upload-block"
        drag
        multiple
        :auto-upload="false"
        :limit="10"
        :accept="'.pdf,.jpg,.jpeg,.png'"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将盖章后的报名表拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持：PDF、JPG、PNG格式。请上传已盖章的报名表扫描件或照片。
          </div>
        </template>
      </el-upload>
      <div class="ef-actions" style="margin-top: 16px">
        <el-button type="primary" size="large" @click="uploadSealed" :disabled="sealedFileList.length === 0" :loading="uploading">
          <el-icon><Upload /></el-icon>
          提交盖章报名表
        </el-button>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="报名详细信息"
      width="800px"
      v-if="currentDetail"
    >
      <!-- 基本信息 -->
      <el-descriptions :column="2" border title="基本信息">
        <el-descriptions-item label="节目名称">
          {{ currentDetail.workName }}
        </el-descriptions-item>
        <el-descriptions-item label="节目类型">
          {{ currentDetail.category }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ currentDetail.submitTime }}
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag
            :type="currentDetail.status === '已审核' ? 'success' : currentDetail.status === '待审核' ? 'warning' : 'info'"
            size="small"
          >
            {{ currentDetail.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.contact" label="联系人">
          {{ currentDetail.contact }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.phone" label="联系电话">
          {{ currentDetail.phone }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.address" label="地址">
          {{ currentDetail.address }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 演奏类报名详情（声乐、器乐、舞蹈、戏曲、朗诵） -->
      <template v-if="['声乐报名', '器乐报名', '舞蹈报名', '戏曲报名', '朗诵报名'].includes(String(currentDetail.category))">
        <el-descriptions :column="2" border title="作品信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.performanceType" label="表演形式">
            {{ currentDetail.performanceType }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.minutes !== undefined && currentDetail.seconds !== undefined" label="作品时长">
            {{ currentDetail.minutes }}分{{ currentDetail.seconds }}秒
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.isOriginal !== undefined" label="是否原创">
            {{ currentDetail.isOriginal ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.group" label="组别">
            {{ currentDetail.group }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.song1" label="曲目1">
            {{ currentDetail.song1 }}
            <span v-if="currentDetail.song1HasChinese !== undefined">
              （{{ currentDetail.song1HasChinese ? '中文作品' : '非中文作品' }}）
            </span>
            <span v-if="currentDetail.song1IsOriginal !== undefined">
              {{ currentDetail.song1IsOriginal ? '原创作品' : '非原创作品' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.song2" label="曲目2">
            {{ currentDetail.song2 }}
            <span v-if="currentDetail.song2HasChinese !== undefined">
              （{{ currentDetail.song2HasChinese ? '中文作品' : '非中文作品' }}）
            </span>
            <span v-if="currentDetail.song2IsOriginal !== undefined">
              {{ currentDetail.song2IsOriginal ? '原创作品' : '非原创作品' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.chorusCount" label="合唱人数">
            {{ currentDetail.chorusCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.pianoAccompanist" label="钢琴伴奏">
            {{ currentDetail.pianoAccompanist === 'teacher' ? '老师' : currentDetail.pianoAccompanist === 'student' ? '学生' : currentDetail.pianoAccompanist }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leader" label="领队">
            {{ currentDetail.leader }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutor" label="指导教师">
            {{ currentDetail.tutor }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 作品类报名详情（书法、绘画、设计、摄影） -->
      <template v-if="['书法作品', '绘画作品', '设计作品', '摄影作品'].includes(String(currentDetail.category))">
        <el-descriptions :column="2" border title="作品信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.workNameField" label="作品名称">
            {{ currentDetail.workNameField }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutorField" label="指导教师">
            {{ currentDetail.tutorField }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.length" label="作品长度">
            {{ currentDetail.length }}cm
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.width" label="作品宽度">
            {{ currentDetail.width }}cm
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.createAt" label="创作时间">
            {{ currentDetail.createAt }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.formType" label="作品形式">
            {{ currentDetail.formType }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.group" label="组别">
            {{ currentDetail.group }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 作者简介和创作说明 -->
        <div v-if="currentDetail.authorIntro || currentDetail.creationIntro" style="margin-top: 20px">
          <el-descriptions :column="1" border>
            <el-descriptions-item v-if="currentDetail.authorIntro" label="作者简介">
              <div style="white-space: pre-wrap;">{{ currentDetail.authorIntro }}</div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentDetail.creationIntro" label="创作说明">
              <div style="white-space: pre-wrap;">{{ currentDetail.creationIntro }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>

      <!-- 微电影作品详情 -->
      <template v-if="currentDetail.category === '微电影作品'">
        <el-descriptions :column="2" border title="作品信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.workNameField" label="作品名称">
            {{ currentDetail.workNameField }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.group" label="组别">
            {{ currentDetail.group }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.videoMinutes !== undefined && currentDetail.videoSeconds !== undefined" label="作品时长">
            {{ currentDetail.videoMinutes }}分{{ currentDetail.videoSeconds }}秒
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.createAt" label="创作时间">
            {{ currentDetail.createAt }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutor1" label="指导教师1">
            {{ currentDetail.tutor1 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutor2" label="指导教师2">
            {{ currentDetail.tutor2 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.tutor3" label="指导教师3">
            {{ currentDetail.tutor3 }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 作者简介和创作说明 -->
        <div v-if="currentDetail.authorIntro || currentDetail.creationIntro" style="margin-top: 20px">
          <el-descriptions :column="1" border>
            <el-descriptions-item v-if="currentDetail.authorIntro" label="作者简介">
              <div style="white-space: pre-wrap;">{{ currentDetail.authorIntro }}</div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentDetail.creationIntro" label="创作说明">
              <div style="white-space: pre-wrap;">{{ currentDetail.creationIntro }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>

      <!-- 艺术实践工作坊详情 -->
      <template v-if="currentDetail.category === '艺术实践工作坊'">
        <el-descriptions :column="2" border title="项目信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.projectName" label="项目名称">
            {{ currentDetail.projectName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.contactPosition" label="联系人职务">
            {{ currentDetail.contactPosition }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.contact" label="联系人">
            {{ currentDetail.contact }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.contactUnit" label="联系单位">
            {{ currentDetail.contactUnit }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.phone" label="联系电话">
            {{ currentDetail.phone }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.email" label="邮箱">
            {{ currentDetail.email }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.address" label="地址">
            {{ currentDetail.address }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.categoryField" label="类别">
            {{ currentDetail.categoryField }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 项目简介、设计思路、展览设计 -->
        <div v-if="currentDetail.projectIntro || currentDetail.designThoughts || currentDetail.exhibitionDesign" style="margin-top: 20px">
          <el-descriptions :column="1" border>
            <el-descriptions-item v-if="currentDetail.projectIntro" label="项目简介">
              <div style="white-space: pre-wrap;">{{ currentDetail.projectIntro }}</div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentDetail.designThoughts" label="设计思路">
              <div style="white-space: pre-wrap;">{{ currentDetail.designThoughts }}</div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentDetail.exhibitionDesign" label="展览设计">
              <div style="white-space: pre-wrap;">{{ currentDetail.exhibitionDesign }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>

      <!-- 美育改革创新详情 -->
      <template v-if="currentDetail.category === '美育改革创新案例'">
        <el-descriptions :column="2" border title="案例信息" style="margin-top: 20px">
          <el-descriptions-item v-if="currentDetail.caseName" label="案例名称">
            {{ currentDetail.caseName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.caseCode" label="案例代码">
            {{ currentDetail.caseCode }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderName" label="负责人姓名">
            {{ currentDetail.leaderName }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderTitle" label="负责人职称">
            {{ currentDetail.leaderTitle }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.submitUnit" label="报送单位">
            {{ currentDetail.submitUnit }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderUnit" label="负责人单位">
            {{ currentDetail.leaderUnit }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.leaderPhone" label="负责人电话">
            {{ currentDetail.leaderPhone }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.categoryField" label="类别（选题方向）">
            {{ currentDetail.categoryField }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 简介 -->
      <div v-if="currentDetail.intro" style="margin-top: 20px">
        <h4>简介</h4>
        <div style="padding: 12px; background-color: #f5f7fa; border-radius: 4px; white-space: pre-wrap;">
          {{ currentDetail.intro }}
        </div>
      </div>

      <!-- 花名册信息 -->
      <div v-if="currentDetail.teachersCount || currentDetail.membersCount || currentDetail.accompCount || currentDetail.studentAccompCount || currentDetail.teacherAccompCount || currentDetail.participantsCount || currentDetail.authorsCount" style="margin-top: 20px">
        <h4>花名册信息</h4>
        <el-descriptions :column="3" border>
          <el-descriptions-item v-if="currentDetail.teachersCount" label="教师数量">
            {{ currentDetail.teachersCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.membersCount" label="成员数量">
            {{ currentDetail.membersCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.accompCount" label="伴奏数量">
            {{ currentDetail.accompCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.studentAccompCount" label="学生伴奏数量">
            {{ currentDetail.studentAccompCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.teacherAccompCount" label="教师伴奏数量">
            {{ currentDetail.teacherAccompCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.participantsCount" label="参与人员数量">
            {{ currentDetail.participantsCount }}人
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.authorsCount" label="作者数量">
            {{ currentDetail.authorsCount }}人
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 上传文件 -->
      <div v-if="currentDetail.files && Array.isArray(currentDetail.files) && currentDetail.files.length > 0" style="margin-top: 20px">
        <h4>上传文件</h4>
        <el-table :data="currentDetail.files" border size="small" max-height="200">
          <el-table-column prop="name" label="文件名" min-width="200" />
          <el-table-column prop="type" label="文件类型" width="120">
            <template #default="{ row }">
              {{ row.type || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, UploadFilled, Download, Upload, Search } from '@element-plus/icons-vue'
import { reviewApi } from '@/services/api'

interface FileItem {
  name: string
  size: number
  type?: string
}

interface RegistrationRecord {
  index: number
  category: string
  categoryKey: string
  workName: string
  submitTime: string
  status: string
  storageKey?: string
  data: Record<string, unknown>
  rawData?: any // 后端原始数据
}

const registrationRecords = ref<RegistrationRecord[]>([])
const allRecords = ref<RegistrationRecord[]>([]) // 所有记录（未筛选）
const filterCategory = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref('')
const exporting = ref(false)
const uploading = ref(false)
const sealedFileList = ref<FileItem[]>([])
const loading = ref(false)

// 获取类别名称
const getCategoryName = (key: string) => {
  const names: Record<string, string> = {
    vocal: '声乐报名',
    instrumental: '器乐报名',
    dance: '舞蹈报名',
    opera: '戏曲报名',
    recitation: '朗诵报名',
    calligraphy: '书法作品',
    painting: '绘画作品',
    design: '设计作品',
    photography: '摄影作品',
    microfilm: '微电影作品',
    artPractice: '艺术实践工作坊',
    aestheticInnovation: '美育改革创新案例'
  }
  return names[key] || key
}

// 映射后端状态到前端状态
const mapBackendStatus = (status: string | undefined | null): string => {
  const value = typeof status === 'string' ? status.toLowerCase() : ''
  if (['approved', 'pass', 'passed', '已通过', '已审核'].includes(value)) {
    return '已审核'
  }
  if (['rejected', 'reject', '已驳回', 'failed', '已退回'].includes(value)) {
    return '已退回'
  }
  return '待审核'
}

// 映射后端报名数据到前端格式
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapBackendRegistration = (record: any, categoryKey: string, index: number): RegistrationRecord => {
  // 提取作品名称
  let workName = ''
  if (categoryKey === 'vocal') {
    workName = record?.song1_title || record?.work_title || record?.performance_title || record?.song2_title || `声乐作品-${index + 1}`
  } else if (categoryKey === 'dance') {
    workName = record?.work_title || record?.performance_title || record?.work_description || `舞蹈作品-${index + 1}`
  } else if (categoryKey === 'instrumental') {
    workName = record?.work_title || record?.performance_title || record?.work_description || `器乐作品-${index + 1}`
  } else {
    workName = record?.work_title || record?.title || record?.work_name || record?.case_name || record?.project_name || `作品-${index + 1}`
  }

  // 提取提交时间
  const submitTime = record?.created_at || record?.submit_time || record?.created_time || new Date().toLocaleString('zh-CN')

  // 映射状态
  const status = mapBackendStatus(record?.status)

  return {
    index: index + 1,
    category: getCategoryName(categoryKey),
    categoryKey: categoryKey,
    workName: workName,
    submitTime: submitTime,
    status: status,
    data: record,
    rawData: record
  }
}

// 加载报名记录（从API获取）
const loadRegistrationRecords = async () => {
  loading.value = true
  try {
    console.log('[first.vue] 开始加载报名记录')

    // 并行获取所有类型的报名记录
    const [vocalData, danceData, instrumentalData] = await Promise.all([
      reviewApi.getAllRegistrations('vocal').catch(err => {
        console.error('[first.vue] 获取声乐报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('dance').catch(err => {
        console.error('[first.vue] 获取舞蹈报名列表失败:', err)
        return []
      }),
      reviewApi.getAllRegistrations('instrumental').catch(err => {
        console.error('[first.vue] 获取器乐报名列表失败:', err)
        return []
      })
    ])

    const records: RegistrationRecord[] = []
    let index = 0

    // 处理声乐报名数据
    if (Array.isArray(vocalData)) {
      vocalData.forEach((item: any) => {
        records.push(mapBackendRegistration(item, 'vocal', index++))
      })
    }

    // 处理舞蹈报名数据
    if (Array.isArray(danceData)) {
      danceData.forEach((item: any) => {
        records.push(mapBackendRegistration(item, 'dance', index++))
      })
    }

    // 处理器乐报名数据
    if (Array.isArray(instrumentalData)) {
      instrumentalData.forEach((item: any) => {
        records.push(mapBackendRegistration(item, 'instrumental', index++))
      })
    }

    console.log('[first.vue] 加载完成，共', records.length, '条记录')
    registrationRecords.value = records
    allRecords.value = records
  } catch (error) {
    console.error('[first.vue] 加载报名记录失败:', error)
    ElMessage.error('加载报名记录失败，请稍后重试')
    registrationRecords.value = []
    allRecords.value = []
  } finally {
    loading.value = false
  }
}

// 筛选和搜索后的记录
const filteredRecords = computed(() => {
  let records = [...allRecords.value]

  // 按类别筛选
  if (filterCategory.value) {
    records = records.filter(record => record.category === filterCategory.value)
  }

  // 模糊搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    records = records.filter(record =>
      record.category.toLowerCase().includes(keyword) ||
      record.workName.toLowerCase().includes(keyword)
    )
  }

  return records
})

// 总数
const totalRecords = computed(() => filteredRecords.value.length)

// 分页后的记录
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

// 导出统计表
function exportStatistics() {
  try {
    // 统计各类别的数量
    const categoryStats: Record<string, number> = {}
    allRecords.value.forEach(record => {
      const category = record.category || '未分类'
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    // 统计各状态的数量
    const statusStats: Record<string, number> = {}
    allRecords.value.forEach(record => {
      const status = record.status || '未知'
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    // 构建CSV内容
    let csvContent = '\ufeff' // BOM for Excel
    csvContent += '报名数据统计表\n'
    csvContent += `统计时间：${new Date().toLocaleString('zh-CN')}\n`
    csvContent += `总记录数：${allRecords.value.length}\n\n`

    // 按类别统计
    csvContent += '按类别统计\n'
    csvContent += '类别,数量\n'
    Object.entries(categoryStats).forEach(([category, count]) => {
      csvContent += `${category},${count}\n`
    })
    csvContent += '\n'

    // 按状态统计
    csvContent += '按状态统计\n'
    csvContent += '状态,数量\n'
    Object.entries(statusStats).forEach(([status, count]) => {
      csvContent += `${status},${count}\n`
    })
    csvContent += '\n'

    // 详细记录
    csvContent += '详细记录\n'
    csvContent += '序号,类别,作品名称,提交时间,状态\n'
    allRecords.value.forEach((record, index) => {
      csvContent += `${index + 1},${record.category},${record.workName},${record.submitTime},${record.status}\n`
    })

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `报名数据统计表_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('导出统计表成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出统计表失败')
  }
}

// 处理筛选
const handleFilter = () => {
  currentPage.value = 1 // 重置到第一页
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
}

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 导出所有报名表
const exportAll = async () => {
  exporting.value = true
  try {
    // TODO: 实现导出逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 按类别导出报名表
const exportByCategory = async () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请选择要导出的类别')
    return
  }
  exporting.value = true
  try {
    // TODO: 实现按类别导出逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(`导出${getCategoryName(selectedCategory.value)}成功`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 上传盖章报名表
const uploadSealed = async () => {
  if (sealedFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  uploading.value = true
  try {
    // TODO: 实现上传逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('上传成功')
    sealedFileList.value = []
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref<Record<string, unknown> | null>(null)

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 从表单数据中提取详情信息
 * @param row 报名记录
 * @returns 格式化后的详情数据
 */
const extractDetailFromData = (row: RegistrationRecord) => {
  // 如果是从API获取的数据，直接使用 rawData
  const rawData = row.rawData || row.data
  const data = rawData || {}

  // 兼容两种数据格式：localStorage格式（有base字段）和API格式（直接是对象）
  const base = (data?.base as Record<string, unknown>) || data || {}
  const rosters = (data?.rosters as Record<string, unknown[]>) || {}

  // 处理文件列表：API返回的格式可能是 attachments 数组或 files 数组
  let files: Array<{ name?: string; size?: number; type?: string; url?: string }> = []
  if (Array.isArray(data?.files)) {
    files = data.files
  } else if (Array.isArray(data?.attachments)) {
    files = data.attachments
  }

  const intro = data?.intro as string || data?.performance_description as string || data?.work_description as string || ''

  // 作品类的作者信息（不是 rosters）
  const authors = (data?.authors as unknown[]) || []

  // 作品类的简介字段
  const authorIntro = data?.authorIntro as string || ''
  const creationIntro = data?.creationIntro as string || ''
  const projectIntro = data?.projectIntro as string || ''
  const designThoughts = data?.designThoughts as string || ''
  const exhibitionDesign = data?.exhibitionDesign as string || ''

  // 计算花名册数量（API返回的格式）
  const participants = Array.isArray(data?.participants) ? data.participants : []
  const teachers = Array.isArray(data?.guide_teachers) ? data.guide_teachers : []

  const teachersCount = Array.isArray(rosters.teachers) ? rosters.teachers.length : teachers.length
  const membersCount = Array.isArray(rosters.members) ? rosters.members.length : participants.length
  const accompCount = Array.isArray(rosters.accomp) ? rosters.accomp.length : 0
  const studentAccompCount = Array.isArray(rosters.studentAccomp) ? rosters.studentAccomp.length : 0
  const teacherAccompCount = Array.isArray(rosters.teacherAccomp) ? rosters.teacherAccomp.length : 0
  const participantsCount = Array.isArray(rosters.participants) ? rosters.participants.length : participants.length
  const authorsCount = Array.isArray(authors) ? authors.length : 0

  return {
    // 基本信息
    category: row.category,
    workName: row.workName,
    submitTime: row.submitTime,
    status: row.status,
    // 基础表单字段（演奏类）- 兼容API格式
    performanceType: base.performance_type || base.performanceType,
    minutes: base.duration_minutes || base.minutes,
    seconds: base.duration_seconds || base.seconds,
    isOriginal: base.is_original !== undefined ? base.is_original : base.isOriginal,
    group: base.group_type || base.group,
    song1: base.song1_title || base.song1,
    song2: base.song2_title || base.song2,
    song1HasChinese: base.song1_is_chinese !== undefined ? base.song1_is_chinese : base.song1HasChinese,
    song2HasChinese: base.song2_is_chinese !== undefined ? base.song2_is_chinese : base.song2HasChinese,
    song1IsOriginal: base.song1_is_original !== undefined ? base.song1_is_original : base.song1IsOriginal,
    song2IsOriginal: base.song2_is_original !== undefined ? base.song2_is_original : base.song2IsOriginal,
    chorusCount: base.performer_count || base.chorusCount,
    pianoAccompanist: base.piano_accompaniment || base.pianoAccompanist,
    leader: base.leader_name || base.leader,
    tutor: base.tutor || (teachers.length > 0 ? teachers[0]?.name : undefined),
    contact: base.contact_name || base.contact,
    phone: base.contact_phone || base.phone,
    address: base.contact_address || base.address,
    // 作品类字段
    workNameField: base.title || base.work_title || base.workName,
    length: base.length,
    width: base.width,
    tutorField: base.tutor || (teachers.length > 0 ? teachers[0]?.name : undefined),
    createAt: base.create_at || base.createAt,
    formType: base.form_type || base.formType,
    // 微电影特有字段
    videoMinutes: base.videoMinutes,
    videoSeconds: base.videoSeconds,
    tutor1: base.tutor1,
    tutor2: base.tutor2,
    tutor3: base.tutor3,
    // 艺术实践工作坊字段
    projectName: base.project_name || base.projectName,
    contactPosition: base.contact_position || base.contactPosition,
    contactUnit: base.contact_unit || base.contactUnit,
    email: base.contact_email || base.email,
    categoryField: base.category,
    // 美育改革创新字段
    caseName: base.case_name || base.caseName,
    caseCode: base.case_code || base.caseCode,
    leaderName: base.leader_name || base.leaderName,
    leaderTitle: base.leader_title || base.leaderTitle,
    submitUnit: base.submit_unit || base.submitUnit,
    leaderUnit: base.leader_unit || base.leaderUnit,
    leaderPhone: base.leader_phone || base.leaderPhone,
    // 简介（根据不同类别可能有不同的简介字段）
    intro: intro || creationIntro || projectIntro || authorIntro || designThoughts || exhibitionDesign,
    authorIntro: authorIntro,
    creationIntro: creationIntro,
    projectIntro: projectIntro,
    designThoughts: designThoughts,
    exhibitionDesign: exhibitionDesign,
    // 花名册数量
    teachersCount: teachersCount,
    membersCount: membersCount,
    accompCount: accompCount,
    studentAccompCount: studentAccompCount,
    teacherAccompCount: teacherAccompCount,
    participantsCount: participantsCount,
    authorsCount: authorsCount,
    // 文件列表 - 处理API返回的文件格式
    files: files.map((file: any) => {
      // API返回的文件可能有不同的字段名
      const fileName = file.name || file.file_name || '未知文件'
      const fileSize = file.size || file.file_size
      const fileType = file.type || file.file_type || '未知'
      const fileUrl = file.url || file.file_url || file.attachment_url

      return {
        name: fileName,
        size: fileSize,
        type: fileType,
        url: fileUrl
      }
    })
  }
}

/**
 * 查看详情
 * @param row 报名记录
 * @description 打开详情对话框，显示该节目的全部信息
 */
const viewDetail = (row: RegistrationRecord) => {
  currentDetail.value = extractDetailFromData(row)
  detailDialogVisible.value = true
}

onMounted(async () => {
  await loadRegistrationRecords()
})
</script>

<style lang="scss" scoped>
.ef-card-title-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.export-section {
  .export-desc {
    color: #606266;
    margin-bottom: 24px;
    line-height: 1.6;
  }
}

.toolbar {
  margin-bottom: 16px;

  .toolbar-info {
    text-align: right;
    color: #606266;
    line-height: 32px;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.ef-upload-block {
  width: 100%;
  display: block;

  :deep(.el-upload) {
    width: 100%;
    display: block;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    min-height: 250px;
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  :deep(.el-icon--upload) {
    font-size: 67px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }

  :deep(.el-upload__text) {
    color: #606266;
    font-size: 14px;
    margin-top: 8px;
    text-align: center;

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  :deep(.el-upload__tip) {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
    text-align: center;
  }
}
</style>

