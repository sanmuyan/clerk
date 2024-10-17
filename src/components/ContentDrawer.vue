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
      @dblclick="handleCopyHide(rowData)"
      @close="closed()"
    >
      <content-details
        detailsType="drawer"
      >
      </content-details>
    </el-drawer>
  </div>
</template>

<script setup>
import { defineModel, inject } from 'vue'
import ContentDetails from '@/components/ContentDetails.vue'

const modelValue = defineModel({ required: true })
const rowData = inject('nowRowData')
const handleCopyHide = inject('handleCopyHide')

const closed = () => {
  modelValue.value = false
}

</script>

<style lang="scss" scoped>
.drawer-container {
  :deep .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
}
</style>
