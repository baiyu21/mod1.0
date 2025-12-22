<!-- 测试登录辅助组件 - 方便后期删除 -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { UserRole } from '@/types'

const router = useRouter()
const userStore = useUserStore()

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
  <div class="test-login-helper">
    <!-- 测试账号提示 -->
    <div class="hint">
      <div class="hint-title">测试账号</div>
      <div class="hint-content">
        <span>tsy1</span> | <span>tsy2</span> | <span>tsy3</span> |
        <span>tsy4</span>
      </div>
      <div class="hint-password">密码均为 <strong>Tsy123456</strong></div>
      <div class="hint-role">
        （用户端 | 管理员端 | 审核端 | 日志端）
      </div>
    </div>

    <!-- 测试按钮区域 -->
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
  </div>
</template>

<style scoped lang="scss">
.test-login-helper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 280px;
}

/* 测试账号提示样式 */
.hint {
  padding: 1.25rem;
  background: #f5f7fa;
  border-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .hint-title {
    font-size: 0.8125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .hint-content {
    text-align: center;
    font-size: 0.8125rem;
    color: #606266;
    margin-bottom: 0.375rem;
    line-height: 1.6;

    span {
      padding: 0.125rem 0.375rem;
      background: #ffffff;
      border-radius: 0.1875rem;
      margin: 0 0.125rem;
      font-size: 0.8125rem;
    }
  }

  .hint-password {
    text-align: center;
    font-size: 0.8125rem;
    color: #606266;
  }

  .hint-role {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #909399;
  }
}

/* 测试按钮区域样式 */
.test-buttons {
  padding: 1.25rem;
  background: #fff3cd;
  border-radius: 0.25rem;
  border: 1px solid #ffc107;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .test-title {
    font-size: 0.8125rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    text-align: center;
    color: #856404;
  }

  .test-buttons-group {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .test-login-helper {
    position: relative;
    top: auto;
    right: auto;
    max-width: 100%;
    margin: 20px auto 0;
  }
}
</style>
