<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

// 判断是否是登录页
const isLoginPage = computed(() => route.path === '/login')

// 判断是否显示布局（非登录页且已登录）
const showLayout = computed(() => !isLoginPage.value && !!userStore.role)
</script>

<template>
  <!-- 登录页 -->
  <div v-if="isLoginPage" class="login-container">
    <router-view />
  </div>
  
  <!-- 主布局 -->
  <div v-else-if="showLayout" class="layout">
    <el-container>
      <AppNav />
      <el-container direction="vertical">
        <AppHeader />
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
  
  <!-- 未登录时显示登录页 -->
  <div v-else class="login-container">
    <router-view />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/layout.scss';

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
}
</style>
