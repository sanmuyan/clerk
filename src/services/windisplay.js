import { screen } from 'electron'
import { config } from '@/plugins/config'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { saveWindow, win } from '@/services/win'
import { logger } from '@/plugins/logger'

export let winShow = false

export const getCurrentDisplay = () => {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

export const getCurrentDisplayDpi = () => {
  return getCurrentDisplay().scaleFactor
}

export const handleWinPosition = () => {
  const winWidth = win.getBounds().width
  const winHeight = win.getBounds().height
  const cursorX = screen.getCursorScreenPoint().x
  const cursorY = screen.getCursorScreenPoint().y
  const display = getCurrentDisplay()
  logger.debug(`current_display: ${JSON.stringify(display)}`)
  let winX = cursorX
  let winY = cursorY
  // 多个屏幕时，获取当前屏幕的绝对X坐标
  const absoluteCursorX = cursorX - display.workArea.x
  if (absoluteCursorX + winWidth > display.workArea.width) {
    // 窗口默认会出现在鼠标右侧。如果鼠标位置+窗口宽度超过屏幕宽度，则窗口位置出现在屏幕左侧
    winX = display.workArea.x + display.workArea.width - winWidth
  } else {
    // 如果屏幕左侧还有空间，窗口往左移动确保鼠标在窗口内
    if (absoluteCursorX > 50) {
      winX -= 50
    } else {
      winX -= absoluteCursorX
    }
  }
  // 多个屏幕时，获取当前屏幕的绝对Y坐标
  const absoluteCursorY = cursorY - display.workArea.y
  if (absoluteCursorY + winHeight > display.workArea.height) {
    // 默认窗口顶部会出现在鼠标位置下部，如果鼠标位置+窗口高度超过屏幕高度，则窗口底部出现在屏幕的底部
    winY = display.workArea.y + display.workArea.height - winHeight
  } else {
    // 如果屏幕上面还有空间，窗口往上移动确保鼠标在窗口内
    if (absoluteCursorY > 40) {
      winY -= 40
    } else {
      winY -= absoluteCursorY
    }
  }
  win.setPosition(winX, winY)
}

let foregroundWindow = null
export const handleWinDisplay = (triggerPaste) => {
  if (winShow) {
    handleWinHide()
    if (winToolsReady) {
      logger.debug(`setForegroundWindow: ${foregroundWindow}`)
      const msg = {
        ForegroundWindow: foregroundWindow
      }
      if (triggerPaste) {
        msg.IsPaste = true
        logger.debug(`triggerPaste: ${foregroundWindow}`)
      }
      winToolsClient.SetForegroundWindow(msg, (err, res) => {
        if (err) {
          logger.error(`setForegroundWindow failed: ${err}`)
        } else {
          if (!res.Status) {
            logger.warn('setForegroundWindow not true')
            winToolsClient.SetForegroundWindow(msg, (err, res) => {
              if (err) {
                logger.error(`setForegroundWindow failed: ${err}`)
              } else {
                if (!res.Status) {
                  logger.warn('setForegroundWindow not true again')
                }
              }
            })
          }
        }
      })
    }
    win.webContents.send('message-from-main', 'reset')
  } else {
    if (winToolsReady) {
      winToolsClient.GetForegroundWindow({}, (err, res) => {
        if (err) {
          logger.error(`getForegroundWindow failed: ${err}`)
        } else {
          foregroundWindow = res.ForegroundWindow
          logger.debug(`setForegroundWindow: ${foregroundWindow}`)
        }
        handleWinShowing()
      })
    } else {
      handleWinShowing()
    }
  }
}

const setWinSize = () => {
  const workAreaWidth = getCurrentDisplay().workArea.width
  const workAreaHeight = getCurrentDisplay().workArea.height
  let minWidth = 350
  let minHeight = 760
  minWidth = minWidth > workAreaWidth ? workAreaWidth : minWidth
  minHeight = minHeight > workAreaHeight ? workAreaHeight : minHeight
  win.setMinimumSize(minWidth, minHeight)
  win.setMaximumSize(workAreaWidth, workAreaHeight)
  if (config.user_config.reset_win_size) {
    win.setSize(minWidth, minHeight)
  } else {
    if (config.dpi !== getCurrentDisplayDpi()) {
      win.setSize(config.window.width, config.window.height)
    }
  }
  handleWinPosition()
}

const handleWinHide = () => {
  logger.debug('winHide')
  winShow = false
  if (win.getBounds().height === getCurrentDisplay().workArea.height && !win.isMaximized()) {
    win.restore()
  }
  if (win.isMaximized()) {
    win.unmaximize()
  }
  win.hide()
  saveWindow()
}

const handleWinShowing = () => {
  logger.debug('winShow')
  winShow = true
  setWinSize()
  win.show()
}
