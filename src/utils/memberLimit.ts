import { getMaxMemberCount, getCategoryMemberLimit } from '@/services/mock'
import { ElMessage } from 'element-plus'

// 页面类型定义
export type PageType =
  | 'vocal'           // 声乐报名
  | 'instrumental'    // 器乐报名
  | 'dance'           // 舞蹈报名
  | 'opera'           // 戏曲报名
  | 'recitation'      // 朗诵报名
  | 'calligraphy'     // 书法作品
  | 'painting'        // 绘画作品
  | 'design'          // 设计作品
  | 'photography'     // 摄影作品
  | 'microfilm'       // 微电影作品
  | 'artPractice'     // 艺术实践工作坊报名
  | 'aestheticInnovation' // 美育改革创新优秀案例申报

// 路由名称到页面类型的映射
const routeNameToPageType: Record<string, PageType> = {
  'vocal': 'vocal',
  'instrumental': 'instrumental',
  'dance': 'dance',
  'opera': 'opera',
  'recitation': 'recitation',
  'work-calligraphy': 'calligraphy',
  'work-painting': 'painting',
  'work-design': 'design',
  'work-photography': 'photography',
  'work-microfilm': 'microfilm',
  'art-practice': 'artPractice',
  'aesthetic-innovation': 'aestheticInnovation'
}

/**
 * 根据路由名称获取页面类型
 */
function getPageTypeByRouteName(routeName: string): PageType | null {
  return routeNameToPageType[routeName] || null
}

/**
 * 计算花名册总人数
 * @param rosters 花名册对象
 * @returns 总人数
 */
interface RosterItem {
  name?: string
  [key: string]: unknown
}

interface Rosters {
  teachers?: RosterItem[]
  members?: RosterItem[]
  accomp?: RosterItem[]
  studentAccomp?: RosterItem[]
  teacherAccomp?: RosterItem[]
}

export function calculateTotalMemberCount(rosters: Rosters): number {
  let total = 0
  
  // 计算各个组的人数
  if (rosters.teachers && Array.isArray(rosters.teachers)) {
    total += rosters.teachers.filter(item => item.name && item.name.trim()).length
  }
  if (rosters.members && Array.isArray(rosters.members)) {
    total += rosters.members.filter(item => item.name && item.name.trim()).length
  }
  if (rosters.accomp && Array.isArray(rosters.accomp)) {
    total += rosters.accomp.filter(item => item.name && item.name.trim()).length
  }
  if (rosters.studentAccomp && Array.isArray(rosters.studentAccomp)) {
    total += rosters.studentAccomp.filter(item => item.name && item.name.trim()).length
  }
  if (rosters.teacherAccomp && Array.isArray(rosters.teacherAccomp)) {
    total += rosters.teacherAccomp.filter(item => item.name && item.name.trim()).length
  }
  
  return total
}

// 页面类型名称映射
const pageTypeNames: Record<PageType, string> = {
  'vocal': '声乐报名',
  'instrumental': '器乐报名',
  'dance': '舞蹈报名',
  'opera': '戏曲报名',
  'recitation': '朗诵报名',
  'calligraphy': '书法作品',
  'painting': '绘画作品',
  'design': '设计作品',
  'photography': '摄影作品',
  'microfilm': '微电影作品',
  'artPractice': '艺术实践工作坊报名',
  'aestheticInnovation': '美育改革创新优秀案例申报'
}

/**
 * 获取人数限制信息
 * @param routeName 路由名称
 * @param categoryValue 类别值（可选，用于获取该类别的人数限制）
 * @returns 人数限制信息对象
 */
export function getMemberLimitInfo(routeName: string, categoryValue?: string): {
  maxCount: number | undefined
  pageType: PageType | null
  pageName: string | null
} {
  const pageType = getPageTypeByRouteName(routeName)
  if (!pageType) {
    return { maxCount: undefined, pageType: null, pageName: null }
  }
  
  let maxCount: number | undefined
  
  // 如果提供了类别值，优先获取该类别的人数限制
  if (categoryValue) {
    maxCount = getCategoryMemberLimit(pageType, categoryValue)
  }
  
  // 如果类别没有设置限制，则使用页面类型的限制
  if (maxCount === undefined) {
    maxCount = getMaxMemberCount(pageType)
  }
  
  const pageName = pageTypeNames[pageType]
  
  return { maxCount, pageType, pageName }
}

/**
 * 检查人数限制
 * @param routeName 路由名称
 * @param totalCount 总人数
 * @returns 是否通过检查，如果超过限制返回false
 */
export async function checkMemberLimit(routeName: string, totalCount: number): Promise<boolean> {
  const { maxCount, pageType, pageName } = getMemberLimitInfo(routeName)
  
  if (!pageType || maxCount === undefined) {
    // 如果不是已知的页面类型或未设置限制，允许通过
    return true
  }
  
  if (totalCount > maxCount) {
    ElMessage.error(
      `${pageName}最多允许${maxCount}人，当前人数为${totalCount}人，已超过限制！`
    )
    return false
  }
  
  return true
}

