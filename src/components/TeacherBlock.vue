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

watch(() => props.rows, (v) => {
  localRows.value = v ? JSON.parse(JSON.stringify(v)) : []
}, { deep: true })

watch(localRows, (v) => {
  emit('update:rows', JSON.parse(JSON.stringify(v)))
}, { deep: true })

const teacherColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'title', label: '职称/专业', width: 160 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'org', label: '所属院系/部门', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
</script>

