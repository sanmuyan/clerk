import { config, isDevelopment } from '@/services/config'
import { getClient } from '@/plugins/wintools'
import { spawn } from 'child_process'

export let winToolsReady = false
export let winToolsClient = {
  SetForegroundWindow: () => {},
  GetForegroundWindow: () => {},
  Ping: () => {},
  GetFileDropList: () => {},
  SetFileDropList: () => {}
}

export const winToolsPing = () => {
  winToolsClient.Ping({}, (err, res) => {
    if (err) {
      console.log('WinTools 服务连接失败')
      winToolsReady = false
    } else {
      console.log('WinTools 服务连接成功')
      winToolsReady = true
    }
  })
}

export const startWinTools = () => {
  if (isDevelopment) {
    winToolsClient = getClient(config)
  } else {
    const winToolsRunning = spawn(config.win_tools_file, [config.user_config.win_tools_port.toString()])
    winToolsRunning.stdout.on('data', (data) => {
      console.log('WinTools 运行中: ' + data.toString())
      if (!winToolsReady) {
        winToolsClient = getClient(config)
      }
    })
    winToolsRunning.stderr.on('data', (data) => {
      console.log('WinTools 运行错误: ' + data.toString())
    })
    winToolsRunning.on('exit', (code, signal) => {
      console.log('WinTools 运行退出: ', code, signal)
      winToolsReady = false
      startWinTools()
    })
  }
}
