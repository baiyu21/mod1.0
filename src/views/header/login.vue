<!-- eslint-disable vue/multi-word-component-names -->
<!--
  登录页面组件
  功能：提供用户登录功能，包含账号密码输入、表单验证和登录提交
  使用 Element Plus 组件库实现 UI，使用组合式 API 管理状态和逻辑
-->
<script setup lang="ts">
import { defineOptions } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/user'
import { commonRules } from '@/composables/useForm'
import type { UserRole } from '@/types'

/**
 * 定义组件名称
 * @description 用于 Vue DevTools 调试和组件标识
 */
defineOptions({
  name: 'LoginPage',
})

const router = useRouter()
const userStore = useUserStore()

/**
 * 使用封装的认证组合式函数
 * @returns {Object} 返回登录相关的状态和方法
 *   - loading: 登录加载状态
 *   - loginForm: 登录表单数据对象，包含 username 和 password
 *   - login: 登录方法，接收表单数据作为参数
 *   - resetLoginForm: 重置表单方法
 */
const {
  loading,
  loginForm,
  login,
  resetLoginForm
} = useAuth()

/**
 * 表单验证规则
 * @type {Object}
 *   - username: 用户名验证规则，必填项
 *   - password: 密码验证规则，6位以上，至少包含三种字符类型（大小写字母、数字、特殊字符）
 */
const rules = {
  username: commonRules.username,
  password: commonRules.password(6)
}

/**
 * 处理登录提交
 * @async
 * @function onSubmit
 * @description 当用户点击登录按钮时调用，验证表单后执行登录操作
 * @returns {Promise<void>}
 */
const onSubmit = async () => {
  await login(loginForm.value)
}

/**
 * 重置表单数据
 * @function handleReset
 * @description 当用户点击重置按钮时调用，清空表单输入并恢复初始状态
 * @returns {void}
 */
const handleReset = () => {
  resetLoginForm()
}

/**
 * 测试登录 - 绕过路由守卫直接访问对应端
 * @function handleTestLogin
 * @description 模拟登录状态，直接跳转到指定端的首页（用于测试，无需后端）
 * @param {UserRole} role - 用户角色
 * @returns {void}
 */
const handleTestLogin = (role: UserRole) => {
  // 模拟登录状态
  userStore.login({
    userId: `test-${role}`,
    role: role,
    token: `test-token-${role}`,
    refreshToken: `test-refresh-${role}`,
    permissions: []
  })

  // 根据角色跳转到对应首页
  const roleRoutes: Record<UserRole, string> = {
    'user': '/user',
    'approval': '/approval',
    'admin': '/admin',
    'logaudit': '/logaudit'
  }

  router.push(roleRoutes[role])
}
</script>

<template>
  <div class="main">
    <div class="leftText">
      <span class="text">大学生艺术作品展<br />节目报名审核管理系统</span>
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
          <div class="hint-title">测试账号</div>
          <div class="hint-content">
            <span>tsy1</span> | <span>tsy2</span> | <span>tsy3</span> |
            <span>tsy4</span>
          </div>
          <div class="hint-password">密码均为 <strong>Tsy123456</strong></div>
          <div class="hint-role" style="margin-top: 0.5rem; font-size: 0.75rem; color: #909399;">
            （用户端 | 管理员端 | 审核端 | 日志端）
          </div>
        </div>
        <div class="test-buttons">
          <div class="test-title">测试入口（无需后端）</div>
          <div class="test-buttons-group">
            <el-button type="success" size="small" @click="handleTestLogin('user')">
              用户端
            </el-button>
            <el-button type="warning" size="small" @click="handleTestLogin('approval')">
              审核端
            </el-button>
            <el-button type="danger" size="small" @click="handleTestLogin('admin')">
              管理员端
            </el-button>
            <el-button type="info" size="small" @click="handleTestLogin('logaudit')">
              日志端
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
/**
 * 登录页面样式
 * 使用 flex 布局实现响应式设计，适配不同屏幕尺寸
 * 使用 vw/vh 和 rem 单位实现响应式尺寸
 * 添加页面淡入和卡片滑入动画效果，提升用户体验
 */
.main {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  align-items: center;
  // 页面整体淡入动画
  animation: fadeIn 0.8s ease forwards;
  // 主容器背景图片
  background-image: url(../../assets/styles/ylinBKGC.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  // 左侧背景区域
  .leftText {
    height: 100vh;
    flex: 1;
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;

    // 左侧文字样式
    .text {
      width: fit-content;
      transform: translateY(-60%);
      // 使用 vw 单位实现响应式字体大小，最大不超过 50px
      font-size: min(6vw, 3.125rem);
      color: white;
      user-select: none;
      text-orientation: upright;
      font-weight: bold;
      letter-spacing: 0.5rem;
      text-shadow: 0.125rem 0.125rem 0.25rem rgba(0, 0, 0, 0.5);
      margin-left: 1.25rem;
    }
  }

  // 右侧表单区域
  .rightForm {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    // 登录卡片样式
    .login-card {
      // 使用 min() 函数实现响应式宽度，最大宽度 420px
      width: min(96vw, 26.25rem);
      // 卡片滑入动画
      animation: textIn 0.8s ease forwards;

      // Element Plus 卡片内容区域样式覆盖
      :deep(.el-card__body) {
        padding: 1.875rem 1.25rem;
      }

      // Element Plus 卡片头部样式覆盖
      :deep(.el-card__header) {
        padding-bottom: 0.5rem;
      }

      // 卡片头部内容样式
      .card-header {
        text-align: center;
        padding: 0.625rem 0 0 0;

        // 标题样式
        .title {
          margin: 0 0 0.75rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          user-select: none;
        }

        // 副标题样式
        .subtitle {
          margin: 0;
          font-size: 0.875rem;
          color: #909399;
        }
      }

      // Element Plus 表单项样式覆盖
      :deep(.el-form-item) {
        margin-bottom: 1.75rem;
      }

      // 提示信息容器样式
      .hint {
        margin-top: 1.875rem;
        padding: 1.25rem;
        background: #f5f7fa;
        border-radius: 0.25rem;

        // 提示标题样式
        .hint-title {
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        // 提示内容样式
        .hint-content {
          text-align: center;
          font-size: 0.8125rem;
          color: #606266;
          margin-bottom: 0.375rem;
          line-height: 1.6;

          // 账号标签样式
          span {
            padding: 0.125rem 0.375rem;
            background: #ffffff;
            border-radius: 0.1875rem;
            margin: 0 0.125rem;
          }
        }

        // 密码提示样式
        .hint-password {
          text-align: center;
          font-size: 0.8125rem;
          color: #606266;
        }
      }

      // 测试按钮区域样式
      .test-buttons {
        margin-top: 1.25rem;
        padding: 1.25rem;
        background: #fff3cd;
        border-radius: 0.25rem;
        border: 1px solid #ffc107;

        // 测试标题样式
        .test-title {
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          text-align: center;
          color: #856404;
        }

        // 测试按钮组样式
        .test-buttons-group {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }
  }
}

/**
 * 页面淡入动画
 * @keyframes fadeIn
 * @description 页面加载时的淡入效果，从透明度 0 到 1
 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/**
 * 卡片滑入动画
 * @keyframes textIn
 * @description 登录卡片从上方滑入并淡入的效果
 */
@keyframes textIn {
  from {
    opacity: 0;
    transform: translateY(-2.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


