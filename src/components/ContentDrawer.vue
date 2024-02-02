<template>
  <div class="drawer-container">
    <el-drawer
      :with-header="false"
      :model-value="modelValue"
      destroy-on-close
      :lock-scroll="false"
      direction="btt"
      :show-close="false"
      size="100%"
      @dblclick="handleCopyHide"
      @close="closed()"
    >
      <content-details
        @handleCopy="handleCopy"
        @handleDelete="handleDelete"
        @handleFull="handleFull"
        :row-data="rowData"
        detailsType="drawer"
        :config="config"
      >
      </content-details>
    </el-drawer>
  </div>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue'
import ContentDetails from '@/components/ContentDetails.vue'

const props = defineProps({
  rowData: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'handleCopyHide', 'handleCopy', 'handleDelete', 'handleFull'])
const closed = () => {
  emit('update:modelValue', false)
}

const handleCopy = () => {
  emit('handleCopy', props.rowData)
}

const handleCopyHide = () => {
  emit('handleCopyHide', props.rowData)
}

const handleDelete = () => {
  emit('handleDelete', props.rowData)
}

const handleFull = () => {
  emit('handleFull')
}

</script>

<style lang="scss" scoped>
.drawer-container {
  :deep .el-drawer__body {
    padding: 0;
  }
}
</style>
