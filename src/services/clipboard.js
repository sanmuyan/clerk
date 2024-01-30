import { addData, getClipboardWithHash, updateUpdateTime } from '@/plugins/sqlite'
import { clipboard } from 'electron'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { config } from '@/services/config'
import { getHash } from '@/plugins/hash'
import { win } from '@/services/win'

const handleClipboard = (currentContent, type, currentHash) => {
  console.log('clipboard update', type)
  const timestamp = Math.floor(Date.now() / 1000)
  getClipboardWithHash(currentHash, type).then(async (res) => {
    if (res) {
      await updateUpdateTime(res.id, timestamp)
    } else {
      await addData(currentContent, type, currentHash)
    }
    win.webContents.send('message-from-main', 'newClipboard')
  })
}

let previousTextHash = null
let previousFileHash = null
let previousImageHash = null

const clearPrevious = (type) => {
  switch (type) {
    case 'file':
      if (clipboard.readText() === '') {
        previousTextHash = null
      }
      if (clipboard.readImage().isEmpty()) {
        previousImageHash = null
      }
      break
    case 'text':
      previousImageHash = null
      previousFileHash = null
      break
    case 'image':
      if (clipboard.readText() === '') {
        previousTextHash = null
      }
      previousFileHash = null
      break
  }
}

const watchText = () => {
  const type = 'text'
  const currentText = clipboard.readText()
  // 文本不能超过1MB
  if (currentText === '' || currentText.trim().length === 0 || currentText.length > 1048576) {
    return
  }
  const currentTextHash = getHash(currentText)
  if (previousTextHash === currentTextHash) {
    return
  }
  previousTextHash = currentTextHash
  handleClipboard(currentText, type, currentTextHash)
  clearPrevious(type)
}

const watchImage = () => {
  const type = 'image'
  const image = clipboard.readImage()
  if (image.isEmpty()) {
    return
  }
  const imageContent = image.toPNG()
  const currentImageHash = getHash(imageContent)
  // 图片不能大于10MB
  if (imageContent.length > 10485760) {
    return
  }

  if (currentImageHash === previousImageHash) {
    return
  }
  previousImageHash = currentImageHash
  handleClipboard(imageContent, type, currentImageHash)
  clearPrevious(type)
}
const watchFile = () => {
  let fileDropList = []
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
  const currentFileHash = getHash(currentFile)
  if (previousFileHash === currentFileHash) {
    return
  }
  previousFileHash = currentFile
  handleClipboard(currentFile, type)
  clearPrevious(type)
}

export const startWatch = (interval, exiting) => {
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
