import { config, initConfig, isDevelopment } from '@/plugins/config'
import { app, BrowserWindow, dialog, ipcMain, protocol } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { initDB } from '@/plugins/sqlite'
import { logger } from '@/plugins/logger'
import { startWinTools, winToolsPing, winToolsRunning } from '@/services/wintools'
import { startServer } from '@/services/server'
import { clearHistoryData } from '@/services/prune'
import { startWatch } from '@/services/clipboard'
import { handleRendererMessage } from '@/services/renderer-message'
import { createWindow } from '@/services/win'

let exiting = false

export const handleExit = () => {
  app.quit()
  logger.warn('应用已退出')
}

export const handleBeforeQuit = () => {
  exiting = true
  if (winToolsRunning) {
    winToolsRunning.kill('SIGTERM')
  }
  logger.warn('应用关闭中...')
}

const initApp = () => {
  // 初始化配置
  initConfig()

  // 禁止多实例运行
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
  }

  // 登录设置
  if (isDevelopment) {
    app.setLoginItemSettings({
      openAtLogin: false,
      args: []
    })
  } else {
    app.setLoginItemSettings({
      openAtLogin: true,
      args: []
    })
  }
  // app 状态管理
  createAppState()
  // 监听渲染进程发送的消息
  ipcMain.on('message-from-renderer', (event, arg, data) => {
    handleRendererMessage(event, arg, data)
  })
}

const initClipboard = async () => {
  // 初始化数据库
  await initDB(config).then((res) => {
    logger.info('数据库初始化成功')
  }).catch((err) => {
    logger.error(`数据库初始化失败: ${err}`)
    dialog.showErrorBox('错误', '数据库初始化失败')
    app.quit()
  })
}

const startClipboard = async () => {
  // 启动 WinTools
  if (config.user_config.enable_win_tools) {
    startWinTools().finally(() => {
      setInterval(() => {
        winToolsPing()
      }, 1000)
    })
  }
  // 启动服务器
  if (config.user_config.enable_server) {
    startServer().then()
  }
  // 启动时清理历史数据
  await clearHistoryData().then()
  // 监听并处理剪贴板变化
  while (true) {
    if (exiting) {
      break
    }
    await startWatch(config.user_config.watch_interval)
  }
}

const createAppState = () => {
  // Scheme must be registered before the app is ready
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        secure: true,
        standard: true
      }
    }
  ])

  app.on('before-quit', () => {
    handleBeforeQuit()
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      handleExit()
    }
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow().then()
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        await installExtension(VUEJS3_DEVTOOLS)
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
    createWindow().then()
  })

  // Exit cleanly on request from parent process in development mode.
  if (isDevelopment) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit') {
          handleExit()
        }
      })
    } else {
      process.on('SIGTERM', () => {
        handleExit()
      })
    }
  }
}

export const start = () => {
  initApp()
  initClipboard().then(() => {
    startClipboard().then()
  })
}
