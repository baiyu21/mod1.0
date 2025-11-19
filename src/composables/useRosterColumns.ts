/**
 * 花名册列定义组合式函数
 * 统一管理指导教师和参演学生的列配置
 */

export type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}

/**
 * 指导教师列定义
 * 按照接口文档要求排序：序号、姓名、身份证号、民族、年龄、性别、所在地区、学校名称、所在院系/部门、联系方式
 * 注意：序号由 RosterBlock 组件自动生成，不需要在此定义
 */
export const teacherColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'org', label: '所在院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]

/**
 * 参演学生/参赛人员列定义（完整版）
 * 按照接口文档要求排序：序号、姓名、身份证号、民族、年龄、性别、所在地区、学校名称、所在院系、年级、专业类别、专业名称、学号、联系方式
 * 注意：序号由 RosterBlock 组件自动生成，不需要在此定义
 * 用于 MemberBlock 组件（包含所有字段和下拉选择选项）
 */
export const memberColumnsFull: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '所在院系', width: 180 },
  { prop: 'grade', label: '年级', width: 100, type: 'select', options: [
    { label: '大一', value: 'freshman' },
    { label: '大二', value: 'sophomore' },
    { label: '大三', value: 'junior' },
    { label: '大四', value: 'senior' },
    { label: '大五', value: 'grade5' },
    { label: '大六', value: 'grade6' },
    { label: '大七', value: 'grade7' },
    { label: '大八', value: 'grade8' },
    { label: '研一', value: 'master1' },
    { label: '研二', value: 'master2' },
    { label: '研三', value: 'master3' },
    { label: '研四', value: 'master4' },
    { label: '博一', value: 'phd1' },
    { label: '博二', value: 'phd2' },
    { label: '博三', value: 'phd3' }
  ] },
  { prop: 'major', label: '专业类别', width: 160, type: 'select', options: [{ label: '艺术类', value: 'art' }, { label: '非艺术类', value: 'non-art' }] },
  { prop: 'majorName', label: '专业名称', width: 180 },
  { prop: 'studentNo', label: '学号', width: 140 },
  { prop: 'phone', label: '联系方式', width: 160 }
]

/**
 * 参演学生/参赛人员列定义（简化版）
 * 按照接口文档要求排序：序号、姓名、身份证号、民族、年龄、性别、所在地区、学校名称、所在院系、年级、专业类别、专业名称、学号、联系方式
 * 注意：序号由 RosterBlock 组件自动生成，不需要在此定义
 * 用于器乐、舞蹈、戏曲、朗诵等报名表单的伴奏等场景（不包含下拉选择选项）
 */
export const memberColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '所在院系', width: 180 },
  { prop: 'grade', label: '年级', width: 100 },
  { prop: 'major', label: '专业类别', width: 160 },
  { prop: 'majorName', label: '专业名称', width: 180 },
  { prop: 'studentNo', label: '学号', width: 140 },
  { prop: 'phone', label: '联系方式', width: 160 }
]

/**
 * 导出花名册列定义
 * @returns 包含 teacherColumns、memberColumns 和 memberColumnsFull 的对象
 */
export function useRosterColumns() {
  return {
    teacherColumns,
    memberColumns,
    memberColumnsFull
  }
}

