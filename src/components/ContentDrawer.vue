<template>
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
    class="drawer-container"
  >
    <content-details
      @handleCopy="handleCopy"
      @handleDelete="handleDelete"
      @handleFull="handleFull"
      :row-data="rowData"
      detailsType="drawer"
    >
    </content-details>
  </el-drawer>
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
  }
})

const emit = defineEmits(['update:modelValue', 'handleCopyHide', 'handleCopy', 'handleDelete'])
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
  background: #f3f2f1;
}
</style>
