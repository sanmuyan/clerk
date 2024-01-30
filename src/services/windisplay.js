import { screen } from 'electron'
import { config } from '@/services/config'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { win } from '@/services/win'

export let winShow = false
export const handleWinPosition = () => {
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
export const handleWinDisplay = (triggerPaste) => {
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
