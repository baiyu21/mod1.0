<template>
  <RosterBlock
    title="指导教师"
    :columns="teacherColumns"
    v-model:rows="localRows"
    :readonly="readonly"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import RosterBlock from './RosterBlock.vue'
import { teacherColumns } from '@/composables/useRosterColumns'

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
</script>

