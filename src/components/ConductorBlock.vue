<template>
  <RosterBlock
    title="指挥（可以为本校老师）"
    :columns="conductorColumns"
    v-model:rows="localRows"
    :readonly="readonly"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import RosterBlock from './RosterBlock.vue'

type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}

type RosterItem = Record<string, string | number | null>

const props = defineProps<{
  rows: RosterItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rows', v: RosterItem[]): void
}>()

const localRows = ref<RosterItem[]>(props.rows ? JSON.parse(JSON.stringify(props.rows)) : [])

// 同步标志，防止循环更新
let isSyncing = false

watch(() => props.rows, (v) => {
  if (isSyncing) return // 如果正在同步，忽略外部更新，避免覆盖用户输入
  // 只有在 props.rows 真正改变时才更新（避免循环更新）
  const newRows = v ? JSON.parse(JSON.stringify(v)) : []
  // 使用 JSON.stringify 比较，避免不必要的更新导致的覆盖问题
  const currentStr = JSON.stringify(localRows.value)
  const newStr = JSON.stringify(newRows)
  if (currentStr !== newStr) {
    isSyncing = true // 临时设置标志，防止触发 localRows 的 watch
    localRows.value = newRows
    setTimeout(() => {
      isSyncing = false
    }, 0)
  }
}, { deep: true })

watch(localRows, (v) => {
  if (isSyncing) return // 防止循环更新
  isSyncing = true
  emit('update:rows', JSON.parse(JSON.stringify(v)))
  // 使用 setTimeout 确保同步完成后再重置标志
  setTimeout(() => {
    isSyncing = false
  }, 0)
}, { deep: true, flush: 'post' })

const conductorColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'major', label: '专业', width: 160 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '所在院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
</script>

