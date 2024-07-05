import { addData, getClipboardWithHash, updateUpdateTime } from '@/plugins/sqlite'
import { clipboard } from 'electron'
import { winToolsClient, winToolsReady } from '@/services/wintools'
import { config } from '@/plugins/config'
import { getHash } from '@/plugins/hash'
import { win } from '@/services/win'
import { logger } from '@/plugins/logger'
import { TYPE_MAP } from '@/constant'

export const handleClipboard = async (currentContent, type, currentHash) => {
  const timestamp = Math.floor(Date.now() / 1000)
  await getClipboardWithHash(currentHash, type).then(async (res) => {
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
    case TYPE_MAP.file:
      if (clipboard.readText() === '') {
        previousTextHash = null
      }
      if (clipboard.readImage().isEmpty()) {
        previousImageHash = null
      }
      break
    case TYPE_MAP.text:
      previousImageHash = null
      previousFileHash = null
      break
    case TYPE_MAP.image:
      if (clipboard.readText() === '') {
        previousTextHash = null
      }
      previousFileHash = null
      break
  }
}

export const watchText = async () => {
  const type = TYPE_MAP.text
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
  await handleClipboard(currentText, type, currentTextHash)
  clearPrevious(type)
}

export const watchImage = async () => {
  const type = TYPE_MAP.image
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
  await handleClipboard(imageContent, type, getHash(imageContent))
  clearPrevious(type)
}

export const watchFile = () => {
  const type = TYPE_MAP.file
  if (winToolsReady) {
    winToolsClient.GetFileDropList({}, async (err, res) => {
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
      await handleClipboard(currentFile, type, currentFileHash)
      clearPrevious(type)
    })
  }
}

export const startWatch = (interval) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      if (config.user_config.enable_text) {
        await watchText()
      }
      if (config.user_config.enable_file) {
        await watchFile()
      }
      if (config.user_config.enable_image) {
        await watchImage()
      }
      resolve()
    }, interval)
  })
}
