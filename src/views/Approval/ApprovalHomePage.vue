<template>
  <div class="approval-home">
    <!-- 总报名统计卡片 -->
    <el-card shadow="never" class="stats-card">
      <template #header>
        <div class="card-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>总报名</span>
        </div>
      </template>
      <div class="stats-content-wrapper">
        <div class="stat-item">
          <div class="stat-label">总报名</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-unit">条</div>
        </div>
        <div class="table-wrapper">
          <!-- 地区筛选功能暂时隐藏，因为后端接口未提供地区字段 -->
          <el-table
            :data="schoolTableData.total"
            border
            stripe
            size="small"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="school" label="大学名字" width="200" />
            <el-table-column prop="count" label="数量" width="100" align="center">
              <template #default="{ row }">
                <span class="count-value">{{ row.count }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 未审核统计卡片 -->
    <el-card shadow="never" class="stats-card">
      <template #header>
        <div class="card-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>未审核</span>
        </div>
      </template>
      <div class="stats-content-wrapper">
        <div class="stat-item">
          <div class="stat-label">未审核</div>
          <div class="stat-value un-reviewed">{{ stats.unReviewed }}</div>
          <div class="stat-unit">条</div>
        </div>
        <div class="table-wrapper">
          <!-- 地区筛选功能暂时隐藏，因为后端接口未提供地区字段 -->
          <el-table
            :data="schoolTableData.unReviewed"
            border
            stripe
            size="small"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="school" label="大学名字" width="200" />
            <el-table-column prop="count" label="数量" width="100" align="center">
              <template #default="{ row }">
                <span class="count-value un-reviewed">{{ row.count }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 待审核统计卡片 -->
    <el-card shadow="never" class="stats-card">
      <template #header>
        <div class="card-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>待审核</span>
        </div>
      </template>
      <div class="stats-content-wrapper">
        <div class="stat-item">
          <div class="stat-label">待审核</div>
          <div class="stat-value pending">{{ stats.pending }}</div>
          <div class="stat-unit">条</div>
        </div>
        <div class="table-wrapper">
          <!-- 地区筛选功能暂时隐藏，因为后端接口未提供地区字段 -->
          <el-table
            :data="schoolTableData.pending"
            border
            stripe
            size="small"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="school" label="大学名字" width="200" />
            <el-table-column prop="count" label="数量" width="100" align="center">
              <template #default="{ row }">
                <span class="count-value pending">{{ row.count }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 已审核统计卡片 -->
    <el-card shadow="never" class="stats-card">
      <template #header>
        <div class="card-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>已审核</span>
        </div>
      </template>
      <div class="stats-content-wrapper">
        <div class="stat-item">
          <div class="stat-label">已审核</div>
          <div class="stat-value approved">{{ stats.approved }}</div>
          <div class="stat-unit">条</div>
        </div>
        <div class="table-wrapper">
          <!-- 地区筛选功能暂时隐藏，因为后端接口未提供地区字段 -->
          <el-table
            :data="schoolTableData.approved"
            border
            stripe
            size="small"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="school" label="大学名字" width="200" />
            <el-table-column prop="count" label="数量" width="100" align="center">
              <template #default="{ row }">
                <span class="count-value approved">{{ row.count }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="quick-actions-card">
      <template #header>
        <div class="card-title">
          <el-icon><Operation /></el-icon>
          <span>快速操作</span>
        </div>
      </template>
      <div class="actions-content">
        <el-button type="primary" @click="goToPending">查看待审核</el-button>
        <el-button type="success" @click="goToReviewed">查看已审核</el-button>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup name="ApprovalHomePage">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis, Operation } from '@element-plus/icons-vue'
import { reviewApi } from '@/services/api'

const router = useRouter()
// const regionFilter = ref<string>('') // 暂时不使用，因为后端接口不支持地区筛选
// const regions = ref<string[]>([]) // 暂时不使用，因为后端接口未提供地区字段
const loading = ref(false)

// 用户统计数据（从后端接口获取）
interface UserStat {
  account: string
  username: string
  total_count: number
  approved_count: number
  rejected_count: number
  pending_count: number
}

const userStats = ref<UserStat[]>([])

// 计算统计数据
const stats = computed(() => {
  const total = userStats.value.reduce((sum, item) => sum + item.total_count, 0)
  const approved = userStats.value.reduce((sum, item) => sum + item.approved_count, 0)
  const rejected = userStats.value.reduce((sum, item) => sum + item.rejected_count, 0)
  const pending = userStats.value.reduce((sum, item) => sum + item.pending_count, 0)
  const unReviewed = total - approved - rejected

  return {
    total,
    unReviewed,
    pending,
    approved,
    rejected
  }
})

// 将用户统计数据转换为表格数据
const schoolTableData = computed(() => {
  // 目前后端接口不支持地区筛选，直接使用所有数据
  const filteredData = userStats.value

  // 总报名表格数据（按账号/学校分组）
  const total = filteredData.map(item => ({
    account: item.account,
    school: item.username || item.account, // username 对应大学名字，如果没有则显示账号
    count: item.total_count
  }))

  // 未审核表格数据
  const unReviewed = filteredData
    .map(item => ({
      account: item.account,
      school: item.username || item.account,
      count: item.total_count - item.approved_count - item.rejected_count
    }))
    .filter(item => item.count > 0)

  // 待审核表格数据
  const pending = filteredData
    .map(item => ({
      account: item.account,
      school: item.username || item.account,
      count: item.pending_count
    }))
    .filter(item => item.count > 0)

  // 已审核表格数据
  const approved = filteredData
    .map(item => ({
      account: item.account,
      school: item.username || item.account,
      count: item.approved_count + item.rejected_count
    }))
    .filter(item => item.count > 0)

  return {
    total,
    unReviewed,
    pending,
    approved
  }
})

// 加载统计数据
const loadStats = async () => {
  loading.value = true
  try {
    const data = await reviewApi.getUserStats()
    userStats.value = data
    // 从数据中提取地区列表（如果后端有提供 region 字段）
    // 目前后端没有提供 region 字段，暂时留空
    // regions.value = [...new Set(data.map(item => item.region).filter(Boolean))]
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载地区列表（暂时不使用，因为后端接口未提供地区字段）
// const loadRegions = async () => {
//   regions.value = []
// }

// 地区筛选变化（暂时不使用，因为后端接口不支持地区筛选）
// const handleRegionFilterChange = () => {
//   loadStats()
// }

// 跳转到待审核页面
const goToPending = () => {
  router.push('/approval/pending')
}

// 跳转到已审核页面
const goToReviewed = () => {
  router.push('/approval/reviewed')
}

onMounted(() => {
  // loadRegions() // 暂时不使用
  loadStats()
})
</script>

<style lang="scss" scoped>
.approval-home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.stats-card {
  .stats-content-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 40px;
    padding: 40px 20px 20px 20px;
  }

  .stat-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 150px;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }

  .stat-value {
    font-size: 48px;
    font-weight: 600;
    color: #409eff;
    line-height: 1;

    &.un-reviewed {
      color: #909399;
    }

    &.pending {
      color: #e6a23c;
    }

    &.approved {
      color: #67c23a;
    }
  }

  .stat-unit {
    font-size: 16px;
    color: #606266;
  }

  .table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-section {
    display: flex;
    justify-content: flex-end;
    padding: 0;
  }

  .count-value {
    color: #409eff;
    font-weight: 600;

    &.un-reviewed {
      color: #909399;
    }

    &.pending {
      color: #e6a23c;
    }

    &.approved {
      color: #67c23a;
    }
  }
}

.quick-actions-card {
  .actions-content {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 20px;
  }
}
</style>
