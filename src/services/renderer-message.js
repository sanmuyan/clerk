import { config } from '@/services/config'
import { clipboard, nativeImage } from 'electron'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { deleteData, listData, queryData, updateCollect, updateRemarks } from '@/plugins/sqlite'
import { handleWinDisplay, winShow } from '@/services/windisplay'
import { win } from '@/services/win'

export const handleRendererMessage = (event, arg, data) => {
  switch (arg) {
    case 'hide_paste':
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
      deleteData(data.id).then(() => {
        win.webContents.send('message-from-main', 'reset')
      })
      break
    case 'updateCollect':
      updateCollect(data.id, data.collect).then(() => {
        win.webContents.send('message-from-main', 'reset')
      })
      break
    case 'updateRemarks':
      updateRemarks(data.id, data.remarks).then(() => {
        win.webContents.send('message-from-main', 'reset')
      })
      break
  }
}
