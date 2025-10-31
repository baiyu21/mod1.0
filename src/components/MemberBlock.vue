<template>
  <RosterBlock
    title="参赛人员"
    :columns="memberColumns"
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

const memberColumns: Column[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'studentNo', label: '学号', width: 140 },
  { prop: 'idNo', label: '身份证号', width: 200 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'nation', label: '民族', width: 100 },
  { prop: 'major', label: '专业类别', width: 160, type: 'select', options: [{ label:'艺术类', value:'art' }, { label:'非艺术类', value:'non-art' }] },
  { prop: 'grade', label: '年级', width: 100, type: 'select', options: [
    { label:'大一', value:'freshman' },
    { label:'大二', value:'sophomore' },
    { label:'大三', value:'junior' },
    { label:'大四', value:'senior' },
    { label:'大五', value:'grade5' },
    { label:'大六', value:'grade6' },
    { label:'大七', value:'grade7' },
    { label:'大八', value:'grade8' },
    { label:'研一', value:'master1' },
    { label:'研二', value:'master2' },
    { label:'研三', value:'master3' },
    { label:'研四', value:'master4' },
    { label:'博一', value:'phd1' },
    { label:'博二', value:'phd2' },
    { label:'博三', value:'phd3' }
  ] },
  { prop: 'gender', label: '性别', width: 100, type: 'select', options: [{ label:'男', value:'male' }, { label:'女', value:'female' }] },
  { prop: 'region', label: '所在地区', width: 140 },
  { prop: 'school', label: '学校名称', width: 160 },
  { prop: 'dept', label: '专业', width: 180 },
  { prop: 'phone', label: '联系方式', width: 160 }
]
</script>

