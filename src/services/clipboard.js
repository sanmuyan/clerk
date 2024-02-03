import { addData, getClipboardWithHash, updateUpdateTime } from '@/plugins/sqlite'
import { clipboard } from 'electron'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { config } from '@/plugins/config'
import { getHash } from '@/plugins/hash'
import { win } from '@/services/win'
import { logger } from '@/plugins/logger'

const handleClipboard = (currentContent, type, currentHash) => {
  const timestamp = Math.floor(Date.now() / 1000)
  getClipboardWithHash(currentHash, type).then(async (res) => {
    if (res) {
      logger.info(`updateClipboard: id=${res.id} type=${type} hash=${currentHash}`)
      await updateUpdateTime(res.id, timestamp).catch(err => {
        logger.error(`updateUpdateTime: ${err}`)
      })
    } else {
      logger.info(`addClipboard: type=${type} hash=${currentHash}`)
      await addData(currentContent, type, currentHash).catch(err => {
        logger.error(`addClipboard: ${err}`)
      })
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

export const watchText = () => {
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

export const watchImage = () => {
  const type = 'image'
  const image = clipboard.readImage()
  if (image.isEmpty()) {
    return
  }
  const imageBit = image.toBitmap()
  // 图片不能大于10MB
  if (imageBit.length > 10485760) {
    return
  }
  const currentImageHash = getHash(imageBit)
  if (currentImageHash === previousImageHash) {
    return
  }
  const imageContent = image.toPNG()
  previousImageHash = currentImageHash
  handleClipboard(imageContent, type, getHash(imageContent))
  clearPrevious(type)
}

export const watchFile = () => {
  const type = 'file'
  if (winToolsReady) {
    winToolsClient.GetFileDropList({}, (err, res) => {
      if (err) {
        logger.error(`getFileDropList: ${err}`)
        return
      }
      const fileDropList = res.FileDropList
      if (Object.keys(fileDropList).length === 0) {
        return
      }
      let currentFile = null
      try {
        currentFile = JSON.stringify(fileDropList)
      } catch (e) {
        logger.error(`watchFile: ${e}`)
        return
      }
      currentFile = currentFile.replace(/\\\\/g, '/')
      const currentFileHash = getHash(currentFile)
      if (previousFileHash === currentFileHash) {
        return
      }
      previousFileHash = currentFileHash
      handleClipboard(currentFile, type, currentFileHash)
      clearPrevious(type)
    })
  }
}

export const startWatch = (exiting) => {
  const si = setInterval(() => {
    if (exiting) {
      clearInterval(si)
    }
    if (config.user_config.enable_text) {
      watchText()
    }
    if (config.user_config.enable_file) {
      watchFile()
    }
    if (config.user_config.enable_image) {
      watchImage()
    }
  }, 1000)
}