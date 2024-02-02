import { win } from '@/services/win'
import { handleWinDisplay, winShow } from '@/services/windisplay'

export const handleShowAppSet = () => {
  win.webContents.send('message-from-main', 'showAppSet')
  if (!winShow) {
    handleWinDisplay()
  }
}
