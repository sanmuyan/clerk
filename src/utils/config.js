export const verificationConfig = (config) => {
  if (config.user_config.win_tools_port < 0 || config.user_config.win_tools_port > 65535) {
    config.user_config.win_tools_port = 50051
  }
  if (config.user_config.max_number < 1000) {
    config.user_config.max_number = 0
  }
  if (config.user_config.max_time < 86400) {
    config.user_config.max_time = 0
  }
  if (config.user_config.watch_interval < 100) {
    config.user_config.watch_interval = 100
  }
  if (config.user_config.page_size < 1 || config.user_config.page_size > 20) {
    config.user_config.page_size = 10
  }
  return config
}
