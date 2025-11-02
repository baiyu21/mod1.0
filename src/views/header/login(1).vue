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
  <div class="main">
    <div class="leftText">
      <span class="text">成都东软学院<br>意杯杯杯杯意杯杯系统</span>
    </div>
    <div class="rightForm">
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
        <div class="hint">示例账号：<br>user1<br>reviewer1<br>admin1<br>logger1<br>密码均为 123456</div>
      </el-card>
    </div>
    
  </div>
  
</template>

<style scoped lang="scss">
.main{
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: space-around;
  align-items: center;
  .leftText{
    height: 100vh;
    flex: 1;
    background-image: url(../assets/img/ylinBKGC.png);
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;
    .text{
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
  .rightForm{
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    .login-card {
      width: min(96vw, 420px);
      border-radius: 10px;
      gap: 50px;
      display: flex;
      flex-direction: column;
      padding: 30px 20px;
      .el-form-item{
        margin-bottom: 20px;
        width: 100%;
        // background-color: rgba(0, 0, 0, 0.281);
        .el-input{
          width: 100%;
        }
      }
      .title {
        transform: translateX(20px);
        margin-bottom: 22px; 
        user-select: none;
      }
    }
  } 
}


</style>


