<template>
  <div class="drawer-container">
    <el-drawer
      :with-header="false"
      v-model="modelValue"
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
import { defineEmits, defineModel, defineProps } from 'vue'
import ContentDetails from '@/components/ContentDetails.vue'

const props = defineProps({
  rowData: {
    type: Object,
    required: true
  },
  config: {
    type: Object,
    required: true
  }
})

const modelValue = defineModel({ required: true })

const emit = defineEmits(['handleCopyHide', 'handleCopy', 'handleDelete', 'handleFull'])
const closed = () => {
  modelValue.value = false
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
