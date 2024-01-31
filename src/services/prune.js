import { config } from '@/plugins/config'
import { clearWithNumber, clearWithTime, vacuumDB } from '@/plugins/sqlite'
import { logger } from '@/plugins/logger'

export const clearHistoryData = async () => {
  if (config.user_config.max_time > 0) {
    const timestamp = Math.floor(Date.now() / 1000)
    logger.warn('run clearWithTime')
    await clearWithTime(timestamp - config.user_config.max_time).catch(err => {
      if (err) {
        logger.error(`clearWithTime: ${err}`)
      }
    })
  }
  if (config.user_config.max_number > 0) {
    logger.warn('run clearWithNumber')
    await clearWithNumber(config.user_config.max_number).catch(err => {
      if (err) {
        logger.error(`clearWithNumber: ${err}`)
      }
    })
  }

  logger.warn('run vacuumDB')
  await vacuumDB().catch((err) => {
    if (err) {
      logger.error(`vacuumDB: ${err}`)
    }
  })
}
