<template>
  <div class="roster-block">
    <div class="roster-tools">
      <div class="roster-title">{{ title }}</div>
      <div class="tool-btns">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
          :disabled="readonly"
        >
          <el-link type="primary" :disabled="readonly">批量导入</el-link>
        </el-upload>
        <el-divider direction="vertical" />
        <el-link @click="addRowBelow(rowsLocal.length - 1)" :disabled="readonly">新增一行</el-link>
        <el-divider direction="vertical" />
        <el-link @click="clearRows" :disabled="readonly">清空</el-link>
        <el-divider direction="vertical" />
        <el-link type="success" @click="downloadTemplate">下载模板</el-link>
      </div>
    </div>

    <el-table :data="rowsLocal" border style="width: 100%">
      <el-table-column label="序号" prop="_seq" width="70" align="center" />
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :label="col.label"
        :width="col.width"
      >
        <template #default="{ row, $index }">
          <el-select
            v-if="col.type==='select'"
            v-model="row[col.prop]"
            size="small"
            :placeholder="`请选择${col.label}`"
            style="width: 100%"
            :disabled="readonly"
          >
            <el-option v-for="op in col.options || []" :key="op.value" :label="op.label" :value="op.value" />
          </el-select>
          <div v-else>
            <el-input
              v-model="row[col.prop]"
              size="small"
              :placeholder="getPlaceholder(col)"
              :disabled="readonly"
              :maxlength="getMaxLength(col.prop)"
              @blur="() => validateField(col.prop, row, $index)"
              :class="{ 'input-error': row[`${col.prop}_error`] }"
            />
            <div v-if="row[`${col.prop}_error`]" class="field-error">
              {{ row[`${col.prop}_error`] }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="{ $index }">
          <span v-if="readonly">-</span>
          <div v-else class="row-actions">
            <el-button size="small" type="primary" link @click="addRowBelow($index)">插入</el-button>
            <el-button size="small" type="danger" link @click="remove($index)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { commonRules } from '@/composables/useForm'

type Column = {
  prop: string
  label: string
  width?: number
  type?: 'text' | 'select'
  options?: Array<{ label: string; value: string }>
}

type RosterItem = Record<string, string | number | null>

const props = defineProps<{
  title: string
  columns: Column[]
  rows: RosterItem[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rows', v: RosterItem[]): void
}>()

const uploadRef = ref()
const rowsLocal = ref<RosterItem[]>(props.rows ? JSON.parse(JSON.stringify(props.rows)) : [])

watch(() => props.rows, (v) => {
  // 只有在 props.rows 真正改变时才更新（避免循环更新）
  const newRows = v ? JSON.parse(JSON.stringify(v)) : []
  // 使用 JSON.stringify 比较，避免不必要的更新导致的覆盖问题
  const currentStr = JSON.stringify(rowsLocal.value)
  const newStr = JSON.stringify(newRows)
  if (currentStr !== newStr) {
    rowsLocal.value = newRows
    reseq()
  }
}, { deep: true })

const reseq = () => rowsLocal.value.forEach((r, i) => (r._seq = i + 1))
reseq()
const sync = () => {
  // 清除错误信息后同步
  const cleaned = rowsLocal.value.map(row => {
    const cleanedRow: Record<string, unknown> = {}
    Object.keys(row).forEach(key => {
      if (!key.endsWith('_error')) {
        cleanedRow[key] = row[key]
      }
    })
    return cleanedRow
  })
  emit('update:rows', cleaned as RosterItem[])
}

/**
 * 获取字段占位符文本
 * @param col 列配置
 * @returns 占位符文本
 */
const getPlaceholder = (col: Column): string => {
  if (col.prop === 'name') return '请输入中文姓名'
  if (col.prop === 'phone') return '请输入11位手机号'
  if (col.prop === 'idNo') return '请输入18位身份证号'
  if (col.prop === 'studentNo') return '请输入学号（6-20位字母数字）'
  if (col.prop === 'age') return '请输入年龄（1-150）'
  return `请输入${col.label}`
}

/**
 * 获取字段最大长度
 * @param prop 字段属性名
 * @returns 最大长度
 */
const getMaxLength = (prop: string): number | undefined => {
  if (prop === 'phone') return 11
  if (prop === 'idNo') return 18
  if (prop === 'studentNo') return 20
  return undefined
}

/**
 * 验证单个字段
 * @param prop 字段属性名
 * @param row 行数据对象
 * @param rowIndex 行索引
 */
const validateField = (prop: string, row: RosterItem, rowIndex: number) => {
  if (!row || rowIndex < 0) return
  
  const value = row[prop]
  const valueStr = String(value || '').trim()
  let error = ''

  // 根据字段类型进行验证
  if (prop === 'name') {
    if (!valueStr) {
      error = '请输入姓名'
    } else {
      const chineseNamePattern = /^[\u4e00-\u9fa5·]+$/
      if (!chineseNamePattern.test(valueStr)) {
        error = '姓名必须为中文'
      } else if (valueStr.length < 2 || valueStr.length > 20) {
        error = '姓名长度应在2-20个字符之间'
      }
    }
  } else if (prop === 'phone') {
    if (!valueStr) {
      error = '请输入手机号'
    } else {
      const phonePattern = /^1[3-9]\d{9}$/
      if (!phonePattern.test(valueStr)) {
        error = '请输入正确的11位手机号'
      }
    }
  } else if (prop === 'idNo') {
    if (!valueStr) {
      error = '请输入身份证号'
    } else {
      const idPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
      if (!idPattern.test(valueStr)) {
        error = '请输入正确的18位身份证号'
      }
    }
  } else if (prop === 'studentNo' && valueStr) {
    if (valueStr.length < 6 || valueStr.length > 20) {
      error = '学号长度应在6-20个字符之间'
    } else {
      const studentNoPattern = /^[A-Za-z0-9]+$/
      if (!studentNoPattern.test(valueStr)) {
        error = '学号只能包含字母和数字'
      }
    }
  } else if (prop === 'age' && valueStr) {
    const age = Number(valueStr)
    if (isNaN(age) || age < 1 || age > 150) {
      error = '年龄应在1-150之间'
    }
  }

  // 设置或清除错误信息
  if (error) {
    row[`${prop}_error`] = error
  } else {
    delete row[`${prop}_error`]
  }
  
  // 强制触发响应式更新
  rowsLocal.value = [...rowsLocal.value]
}

const addRowBelow = (idx: number) => {
  // 如果索引无效或小于0，则在数组末尾添加
  const at = idx < 0 || isNaN(idx) ? rowsLocal.value.length : Math.max(0, idx + 1)
  // 创建一个空对象，确保所有列都有对应的属性
  const newRow: RosterItem = {}
  rowsLocal.value.splice(at, 0, newRow)
  reseq()
  sync()
}
const remove = (idx: number) => { rowsLocal.value.splice(idx, 1); reseq(); sync() }
const clearRows = () => { rowsLocal.value = []; reseq(); sync() }

// Excel文件导入功能
const handleFileChange = (file: { raw: File }) => {
  if (!file.raw) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName || !workbook.Sheets[sheetName]) {
        ElMessage.warning('Excel文件格式不正确')
        return
      }

      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        ElMessage.warning('Excel文件内容为空或格式不正确')
        return
      }

      // 跳过表头，从第二行开始解析数据
      const importedRows: RosterItem[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row && Array.isArray(row) && row.some(cell => cell !== undefined && cell !== '')) {
          const rowData: RosterItem = {}
          props.columns.forEach((col, index) => {
            // 跳过序号列，从第二列开始映射
            const cellValue = row[index + 1]
            if (cellValue !== undefined && cellValue !== '') {
              rowData[col.prop] = String(cellValue).trim()
            }
          })
          importedRows.push(rowData)
        }
      }

      if (importedRows.length > 0) {
        rowsLocal.value.push(...importedRows)
        reseq()
        sync()
        ElMessage.success(`成功导入 ${importedRows.length} 条数据`)
      } else {
        ElMessage.warning('未找到有效的数据行')
      }
    } catch (error) {
      console.error('Excel解析错误:', error)
      ElMessage.error('Excel文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const downloadTemplate = () => {
  const header = ['序号', ...props.columns.map(c => c.label)]
  const csv = [header, ['示例行', ...props.columns.map(() => '')]].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title}-模板.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.roster-tools{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.roster-title{font-weight:600}
.row-actions{display:inline-flex;gap:6px}
.tool-btns {
  display: flex;
  align-items: center;
  gap: 0;
}
.tool-btns .el-upload {
  display: inline-flex;
  align-items: center;
}
.field-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.2;
}
.input-error :deep(.el-input__inner) {
  border-color: #f56c6c;
}
</style>
