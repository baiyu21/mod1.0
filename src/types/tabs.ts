// 标签页相关类型定义
// Tabs Type Definitions

export interface TabItem {
  path: string
  title: string
  closable?: boolean
  component?: string
  query?: Record<string, any>
}

export interface TabsState {
  tabs: TabItem[]
  activeTab: string
}

