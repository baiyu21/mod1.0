<template>
  <div class="pending-review">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <el-icon><Document /></el-icon>
            <span>待审核报名</span>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="registrations"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="workName" label="节目名称" width="180" />
        <el-table-column prop="category" label="节目类型" width="150" />
        <el-table-column prop="contactName" label="联系人姓名" width="120" />
        <el-table-column prop="contactPhone" label="联系方式" width="150" />
        <el-table-column prop="description" label="简介" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button type="success" size="small" @click="handleApprove(row)">
              审核通过
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 详情对话框 -->
      <el-dialog
        v-model="detailDialogVisible"
        title="报名详情"
        width="800px"
        :before-close="handleCloseDetail"
      >
        <div v-if="currentDetail" class="detail-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="节目名称">
              {{ currentDetail.workName }}
            </el-descriptions-item>
            <el-descriptions-item label="节目类型">
              {{ currentDetail.category }}
            </el-descriptions-item>
            <el-descriptions-item label="提交人">
              {{ currentDetail.submitterName }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ currentDetail.submitTime }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人姓名">
              {{ currentDetail.contactName || '未填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系方式">
              {{ currentDetail.contactPhone || '未填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="学校名称">
              {{ currentDetail.school || '未填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="所在地区">
              {{ currentDetail.region || '未填写' }}
            </el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">
              {{ currentDetail.description || '未填写' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
      
      <!-- 审核通过对话框 -->
      <el-dialog
        v-model="approveDialogVisible"
        title="审核通过"
        width="500px"
        :before-close="handleCloseApprove"
      >
        <el-form
          ref="approveFormRef"
          :model="approveForm"
          label-width="100px"
        >
          <el-form-item label="审核意见">
            <el-input
              v-model="approveForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入审核意见（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="handleCloseApprove">取消</el-button>
            <el-button type="primary" :loading="approving" @click="handleSubmitApprove">
              确定通过
            </el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 驳回对话框 -->
      <el-dialog
        v-model="rejectDialogVisible"
        title="审核驳回"
        width="500px"
        :before-close="handleCloseReject"
      >
        <el-form
          ref="rejectFormRef"
          :model="rejectForm"
          :rules="rejectRules"
          label-width="100px"
        >
          <el-form-item label="驳回原因" prop="comment">
            <el-input
              v-model="rejectForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入驳回原因（必填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="handleCloseReject">取消</el-button>
            <el-button type="danger" :loading="rejecting" @click="handleSubmitReject">
              确定驳回
            </el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script lang="ts" setup name="PendingReview">
import { ref, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import type { Registration } from '@/types'
import {
  fetchPendingRegistrations,
  approveRegistration,
  rejectRegistration
} from '@/services/mock'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const registrations = ref<Registration[]>([])

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref<Registration | null>(null)

// 审核通过对话框
const approveDialogVisible = ref(false)
const approveFormRef = ref<FormInstance>()
const approving = ref(false)
const currentApproveId = ref<string>('')
const approveForm = ref({
  comment: ''
})

// 驳回对话框
const rejectDialogVisible = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejecting = ref(false)
const currentRejectId = ref<string>('')
const rejectForm = ref({
  comment: ''
})

const rejectRules: FormRules = {
  comment: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' },
    { min: 5, message: '驳回原因至少5个字符', trigger: 'blur' }
  ]
}

// 加载待审核记录
const loadRegistrations = async () => {
  loading.value = true
  try {
    const data = await fetchPendingRegistrations()
    registrations.value = data
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 查看详情
const handleViewDetail = (row: Registration) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// 关闭详情对话框
const handleCloseDetail = () => {
  detailDialogVisible.value = false
  currentDetail.value = null
}

// 审核通过
const handleApprove = (row: Registration) => {
  currentApproveId.value = row.id
  approveForm.value.comment = ''
  approveDialogVisible.value = true
}

// 关闭审核通过对话框
const handleCloseApprove = () => {
  approveDialogVisible.value = false
  currentApproveId.value = ''
  approveForm.value.comment = ''
  approveFormRef.value?.resetFields()
}

// 提交审核通过
const handleSubmitApprove = async () => {
  if (!currentApproveId.value) return
  
  approving.value = true
  try {
    const success = await approveRegistration(
      currentApproveId.value,
      userStore.userId || '',
      userStore.userId || '审核员',
      approveForm.value.comment || undefined
    )
    
    if (success) {
      ElMessage.success('审核通过')
      approveDialogVisible.value = false
      await loadRegistrations()
    } else {
      ElMessage.error('审核失败')
    }
  } catch (error) {
    ElMessage.error('审核失败')
    console.error(error)
  } finally {
    approving.value = false
  }
}

// 驳回
const handleReject = (row: Registration) => {
  currentRejectId.value = row.id
  rejectForm.value.comment = ''
  rejectDialogVisible.value = true
}

// 关闭驳回对话框
const handleCloseReject = () => {
  rejectDialogVisible.value = false
  currentRejectId.value = ''
  rejectForm.value.comment = ''
  rejectFormRef.value?.resetFields()
}

// 提交驳回
const handleSubmitReject = async () => {
  if (!rejectFormRef.value) return
  
  await rejectFormRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请填写完整的驳回原因')
      return
    }
  })
  
  if (!currentRejectId.value) return
  
  rejecting.value = true
  try {
    const success = await rejectRegistration(
      currentRejectId.value,
      userStore.userId || '',
      userStore.userId || '审核员',
      rejectForm.value.comment
    )
    
    if (success) {
      ElMessage.success('已驳回')
      rejectDialogVisible.value = false
      await loadRegistrations()
    } else {
      ElMessage.error('驳回失败')
    }
  } catch (error) {
    ElMessage.error('驳回失败')
    console.error(error)
  } finally {
    rejecting.value = false
  }
}

onMounted(() => {
  loadRegistrations()
})
</script>

<style lang="scss" scoped>
.pending-review {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  
  .detail-content {
    padding: 10px 0;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>

