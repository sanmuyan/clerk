'use strict'

import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, protocol, Tray } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { initDB } from '@/plugins/sqlite'
import { config, initConfig, isDevelopment } from '@/plugins/config'
import { startWinTools, winToolsPing } from '@/services/wintools'
import { clearHistoryData } from '@/services/prune'
import { handleRendererMessage } from '@/services/renderer-message'
import { handleWinDisplay, winShow } from '@/services/windisplay'
import { startWatch } from '@/services/clipboard'
import { createWindow, win } from '@/services/win'
import { logger } from '@/plugins/logger'
import { handleShowAppSet, setGlobalShortcut } from '@/services/appset'
import { startServer } from '@/services/server'

const fs = require('fs')

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

// 初始化配置
initConfig()

// 初始化数据库
initDB(config).then((res) => {
  logger.info('数据库初始化成功')
  start().then()
}).catch((err) => {
  logger.error(`数据库初始化失败: ${err}`)
  dialog.showErrorBox('错误', '数据库初始化失败')
  app.quit()
})

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

let tray = null
let exiting = false

const handleExit = () => {
  logger.warn('进程退出')
  exiting = true
  app.quit()
}
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
  createWindow().then(() => {
  })
  // 注册全局快捷键
  setGlobalShortcut(config.user_config.shortcut_keys)

  // 定义托盘
  const icon = nativeImage.createFromPath(config.logo_file)
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '    设置    ',
      type: 'normal',
      click: () => {
        handleShowAppSet()
      }
    },
    {
      label: '    退出    ',
      type: 'normal',
      click: () => {
        handleExit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    handleWinDisplay()
  })
  tray.setToolTip('Clerk')

  // 设置菜单
  win.setSkipTaskbar(true)
  const template = []
  const appMenu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(appMenu)

  // 监听窗口尺寸变化
  win.on('resize', () => {
    logger.debug(`窗口尺寸变化 ${win.getSize()}`)
    const windowWidth = win.getSize()[0]
    const windowHeight = win.getSize()[1]
    if (win.isResizable()) {
      config.window.width = windowWidth
      config.window.height = windowHeight
      fs.writeFile(config.window_config_file, JSON.stringify(config.window, null, 2), (err) => {
        if (err) {
          logger.error(`保存窗口尺寸失败: ${err}`)
        } else {
          logger.silly('窗口尺寸已保存')
        }
      })
    } else {
      logger.debug('不允许更改窗口尺寸')
    }
  })

  // 监听窗口最小化
  win.on('minimize', () => {
    handleWinDisplay()
  })

  // 监听窗口失去焦点
  win.on('blur', () => {
    if (config.user_config.blur_hide && !isDevelopment) {
      if (winShow) {
        handleWinDisplay()
      }
    }
  })
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

// 监听渲染进程发送的消息
ipcMain.on('message-from-renderer', (event, arg, data) => {
  handleRendererMessage(event, arg, data)
})

const start = async () => {
  // 启动WinTools
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
