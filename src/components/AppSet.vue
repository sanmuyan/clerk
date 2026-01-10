<template>
  <div class="drawer-container">
    <el-drawer
      :with-header="true"
      v-model="modelValue"
      destroy-on-close
      :lock-scroll="false"
      direction="rtl"
      :show-close="false"
      size="100%"
      @open="handleOpen"
      title="设置"
    >
      <el-scrollbar>
        <div class="app-set-container">
          <div class="app-set-switch-container">
            <div
              class="app-set-switch-container-item"
              v-for="item in appSetSwitchItems"
              :key="item.label"
            >
              <el-checkbox v-model="setConfig.user_config[item.key]">{{item.label}}</el-checkbox>
            </div>
          </div>
          <div class="app-set-button-container">
            <el-button @click="showClearHistory = true" type="primary">清理数据</el-button>
          </div>
          <div class="app-set-input-container">
            <div class="app-set-input-container-item"
                 v-for="item in appSetInputItems"
                 :key="item.label"
            >
              <span class="app-set-input-container-des">{{ item.label }}</span>
              <el-input
                class="app-set-input-container-input"
                v-if="item.inputType === 'number'"
                :readonly="item.readonly"
                @click="item.inputClick"
                v-model.number="setConfig.user_config[item.key]"
                :type=item.inputType>
                <template #suffix>{{item.inputSuffix}}</template>
              </el-input>
              <el-input
                class="app-set-input-container-input"
                v-else
                :show-password="item.inputType === 'password'"
                :readonly="item.readonly"
                @click="item.inputClick"
                v-model="setConfig.user_config[item.key]"
                :type=item.inputType>
                <template #suffix>{{item.inputSuffix}}</template>
              </el-input>
            </div>
          </div>
          <div class="app-set-main-button">
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleApplySet">应用</el-button>
          </div>
          <div style="margin-top: 25px"></div>
        </div>
      </el-scrollbar>
      <el-dialog
        v-model="showClearHistory"
        title="清理数据"
        width="80%"
        :show-close="false"
      >
        <div class="app-set-clear-container">
          <div class="app-set-clear-container-switch-item">
            <el-checkbox v-model="isClearText">文本</el-checkbox>
            <el-checkbox v-model="isClearImage">图片</el-checkbox>
            <el-checkbox v-model="isClearFile">文件</el-checkbox>
          </div>
          <div class="app-set-clear-container-time-option">
            <div class="app-set-clear-container-time-option-item">
              <el-date-picker
                v-model="clearBeforeTime"
                placeholder="清理之前的数据"
                :disabled="isDisableBeforeTime"
                type="datetime">
              </el-date-picker>
            </div>
            <div class="app-set-clear-container-time-option-item">
              <el-date-picker
                v-model="clearAfterTime"
                placeholder="清理之后的数据"
                :disabled="isDisableAfterTime"
                type="datetime">
              </el-date-picker>
            </div>
          </div>
          <div class="app-set-clear-container-button-item">
            <el-button @click="handleCloseClearHistory" type="primary">取消</el-button>
            <el-popconfirm title="将会删除所选数据" @confirm="handleClearHistoryData">
              <template #reference>
                <el-button :disabled="isDisableClearButton" type="warning">清理</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-dialog>
      <el-dialog
        v-model="showShortcutKeys"
        title="设置快捷键"
        width="80%"
        :show-close="false"
        @close="handleCloseShortcutKeysListen"
      >
        <div class="app-set-shortcut-keys-container">
          <span>{{ shortcutKeysListen }}</span>
          <div class="app-set-shortcut-keys-container-button-item">
            <el-button @click="handleCloseShortcutKeysListen">取消</el-button>
            <el-button type="primary" @click="handleApplyShortcutKeysListen">确定</el-button>
          </div>
        </div>
      </el-dialog>
      <el-dialog
        v-model="showSetDbFile"
        title="设置数据文件"
        width="80%"
        :show-close="false"
      >
        <div class="app-set-shortcut-keys-container">
          <span>
            <input accept=".db" ref="openDbFileRef" type="file">
          </span>
          <div class="app-set-shortcut-keys-container-button-item">
            <el-button @click="handleCloseSetDbFile">取消</el-button>
            <el-button type="primary" @click="handleApplySetDbFile">确定</el-button>
          </div>
        </div>
      </el-dialog>
    </el-drawer>
  </div>
