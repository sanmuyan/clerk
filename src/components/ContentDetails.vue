<template>
  <el-card class="card-container">
    <template #header>
          <span>
            {{ rowData.desType }} {{ rowData.time }}
            <el-button @click="handleCopy" round :icon="CopyDocument" size="small"></el-button>
            <el-button v-if="rowData.collect === 'y'" @click="handleCollect" round :icon="Star" type="warning" size="small"></el-button>
            <el-button v-if="rowData.collect !== 'y'" @click="handleCollect" round :icon="Star" type="default" size="small"></el-button>
            <el-button @click="handleDelete" round :icon="Delete" size="small"></el-button>
          </span>
    </template>
    <el-container>
      <el-container class="content-container">
        <el-scrollbar>
          <el-container>
            <div v-if="rowData.type === 'text'" v-highlight>
              <pre>
                <code>{{ rowData.content }}</code>
              </pre>
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
  </el-card>
</template>

<script setup>
import { defineEmits, defineProps, onMounted, ref } from 'vue'
import { CopyDocument, Delete, Star } from '@element-plus/icons-vue'
import { updateCollect } from '@/plugins/sqlite'

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

const handleCopy = () => {
  emit('handleCopy', props.rowData)
}

const handleDelete = () => {
  emit('handleDelete', props.rowData)
}

const handleCollect = () => {
  const row = props.rowData
  if (props.rowData.collect === 'y') {
    row.collect = 'n'
    updateCollect(props.rowData.id, 'n')
  } else {
    row.collect = 'y'
    updateCollect(props.rowData.id, 'y')
  }
  emit('update:rowData', row)
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
