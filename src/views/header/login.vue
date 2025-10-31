<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { commonRules } from '@/composables/useForm'

// 使用封装的认证组合式函数
const {
  loading,
  loginForm,
  login,
  resetLoginForm
} = useAuth()

// 表单验证规则
const rules = {
  username: commonRules.username,
  password: commonRules.password(6)
}

// 处理登录
const onSubmit = async () => {
  await login(loginForm.value)
}

// 重置表单
const handleReset = () => {
  resetLoginForm()
}
</script>

<template>
  <el-card class="login-card" shadow="always">
    <h2 class="title">登录</h2>
    <el-form :model="loginForm" :rules="rules" label-width="80" @submit.prevent>
      <el-form-item label="账号" prop="username">
        <el-input v-model="loginForm.username" placeholder="请输入账号" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="onSubmit">登录</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
    <div class="hint">示例账号：user1（用户端）/reviewer1（审核端）/admin1（管理员端）/logger1（日志审计员端），密码均为 123456</div>
  </el-card>
</template>

<style scoped lang="scss">
.login-card {
  width: min(96vw, 420px);
}
.title { margin-bottom: 12px; }
</style>


