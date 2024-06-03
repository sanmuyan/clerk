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
        <div class="app-set-switch-container">
          <div class="app-set-switch-container-item">
            <el-checkbox v-model="setConfig.user_config.enable_text">文本</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_image">图片</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_file">文件</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.hide_paste">自动粘贴</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.enable_win_tools">系统工具</el-checkbox>
          </div>
          <div class="app-set-switch-container-item">
            <el-checkbox v-model="setConfig.user_config.blur_hide">失焦最小化</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.copy_hide">复制最小化</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.reset_query_data">重置搜索</el-checkbox>
            <el-checkbox v-model="setConfig.user_config.reset_type_select">重置分类</el-checkbox>
          </div>
        </div>
        <div class="app-set-button-container">
          <el-button @click="showClearHistory = true" type="primary">清理数据</el-button>
        </div>
        <div class="app-set-input-container">
          <div class="app-set-input-container-des">
            <div>监听间隔：</div>
            <div>显示数量：</div>
            <div>保留条数：</div>
            <div>保留时间：</div>
            <div>系统工具端口：</div>
            <div>快捷键：</div>
            <div>数据库文件：</div>
          </div>
          <div class="app-set-input-container-item">
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
            <el-input readonly @click="handleClickShortcutKeys" v-model="setConfig.user_config.shortcut_keys"
                      type="text"
                      style="width: 100px"></el-input>
            <el-input readonly @click="handleClickSetDbFile" v-model="setConfig.user_config.db_file" type="text"
                      style="width: 100px"></el-input>
          </div>
        </div>
        <div class="app-set-main-button">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleApplySet">应用</el-button>
        </div>
      </div>
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
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue'
import { ipcRenderer } from 'electron'
import { verificationConfig } from '@/utils/config'
import { handleDownShortcutKeys, handleUpShortcutKeys } from '@/utils/shortcut-keys'

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

const emit = defineEmits(['update:modelValue', 'handleApplySet'])

const setConfig = ref(JSON.parse(JSON.stringify(props.config)))

const handleClickShortcutKeys = () => {
  showShortcutKeys.value = true
}

const handleCloseShortcutKeysListen = () => {
  showShortcutKeys.value = false
  shortcutKeysListenTemp.value = []
  shortcutKeysListen.value = '请输入快捷键'
}

const handleApplyShortcutKeysListen = () => {
  setConfig.value.user_config.shortcut_keys = shortcutKeysListen.value
  showShortcutKeys.value = false
  shortcutKeysListenTemp.value = []
  shortcutKeysListen.value = '请输入快捷键'
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
  emit('update:modelValue', false)
}

const handleOpen = () => {
  setConfig.value = JSON.parse(JSON.stringify(props.config))
}
const handleApplySet = () => {
  handleClose()
  emit('handleApplySet', verificationConfig(setConfig.value))
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

watch(() => props.config, (val) => {
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
      margin-top: 30px;
      margin-left: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;

      .el-button :deep {
        height: 21px;
        width: 40%;
      }
    }

    .app-set-input-container {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(100, 100px);
      grid-gap: 10px;

      .app-set-input-container-des {
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

      .app-set-input-container-item {
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

    .app-set-main-button {
      margin-top: 30px;
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
