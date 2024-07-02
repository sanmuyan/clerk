import { win } from '@/services/win'
import { handleWinDisplay, winShow } from '@/services/windisplay'
import { globalShortcut } from 'electron'
import { logger } from '@/plugins/logger'

export const handleShowAppSet = () => {
  win.webContents.send('message-from-main', 'showAppSet')
  if (!winShow) {
    handleWinDisplay()
  }
}

export const setGlobalShortcut = (key) => {
  globalShortcut.unregisterAll()
  try {
    if (!key) {
      return
    }
    globalShortcut.register(key, () => {
      handleWinDisplay()
    })
  } catch (e) {
    logger.error(`setGlobalShortcut: ${e}`)
  }
}
