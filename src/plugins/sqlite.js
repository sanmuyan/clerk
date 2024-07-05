import sqlite3 from 'sqlite3'
import { getPaginator } from '@/utils/paginator'
import { COLLECT_MAP, DB_CONTENT_COLUMN_MAP, DB_CONTENT_TABLE_NAME_MAP, DB_MAIN_TABLE_NAME, TYPE_MAP } from '@/constant'
import { logger } from '@/plugins/logger'

const sqlite = sqlite3.verbose()
let db = null

const enableForeignKeys = () => {
  return new Promise((resolve, reject) => {
    const foreignKeysSql = 'PRAGMA foreign_keys = ON'
    logger.debug(`initDBForeignKeysSQL: ${foreignKeysSql}`)
    db.get(foreignKeysSql, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
export const initDB = (config) => {
  db = new sqlite.Database(config.user_config.db_file)

  return new Promise((resolve, reject) => {
    const checkSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME}`
    logger.debug(`initDBCheckSQL: ${checkSql}`)
    db.run(checkSql, (err) => {
      if (err) {
        db.exec(config.init_sql, (err) => {
          if (err) {
            reject(err)
          } else {
            logger.warn('数据库结构初始化成功')
            enableForeignKeys().then(resolve).catch(err => {
              reject(err)
            })
          }
        })
      } else {
        enableForeignKeys().then(resolve).catch(reject)
      }
    })
  })
}

const getCount = (sql) => {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const getContentWithRow = (row) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM ${DB_CONTENT_TABLE_NAME_MAP[row.type]} WHERE clerk_id = ${row.id}`
    logger.silly(`getContentWithRowSQL: ${sql}`)
    db.get(sql, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res) {
          res.content = res[DB_CONTENT_COLUMN_MAP[row.type]]
          resolve(res)
        } else {
          if (row.collect !== 'y') {
            deleteData(row.id).then(() => {
              reject(new Error(`content not found: ${row.id}, ${row.type}`))
            }).catch(reject)
          }
        }
      }
    })
  })
}

export const getClipboardWithHash = (hash, type) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM ${DB_MAIN_TABLE_NAME} WHERE hash = '${hash}'`
    logger.debug(`getClipboardWithHashSQL: ${sql}`)
    db.get(sql, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res) {
          res.content = res[DB_CONTENT_COLUMN_MAP[type]]
          resolve(res)
        } else {
          resolve()
        }
      }
    })
  })
}
export const addData = (content, type, hash) => {
  return new Promise((resolve, reject) => {
    if (!(type in TYPE_MAP)) {
      type = TYPE_MAP.text
    }
    const timestamp = Math.floor(Date.now() / 1000)
    const mainSql = `INSERT INTO ${DB_MAIN_TABLE_NAME}(create_time,update_time,type,collect,remarks,hash) VALUES (${timestamp},${timestamp}, '${type}', 'n', '', '${hash}')`
    logger.debug(`addDataMainSQL: ${mainSql}`)
    db.run('BEGIN TRANSACTION')
    db.run(mainSql, (err) => {
      if (err) {
        db.run('ROLLBACK')
        reject(err)
      } else {
        const lastIDSQL = 'SELECT last_insert_rowid() AS id'
        logger.debug(`addDataLastIDSQL: ${lastIDSQL}`)
        db.get(lastIDSQL, (err, res) => {
          if (err) {
            db.run('ROLLBACK')
            reject(err)
          } else {
            const lastId = res.id
            const contentSql = `INSERT INTO ${DB_CONTENT_TABLE_NAME_MAP[type]}(clerk_id,${DB_CONTENT_COLUMN_MAP[type]}) VALUES (${lastId}, ?)`
            logger.debug(`addDataContentSQL: ${contentSql}`)
            db.run(contentSql, [content], (err) => {
              if (err) {
                db.run('ROLLBACK')
                reject(err)
              } else {
                db.run('COMMIT')
                resolve()
              }
            })
          }
        })
      }
    })
  })
}

export const updateUpdateTime = (id) => {
  const timestamp = Math.floor(Date.now() / 1000)
  return new Promise((resolve, reject) => {
    const sql = `UPDATE ${DB_MAIN_TABLE_NAME} SET update_time = ${timestamp} WHERE id = ${id}`
    logger.debug(`updateUpdateTimeSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const listDataWithSql = (sql, countSql, page) => {
  sql = `${sql} ORDER BY update_time DESC LIMIT ${page.limit} OFFSET ${page.offset}`
  logger.debug(`listDataWithSqlSQL: ${sql}`)
  return new Promise((resolve, reject) => {
    db.all(sql, async (err, rows) => {
      if (err) {
        reject(err)
      } else {
        for (const row of rows) {
          await getContentWithRow(row).then(r => {
            if (row.type === 'image') {
              rows.find(o => o.id === row.id).content = `data:image/png;base64,${r.content.toString('base64')}`
            } else {
              rows.find(o => o.id === row.id).content = r.content
            }
          })
        }
        getCount(countSql).then(r => {
          resolve({
            data: rows,
            count: r.count
          })
        }).catch(reject)
      }
    })
  })
}
export const listData = (pageNumber, pageSize, typeSelect) => {
  const page = getPaginator(pageNumber, pageSize)
  let sql = `SELECT * FROM ${DB_MAIN_TABLE_NAME}`
  let countSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME}`
  switch (typeSelect) {
    case 'all':
      break
    case 'collect':
      sql = `${sql} WHERE collect = 'y'`
      countSql = `${countSql} WHERE collect = 'y'`
      break
    default:
      if (!(typeSelect in TYPE_MAP)) {
        typeSelect = TYPE_MAP.text
      }
      sql = `${sql} WHERE type = '${typeSelect}'`
      countSql = `${countSql} WHERE type = '${typeSelect}'`
      break
  }
  return listDataWithSql(sql, countSql, page)
}
export const queryData = (pageNumber, pageSize, content, typeSelect) => {
  const page = getPaginator(pageNumber, pageSize)
  let sql = `SELECT ${DB_MAIN_TABLE_NAME}.* FROM ${DB_MAIN_TABLE_NAME} LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.text} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.text}.clerk_id LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.file} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.file}.clerk_id LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.image} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.image}.clerk_id WHERE (${DB_CONTENT_TABLE_NAME_MAP.text}.${DB_CONTENT_COLUMN_MAP.text} LIKE '%${content}%' OR ${DB_CONTENT_TABLE_NAME_MAP.file}.${DB_CONTENT_COLUMN_MAP.file} LIKE '%${content}%' OR remarks LIKE '%${content}%')`
  let countSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME} LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.text} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.text}.clerk_id LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.file} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.file}.clerk_id LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.image} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.image}.clerk_id WHERE (${DB_CONTENT_TABLE_NAME_MAP.text}.${DB_CONTENT_COLUMN_MAP.text} LIKE '%${content}%' OR ${DB_CONTENT_TABLE_NAME_MAP.file}.${DB_CONTENT_COLUMN_MAP.file} LIKE '%${content}%' OR remarks LIKE '%${content}%')`
  switch (typeSelect) {
    case 'all':
      break
    case 'collect':
      sql = `${sql} AND collect = 'y'`
      countSql = `${countSql} AND collect = 'y'`
      break
    default:
      sql = `${sql} AND type = '${typeSelect}'`
      countSql = `${countSql} AND type = '${typeSelect}'`
      break
  }
  return listDataWithSql(sql, countSql, page)
}

