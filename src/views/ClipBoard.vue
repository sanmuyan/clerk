<template>
  <div class="clipboard-container">
    <div class="drag-container">
      <el-tag class="ml-2" type="success">当前 {{ nowCount }}</el-tag>
      <el-tag class="ml-2" type="success">页数 {{ pageNumber }}</el-tag>
      <el-tag class="ml-2" type="success">总数 {{ totalCount }}</el-tag>
    </div>
    <div class="search-box">
      <el-input
        v-model="inputQuery"
        placeholder="搜索"
        @input="handelInputChange()"
      >
        <template #append>
          <el-select v-model="typeSelect" style="width: 80px">
            <el-option
              v-for="item in typeSelectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </template>
      </el-input>
    </div>
    <div>
      <el-card body-style="padding: 0;" class="card-container">
        <el-table
          :height="tableHeight"
          :show-header="false"
          :data="tableData"
          @cell-mouse-enter="handelMouseEnter"
          @cell-mouse-leave="handelMouseLeave"
          @row-dblclick="handleCopyHide"
          highlight-current-row
          ref="xClipBoardTableData"
          @current-change="handleCurrentChange"
          :row-class-name="tableRowClassName"
        >
          <el-table-column prop="content" label="剪切板" :width="contentWidth" :show-overflow-tooltip=false>
            <template #default="{ row }">
              <div>
                <div v-if="row.type === 'image'" class="image-container">
                  <img :src="row.content" alt="" :width="row.width" :height="row.height"/>
                </div>
                <div v-if="row.type === 'text'" class="text-container">
                  {{ row.content }}
                </div>
                <div v-if="row.type === 'file'" class="text-container">
                  {{ row.fileContent }}
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    <div>
      <content-drawer
        v-model="showDrawer"
        :rowData="nowRowData"
        @handleCopyHide="handleCopyHide"
        @handleCopy="handleCopy"
        @handleDelete="handleDelete"
      ></content-drawer>
    </div>
    <div class="content-details">
      <content-details
        @handleCopy="handleCopy"
        @handleDelete="handleDelete"
        :rowData="nowRowData"
        detailsType="main"
      >
      </content-details>
    </div>
  </div>
</template>

<script setup>
import { ipcRenderer } from 'electron'
import { getCurrentInstance, onMounted, ref, watch } from 'vue'
import { deleteData, initDB, listData, queryData } from '@/plugins/sqlite'
import ContentDrawer from '@/components/ContentDrawer.vue'
import ContentDetails from '@/components/ContentDetails.vue'

const tableData = ref([])
const inputQuery = ref('')
const contentWidth = ref()
const pageNumber = ref(1)
const pageSize = ref(10)
const tableHeight = ref(400)
const totalCount = ref(0)
const showDrawer = ref(false)
const nowRowData = ref({})
const proxyRef = ref(null)
const nowCount = ref(0)
const disableWheel = ref(false)
const isEnterControl = ref(false)
const config = ref({})
const typeSelect = ref('all')

ipcRenderer.send('message-from-renderer', 'init')

// 选择器
const typeSelectOptions = ref([
  {
    label: '全部',
    value: 'all'
  },
  {
    label: '文本',
    value: 'text'
  },
  {
    label: '文件',
    value: 'file'
  },
  {
    label: '图片',
    value: 'image'
  },
  {
    label: '收藏',
    value: 'collect'
  }
])

// 监听窗口变化
const handleResize = () => {
  if (window.innerWidth < 65) {
    return
  }
  contentWidth.value = window.innerWidth - 2
}
handleResize()

const handelSetCurrent = (row) => {
  if (tableData.value.length > 0 && proxyRef.value.$refs.xClipBoardTableData && row) {
    proxyRef.value.$refs.xClipBoardTableData.setCurrentRow(row)
  }
}

