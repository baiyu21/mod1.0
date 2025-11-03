<script setup lang="ts">
import { defineOptions } from 'vue'

defineOptions({
  name: 'LoginPage',
})

import { useAuth } from '@/composables/useAuth'
import { commonRules } from '@/composables/useForm'

// 使用封装的认证组合式函数
const { loading, loginForm, login, resetLoginForm } = useAuth()

// 表单验证规则
const rules = {
  username: commonRules.username,
  password: commonRules.password(6),
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
  <div class="main">
    <div class="leftText">
      <span class="text">四川省<br />音乐基本功展示报名系统</span>
    </div>
    <div class="rightForm">
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="card-header">
            <h2 class="title">登录系统</h2>
            <p class="subtitle">欢迎回来，请登录您的账号</p>
          </div>
        </template>
        <el-form :model="loginForm" :rules="rules" label-width="80px" @submit.prevent>
          <el-form-item label="账号" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="onSubmit">登录</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="hint">
          <div class="hint-title">示例账号</div>
          <div class="hint-content">
            <span>user1</span> | <span>reviewer1</span> | <span>admin1</span> |
            <span>logger1</span>
          </div>
          <div class="hint-password">密码均为 <strong>123456</strong></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  align-items: center;
  animation: fadeIn 0.8s ease forwards;
  background-image: url(../assets/styles/1.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  .leftText {
    height: 100vh;
    flex: 1;
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;
    .text {
      // background-color: rgba(0, 0, 0, 0.338);
      width: fit-content;
      transform: translateY(-60%);
      font-size: min(6vw, 50px);
      color: white;
      // writing-mode: vertical-rl;
      user-select: none;
      text-orientation: upright;
      font-weight: bold;
      letter-spacing: 8px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      margin-left: 20px;
    }
  }
  .rightForm {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    .login-card {
      width: min(96vw, 420px);
      animation: textIn 0.8s ease forwards;

      :deep(.el-card__body) {
        padding: 30px 20px;
      }

      :deep(.el-card__header) {
        padding-bottom: 8px;
      }

      .card-header {
        text-align: center;
        padding: 10px 0 0 0;

        .title {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }

      :deep(.el-form-item) {
        margin-bottom: 28px;
      }

      .hint {
        margin-top: 30px;
        padding: 20px;
        background: #f5f7fa;
        border-radius: 4px;

        .hint-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: center;
        }

        .hint-content {
          text-align: center;
          font-size: 13px;
          color: #606266;
          margin-bottom: 6px;
          line-height: 1.6;

          span {
            padding: 2px 6px;
            background: #ffffff;
            border-radius: 3px;
            margin: 0 2px;
          }
        }

        .hint-password {
          text-align: center;
          font-size: 13px;
          color: #606266;
        }
      }
    }
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes textIn {
  from {
    opacity: 0;
    transform: translateY(-40px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
}
</style>
