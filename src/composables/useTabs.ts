// 标签页相关组合式函数
// Tabs Composable

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TabItem } from '@/types/tabs'

/**
 * 标签页相关组合式函数
 * @returns 标签页相关的方法和状态
 */
export function useTabs() {
  const route = useRoute()
  const router = useRouter()
  
  // 标签页列表
  const tabs = ref<TabItem[]>([])
  // 当前激活的标签页
  const activeTab = ref<string>('')
  
  /**
   * 添加标签页
   * @param tab 标签页信息
   */
  const addTab = (tab: TabItem) => {
    // 检查标签页是否已存在
    const existingTab = tabs.value.find(t => t.path === tab.path)
    if (!existingTab) {
      tabs.value.push({
        ...tab,
        closable: tab.closable !== false // 默认可关闭
      })
    }
    activeTab.value = tab.path
  }
  
  /**
   * 移除标签页
   * @param path 标签页路径
   */
  const removeTab = (path: string) => {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index === -1) return
    
    tabs.value.splice(index, 1)
    
    // 如果移除的是当前激活的标签页，切换到最后一个标签页
    if (activeTab.value === path) {
      const lastTab = tabs.value[tabs.value.length - 1]
      if (lastTab) {
        activeTab.value = lastTab.path
        router.push(lastTab.path)
      } else {
        // 如果没有标签页了，根据角色跳转到对应首页
        const defaultPaths: Record<string, string> = {
          'user': '/user',
          'approval': '/approval',
          'admin': '/admin',
          'logaudit': '/logaudit'
        }
        const role = (route.meta.roles as string[])?.[0] || 'user'
        router.push(defaultPaths[role] || '/user')
      }
    }
  }
  
  /**
   * 清空所有标签页
   */
  const clearTabs = () => {
    tabs.value = []
    activeTab.value = ''
  }
  
  /**
   * 关闭其他标签页
   * @param path 保留的标签页路径
   */
  const closeOtherTabs = (path: string) => {
    tabs.value = tabs.value.filter(t => t.path === path)
    activeTab.value = path
  }
  
  /**
   * 关闭所有标签页
   */
  const closeAllTabs = () => {
    clearTabs()
    const defaultPaths: Record<string, string> = {
      'user': '/user',
      'approval': '/approval',
      'admin': '/admin',
      'logaudit': '/logaudit'
    }
    const role = (route.meta.roles as string[])?.[0] || 'user'
    router.push(defaultPaths[role] || '/user')
  }
  
  /**
   * 处理标签页点击
   * @param tab 标签页对象
   */
  const handleTabClick = (tab: any) => {
    const targetPath = tab.props.name as string
    activeTab.value = targetPath
    router.push(targetPath)
  }
  
  /**
   * 处理标签页移除
   * @param path 标签页路径
   */
  const handleTabRemove = (path: string) => {
    removeTab(path)
  }
  
  /**
   * 根据路由名称获取标签页标题
   * @param routeName 路由名称
   * @param path 路由路径
   * @returns 标签页标题
   */
  const getTabTitle = (routeName: string | symbol | undefined, path: string): string => {
    // 优先使用 meta.title
    if (route.meta?.title) {
      return route.meta.title as string
    }
    
    if (!routeName || typeof routeName !== 'string') {
      // 根据路径生成标题
      const pathMap: Record<string, string> = {
        '/user': '首页',
        '/user/vocal': '声乐报名',
        '/user/instrumental': '器乐报名',
        '/user/dance': '舞蹈报名',
        '/user/opera': '戏曲报名',
        '/user/recitation': '朗诵报名',
        '/user/work-calligraphy': '书法作品',
        '/user/work-painting': '绘画作品',
        '/user/work-design': '设计作品',
        '/user/work-photography': '摄影作品',
        '/user/work-microfilm': '微电影作品',
        '/user/art-practice': '艺术实践工作坊报名',
        '/user/aesthetic-innovation': '美育改革创新优秀案例申报',
        '/approval': '首页',
        '/approval/approval': '审核报名',
        '/approval/pending': '待审核记录',
        '/approval/statistics': '报名统计',
        '/approval/account': '账号管理',
        '/admin': '首页',
        '/admin/approval': '审核报名',
        '/admin/statistics': '报名统计',
        '/admin/account': '账号管理',
        '/admin/tips': '提示管理',
        '/admin/category': '类型管理',
        '/logaudit': '首页',
        '/logaudit/logs': '操作日志',
        '/logaudit/audit': '审计记录',
      }
      return pathMap[path] || path.split('/').pop() || '页面'
    }
    
    // 根据路由名称映射标题
    const nameMap: Record<string, string> = {
      'user-home': '首页',
      'vocal': '声乐报名',
      'instrumental': '器乐报名',
      'dance': '舞蹈报名',
      'opera': '戏曲报名',
      'recitation': '朗诵报名',
      'work-calligraphy': '书法作品',
      'work-painting': '绘画作品',
      'work-design': '设计作品',
      'work-photography': '摄影作品',
      'work-microfilm': '微电影作品',
      'art-practice': '艺术实践工作坊报名',
      'aesthetic-innovation': '美育改革创新优秀案例申报',
      'approval-home': '首页',
      'pending-review': '待审核记录',
      'admin-home': '首页',
      'logaudit-home': '首页',
    }
    
    return nameMap[routeName] || routeName
  }

  // 监听路由变化，自动添加标签页
  watch(
    () => route.path,
    (newPath) => {
      // 跳过登录页和错误页
      if (newPath === '/login' || newPath === '/404' || newPath === '/403') {
        return
      }
      
      const tabTitle = (route.meta?.title as string) || getTabTitle(route.name, newPath)
      addTab({
        path: newPath,
        title: tabTitle,
        closable: newPath !== '/user' && newPath !== '/approval' && newPath !== '/admin' && newPath !== '/logaudit' // 首页不可关闭
      })
    },
    { immediate: true }
  )
  
  return {
    // 状态
    tabs,
    activeTab,
    
    // 方法
    addTab,
    removeTab,
    clearTabs,
    closeOtherTabs,
    closeAllTabs,
    handleTabClick,
    handleTabRemove
  }
}

