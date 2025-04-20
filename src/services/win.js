import { BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import { config, isDevelopment } from '@/plugins/config'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { logger } from '@/plugins/logger'
import { getCurrentDisplay, getCurrentDisplayDpi, handleWinDisplay, winShow } from '@/services/windisplay'
import { handleShowAppSet, setGlobalShortcut } from '@/services/appset'
import { handleExit } from '@/services/app'

const fs = require('fs')
export let win = null

export async function createWindow () {
  // handleDpiChange()
  // Create the browser window.
  win = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    x: config.window.x,
    y: config.window.y,
    show: false,
    frame: false,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  // 注册全局快捷键
  setGlobalShortcut(config.user_config.shortcut_keys)
  createWindowState()
  createMenu()
}

// 保存窗口状态
export const saveWindow = () => {
  config.window = win.getBounds()
  config.window.dpi = getCurrentDisplayDpi()
  config.window.windowId = getCurrentDisplay().id
  fs.writeFile(config.window_config_file, JSON.stringify(config.window, null, 2), (err) => {
    if (err) {
      logger.error(`保存窗口状态失败: ${err}`)
    } else {
      logger.debug(`窗口状态已保存 ${JSON.stringify(config.window)}`)
    }
  })
}

// 窗口状态管理
const createWindowState = () => {
  // 监听窗口尺寸变化
  win.on('resize', () => {
    logger.silly(`窗口尺寸变化 ${win.getSize()}`)
    if (win.isResizable()) {
      return
    }
    logger.debug('不允许更改窗口尺寸')
  })

  // 监听窗口位置变化
  win.on('move', () => {
    logger.silly(`窗口位置变化 ${win.getPosition()}`)
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
}

// 菜单设置
const createMenu = () => {
  // 定义托盘
  const icon = nativeImage.createFromPath(config.logo_file)
  const tray = new Tray(icon)
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
}
