import { config } from '@/plugins/config'
import { clearMarkedDelete, clearWithNumber, clearWithTime, vacuumDB } from '@/plugins/sqlite'
import { logger } from '@/plugins/logger'

export const clearHistoryData = async () => {
  if (config.user_config.max_time > 0) {
    const timestamp = Math.floor(Date.now() / 1000)
    logger.warn('run clearWithTime')
    await clearWithTime(timestamp - config.user_config.max_time).then((err) => {
      if (err) {
        logger.error(`clearWithTime: ${err}`)
      }
    })
  }
  if (config.user_config.max_number > 0) {
    logger.warn('run clearWithNumber')
    await clearWithNumber(config.user_config.max_number).then((err) => {
      if (err) {
        logger.error(`clearWithNumber: ${err}`)
      }
    })
  }

  await clearMarkedDelete().then((err) => {
    logger.warn('run clearMarkedDelete')
    if (err) {
      logger.error(`clearMarkedDelete: ${err}`)
    }
  })

  await vacuumDB().then((err) => {
    logger.warn('run vacuumDB')
    if (err) {
      logger.error(`vacuumDB: ${err}`)
    }
  })
}
