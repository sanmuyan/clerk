import { config, isDevelopment } from '@/plugins/config'
import { getClient } from '@/plugins/wintools'
import { spawn } from 'child_process'
import { logger } from '@/plugins/logger'

export let winToolsReady = false
export let winToolsClient = {
  SetForegroundWindow: () => {
  },
  GetForegroundWindow: () => {
  },
  Ping: () => {
  },
  GetFileDropList: () => {
  },
  SetFileDropList: () => {
  }
}

export const winToolsPing = () => {
  winToolsClient.Ping({}, (err, res) => {
    if (err) {
      if (winToolsReady) {
        logger.debug('winTools 服务连接失败')
      }
      winToolsReady = false
    } else {
      if (!winToolsReady) {
        logger.debug('winTools 服务连接成功')
      }
      winToolsReady = true
    }
  })
}

export let winToolsRunning = null
export const startWinTools = async () => {
  if (isDevelopment) {
    winToolsClient = getClient(config)
    logger.warn('开发模式 winTools 需要手动启动')
  } else {
    winToolsRunning = spawn(config.win_tools_file, [config.user_config.win_tools_port.toString()])
    winToolsRunning.stdout.on('data', (data) => {
      logger.info(`winTools 运行中: ${data.toString()}`)
      if (!winToolsReady) {
        winToolsClient = getClient(config)
      }
    })
    winToolsRunning.stderr.on('data', (data) => {
      logger.error(`winTools 运行错误: ${data.toString()}`)
    })
    winToolsRunning.on('exit', (code, signal) => {
      logger.warn(`winTools 运行退出: ${code} ${signal}`)
      winToolsReady = false
    })
  }
}
