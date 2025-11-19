<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-upload
    ref="uploadRef"
    v-model:file-list="fileList"
    :class="uploadClass"
    drag
    multiple
    :auto-upload="autoUpload"
    :limit="limit"
    :disabled="readonly"
    :accept="accept"
    :http-request="handleUpload"
    :on-remove="handleRemove"
    :on-exceed="handleExceed"
    :on-change="handleFileChange"
  >
    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
    <div class="el-upload__text" v-html="uploadText"></div>
    <template #tip>
      <div class="el-upload__tip">
        <slot name="tip">{{ tip }}</slot>
      </div>
    </template>
  </el-upload>
  <div v-if="successVisible" class="upload-success-indicator">
    <el-icon><CircleCheckFilled /></el-icon>
    <span>{{ successMessage }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { UploadFilled, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFiles, UploadInstance, UploadRequestOptions } from 'element-plus'
import { uploadApi } from '@/services/api'

/**
 * 文件项类型（简化版，用于表单提交）
 */
export interface FileItem {
  name: string
  size: number
  type?: string
  url?: string
}

/**
 * 文件上传组件 Props
 */
interface Props {
  /**
   * 文件列表（v-model）
   * 支持 Element Plus 的 UploadFiles 类型或简化的 FileItem[] 类型
   */
  modelValue: UploadFiles | FileItem[]
  /**
   * 文件类型限制（accept 属性）
   * @example '.mp3,.wav,.pdf,.jpg,.jpeg,.png'
   */
  accept?: string
  /**
   * 文件数量限制
   * @default 6
   */
  limit?: number
  /**
   * 提示文本
   */
  tip?: string
  /**
   * 是否只读（禁用上传）
   * @default false
   */
  readonly?: boolean
  /**
   * 上传区域文本（支持 HTML）
   * @default '将文件拖到此处，或 点击上传'
   */
  uploadText?: string
  /**
   * 上传组件样式类名
   * @default 'ef-upload-block'
   */
  uploadClass?: string
  /**
   * 是否自动上传（选择文件后立即上传）
   * @default false
   */
  autoUpload?: boolean
  /**
   * 上传类别（用于选择上传接口路径）
   * @example 'vocal', 'instrumental', 'dance', 'opera', 'recitation'
   * @default 'vocal'
   */
  uploadCategory?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.mp3,.wav,.pdf,.jpg,.jpeg,.png',
  limit: 6,
  tip: '支持多媒体、文档、图片等多种格式，最终材料请合理打包并控制文件大小。',
  readonly: false,
  uploadText: '将文件拖到此处，或 <em>点击上传</em>',
  uploadClass: 'ef-upload-block',
  autoUpload: false,
  uploadCategory: 'vocal'
})

/**
 * 文件上传组件 Emits
 */
interface Emits {
  /**
   * 文件列表更新事件
   * @param files 文件列表
   */
  (e: 'update:modelValue', files: UploadFiles | FileItem[]): void
  /**
   * 文件上传成功事件
   * @param file 上传成功的文件
   * @param url 文件URL
   */
  (e: 'upload-success', file: File, url: string): void
  /**
   * 文件上传失败事件
   * @param file 上传失败的文件
   * @param error 错误信息
   */
  (e: 'upload-error', file: File, error: string): void
  /**
   * 所有文件上传完成事件
   * @param urls 所有文件的URL列表
   */
  (e: 'upload-complete', urls: string[]): void
}

const emit = defineEmits<Emits>()

const uploadRef = ref<UploadInstance>()

/**
 * 文件列表（内部使用）
 * 使用 computed 实现双向绑定
 */
const fileList = computed({
  get: () => props.modelValue as UploadFiles,
  set: (value) => emit('update:modelValue', value)
})

/**
 * 上传中的文件集合（用于跟踪上传状态）
 */
const uploadingFiles = ref<Set<string>>(new Set())

/**
 * 上传成功提示
 */
const successMessage = ref('文件上传成功')
const successVisible = ref(false)
let successTimer: number | undefined

const showSuccess = (message: string) => {
  successMessage.value = message
  successVisible.value = true
  if (successTimer) {
    window.clearTimeout(successTimer)
  }
  successTimer = window.setTimeout(() => {
    successVisible.value = false
  }, 2000)
}

const hideSuccess = () => {
  successVisible.value = false
  if (successTimer) {
    window.clearTimeout(successTimer)
    successTimer = undefined
  }
}

/**
 * 自定义上传处理函数
 * @param options 上传选项
 */
