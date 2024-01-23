'use strict'

import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  protocol,
  screen,
  Tray
} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import {
  addData,
  clearWithNumber,
  clearWithTime,
  deleteData,
  getData,
  initDB,
  listData,
  queryData,
  updateCollect,
  updateData,
  updateRemarks
} from '@/plugins/sqlite'
import { getUserConfig } from '@/utils/config'
import { getClient } from '@/plugins/wintools'

const fs = require('fs')
const { spawn } = require('child_process')

// 禁止多实例运行
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

const isDevelopment = process.env.NODE_ENV !== 'production'

// 初始化配置
const userHome = app.getPath('home').replace(/\\/g, '/')
console.log('userHome', userHome)
let appPath = app.getAppPath().replace(/\\/g, '/').replace('/app.asar', '')
let resourcesPath = appPath
if (isDevelopment) {
  appPath = '.'
  resourcesPath = appPath + '/resources'
}
const userConfigPath = userHome + '/.clerk'
console.log('appPath', appPath)
console.log('resourcesPath', resourcesPath)
console.log('userConfigPath', userConfigPath)
let winToolsFile = null
if (process.platform === 'win32') {
  winToolsFile = resourcesPath + '/WinTools/win-x64/WinTools.exe'
  if (isDevelopment) {
    winToolsFile = appPath + '/WinTools/WinTools/bin/Release/net7.0/win-x64/WinTools.exe'
  }
}

let config = {}

try {
  config = {
    user_home: userHome,
    app_path: appPath,
    resources_path: resourcesPath,
    win_tools_file: winToolsFile,
    win_tools_proto_file: resourcesPath + '/WinTools.proto',
    user_config_path: userConfigPath,
    init_sql: fs.readFileSync(resourcesPath + '/init.sql', 'utf8'),
    window: {
      width: 600,
      height: 800
    },
    window_config_file: userConfigPath + '/window.json',
    user_config: {
      enable_win_tools: true,
      win_tools_port: 50051,
      shortcut_keys: 'Ctrl+Right',
      db_file: userConfigPath + '/clerk.db',
      max_number: 0,
      max_time: 0,
      blur_hide: true,
      copy_hide: true,
      hide_paste: true,
      page_size: 10,
      enable_text: true,
      enable_image: true,
      enable_file: true
    },
    logo_file: resourcesPath + '/logo.png'
  }
  try {
    config.window = JSON.parse(fs.readFileSync(config.window_config_file, 'utf8'))
  } catch (e) {
    console.log('window.json文件不存在')
  }
  const userConfig = getUserConfig(config)
  for (const key in userConfig) {
    config.user_config[key] = userConfig[key]
  }
} catch (e) {
  dialog.showErrorBox('错误', '生成配置失败' + e.toString())
  app.quit()
}

if (isDevelopment) {
  config.user_config.blur_hide = false
}

console.log('config: ', config)

// 启动WinTools
let winToolsReady = false
let winToolsClient = null

const winToolsPing = () => {
  winToolsClient.Ping({}, (err, res) => {
    if (err) {
      console.log('WinTools 服务连接失败')
      winToolsReady = false
    } else {
      console.log('WinTools 服务连接成功')
      winToolsReady = true
    }
  })
}

const startWinTools = () => {
  if (isDevelopment) {
    winToolsClient = getClient(config)
  } else {
    const winToolsRunning = spawn(config.win_tools_file, [config.user_config.win_tools_port.toString()])
    winToolsRunning.stdout.on('data', (data) => {
      console.log('WinTools 运行中: ' + data.toString())
      if (!winToolsReady) {
        winToolsClient = getClient(config)
      }
    })
    winToolsRunning.stderr.on('data', (data) => {
      console.log('WinTools 运行错误: ' + data.toString())
    })
    winToolsRunning.on('exit', (code, signal) => {
      console.log('WinTools 运行退出: ', code, signal)
      winToolsReady = false
      startWinTools()
    })
  }
}

try {
  if (config.user_config.enable_win_tools) {
    startWinTools()
    setInterval(() => {
      winToolsPing()
    }, 10000)
  }
} catch (e) {
  dialog.showErrorBox('错误', 'WinTools服务连接失败' + e.toString())
}

