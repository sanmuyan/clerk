import { config } from '@/services/config'
import { clearMarkedDelete, clearWithNumber, clearWithTime, vacuumDB } from '@/plugins/sqlite'

export const clearHistoryData = async () => {
  if (config.user_config.max_time > 0) {
    const timestamp = Math.floor(Date.now() / 1000)
    await clearWithTime(timestamp - config.user_config.max_time).then((err) => {
      if (err) {
        console.log(err)
      }
    })
  }
  if (config.user_config.max_number > 0) {
    console.log('clearWithNumber')
    await clearWithNumber(config.user_config.max_number).then((err) => {
      if (err) {
        console.log(err)
      }
    })
  }

  await clearMarkedDelete().then((err) => {
    if (err) {
      console.log(err)
    }
  })

  await vacuumDB().then((err) => {
    if (err) {
      console.log(err)
    }
  })
}