export const deleteData = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM ${DB_MAIN_TABLE_NAME} WHERE id = ${id} AND collect != 'y'`
    logger.debug(`deleteSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export const clearWithTime = (minTimestamp) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM ${DB_MAIN_TABLE_NAME} WHERE collect != 'y' AND update_time < ${minTimestamp}`
    logger.debug(`clearWithTimeSQL: ${sql}`)
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        rows.forEach(row => {
          deleteData(row.id).catch(err => {
            logger.error(`clearWithTime: ${err}`)
          })
        })
        resolve()
      }
    })
  })
}

export const clearWithNumber = (maxNumber) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM ${DB_MAIN_TABLE_NAME} WHERE collect != 'y' ORDER BY update_time DESC LIMIT -1 OFFSET ${maxNumber}`
    logger.debug(`clearWithNumberSQL: ${sql}`)
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        rows.forEach(row => {
          deleteData(row.id).catch(err => {
            logger.error(`clearWithNumber: ${err}`)
          })
        })
        resolve()
      }
    })
  })
}

export const updateCollect = (id, collect) => {
  return new Promise((resolve, reject) => {
    if (!(collect in COLLECT_MAP)) {
      collect = COLLECT_MAP.n
    }
    const sql = `UPDATE ${DB_MAIN_TABLE_NAME} SET collect = '${collect}' WHERE id = ${id}`
    logger.debug(`updateCollectSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        updateUpdateTime(id).then(resolve).catch(reject)
      }
    })
  })
}

export const updateRemarks = (id, remarks) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE ${DB_MAIN_TABLE_NAME} SET remarks = '${remarks}' WHERE id = ${id}`
    logger.debug(`updateRemarksSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        updateUpdateTime(id).then(resolve).catch(reject)
      }
    })
  })
}

export const vacuumDB = () => {
  return new Promise((resolve, reject) => {
    const sql = 'VACUUM'
    logger.debug(`vacuumSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export const clearHistoryData = (options) => {
  return new Promise((resolve, reject) => {
    let sql = `DELETE FROM ${DB_MAIN_TABLE_NAME} WHERE collect != 'y'`
    if (!options.isClearText) {
      sql = `${sql} AND type != 'text'`
    }
    if (!options.isClearImage) {
      sql = `${sql} AND type != 'image'`
    }
    if (!options.isClearFile) {
      sql = `${sql} AND type != 'file'`
    }
    if (options.clearBeforeTime && !options.clearAfterTime) {
      sql = `${sql} AND update_time < ${options.clearBeforeTime}`
    }
    if (options.clearAfterTime && !options.clearBeforeTime) {
      sql = `${sql} AND update_time > ${options.clearAfterTime}`
    }
    logger.debug(`clearHistoryDataSQL: ${sql}`)
    db.run(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
