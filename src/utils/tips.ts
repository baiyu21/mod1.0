// 页面类型定义
type PageType =
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

// 默认提示词
const defaultTips: Record<PageType, string> = {
  vocal: '合唱：合唱队人数不超过40人，钢琴伴奏1人，指挥1人（应为本校教师），每支合唱队可演唱两首作品（其中至少一首中国作品），演出时间不超过8分钟。\n小合唱或表演唱：人数不超过15人（含伴奏），不设指挥，不得伴舞，演出时间不超过5分钟。',
  instrumental: '小合奏或重奏：人数不超过12人，不设指挥，演出时间不超过6分钟。\n大合奏：人数不超过65人，指挥1人，演出时间不超过10分钟（含指挥、乐队各一次上下台）。',
  dance: '群舞：人数不超过36人，演出时间不超过7分钟。\n独舞、双人舞、三人舞：演出时间不超过6分钟。',
  opera: '含戏曲、校园短剧、小品、歌舞剧、音乐剧等。人数不超过12人（含伴奏），演出时间不超过12分钟。',
  recitation: '作品文体不限，须使用普通话，人数不超过8人（含伴奏，学生不作道具），不得伴舞，演出时间不超过5分钟。',
  calligraphy: '书体不限。尺寸不超过四尺宣纸（69cm×138cm）。',
  painting: '国画、水彩/水粉画（丙烯画）、版画、油画，或其他画种。尺寸：国画不超过四尺宣纸（69cm×138cm）对开，其他画种尺寸均不超过对开（54cm×78cm）。',
  design: '含平面设计和立体设计。平面设计尺寸不超过对开（54cm×78cm），立体设计尺寸不超过50cm（长）×50cm（宽）×50cm（高）。',
  photography: '单张照和组照（每组不超过4幅，需标明顺序号），尺寸均为14英寸（30.48cm×35.56cm）；除影调处理外，不得利用电脑和暗房技术改变影像原貌。',
  microfilm: '播放格式不限，播放时长不超过12分钟。',
  artPractice: '艺术实践工作坊应体现中华优秀文化传承、地域特色、民族团结等主题。',
  aestheticInnovation: '高校美育改革创新优秀案例需围绕美育改革创新实践展开，体现美育工作的创新性和实效性。'
}

// 默认上传提示
const defaultUploadTips: Record<PageType, string> = {
  vocal: '支持：音频（mp3/wav）、乐谱（pdf）、图片（jpg/png，建议≥1200×1200）。为统一展演的正常播放，请使用常见编码格式。每个节目的最终材料以本地打包提交，文件大小不宜超过100MB；不要将多个文件打包；严禁含违规内容；请遵守版权规范。',
  instrumental: '音频、乐谱、图片、视频等多格式支持，所有作品资料请合规提交。',
  dance: '支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  opera: '支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  recitation: '支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  calligraphy: '支持：图片（jpg/png，建议≥1200×1200）、PDF等格式。每个作品的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  painting: '支持：图片（jpg/png，建议≥1200×1200）、PDF等格式。每个作品的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  design: '支持：图片（jpg/png，建议≥1200×1200）、PDF、3D模型等格式。每个作品的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  photography: '支持：图片（jpg/png，建议≥1200×1200）、RAW等格式。每个作品的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  microfilm: '支持：视频（mp4/mov等）、图片、脚本等格式。播放格式不限，每个作品的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  artPractice: '支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。',
  aestheticInnovation: '支持：音频、视频、图片、PDF等多种格式。为展演播放，请使用常见编码，每个节目的最终材料以本地打包提交，文件大小不宜超过100MB，不要将多个文件打包。'
}

/**
 * 获取指定页面类型的提示词（实时从localStorage读取）
 * @param pageType 页面类型
 * @returns 提示词内容
 */
export function getPageTip(pageType: PageType): string {
  try {
    const saved = localStorage.getItem('pageTips')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed[pageType]) {
        return parsed[pageType]
      }
    }
  } catch (e) {
    console.error('Failed to parse page tips:', e)
  }
  return defaultTips[pageType] || ''
}

/**
 * 获取指定页面类型的上传提示（实时从localStorage读取）
 * @param pageType 页面类型
 * @returns 上传提示内容
 */
export function getPageUploadTip(pageType: PageType): string {
  try {
    const saved = localStorage.getItem('pageUploadTips')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed[pageType]) {
        return parsed[pageType]
      }
    }
  } catch (e) {
    console.error('Failed to parse page upload tips:', e)
  }
  return defaultUploadTips[pageType] || ''
}

/**
 * 路由名称到页面类型的映射
 */
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
 * 根据路由名称获取提示词
 * @param routeName 路由名称
 * @returns 提示词内容
 */
export function getTipByRouteName(routeName: string): string {
  const pageType = getPageTypeByRouteName(routeName)
  if (!pageType) {
    return ''
  }
  return getPageTip(pageType)
}

/**
 * 根据路由名称获取上传提示
 * @param routeName 路由名称
 * @returns 上传提示内容
 */
export function getUploadTipByRouteName(routeName: string): string {
  const pageType = getPageTypeByRouteName(routeName)
  if (!pageType) {
    return ''
  }
  return getPageUploadTip(pageType)
}

