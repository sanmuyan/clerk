import { logger } from '@/plugins/logger'
import { getClipboardWithHash, listData, updateCollect, updateRemarks } from '@/plugins/sqlite'
import { handleClipboard } from '@/services/clipboard'
import { getHash } from '@/plugins/hash'
import { config } from '@/plugins/config'
import { COLLECT_MAP, TYPE_MAP } from '@/constant'

const express = require('express')

export const startServer = async () => {
  const hostname = '0.0.0.0'
  const app = express()
  const port = config.user_config.server_port
  app.use(express.json())
  app.use(authMiddleware)
  app.get('/api/clipboards', getClipboards)
  app.post('/api/clipboards', updateClipboards)
  try {
    app.listen(port, hostname, () => {
      logger.info(`接口服务运行中 http://${hostname}:${port}/`)
    })
  } catch (err) {
    logger.error(`启动接口服失败: ${err}`)
  }
}

const authMiddleware = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  if (!config.user_config.server_token) {
    return next()
  }
  const token = req.headers.token
  if (token !== config.user_config.server_token) {
    return res.status(200).send(JSON.stringify({
      success: false,
      msg: '身份验证错误'
    }))
  }
  return next()
}

const getClipboards = (req, res) => {
  const pageNumber = req.query.page_number
  const pageSize = req.query.page_size
  const typeSelect = req.query.type
  listData(pageNumber, pageSize, typeSelect).then((data) => {
    data.success = true
    res.send(JSON.stringify(data))
  }).catch(
    (err) => {
      logger.error(`getClipboards: ${err}`)
      res.send(JSON.stringify({ success: false }))
    }
  )
}

const updateClipboards = async (req, res) => {
  try {
    const clipboards = req.body
    const resp = {
      success: true,
      update_count: 0,
      error_count: 0
    }
    for (const clipboard of clipboards.data) {
      if (!(clipboard.type in TYPE_MAP || !clipboard.content)) {
        resp.error_count++
        continue
      }
      if (clipboard.type === TYPE_MAP.image) {
        if (!clipboard.content.startsWith('data:image/png;base64,')) {
          resp.error_count++
          continue
        }
        const imageBase64 = clipboard.content.replace('data:image/png;base64,', '')
        const imageBuffer = Buffer.from(imageBase64, 'base64')
        clipboard.hash = getHash(imageBuffer)
      }
      if (!clipboards.hash) {
        clipboard.hash = getHash(clipboard.content)
      }
      await handleClipboard(clipboard.content, clipboard.type, clipboard.hash)
      await getClipboardWithHash(clipboard.hash, clipboard.type).then(async (res) => {
        if (res) {
          if (clipboard.collect in COLLECT_MAP) {
            await updateCollect(res.id, clipboard.collect)
          }
          if (clipboard.remarks) {
            await updateRemarks(res.id, clipboard.remarks)
          }
        }
      })
      resp.update_count++
    }
    res.send(JSON.stringify(resp))
  } catch (err) {
    logger.error(`updateClipboards: ${err}`)
    res.send(JSON.stringify({ success: false }))
  }
}
