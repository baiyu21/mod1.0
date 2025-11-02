import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTipByRouteName, getUploadTipByRouteName } from '@/utils/tips'

/**
 * 用于获取提示词的composable
 * 支持实时监听localStorage变化并更新提示词
 */
export function useTips() {
  const route = useRoute()
  
  // 提示词刷新触发器（用于监听localStorage变化）
  const tipRefreshTrigger = ref(0)

  // 监听localStorage变化
  const handleStorageChange = () => {
    tipRefreshTrigger.value++
  }

  // 创建自定义事件监听器，用于同窗口内的localStorage变化
  const handleLocalStorageChange = () => {
    tipRefreshTrigger.value++
  }

  onMounted(() => {
    // 监听跨窗口的storage事件
    window.addEventListener('storage', handleStorageChange)
    
    // 监听同窗口内的localStorage变化（自定义事件）
    window.addEventListener('localStorageChange', handleLocalStorageChange)
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('localStorageChange', handleLocalStorageChange)
  })

  // 获取提示词（响应式，当localStorage变化时会更新）
  const pageTip = computed(() => {
    // 引用tipRefreshTrigger以建立响应式依赖
    void tipRefreshTrigger.value
    const routeName = route.name as string
    return getTipByRouteName(routeName)
  })

  const pageUploadTip = computed(() => {
    // 引用tipRefreshTrigger以建立响应式依赖
    void tipRefreshTrigger.value
    const routeName = route.name as string
    return getUploadTipByRouteName(routeName)
  })

  return {
    pageTip,
    pageUploadTip
  }
}