const handleUpload = async (options: UploadRequestOptions) => {
  const { file, onSuccess, onError, onProgress } = options
  const fileKey = `${file.name}-${file.size}`

  try {
    // 标记为上传中
    uploadingFiles.value.add(fileKey)
    hideSuccess()

    // 显示上传进度（可选）
    if (onProgress) {
      // 创建一个简单的进度事件对象
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressEvent: any = {
        percent: 10,
        lengthComputable: true,
        loaded: file.size * 0.1,
        total: file.size,
        target: {} as XMLHttpRequest
      }
      onProgress(progressEvent)
    }
    console.log('[FileUploadBlock] 开始上传文件:', {
      fileName: file.name,
      fileSize: file.size,
      category: props.uploadCategory
    })

    // 调用上传接口
    const uploadedUrl = await uploadApi.uploadFile(file as File, props.uploadCategory)

    if (uploadedUrl) {
      // 上传成功
      console.log('[FileUploadBlock] 文件上传成功，URL:', uploadedUrl)

      // 更新文件列表中的 URL
      const currentFile = fileList.value.find(f => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fFile = (f as any).raw || f
        return fFile === file || (fFile instanceof File && fFile.name === file.name && fFile.size === file.size)
      })

      if (currentFile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(currentFile as any).url = uploadedUrl
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(currentFile as any).status = 'success'
      }

      // 触发上传成功事件
      emit('upload-success', file as File, uploadedUrl)

      // 调用成功回调
      if (onSuccess) {
        onSuccess({ url: uploadedUrl })
      }
      showSuccess(`${file.name} 上传成功`)

      // 检查是否所有文件都已上传完成
      checkAllFilesUploaded()
    } else {
      // 上传失败
      const errorMsg = '文件上传失败'
      console.error('[FileUploadBlock] 文件上传失败:', file.name)

      // 更新文件状态
      const currentFile = fileList.value.find(f => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fFile = (f as any).raw || f
        return fFile === file || (fFile instanceof File && fFile.name === file.name && fFile.size === file.size)
      })

      if (currentFile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(currentFile as any).status = 'fail'
      }

      // 触发上传失败事件
      emit('upload-error', file as File, errorMsg)

      // 调用失败回调
      if (onError) {
        // 创建一个符合 UploadAjaxError 类型的错误对象
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorObj: any = {
          status: 0,
          method: 'POST',
          url: '',
          message: errorMsg
        }
        onError(errorObj)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '文件上传失败'
    console.error('[FileUploadBlock] 上传异常:', error)

    // 触发上传失败事件
    emit('upload-error', file as File, errorMsg)

    // 调用失败回调
    if (onError) {
      // 创建一个符合 UploadAjaxError 类型的错误对象
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj: any = {
        status: 0,
        method: 'POST',
        url: '',
        message: errorMsg
      }
      onError(errorObj)
    }
  } finally {
    // 移除上传中标记
    uploadingFiles.value.delete(fileKey)
  }
}

/**
 * 检查所有文件是否都已上传完成
 */
const checkAllFilesUploaded = () => {
  const allFiles = fileList.value
  const uploadedUrls: string[] = []

  allFiles.forEach(file => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileUrl = (file as any).url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileStatus = (file as any).status

    // 如果文件有 URL 且状态为成功，说明已上传
    if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
      uploadedUrls.push(fileUrl)
    } else if (fileStatus === 'success' && fileUrl) {
      uploadedUrls.push(fileUrl)
    }
  })

  // 如果所有文件都已上传，触发完成事件
  if (uploadedUrls.length > 0 && uploadedUrls.length === allFiles.length) {
    emit('upload-complete', uploadedUrls)
  }
}

/**
 * 文件变化处理（文件选择后触发）
 */
const handleFileChange = (file: UploadFiles[number], fileList: UploadFiles) => {
  console.log('[FileUploadBlock] 文件变化:', {
    fileName: file.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileStatus: (file as any).status,
    fileListLength: fileList.length
  })

  // 如果文件是新添加的且未上传，且 autoUpload 为 false，则手动触发上传
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileStatus = (file as any).status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileRaw = (file as any).raw

  // 如果文件状态是 ready（新添加）且不是自动上传模式，则立即上传
  if (fileStatus === 'ready' && !props.autoUpload && fileRaw instanceof File) {
    console.log('[FileUploadBlock] 检测到新文件，立即上传:', file.name)
    // 手动触发上传
    uploadSingleFile(fileRaw, file)
  }
}

/**
 * 上传单个文件
 * @param file 文件对象
 * @param fileItem 文件列表项
 */