</template>
<script setup>
import { defineEmits, defineModel, inject, onMounted, ref, watch } from 'vue'
import { ipcRenderer } from 'electron'
import { handleDownShortcutKeys, handleUpShortcutKeys } from '@/utils/shortcut-keys'

const config = ref(inject('config'))

const modelValue = defineModel({ required: true })

const showClearHistory = ref(false)
const isClearText = ref(false)
const isClearImage = ref(false)
const isClearFile = ref(false)
const isDisableClearButton = ref(true)
const clearBeforeTime = ref(null)
const clearAfterTime = ref(null)
const isDisableBeforeTime = ref(false)
const isDisableAfterTime = ref(false)
const showShortcutKeys = ref(false)
const shortcutKeysListenTemp = ref([])
const shortcutKeysListen = ref('请输入快捷键')
const showSetDbFile = ref(false)
const setDbFile = ref(null)
const openDbFileRef = ref(null)

const emit = defineEmits(['handleApplySet'])

const setConfig = ref(JSON.parse(JSON.stringify(config.value)))

const handleClickShortcutKeys = () => {
  ipcRenderer.send('message-from-renderer', 'setGlobalShortcut')
  showShortcutKeys.value = true
}

const handleCloseShortcutKeysListen = () => {
  ipcRenderer.send('message-from-renderer', 'setGlobalShortcut', setConfig.value.user_config.shortcut_keys)
  showShortcutKeys.value = false
  shortcutKeysListenTemp.value = []
  shortcutKeysListen.value = '请输入快捷键'
}

const handleApplyShortcutKeysListen = () => {
  if (shortcutKeysListen.value !== '请输入快捷键') {
    setConfig.value.user_config.shortcut_keys = shortcutKeysListen.value
  }
  handleCloseShortcutKeysListen()
}

const handleClickSetDbFile = () => {
  showSetDbFile.value = true
}

const handleCloseSetDbFile = () => {
  showSetDbFile.value = false
  setDbFile.value = null
  openDbFileRef.value = null
}

const handleApplySetDbFile = () => {
  if (openDbFileRef.value.files.length > 0) {
    setConfig.value.user_config.db_file = openDbFileRef.value.files[0].path.replace(/\\/g, '/')
  }
  openDbFileRef.value.value = null
  showSetDbFile.value = false
  setDbFile.value = null
}

const handleClose = () => {
  modelValue.value = false
}

const handleOpen = () => {
  setConfig.value = JSON.parse(JSON.stringify(config.value))
}
const handleApplySet = () => {
  emit('handleApplySet', setConfig.value)
  handleClose()
}

const handleClearHistoryData = () => {
  ipcRenderer.send('message-from-renderer', 'clearHistoryData', {
    isClearText: isClearText.value,
    isClearImage: isClearImage.value,
    isClearFile: isClearFile.value,
    clearBeforeTime: clearBeforeTime.value ? new Date(clearBeforeTime.value).getTime() / 1000 : null,
    clearAfterTime: clearAfterTime.value ? new Date(clearAfterTime.value).getTime() / 1000 : null
  })
}

const handleCloseClearHistory = () => {
  showClearHistory.value = false
  clearBeforeTime.value = null
  clearAfterTime.value = null
  isClearText.value = false
  isClearImage.value = false
  isClearFile.value = false
}

watch(() => config.value, (val) => {
  if (val) {
    setConfig.value = JSON.parse(JSON.stringify(val))
  }
})

watch(() => isClearText.value, (val) => {
  if (val) {
    isDisableClearButton.value = false
  } else {
    isDisableClearButton.value = !(isClearFile.value || isClearImage.value)
  }
})

watch(() => isClearImage.value, (val) => {
  if (val) {
    isDisableClearButton.value = false
  } else {
    isDisableClearButton.value = !(isClearFile.value || isClearText.value)
  }
})

watch(() => isClearFile.value, (val) => {
  if (val) {
    isDisableClearButton.value = false
  } else {
    isDisableClearButton.value = !(isClearText.value || isClearImage.value)
  }
})

watch(() => clearAfterTime.value, (val) => {
  isDisableBeforeTime.value = clearAfterTime.value !== null
})