// 获取数据
const handelTableData = (data, action) => {
  totalCount.value = data.count
  data.data.forEach(item => {
    item.time = new Date(item.timestamp * 1000).toLocaleString('zh-CN', { hour12: false })
    const typeMap = {
      image: '图片',
      text: '文本',
      file: '文件'
    }
    item.width = contentWidth.value
    item.height = 23
    item.desType = typeMap[item.type]
    tableData.value.push(item)
    if (item.type === 'image') {
      const img = new Image()
      img.src = item.content
      item.width = img.width
      img.onload = () => {
        if (img.height > 23) {
          item.width = Math.floor(img.width / (img.height / 23))
        }
        if (img.height < 23) {
          item.width = Math.floor(img.width * (23 / img.height))
        }
      }
    }
    if (item.type === 'file') {
      item.fileContentTable = []
      item.fileContent = item.content.replace(/\[/g, '').replace(/]/g, '').replace(/"/g, '').replace(/,/g, ' ')
      item.fileContentArray = JSON.parse(item.content)
    }
  })
  // 默认选中第一行
  if (tableData.value.length > 0) {
    if (action === 'pre') {
      nowRowData.value = tableData.value[tableData.value.length - 1]
      handelSetCurrent(nowRowData.value)
    } else {
      nowRowData.value = tableData.value[0]
      handelSetCurrent(nowRowData.value)
    }
  }
  nowCount.value = tableData.value.length
}
const getTableData = (action) => {
  switch (action) {
    case 'reset':
      tableData.value = []
      pageNumber.value = 1
      break
    case 'next':
      tableData.value = []
      break
    case 'pre':
      tableData.value = []
      break
  }

  if (inputQuery.value) {
    queryData(pageNumber.value, pageSize.value, inputQuery.value, typeSelect.value).then(res => {
      handelTableData(res)
    })
    return
  }
  listData(pageNumber.value, pageSize.value, typeSelect.value).then(res => {
    handelTableData(res, action)
  })
}

// 删除数据
const handleDeleteRow = (row) => {
  tableData.value = tableData.value.filter(item => item.id !== row.id)
  getTableData('reset')
  nowRowData.value = tableData.value[0]
}
const handleDelete = (row) => {
  deleteData(row.id).then(() => {
    handleDeleteRow(row)
  })
}

// 处理拷贝
const handleCopy = (row) => {
  ipcRenderer.send('message-from-renderer', 'write', row.content, row.type)
}

const handleCopyHide = (row) => {
  handleCopy(row)
  if (config.value.user_config.copy_hide) {
    ipcRenderer.send('message-from-renderer', 'hide', 'triggerPaste')
  }
}

// 查询框变化
const handelInputChange = () => {
  getTableData('reset')
}

// 处理显示详情
const handleShowDrawer = () => {
  showDrawer.value = !showDrawer.value
  disableWheel.value = showDrawer.value
}

// 鼠标进入事件
const handelMouseEnter = (row) => {
  disableWheel.value = false
  if (!isEnterControl.value) {
    return
  }
  if (nowRowData.value.id !== row.id) {
    nowRowData.value = row
  }
}
const handelMouseLeave = (row) => {
  disableWheel.value = true
}

// 获取下一页数据
const handleNextPageData = () => {
  if (pageNumber.value * pageSize.value + pageSize.value < totalCount.value + pageSize.value) {
    pageNumber.value += 1
    getTableData('next')
  }
}

// 获取上一页数据
const handlePrePageData = () => {
  if (pageNumber.value > 1) {
    pageNumber.value -= 1
    getTableData('pre')
  }
}

// 滚轮事件
const handelWheel = (event) => {
  if (showDrawer.value || disableWheel.value) {
    return
  }
  if (!handleEventLimit(event)) {
    return
  }
  event.wheelDelta > 0 ? handlePrePageData() : handleNextPageData()
}

// 选中变化事件
const handleCurrentChange = (currentRow, oldCurrentRow) => {
  currentRow ? nowRowData.value = currentRow : nowRowData.value = {}
}

// 事件限制

let lastEventTimeStamp = 0
const handleEventLimit = (event) => {
  if (lastEventTimeStamp === 0) {
    lastEventTimeStamp = event.timeStamp
  } else {
    if (event.timeStamp - lastEventTimeStamp > 200) {
      lastEventTimeStamp = 0
      return true
    }
  }
  return false
}

let downKeyEventCount = 0
const handleDownKeyLimit = (event, type) => {
  if (type === 'keyDown') {
    if (downKeyEventCount < 2) {
      downKeyEventCount += 1
    } else {
      if (handleEventLimit(event)) {
        return true
      }
    }
  } else {
    downKeyEventCount = 0
    return true
  }
  return false
}

// 键盘下箭头处理
const handleArrowDown = (event, type) => {
  if (!handleDownKeyLimit(event, type)) {
    return
  }
  const currentIndex = tableData.value.findIndex(obj => obj.id === nowRowData.value.id)
  if (currentIndex === tableData.value.length - 1) {
    handleNextPageData()
    return
  }
  const nextObj = tableData.value[currentIndex + 1]
  handelSetCurrent(nextObj)
}

// 键盘上箭头处理
const handleArrowUp = (event, type) => {
  if (!handleDownKeyLimit(event, type)) {
    return
  }
  const currentIndex = tableData.value.findIndex(obj => obj.id === nowRowData.value.id)
  if (currentIndex === 0) {
    handlePrePageData()
    return
  }
  const nextObj = tableData.value[currentIndex - 1]
  handelSetCurrent(nextObj)
}

const tableRowClassName = (row, rowIndex) => {
  if (row.row.collect === 'y') {
    return 'warning-row'
  }
  return ''
}

// 处理 ctrl 键
const handelControl = (event) => {
  event.ctrlKey ? isEnterControl.value = true : isEnterControl.value = false
}

// 处理 page 键
const handlePageKey = (event, type) => {
  if (showDrawer.value) {
    return
  }
  if (!handleDownKeyLimit(event, type)) {
    return
  }
  event.key === 'PageUp' ? handlePrePageData() : handleNextPageData()
}

// 处理鼠标右键
const handelContextmenu = (event) => {
  handleShowDrawer()
}

// 监听区域 start

// watch 事件
watch(() => typeSelect.value,
  (val) => {
    if (val) {
      getTableData('reset')
    }
  }
)

// 键盘按下事件
const handelKeyup = (event) => {
  console.log('key up event: ', event.key)
  switch (event.key) {
    case 'c':
      if (isEnterControl.value) {
        handleCopy(nowRowData.value)
      }
      break
    case 'ArrowDown':
      handleArrowDown(event)
      break
    case 'ArrowUp':
      handleArrowUp(event)
      break
    case 'Enter':
      handleCopyHide(nowRowData.value)
      break
    case 'Delete':
      handleDelete(nowRowData.value)
      break
    case 'Control':
      handelControl(event)
      break
    case 'PageDown':
      handlePageKey(event)
      break
    case 'PageUp':
      handlePageKey(event)
      break
  }
}

const handelKeydown = (event) => {
  console.log('key down event: ', event.key)
  switch (event.key) {
    case 'Control':
      handelControl(event)
      break
    case 'PageDown':
      handlePageKey(event, 'keyDown')
      break
    case 'PageUp':
      handlePageKey(event, 'keyDown')
      break
    case 'ArrowDown':
      handleArrowDown(event, 'keyDown')
      break
    case 'ArrowUp':
      handleArrowUp(event, 'keyDown')
      break
  }
}

// 监听各类事件
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // window.addEventListener('scroll', handelScroll)
  window.addEventListener('wheel', handelWheel)
  window.addEventListener('keyup', handelKeyup)
  window.addEventListener('keydown', handelKeydown)
  window.addEventListener('contextmenu', handelContextmenu)
  proxyRef.value = getCurrentInstance().proxy
})

// 监听主进程消息
ipcRenderer.on('message-from-main', (event, arg, data) => {
  console.log('message-from-main: ', arg, data)
  switch (arg) {
    case 'newClipboard':
      getTableData('reset')
      break
    case 'reset':
      inputQuery.value = null
      getTableData('reset')
      break
    case 'init':
      config.value = data
      pageSize.value = config.value.user_config.page_size
      tableHeight.value = pageSize.value * 40
      initDB(data).then(() => {
        ipcRenderer.send('message-from-renderer', 'initReady')
        getTableData()
      })
      break
  }
})

// 监听区域 end

</script>

<style lang="scss" scoped>
.clipboard-container {
  .drag-container {
    -webkit-app-region: drag;
    width: 100%;
    height: 25px;
  }

  .search-box {
    width: 100%;
  }

  .card-container {
    .el-table :deep {
      .el-table__cell {
        padding: 8px;
      }
    }

    .text-container {
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .image-container {
      height: 23px;
    }
  }

  .content-details {
    .el-card :deep {
      border: 0;
    }
  }
}
</style>