const uploadSingleFile = async (file: File, fileItem: UploadFiles[number]) => {
  const fileKey = `${file.name}-${file.size}`

  try {
    // 标记为上传中
    uploadingFiles.value.add(fileKey)
    hideSuccess()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(fileItem as any).status = 'uploading'

    console.log('[FileUploadBlock] ========== 开始上传文件 ==========')
    console.log('[FileUploadBlock] 文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category: props.uploadCategory,
      uploadUrl: `/api/${props.uploadCategory}/upload/`
    })

    // 调用上传接口
    const uploadedUrl = await uploadApi.uploadFile(file, props.uploadCategory)

    console.log('[FileUploadBlock] ========== 上传接口响应 ==========')
    console.log('[FileUploadBlock] 上传结果:', {
      success: !!uploadedUrl,
      fileUrl: uploadedUrl,
      fileName: file.name
    })

    if (uploadedUrl) {
      // 上传成功
      console.log('[FileUploadBlock] ✅ 文件上传成功')
      console.log('[FileUploadBlock] 文件URL:', uploadedUrl)
      console.log('[FileUploadBlock] 完整响应数据:', {
        success: true,
        message: '文件上传成功',
        data: {
          file_name: file.name,
          original_name: file.name,
          file_url: uploadedUrl
        }
      })

      // 更新文件列表中的 URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(fileItem as any).url = uploadedUrl
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(fileItem as any).status = 'success'

      // 触发上传成功事件
      emit('upload-success', file, uploadedUrl)
      showSuccess(`${file.name} 上传成功`)

      // 检查是否所有文件都已上传完成
      checkAllFilesUploaded()
    } else {
      // 上传失败
      console.error('[FileUploadBlock] ❌ 文件上传失败')
      console.error('[FileUploadBlock] 错误信息: 文件上传失败，未返回URL')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(fileItem as any).status = 'fail'

      // 触发上传失败事件
      emit('upload-error', file, '文件上传失败')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '文件上传失败'
    console.error('[FileUploadBlock] ❌ 上传异常:', error)
    console.error('[FileUploadBlock] 异常信息:', errorMsg)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(fileItem as any).status = 'fail'

    // 触发上传失败事件
    emit('upload-error', file, errorMsg)
  } finally {
    // 移除上传中标记
    uploadingFiles.value.delete(fileKey)
    console.log('[FileUploadBlock] ========== 上传流程结束 ==========')
  }
}

/**
 * 文件移除处理
 */
const handleRemove = (file: UploadFiles[number]) => {
  console.log('[FileUploadBlock] 移除文件:', file.name)
  // 文件移除后，检查是否所有文件都已上传完成
  checkAllFilesUploaded()
}

/**
 * 文件数量超出限制处理
 */
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

/**
 * 手动触发上传所有文件
 * @returns Promise<string[]> 返回所有文件的URL列表
 */
const uploadAllFiles = async (): Promise<string[]> => {
  const urls: string[] = []
  const filesToUpload: File[] = []

  // 收集需要上传的文件
  fileList.value.forEach(file => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileObj = (file as any).raw || file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileUrl = (file as any).url

    if (fileObj instanceof File) {
      // 如果文件没有 URL 或 URL 不是有效的 HTTP URL，需要上传
      if (!fileUrl || !fileUrl.startsWith('http')) {
        filesToUpload.push(fileObj)
      } else {
        urls.push(fileUrl)
      }
    }
  })

  // 上传所有需要上传的文件
  if (filesToUpload.length > 0) {
    ElMessage.info(`正在上传 ${filesToUpload.length} 个文件，请稍候...`)

    const uploadPromises = filesToUpload.map(async (file) => {
      const uploadedUrl = await uploadApi.uploadFile(file, props.uploadCategory)
      if (uploadedUrl) {
        // 更新文件列表中的 URL
        const currentFile = fileList.value.find(f => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fFile = (f as any).raw || f
          return fFile === file || (fFile instanceof File && fFile.name === file.name && fFile.size === file.size)
        })

        if (currentFile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(currentFile as any).url = uploadedUrl
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(currentFile as any).status = 'success'
        }

        return uploadedUrl
      }
      return null
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    urls.push(...uploadedUrls.filter((url): url is string => url !== null))
  }

  return urls
}

/**
 * 获取第一个文件的URL（用于报名接口的 work_file 字段）
 * @returns 第一个文件的URL，如果没有则返回 null
 */
const getFirstFileUrl = (): string | null => {
  if (fileList.value.length === 0) {
    return null
  }

  const firstFile = fileList.value[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileUrl = (firstFile as any).url

  if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
    return fileUrl
  }

  return null
}

// 暴露方法供父组件调用
defineExpose({
  uploadAllFiles,
  getFirstFileUrl,
  uploadRef
})
</script>

<style lang="scss" scoped>
// 样式由全局样式文件 entryForm.scss 提供
// 如果需要自定义样式，可以通过 uploadClass prop 传入
.upload-success-indicator {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background-color: #f0f9eb;
  color: #4caf50;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
</style>

