const winston = require('winston')
const {
  combine,
  timestamp,
  printf
} = winston.format

const myFormat = printf(({
  level,
  message,
  timestamp
}) => {
  return `time=${timestamp} level=${level} msg="${message}"`
})

export let logger = winston.createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug'
    })
  ]
})

export const initLogger = (isDevelopment, level, logFile) => {
  if (!isDevelopment) {
    logger = winston.createLogger({
      format: combine(
        timestamp(),
        myFormat
      ),
      transports: [
        new winston.transports.File({
          filename: logFile || 'app.log',
          level: level || 'info',
          maxsize: 1000000,
          maxFiles: 5
        })
      ]
    })
  }
}