try {
  initDB(config).then(() => {
    start()
  })
} catch (e) {
  dialog.showErrorBox('错误', '数据库初始化失败' + e.toString())
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

let win = null
let tray = null
let winShow = false
let exiting = false

async function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: config.window.width || 600,
    height: config.window.height || 800,
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
}

const handleExit = () => {
  console.log('进程退出')
  fs.writeFileSync(config.window_config_file, JSON.stringify(config.window, null, 2))
  app.quit()
  exiting = true
}

const handleWinPosition = () => {
  const cursorX = screen.getCursorScreenPoint().x
  const cursorY = screen.getCursorScreenPoint().y
  const display = screen.getPrimaryDisplay()

  let winX = cursorX
  let winY = cursorY
  if (cursorX + config.window.width > display.size.width) {
    // 默认会出现在鼠标右侧。如果鼠标位置+窗口宽度超过屏幕宽度，则窗口位置出现在鼠标左侧
    winX = cursorX - config.window.width
  } else {
    // 窗口往左移动确保鼠标在窗口内
    winX -= 50
  }
  if (cursorY + config.window.height > display.size.height) {
    // 默认窗口顶部会出现在鼠标位置下部，如果鼠标位置+窗口高度超过屏幕高度，则窗口底部出现在屏幕最大高度点
    winY = display.size.height - config.window.height
    // 减去任务栏高度
    winY = winY - 50
  } else {
    // 窗口往上移动确保鼠标在窗口内
    if (cursorY > 20) {
      winY -= 40
    }
  }
  win.setPosition(winX, winY)
}

