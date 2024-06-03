import { app, dialog } from 'electron'
import fs from 'fs'
import { initLogger, logger } from '@/plugins/logger'
import { verificationConfig } from '@/utils/config'

let configFile = ''
const getUserConfig = (config) => {
  if (!fs.existsSync(config.user_config_path)) {
    fs.mkdirSync(config.user_config_path)
  }
  const argv = process.argv.filter(arg => arg.includes('--config='))
  if (argv.length === 1) {
    configFile = argv[0].split('=')[1]
  } else {
    configFile = config.user_config_path + '/config.json'
    if (!fs.existsSync(configFile)) {
      logger.warn('配置文件不存在, 将使用默认配置文件')
      fs.copyFileSync(config.resources_path + '/config-example.json', configFile)
    }
  }

  return JSON.parse(fs.readFileSync(configFile, 'utf8'))
}

export const isDevelopment = process.env.NODE_ENV !== 'production'

// 初始化配置
const userHome = app.getPath('home').replace(/\\/g, '/')
logger.info(`userHome=${userHome}`)
let appPath = app.getAppPath().replace(/\\/g, '/').replace('/app.asar', '')
let resourcesPath = appPath
if (isDevelopment) {
  appPath = '.'
  resourcesPath = appPath + '/resources'
}
const userConfigPath = userHome + '/.clerk'
logger.info(`appPath=${appPath}`)
logger.info(`resourcesPath:=${resourcesPath}`)
logger.info(`userConfigPath=${userConfigPath}`)

let winToolsFile = null
if (process.platform === 'win32') {
  winToolsFile = resourcesPath + '/WinTools/win-x64/WinTools.exe'
}

export let config = {}

export const initConfig = () => {
  try {
    config = {
      user_home: userHome,
      app_path: appPath,
      resources_path: resourcesPath,
      win_tools_file: winToolsFile,
      win_tools_proto_file: resourcesPath + '/WinTools.proto',
      user_config_path: userConfigPath,
      init_sql: fs.readFileSync(resourcesPath + '/init.sql', 'utf8'),
      window: {
        width: 600,
        height: 800
      },
      window_config_file: userConfigPath + '/window.json',
      user_config: {
        enable_win_tools: true,
        win_tools_port: 50051,
        shortcut_keys: 'Ctrl+Right',
        db_file: userConfigPath + '/clerk.db',
        max_number: 0,
        max_time: 0,
        blur_hide: true,
        copy_hide: true,
        hide_paste: true,
        page_size: 10,
        enable_text: true,
        enable_image: true,
        enable_file: true,
        watch_interval: 1000,
        reset_query_data: true,
        reset_type_select: true,
        reset_list_post_update: true
      },
      logo_file: resourcesPath + '/logo.png'
    }
    try {
      config.window = JSON.parse(fs.readFileSync(config.window_config_file, 'utf8'))
    } catch (e) {
      logger.warn('window.json 文件不存在')
    }
    const userConfig = getUserConfig(config)
    for (const key in userConfig) {
      if (key in config.user_config) {
        config.user_config[key] = userConfig[key]
      }
    }
    verificationConfig(config)
  } catch (e) {
    dialog.showErrorBox('错误', '生成配置失败' + e.toString())
    app.quit()
  }
}

// 初始化 logger
initLogger(isDevelopment, 'info', `${resourcesPath}/app.log`)

export const appConfig = (c) => {
  config = c
  fs.writeFile(configFile, JSON.stringify(config.user_config, null, 4), (err) => {
    if (err) {
      logger.error(`apply config failed: ${err}`)
    }
  })
}
