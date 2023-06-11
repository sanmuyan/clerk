const fs = require('fs')

export const getUserConfig = (config) => {
  if (!fs.existsSync(config.user_config_path)) {
    fs.mkdirSync(config.user_config_path)
  }
  let configFile = ''
  const argv = process.argv.filter(arg => arg.includes('--config='))
  if (argv.length === 1) {
    configFile = argv[0].split('=')[1]
  } else {
    configFile = config.user_config_path + '/config.json'
    if (!fs.existsSync(configFile)) {
      console.error('配置文件不存在, 将使用默认配置文件')
      fs.copyFileSync(config.resources_path + '/config-example.json', configFile)
    }
  }

  return JSON.parse(fs.readFileSync(configFile, 'utf8'))
}
