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
      meta: { roles: ['user'], requiresAuth: true, title: '首页' }
    },
    {
      path: '/user/vocal',
      name: 'vocal',
      component: () => import('@/views/user/EntryFormVocal.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '声乐报名' }
    },
    {
      path: '/user/instrumental',
      name: 'instrumental',
      component: () => import('@/views/user/EntryFormInstrumental.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '器乐报名' }
    },
    {
      path: '/user/dance',
      name: 'dance',
      component: () => import('@/views/user/EntryFormDance.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '舞蹈报名' }
    },
    {
      path: '/user/opera',
      name: 'opera',
      component: () => import('@/views/user/EntryFormOpera.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '戏曲报名' }
    },
    {
      path: '/user/recitation',
      name: 'recitation',
      component: () => import('@/views/user/EntryFormRecitation.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '朗诵报名' }
    },
    {
      path: '/user/work-calligraphy',
      name: 'work-calligraphy',
      component: () => import('@/views/user/WorkCalligraphy.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '书法作品' }
    },
    {
      path: '/user/work-painting',
      name: 'work-painting',
      component: () => import('@/views/user/WorkPainting.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '绘画作品' }
    },
    {
      path: '/user/work-design',
      name: 'work-design',
      component: () => import('@/views/user/WorkDesign.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '设计作品' }
    },
    {
      path: '/user/work-photography',
      name: 'work-photography',
      component: () => import('@/views/user/WorkPhotography.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '摄影作品' }
    },
    {
      path: '/user/work-microfilm',
      name: 'work-microfilm',
      component: () => import('@/views/user/WorkMicrofilm.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '微电影作品' }
    },
    {
      path: '/user/art-practice',
      name: 'art-practice',
      component: () => import('@/views/user/ArtPractice.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '艺术实践工作坊报名' }
    },
    {
      path: '/user/aesthetic-innovation',
      name: 'aesthetic-innovation',
      component: () => import('@/views/user/AestheticInnovation.vue'),
      meta: { roles: ['user'], requiresAuth: true, title: '美育改革创新优秀案例申报' }
    },
    // 审核端路由
    {
      path: '/approval',
      name: 'approval-home',
      component: () => import('@/views/reviewer/IndexPage.vue'),
      meta: { roles: ['approval'], requiresAuth: true, title: '首页' }
    },
    {
      path: '/approval/approval',
      name: 'approval-page',
      component: () => import('@/views/reviewer/ApprovalPage.vue'),
      meta: { roles: ['approval'], requiresAuth: true, title: '审核报名' }
    },
    {
      path: '/approval/statistics',
      name: 'approval-statistics',
      component: () => import('@/views/reviewer/StatisticsPage.vue'),
      meta: { roles: ['approval'], requiresAuth: true, title: '报名统计' }
    },
    {
      path: '/approval/account',
      name: 'approval-account',
      component: () => import('@/views/reviewer/AccountPage.vue'),
      meta: { roles: ['approval'], requiresAuth: true, title: '账号管理' }
    },
    // 管理员端路由（复用审核端页面组件）
    {
      path: '/admin',
      name: 'admin-home',
      component: () => import('@/views/reviewer/IndexPage.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '首页' }
    },
    {
      path: '/admin/approval',
      name: 'admin-approval',
      component: () => import('@/views/reviewer/ApprovalPage.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '审核报名' }
    },
    {
      path: '/admin/statistics',
      name: 'admin-statistics',
      component: () => import('@/views/reviewer/StatisticsPage.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '报名统计' }
    },
    {
      path: '/admin/account',
      name: 'admin-account',
      component: () => import('@/views/reviewer/AccountPage.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '账号管理' }
    },
    {
      path: '/admin/tips',
      name: 'admin-tips',
      component: () => import('@/views/Admin/TipsManagement.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '提示管理' }
    },
    {
      path: '/admin/category',
      name: 'admin-category',
      component: () => import('@/views/Admin/CategoryManagement.vue'),
      meta: { roles: ['admin'], requiresAuth: true, title: '类型管理' }
    },
    // 日志审计员端路由
    {
      path: '/logaudit',
      name: 'logaudit-home',
      component: () => import('@/views/LogAudit/LogAuditHomePage.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true, title: '首页' }
    },
    {
      path: '/logaudit/logs',
      name: 'logaudit-logs',
      component: () => import('@/views/LogAudit/LogView.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true, title: '操作日志' }
    },
    {
      path: '/logaudit/audit',
      name: 'logaudit-audit',
      component: () => import('@/views/LogAudit/AuditRecord.vue'),
      meta: { roles: ['logaudit'], requiresAuth: true, title: '审计记录' }
    }
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
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
  } catch (error) {
    console.error('路由守卫错误:', error)
    next('/login')
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由加载错误:', error)
  // 可以在这里添加错误提示
})

export default router
