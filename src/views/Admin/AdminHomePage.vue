<template>
  <div class="admin-home-page">
    <h1>管理员端首页</h1>

    <!-- 导出报名表卡片 -->
    <el-card class="mb20">
      <template #header>
        <div class="card-header">
          <span>导出报名表</span>
        </div>
      </template>
      <div class="export-section">
        <div class="export-description">
          您可以选择导出所有报名表数据，或按类别、按用户导出特定类型的报名表。
        </div>
        <div class="export-actions">
          <el-select
            v-model="selectedUser"
            placeholder="请选择用户 (全部)"
            style="width: 220px"
            clearable
            filterable
            :loading="userListLoading"
          >
            <el-option
              v-for="user in userList"
              :key="user.account"
              :label="user.username || user.account"
              :value="user.account"
            >
              <span>{{ user.username || user.account }}</span>
              <span v-if="user.username && user.account !== user.username" style="color: #909399; margin-left: 8px;">
                ({{ user.account }})
              </span>
            </el-option>
          </el-select>
          <el-select
            v-model="selectedCategory"
            placeholder="请选择节目类型（全部）"
            style="width: 220px"
            clearable
          >
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button type="primary" :icon="Download" @click="exportAllRegistrationForms">
            导出所有报名表
          </el-button>
          <el-button type="success" :icon="Download" @click="exportSelectedCategoryForms">
            导出选中类别报名表
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup name="AdminHomePage">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { accountApi } from '@/services/api'

// 导出报名表相关
const selectedUser = ref('')
const selectedCategory = ref('')
const userList = ref<any[]>([])
const userListLoading = ref(false)

// 节目类型选项（用户端的12个类型）
const categoryOptions = [
  { label: '全部', value: '' },
  { label: '声乐报名', value: '声乐报名' },
  { label: '器乐报名', value: '器乐报名' },
  { label: '舞蹈报名', value: '舞蹈报名' },
  { label: '戏曲报名', value: '戏曲报名' },
  { label: '朗诵报名', value: '朗诵报名' },
  { label: '书法作品', value: '书法作品' },
  { label: '绘画作品', value: '绘画作品' },
  { label: '设计作品', value: '设计作品' },
  { label: '摄影作品', value: '摄影作品' },
  { label: '微电影作品', value: '微电影作品' },
  { label: '艺术实践工作坊报名', value: '艺术实践工作坊报名' },
  { label: '美育改革创新优秀案例申报', value: '美育改革创新优秀案例申报' }
]

// 加载用户列表（只获取 role 为 'user' 的用户）
const loadUserList = async () => {
  userListLoading.value = true
  try {
    const result = await accountApi.getAccounts({ page: 1, page_size: 1000 })
    // 过滤出 role 为 'user' 的用户
    userList.value = result.users.filter((user: any) => user.role === 'user')
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败，请稍后重试')
  } finally {
    userListLoading.value = false
  }
}

// 导出所有报名表
function exportAllRegistrationForms() {
  const userInfo = selectedUser.value
    ? userList.value.find(u => u.account === selectedUser.value)
    : null
  const userLabel = userInfo ? (userInfo.username || userInfo.account) : '全部'

  ElMessage.success(`正在导出${selectedUser.value ? `用户"${userLabel}"的` : ''}所有报名表...`)
  // TODO: 实现导出逻辑，传递 selectedUser.value 和 selectedCategory.value
}

// 导出选中类别报名表
function exportSelectedCategoryForms() {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择类别')
    return
  }

  const userInfo = selectedUser.value
    ? userList.value.find(u => u.account === selectedUser.value)
    : null
  const userLabel = userInfo ? (userInfo.username || userInfo.account) : '全部'
  const categoryLabel = categoryOptions.find((opt) => opt.value === selectedCategory.value)?.label || ''

  ElMessage.success(
    `正在导出${selectedUser.value ? `用户"${userLabel}"的` : ''}${categoryLabel}报名表...`
  )
  // TODO: 实现导出逻辑，传递 selectedUser.value 和 selectedCategory.value
}

// 组件挂载时加载用户列表
onMounted(() => {
  loadUserList()
})
</script>

<style lang="scss" scoped>
.admin-home-page {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.mb20 {
  margin-bottom: 20px;
}

// 导出报名表区域样式
.export-section {
  .export-description {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .export-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
}
</style>

