<template>
  <el-card class="card-container">
    <template #header>
          <span style="display: block">
            <el-tooltip placement="top" effect="dark">
                 <template #content>
                   <span>类型：{{ rowData.desType }} </span>
                   <br/>
                   <span>创建：{{ rowData.create_time }} </span>
                   <br/>
                   <span>更新：{{ rowData.update_time }} </span>
                   <br/>
                   <span v-if="rowData.remarks">备注： {{ rowData.remarks }}</span>
                 </template>
                 <el-button @click="handleCopy" round :icon="CopyDocument" size="small"></el-button>
            </el-tooltip>
            <el-button v-if="rowData.collect === 'y'" @click="handleCollect" round :icon="Star" type="warning"
                       size="small"></el-button>
            <el-button v-else @click="handleCollect" round :icon="Star" type="default"
                       size="small"></el-button>
            <el-button @click="handleRemarks" round :icon="Edit" size="small"></el-button>
            <el-button @click="handleDelete" round :icon="Delete" size="small"></el-button>
            <el-button @click="handleFull" round :icon="FullScreen" size="small"></el-button>
          </span>
    </template>
    <el-container>
      <el-container class="content-container">
        <el-scrollbar>
          <el-container>
            <div v-if="rowData.type === 'text'">
              <highlightjs v-if="rowData.size < 10240" autodetect :code="rowData.content"/>
              <span v-else> {{ rowData.content }}</span>
            </div>
            <div v-if="rowData.type === 'image'">
              <img :src="rowData.content" alt=""/>
            </div>
            <div v-if="rowData.type === 'file'">
              <ul>
                <li style="white-space:nowrap;" v-for="item in rowData.fileContentArray" :key="item"> {{ item }}</li>
              </ul>
            </div>
          </el-container>
        </el-scrollbar>
      </el-container>
    </el-container>
    <el-dialog
      v-model="showRemarks"
      title="编辑备注"
      width="80%"
    >
      <span>
        <el-input v-model="remarksData"></el-input>
      </span>
      <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleUpdateRemarks">
          确定
        </el-button>
      </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { defineEmits, defineProps, onMounted, ref } from 'vue'
import { CopyDocument, Delete, FullScreen, Edit, Star } from '@element-plus/icons-vue'
import { ipcRenderer } from 'electron'

const contentHeight = ref('100px')

const props = defineProps({
  rowData: {
    type: Object,
    required: true
  },
  detailsType: {
    type: String,
    required: true
  }
})

const cardHeight = ref('100%')

const emit = defineEmits(['handleCopy', 'handleDelete', 'update:rowData'])

const remarksData = ref('')

const showRemarks = ref(false)

const handleCopy = () => {
  emit('handleCopy', props.rowData)
}

const handleDelete = () => {
  emit('handleDelete', props.rowData)
}

const handleFull = () => {
  emit('handleFull')
}

const handleRemarks = () => {
  showRemarks.value = !showRemarks.value
  remarksData.value = props.rowData.remarks
}

const handleUpdateRemarks = () => {
  showRemarks.value = !showRemarks.value
  const row = props.rowData
  row.remarks = remarksData.value
  emit('update:rowData', row)
  ipcRenderer.send('message-from-renderer', 'updateRemarks', {
    id: props.rowData.id,
    remarks: remarksData.value
  })
}

const handleCollect = () => {
  const row = props.rowData
  if (row.collect === 'y') {
    row.collect = 'n'
  } else {
    row.collect = 'y'
  }
  emit('update:rowData', row)
  ipcRenderer.send('message-from-renderer', 'updateCollect', {
    id: row.id,
    collect: row.collect
  })
}

const handleResize = () => {
  if (props.detailsType === 'main') {
    cardHeight.value = (window.innerHeight - 455) + 'px'
    contentHeight.value = (window.innerHeight - 555) + 'px'
  } else {
    contentHeight.value = (window.innerHeight - 100) + 'px'
  }
}

handleResize()

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

</script>

<style scoped lang="scss">
.card-container {
  width: 100%;
  height: v-bind(cardHeight);

  .content-container {
    max-height: v-bind(contentHeight);
    width: 100%;
  }
}

</style>