watch(() => clearBeforeTime.value, (val) => {
  isDisableAfterTime.value = clearBeforeTime.value !== null
})

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (showShortcutKeys.value) {
      const result = handleDownShortcutKeys(shortcutKeysListenTemp.value, shortcutKeysListen.value, e)
      shortcutKeysListenTemp.value = result.shortcutKeysListenTemp
      shortcutKeysListen.value = result.shortcutKeysListen
    }
  })
  window.addEventListener('keyup', (e) => {
    if (showShortcutKeys.value) {
      const result = handleUpShortcutKeys(shortcutKeysListenTemp.value, shortcutKeysListen.value, e)
      shortcutKeysListenTemp.value = result.shortcutKeysListenTemp
      shortcutKeysListen.value = result.shortcutKeysListen
    }
  })
})

const appSetInputItems = ref([
  {
    label: '监听间隔',
    inputType: 'number',
    inputSuffix: 'ms',
    key: 'watch_interval'
  },
  {
    label: '显示数量',
    inputType: 'number',
    key: 'page_size'
  },
  {
    label: '保留条数',
    inputType: 'number',
    key: 'max_number'
  },
  {
    label: '保留时间',
    inputType: 'number',
    inputSuffix: 's',
    key: 'max_time'
  },
  {
    label: '清空剪切板',
    inputType: 'number',
    inputSuffix: 's',
    key: 'clipboard_clear_time'
  },
  {
    label: '系统工具端口',
    inputType: 'number',
    key: 'win_tools_port'
  },
  {
    label: '接口端口',
    inputType: 'number',
    key: 'server_port'
  },
  {
    label: '接口口令',
    inputType: 'password',
    key: 'server_token'
  },
  {
    label: '快捷键',
    inputType: 'text',
    inputClick: handleClickShortcutKeys,
    readonly: true,
    key: 'shortcut_keys'
  },
  {
    label: '数据库文件',
    inputType: 'text',
    inputClick: handleClickSetDbFile,
    readonly: true,
    key: 'db_file'
  }
])

const appSetSwitchItems = ref([
  {
    label: '文本',
    key: 'enable_text'
  },
  {
    label: '图片',
    key: 'enable_image'
  },
  {
    label: '文件',
    key: 'enable_file'
  },
  {
    label: '自动粘贴',
    key: 'hide_paste'
  },
  {
    label: '系统工具',
    key: 'enable_win_tools'
  },
  {
    label: '接口服务',
    key: 'enable_server'
  },
  {
    label: '失焦最小化',
    key: 'blur_hide'
  },
  {
    label: '复制最小化',
    key: 'copy_hide'
  },
  {
    label: '重置搜索',
    key: 'reset_query_data'
  },
  {
    label: '重置分类',
    key: 'reset_type_select'
  },
  {
    label: '更新后刷新',
    key: 'reset_list_post_update'
  },
  {
    label: '重置窗口',
    key: 'reset_win_size'
  }
])
</script>
<style scoped lang="scss">
.drawer-container {
  :deep .el-drawer__body {
    padding: 0;
  }

  .app-set-container {
    margin-left: 10px;

    .app-set-switch-container {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .app-set-switch-container-item {
        margin-left: 20px;
        display: flex;
        flex-direction: column;
        grid-gap: 5px;
      }
    }

    .app-set-button-container {
      margin-top: 15px;
      margin-left: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;

      .el-button :deep {
        height: 21px;
        width: 40%;
      }
    }

    .app-set-input-container {
      margin-top: 15px;

      .app-set-input-container-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .app-set-input-container-des {
          font-size: 14px;
          width: 80px;
          text-align: right;
          margin-right: 20px;
          white-space: nowrap;
        }
        .app-set-input-container-input {
          height: 25px;
          width: 150px;
        }
      }
    }

    .app-set-main-button {
      margin-top: 30px;
      margin-bottom: 30px;
      margin-right: 15px;
      text-align: right;
    }
  }

  .app-set-clear-container {
    .app-set-clear-container-switch-item {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-gap: 10px;
    }

    .app-set-clear-container-time-option {
      margin-top: 25px;
      display: flex;
      flex-direction: column;
      grid-gap: 25px;

      .app-set-clear-container-time-option-item {
        display: flex;
      }
    }

    .app-set-clear-container-button-item {
      margin-top: 25px;
      margin-right: 10px;
      text-align: right;
    }
  }

  .app-set-shortcut-keys-container {
    display: grid;
    grid-gap: 25px;

    .app-set-shortcut-keys-container-button-item {
      margin-top: 25px;
      text-align: right;
    }
  }
}
</style>
