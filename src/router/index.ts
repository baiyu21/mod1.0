import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/header/login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/login'
    },
    // 用户端路由
    {
      path: '/user',
      name: 'user-home',
      component: () => import('@/views/user/first.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/vocal',
      name: 'vocal',
      component: () => import('@/views/user/EntryFormVocal.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/instrumental',
      name: 'instrumental',
      component: () => import('@/views/user/EntryFormInstrumental.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/dance',
      name: 'dance',
      component: () => import('@/views/user/EntryFormDance.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/opera',
      name: 'opera',
      component: () => import('@/views/user/EntryFormOpera.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/recitation',
      name: 'recitation',
      component: () => import('@/views/user/EntryFormRecitation.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/work-calligraphy',
      name: 'work-calligraphy',
      component: () => import('@/views/user/WorkCalligraphy.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/work-painting',
      name: 'work-painting',
      component: () => import('@/views/user/WorkPainting.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/work-design',
      name: 'work-design',
      component: () => import('@/views/user/WorkDesign.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/work-photography',
      name: 'work-photography',
      component: () => import('@/views/user/WorkPhotography.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/work-microfilm',
      name: 'work-microfilm',
      component: () => import('@/views/user/WorkMicrofilm.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/art-practice',
      name: 'art-practice',
      component: () => import('@/views/user/ArtPractice.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    {
      path: '/user/aesthetic-innovation',
      name: 'aesthetic-innovation',
      component: () => import('@/views/user/AestheticInnovation.vue'),
      meta: { roles: ['user'], requiresAuth: true }
    },
    // 审核端路由
    {
      path: '/approval',
      name: 'approval-home',
      component: () => import('@/views/Approval/ApprovalHomePage.vue'),
      meta: { roles: ['approval'], requiresAuth: true }
    },
    {
      path: '/approval/pending',
      name: 'approval-pending',
      component: () => import('@/views/Approval/PendingReview.vue'),
      meta: { roles: ['approval'], requiresAuth: true }
    },
    // 管理员端路由
    {
      path: '/admin',
      name: 'admin-home',
      component: () => import('@/views/Admin/AdminHomePage.vue'),
      meta: { roles: ['admin'], requiresAuth: true }
    },
    // 日志审计员端路由
    {
      path: '/logaudit',
      name: 'logaudit-home',
      component: () => import('@/views/LogAudit/LogAuditHomePage.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true }
    },
    {
      path: '/logaudit/logs',
      name: 'logaudit-logs',
      component: () => import('@/views/LogAudit/LogView.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true }
    },
    {
      path: '/logaudit/audit',
      name: 'logaudit-audit',
      component: () => import('@/views/LogAudit/AuditRecord.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true }
    }
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const roles = to.meta.roles as string[] | undefined

  // 如果不需要认证，直接放行
  if (!requiresAuth) {
    next()
    return
  }

  // 如果需要认证但未登录，跳转到登录页
  if (!userStore.role) {
    next('/login')
    return
  }

  // 如果指定了角色，检查是否有权限
  if (roles && roles.length > 0) {
    if (!roles.includes(userStore.role)) {
      // 没有权限，根据当前角色跳转到对应首页
      const roleRoutes: Record<string, string> = {
        'user': '/user',
        'approval': '/approval',
        'admin': '/admin',
        'logaudit': '/logaudit'
      }
      next(roleRoutes[userStore.role] || '/login')
      return
    }
  }

  next()
})

export default router
