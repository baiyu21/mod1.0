<template>
  <el-header class="header">
    <div class="actions">
      <span class="username" v-if="username">{{ username }}</span>
      <el-button type="primary" link @click="handleChangePassword">修改密码</el-button>
      <el-button type="danger" link @click="handleLogout">退出登录</el-button>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="changePasswordVisible"
      title="修改密码"
      width="500px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="100px"
      >
        <el-form-item label="旧密码" prop="oldPwd">
          <el-input
            v-model="changePasswordForm.oldPwd"
            type="password"
            placeholder="请输入旧密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input
            v-model="changePasswordForm.newPwd"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPwd">
          <el-input
            v-model="changePasswordForm.confirmPwd"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="changePasswordForm.name"
            placeholder="请输入姓名"
            clearable
          />
        </el-form-item>
        <el-form-item label="电话号" prop="phone">
          <el-input
            v-model="changePasswordForm.phone"
            placeholder="请输入手机号码"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" :loading="changePasswordLoading" @click="handleSubmitPassword">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </el-header>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const {
  logout,
  openChangePassword,
  closeChangePassword,
  submitChangePassword,
  changePasswordVisible,
  changePasswordLoading,
  changePasswordForm
} = useAuth()

const username = computed(() => userStore.userId || '用户')
const changePasswordFormRef = ref<FormInstance>()

// 表单验证规则
const validateConfirmPwd = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== changePasswordForm.value.newPwd) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validatePhone = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入手机号码'))
  } else {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(value)) {
      callback(new Error('请输入正确的手机号码'))
    } else {
      callback()
    }
  }
}

const changePasswordRules: FormRules = {
  oldPwd: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, validator: validateConfirmPwd, trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, validator: validatePhone, trigger: 'blur' }
  ]
}

const handleChangePassword = () => {
  openChangePassword()
}

const handleCloseDialog = () => {
  changePasswordFormRef.value?.resetFields()
  closeChangePassword()
}

const handleSubmitPassword = async () => {
  if (!changePasswordFormRef.value) return

  await changePasswordFormRef.value.validate((valid) => {
    if (valid) {
      submitChangePassword()
    } else {
      ElMessage.warning('请检查表单填写是否正确')
    }
  })
}

const handleLogout = () => {
  logout()
}
</script>
<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-bottom: 1px solid $border-base;
  background: $header-bg;
}

.actions {
  display: flex;
  align-items: center;
  gap: $header-gap;
  font-size: $font-size-base;
}

.username {
  color: $username-text;
  font-weight: $font-weight-medium;
  background: $username-bg;
  border: 1px solid $username-border;
  border-radius: $border-radius-round;
  padding: $username-padding;
  box-sizing: content-box;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  margin-right: 0;
}

:deep(.el-button.is-link) {
  font-size: $font-size-base;
  padding: 0;
}

:deep(.el-button) {
  padding: 0;
}

:deep(.el-button + .el-button) {
  margin-left: 0 !important;
}
</style>
