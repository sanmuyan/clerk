<template>
  <el-card class="card-container" shadow="never">
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
                 <el-button @click="handleCopy(rowData)" round :icon="CopyDocument" size="small"></el-button>
            </el-tooltip>
            <el-button v-if="rowData.collect === 'y'" @click="handleCollect" round :icon="Star" type="warning"
                       size="small"></el-button>
            <el-button v-else @click="handleCollect" round :icon="Star" type="default"
                       size="small"></el-button>
            <el-popover title="编辑备注" :visible="showRemarks" trigger="click" placement="top" width="50%">
              <div style="margin-top: 10px;">
                <el-input v-model="remarksData" size="small"></el-input>
              </div>
              <div style="margin-top: 15px; text-align: left">
                <el-button size="small" type="primary" @click="handleUpdateRemarks">确定</el-button>
                <el-button size="small" type="info" @click="handleRemarks">取消</el-button>
              </div>
              <template #reference>
                  <el-button @click="handleRemarks" round :icon="Edit" size="small"></el-button>
              </template>
            </el-popover>
            <el-popconfirm v-if="rowData.collect === 'y'" title="确定删除" @confirm="handleDeleteCollect">
              <template #reference>
                <el-button round :icon="Delete" size="small"></el-button>
              </template>
            </el-popconfirm>
            <el-button v-else @click="handleDelete(rowData)" round :icon="Delete" size="small"></el-button>
            <el-button @click="handleFull()" round :icon="FullScreen" size="small"></el-button>
          </span>
    </template>
    <el-container @mouseenter="handleMouseEnterContent" @mouseleave="handleMouseLeaveContent">
      <el-scrollbar>
        <el-container :style="{maxHeight: contentHeight}">
          <div v-if="rowData.type === 'text'">
            <highlightjs class="hl-pre" v-if="rowData.size < 10240" autodetect :code="rowData.content"/>
            <span v-else> {{ rowData.content }}</span>
          </div>
          <div v-if="rowData.type === 'image'">
            <img :src="rowData.content" alt=""/>
          </div>
          <div v-if="rowData.type === 'file'">
            <ul class="file-ul">
              <li style="white-space:nowrap;" v-for="item in rowData.fileContentArray" :key="item"> {{ item }}</li>
            </ul>
          </div>
        </el-container>
      </el-scrollbar>
    </el-container>
  </el-card>
</template>

<script setup>
import { defineModel, inject, onMounted, ref, watch } from 'vue'
import { CopyDocument, Delete, Edit, FullScreen, Star } from '@element-plus/icons-vue'
import { ipcRenderer } from 'electron'

const detailsType = defineModel('detailsType', { required: true })

const config = inject('config')
const rowData = ref(inject('nowRowData'))
const handleCopy = inject('handleCopy')
const handleDelete = inject('handleDelete')
const handleFull = inject('handleFull')
const isMouseInContent = inject('isMouseInContent')

const contentHeight = ref('200px')

const remarksData = ref('')

const showRemarks = ref(false)

const handleRemarks = () => {
  showRemarks.value = !showRemarks.value
  remarksData.value = rowData.value.remarks
}

const handleUpdateRemarks = () => {
  showRemarks.value = !showRemarks.value
  rowData.value.remarks = remarksData.value
  ipcRenderer.send('message-from-renderer', 'updateRemarks', {
    id: rowData.value.id,
    remarks: remarksData.value
  })
}

const handleDeleteCollect = () => {
  handleCollect()
  handleDelete(rowData.value)
}

const handleCollect = () => {
  if (rowData.value.collect === 'y') {
    rowData.value.collect = 'n'
  } else {
    rowData.value.collect = 'y'
  }
  ipcRenderer.send('message-from-renderer', 'updateCollect', {
    id: rowData.value.id,
    collect: rowData.value.collect
  })
}

const handleResize = () => {
  if (config.value.user_config && detailsType.value === 'main') {
    const tableHeight = 40 * config.value.user_config.page_size // 数据条目长度
    const otherHeight = 25 + 30 + 62 + 20 + 20 // 窗口头部=25 搜索框=30 内容头部=62 内容上间距=20
    if ((window.innerHeight - (tableHeight + otherHeight)) > 100) {
      contentHeight.value = (window.innerHeight - (tableHeight + otherHeight)) + 'px'
    }
  } else {
    if (window.innerHeight > 200) {
      contentHeight.value = (window.innerHeight - 62 - 20 - 20) + 'px'
    }
  }
}

handleResize()

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

watch(() => config.value, (val) => {
  if (val) {
    handleResize()
  }
})

const handleMouseEnterContent = () => {
  isMouseInContent.value = true
}

const handleMouseLeaveContent = () => {
  isMouseInContent.value = false
}

</script>

<style scoped lang="scss">
.card-container {
  border: none;
  .hl-pre {
    margin: 0;
  }
  .file-ul {
    margin-block-start: 0;
  }
}

</style>
