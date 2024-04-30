<template>
  <div class="drawer-container">
    <el-drawer
      :with-header="true"
      :model-value="modelValue"
      destroy-on-close
      :lock-scroll="false"
      direction="rtl"
      :show-close="false"
      size="100%"
      @open="handleOpen"
      title="设置"
    >
      <div class="app-set-container">
        <div class="app-set-switch">
          <div class="app-set-switch-item">
            <el-checkbox v-model="setConfig.user_config.enable_text">文本</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_image">图片</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_file">文件</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.hide_paste">自动粘贴</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_win_tools">系统工具</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.blur_hide">失焦最小化</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.copy_hide">复制最小化</el-checkbox>
          </div>
          <div class="app-set-switch-item">
            <el-checkbox v-model="setConfig.user_config.reset_query_data">重置搜索</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.reset_type_select">重置分类</el-checkbox>
          </div>
        </div>
        <div class="app-set-input">
          <div class="app-set-input-des">
            <div>监听间隔：</div>
            <div>显示数量：</div>
            <div>保留条数：</div>
            <div>保留时间：</div>
            <div>系统工具端口：</div>
            <div>快捷键：</div>
            <div>数据库文件：</div>
            <div>重置数据：</div>
          </div>
          <div class="app-set-input-item">
            <el-input v-model.number="setConfig.user_config.watch_interval" type="number" style="width: 100px">
              <template #suffix>ms</template>
            </el-input>
            <el-input v-model.number="setConfig.user_config.page_size" type="number" style="width: 100px"></el-input>
            <el-input v-model.number="setConfig.user_config.max_number" type="number" style="width: 100px"></el-input>
            <el-input v-model.number="setConfig.user_config.max_time" type="number" style="width: 100px">
              <template #suffix>s</template>
            </el-input>
            <el-input v-model.number="setConfig.user_config.win_tools_port" type="number"
                      style="width: 100px"></el-input>
            <el-input v-model="setConfig.user_config.shortcut_keys" type="text" style="width: 100px"></el-input>
            <el-input v-model="setConfig.user_config.db_file" type="text" style="width: 100px"></el-input>
            <el-popconfirm title="将会删除所有数据" @confirm="handleRestData">
              <template #reference>
                <el-button type="warning">重置</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <div class="app-set-button">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleApplySet">应用</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script setup>
import { defineEmits, defineProps, ref, watch } from 'vue'
import { ipcRenderer } from 'electron'
import { verificationConfig } from '@/utils/config'

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'handleApplySet'])

const setConfig = ref(JSON.parse(JSON.stringify(props.config)))

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleOpen = () => {
  setConfig.value = JSON.parse(JSON.stringify(props.config))
}
const handleApplySet = () => {
  handleClose()
  emit('handleApplySet', verificationConfig(setConfig.value))
}

const handleRestData = () => {
  ipcRenderer.send('message-from-renderer', 'resetData')
}

watch(() => props.config, (val) => {
  if (val) {
    setConfig.value = JSON.parse(JSON.stringify(val))
  }
})

</script>
<style scoped lang="scss">
.drawer-container {
  :deep .el-drawer__body {
    padding: 0;
  }

  .app-set-container {
    margin-left: 10px;

    .app-set-switch {
      display: grid;
      grid-template-columns: 1fr 1fr;
      .app-set-switch-item {
        margin-left: 20px;
        display: flex;
        flex-direction: column;
        grid-gap: 5px;
      }
    }

    .app-set-input {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(100, 100px);
      grid-gap: 10px;

      .app-set-input-des {
        font-size: 14px;
        text-align: right;
        display: flex;
        flex-direction: column;
        grid-gap: 10px;

        div {
          margin-top: 2px;
          margin-bottom: 2px;
        }
      }

      .app-set-input-item {
        .el-input :deep .el-input__inner {
          --el-input-inner-height: 21px;
        }

        :deep .el-input__suffix-inner {
          height: 21px;
        }

        .el-button :deep {
          height: 21px;
        }

        text-align: left;
        display: flex;
        flex-direction: column;
        grid-gap: 10px;
      }
    }

    .app-set-button {
      margin-top: 30px;
      margin-right: 20px;
      text-align: right;
    }
  }
}
</style>
