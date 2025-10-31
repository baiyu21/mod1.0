<template>
  <el-aside :width="sidebarWidth + 'px'" class="aside">
    <div class="brand">大艺展报名系统</div>
    <el-menu router :default-active="route.path">
      <!-- 用户端菜单 -->
      <template v-if="userRole === 'user'">
        <el-menu-item index="/user">首页</el-menu-item>
        <div class="menu-section">—— 演奏类报名 ——</div>
        <el-menu-item index="/user/vocal">声乐报名</el-menu-item>
        <el-menu-item index="/user/instrumental">器乐报名</el-menu-item>
        <el-menu-item index="/user/dance">舞蹈报名</el-menu-item>
        <el-menu-item index="/user/opera">戏曲报名</el-menu-item>
        <el-menu-item index="/user/recitation">朗诵报名</el-menu-item>
        <div class="menu-section">—— 作品类报名 ——</div>
        <el-menu-item index="/user/work-calligraphy">书法作品</el-menu-item>
        <el-menu-item index="/user/work-painting">绘画作品</el-menu-item>
        <el-menu-item index="/user/work-design">设计作品</el-menu-item>
        <el-menu-item index="/user/work-photography">摄影作品</el-menu-item>
        <el-menu-item index="/user/work-microfilm">微电影作品</el-menu-item>
        <div class="menu-section">—— 其他报名 ——</div>
        <el-menu-item index="/user/art-practice">艺术实践工作坊报名</el-menu-item>
        <el-menu-item index="/user/aesthetic-innovation">美育改革创新优秀案例申报</el-menu-item>
      </template>

      <!-- 审核端菜单 -->
      <template v-else-if="userRole === 'approval'">
        <el-menu-item index="/approval">首页</el-menu-item>
        <div class="menu-section">—— 待审核 ——</div>
        <el-menu-item index="/approval/pending">待审核记录</el-menu-item>
        <div class="menu-section">—— 已审核 ——</div>
        <el-menu-item index="/approval/reviewed">已审核记录</el-menu-item>
      </template>

      <!-- 管理员端菜单 -->
      <template v-else-if="userRole === 'admin'">
        <el-menu-item index="/admin">首页</el-menu-item>
        <div class="menu-section">—— 用户管理 ——</div>
        <el-menu-item index="/admin/users">用户管理</el-menu-item>
        <div class="menu-section">—— 系统设置 ——</div>
        <el-menu-item index="/admin/settings">系统设置</el-menu-item>
      </template>

      <!-- 日志审计员端菜单 -->
      <template v-else-if="userRole === 'logaudit'">
        <el-menu-item index="/logaudit">首页</el-menu-item>
        <div class="menu-section">—— 日志审计 ——</div>
        <el-menu-item index="/logaudit/logs">操作日志</el-menu-item>
        <el-menu-item index="/logaudit/audit">审计记录</el-menu-item>
      </template>
    </el-menu>
  </el-aside>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const sidebarWidth = 220
const userRole = computed(() => userStore.role)
</script>
<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.aside {
  border-right: 1px solid $border-base;
  height: 100vh;
  background: $sidebar-bg;
}

.brand {
  padding: $brand-padding;
  font-weight: $font-weight-bold;
  color: $brand-text;
  text-align: center;
}

.menu-section {
  padding: $section-padding;
  color: $section-text;
  text-align: center;
  user-select: none;
}

:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: $menu-text;
  border-radius: $border-radius-base;
  margin: 0 $menu-margin;
}

:deep(.el-menu-item:hover) {
  background-color: $menu-hover-bg;
  color: $menu-hover-text;
}

:deep(.el-menu-item.is-active) {
  background-color: $menu-active-bg;
  color: $menu-active-text;
}
</style>