let foregroundWindow = null
const handleWinDisplay = (triggerPaste) => {
  if (winShow) {
    console.log('winHide')
    winShow = false
    win.hide()
    if (winToolsReady) {
      console.log('setForegroundWindow', foregroundWindow)
      const msg = {
        ForegroundWindow: foregroundWindow
      }
      if (triggerPaste) {
        msg.IsPaste = true
        console.log('triggerPaste', foregroundWindow)
      }
      winToolsClient.SetForegroundWindow(msg, (err, res) => {
        if (err) {
          console.log('SetForegroundWindow failed', err)
        } else {
          if (!res.Status) {
            console.log('SetForegroundWindow not true')
            winToolsClient.SetForegroundWindow(msg, (err, res) => {
              if (err) {
                console.log('SetForegroundWindow failed', err)
              } else {
                if (!res.Status) {
                  console.log('SetForegroundWindow not true again')
                }
              }
            })
          }
        }
      })
    }
    win.webContents.send('message-from-main', 'reset')
  } else {
    console.log('winShow')
    winShow = true
    handleWinPosition()
    if (winToolsReady) {
      winToolsClient.GetForegroundWindow({}, (err, res) => {
        if (err) {
          console.log('GetForegroundWindow failed', err)
        } else {
          foregroundWindow = res.ForegroundWindow
          console.log('foregroundWindow', foregroundWindow)
        }
        win.show()
      })
    } else {
      win.show()
    }
  }
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
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
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
  globalShortcut.register(config.user_config.shortcut_keys, () => {
    handleWinDisplay()
  })

  // 定义托盘
  const icon = nativeImage.createFromPath(config.logo_file)
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
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
    config.window.width = win.getSize()[0]
    config.window.height = win.getSize()[1]
  })

  // 监听窗口最小化
  win.on('minimize', () => {
    handleWinDisplay()
  })

  // 监听窗口失去焦点
  win.on('blur', () => {
    if (config.user_config.blur_hide) {
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
  switch (arg) {
    case 'copy':
      if (winShow) {
        if (config.user_config.hide_paste) {
          handleWinDisplay(true)
        }
      }
      break
    case 'write':
      switch (data.type) {
        case 'text':
          console.log('setClipboardText')
          clipboard.writeText(data.content)
          break
        case 'image':
          console.log('setClipboardImage')
          clipboard.writeImage(nativeImage.createFromDataURL(data.content))
          break
        case 'file':
          console.log('setFileDropList')
          if (winToolsReady) {
            winToolsClient.SetFileDropList({ FileDropList: JSON.parse(data.content) }, (err, res) => {
              if (err) {
                console.log('SetFileDropList failed', err)
              }
            })
          }
      }
      break
    case 'init':
      win.webContents.send('message-from-main', 'init', config)
      break
    case 'queryData':
      queryData(data.pageNumber, data.pageSize, data.inputQuery, data.typeSelect).then(res => {
        win.webContents.send('message-from-main', 'queryData', {
          data: res,
          action: data.action
        })
      })
      break
    case 'listData':
      listData(data.pageNumber, data.pageSize, data.typeSelect).then(res => {
        win.webContents.send('message-from-main', 'listData', {
          data: res,
          action: data.action
        })
      })
      break
    case 'delete':
      deleteData(data.id).catch()
      break
    case 'updateCollect':
      updateCollect(data.id, data.collect).catch()
      break
    case 'updateRemarks':
      updateRemarks(data.id, data.remarks).catch()
      break
  }
})

// 监听并处理剪贴板变化
const handleClipboard = (current, type) => {
  console.log('clipboard update', type)
  const timestamp = Math.floor(Date.now() / 1000)
  getData(current, type).then(async (res) => {
    if (res) {
      await updateData(res.id, timestamp)
    } else {
      await addData(current, timestamp, type)
    }
    win.webContents.send('message-from-main', 'newClipboard')
  })
}

let previousText = null
let previousFile = null
let previousImage = null
let fileDropList = []

const clearPrevious = (type) => {
  switch (type) {
    case 'file':
      if (clipboard.readText() === '') {
        previousText = null
      }
      if (clipboard.readImage().isEmpty()) {
        previousImage = null
      }
      break
    case 'text':
      previousImage = null
      previousFile = null
      break
    case 'image':
      if (clipboard.readText() === '') {
        previousText = null
      }
      previousFile = null
      break
  }
}

const watchText = () => {
  const type = 'text'
  const currentText = clipboard.readText()
  if (currentText === '' || currentText.trim().length === 0 || currentText.length > 1048576) {
    return
  }
  if (previousText === currentText) {
    return
  }
  previousText = currentText
  handleClipboard(currentText, type)
  clearPrevious(type)
}

const watchImage = () => {
  const type = 'image'
  const image = clipboard.readImage()
  if (image.isEmpty()) {
    return
  }
  const size = image.toBitmap().length
  if (size === previousImage || size > 104857600) {
    return
  }

  const currentImage = image.toDataURL()

  if (currentImage === previousImage) {
    return
  }
  previousImage = size
  handleClipboard(currentImage, type)
  clearPrevious(type)
}
const watchFile = () => {
  if (winToolsReady) {
    winToolsClient.GetFileDropList({}, (err, res) => {
      if (err) {
        console.log('GetFileDropList failed:', err)
        return
      }
      fileDropList = res.FileDropList
    })
  }

  const type = 'file'
  if (Object.keys(fileDropList).length === 0) {
    return
  }
  let currentFile = null
  try {
    currentFile = JSON.stringify(fileDropList)
  } catch (e) {
    console.log(e)
    return
  }
  currentFile = currentFile.replace(/\\\\/g, '/')
  if (previousFile === currentFile) {
    return
  }
  previousFile = currentFile
  handleClipboard(currentFile, type)
  clearPrevious(type)
}

const startWatch = (interval) => {
  const si = setInterval(() => {
    if (exiting) {
      clearInterval(si)
    }
    if (config.user_config.enable_text) {
      watchText()
    }
    if (config.user_config.enable_image) {
      watchImage()
    }
    if (config.user_config.enable_file) {
      watchFile()
    }
  }, interval)
}

// 启动时清理历史数据
const clearHistoryData = () => {
  if (config.user_config.max_time > 0) {
    const timestamp = Math.floor(Date.now() / 1000)
    clearWithTime(timestamp - config.user_config.max_time).then((err, res) => {
      if (err) {
        console.log(err)
      }
    })
  }
  if (config.user_config.max_number > 0) {
    console.log('clearWithNumber')
    clearWithNumber(config.user_config.max_number).then((err, res) => {
      if (err) {
        console.log(err)
      }
    })
  }
}

const start = () => {
  startWatch(500)
  clearHistoryData()
}
