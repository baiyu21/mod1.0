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
          <div class="filter-section">
            <el-select
              v-model="regionFilter"
              placeholder="请选择地区"
              clearable
              style="width: 200px"
              @change="handleRegionFilterChange"
            >
              <el-option
                v-for="region in regions"
                :key="region"
                :label="region"
                :value="region"
              />
            </el-select>
          </div>
          <el-table
            :data="schoolTableData.total"
            border
            stripe
            size="small"
            style="width: 100%"
          >
            <el-table-column prop="school" label="学校名称" width="200" />
            <el-table-column prop="region" label="所在地区" width="150" />
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
          <div class="filter-section">
            <el-select
              v-model="regionFilter"
              placeholder="请选择地区"
              clearable
              style="width: 200px"
              @change="handleRegionFilterChange"
            >
              <el-option
                v-for="region in regions"
                :key="region"
                :label="region"
                :value="region"
              />
            </el-select>
          </div>
          <el-table
            :data="schoolTableData.unReviewed"
            border
            stripe
            size="small"
            style="width: 100%"
          >
            <el-table-column prop="school" label="学校名称" width="200" />
            <el-table-column prop="region" label="所在地区" width="150" />
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
          <div class="filter-section">
            <el-select
              v-model="regionFilter"
              placeholder="请选择地区"
              clearable
              style="width: 200px"
              @change="handleRegionFilterChange"
            >
              <el-option
                v-for="region in regions"
                :key="region"
                :label="region"
                :value="region"
              />
            </el-select>
          </div>
          <el-table
            :data="schoolTableData.pending"
            border
            stripe
            size="small"
            style="width: 100%"
          >
            <el-table-column prop="school" label="学校名称" width="200" />
            <el-table-column prop="region" label="所在地区" width="150" />
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
          <div class="filter-section">
            <el-select
              v-model="regionFilter"
              placeholder="请选择地区"
              clearable
              style="width: 200px"
              @change="handleRegionFilterChange"
            >
              <el-option
                v-for="region in regions"
                :key="region"
                :label="region"
                :value="region"
              />
            </el-select>
          </div>
          <el-table
            :data="schoolTableData.approved"
            border
            stripe
            size="small"
            style="width: 100%"
          >
            <el-table-column prop="school" label="学校名称" width="200" />
            <el-table-column prop="region" label="所在地区" width="150" />
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
import { getRegistrationStats, getAllRegions } from '@/services/mock'

const router = useRouter()
const regionFilter = ref<string>('')
const regions = ref<string[]>([])

const stats = ref({
  total: 0,
  unReviewed: 0,
  pending: 0,
  approved: 0,
  bySchool: {} as Record<string, {
    total: number
    pending: number
    approved: number
    unReviewed: number
    region: string
  }>
})

// 将学校统计数据转换为表格数据
const schoolTableData = computed(() => {
  const bySchool = stats.value.bySchool

  const total = Object.keys(bySchool).map(school => {
    const schoolStat = bySchool[school]
    if (!schoolStat) return null
    return {
      school,
      region: schoolStat.region,
      count: schoolStat.total
    }
  }).filter((item): item is { school: string; region: string; count: number } => item !== null)

  const unReviewed = Object.keys(bySchool).map(school => {
    const schoolStat = bySchool[school]
    if (!schoolStat) return null
    return {
      school,
      region: schoolStat.region,
      count: schoolStat.unReviewed
    }
  }).filter((item): item is { school: string; region: string; count: number } => item !== null && item.count > 0)

  const pending = Object.keys(bySchool).map(school => {
    const schoolStat = bySchool[school]
    if (!schoolStat) return null
    return {
      school,
      region: schoolStat.region,
      count: schoolStat.pending
    }
  }).filter((item): item is { school: string; region: string; count: number } => item !== null && item.count > 0)

  const approved = Object.keys(bySchool).map(school => {
    const schoolStat = bySchool[school]
    if (!schoolStat) return null
    return {
      school,
      region: schoolStat.region,
      count: schoolStat.approved
    }
  }).filter((item): item is { school: string; region: string; count: number } => item !== null && item.count > 0)

  return {
    total,
    unReviewed,
    pending,
    approved
  }
})

// 加载统计数据
const loadStats = async () => {
  const data = await getRegistrationStats(regionFilter.value || undefined)
  stats.value = data
}

// 加载地区列表
const loadRegions = async () => {
  regions.value = getAllRegions()
}

// 地区筛选变化
const handleRegionFilterChange = () => {
  loadStats()
}

// 跳转到待审核页面
const goToPending = () => {
  router.push('/approval/pending')
}

// 跳转到已审核页面
const goToReviewed = () => {
  router.push('/approval/reviewed')
}

onMounted(() => {
  loadRegions()
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
