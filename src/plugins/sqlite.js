import sqlite3 from 'sqlite3'
import { getPaginator } from '@/utils/paginator'
import {
  DB_CONTENT_COLUMN_MAP,
  DB_CONTENT_TABLE_NAME_MAP,
  DB_IMAGE_CHECKSUMS_COLUMN,
  DB_MAIN_TABLE_NAME
} from '@/constant'

const sqlite = sqlite3.verbose()
let db = null

export const initDB = (config) => {
  db = new sqlite.Database(config.user_config.db_file)

  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME}`, (err, res) => {
      if (err) {
        db.exec(config.init_sql, (err) => {
          if (err) {
            console.log(err)
            reject(err)
          } else {
            console.log('数据库初始化成功')
          }
        })
      } else {
        console.log('数据库连接成功', res)
      }
      resolve()
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err)
        }
      })
    })
  })
}

const getCount = (sql) => {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

const getContentWithRow = (row) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${DB_CONTENT_TABLE_NAME_MAP[row.type]} WHERE clerk_id = ?`, [row.id], (err, res) => {
      if (err) {
        reject(err)
      }
      if (res) {
        res.content = res[DB_CONTENT_COLUMN_MAP[row.type]]
      } else {
        if (row.collect !== 'y') {
          deleteData(row.id).then()
        }
        reject(new Error(`content not found: ${row.id}, ${row.type}`))
      }
      resolve(res)
    })
  })
}

export const getImageChecksumsWithChecksums = (imageChecksums, type) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${DB_CONTENT_TABLE_NAME_MAP[type]} WHERE "${DB_IMAGE_CHECKSUMS_COLUMN}" = ?`, [imageChecksums], (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

export const getContentWithContent = (content, type) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${DB_CONTENT_TABLE_NAME_MAP[type]} WHERE ${DB_CONTENT_COLUMN_MAP[type]} = ?`, [content], (err, res) => {
      if (err) {
        reject(err)
      }
      if (res) {
        res.content = res[DB_CONTENT_COLUMN_MAP[type]]
      }
      resolve(res)
    })
  })
}

export const addImageData = (content, type, imageChecksums) => {
  const timestamp = Math.floor(Date.now() / 1000)
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ${DB_MAIN_TABLE_NAME}(create_time,update_time,type) VALUES (?,?,?)`, [timestamp, timestamp, type], (err) => {
      if (err) {
        reject(err)
      }
      db.get('SELECT last_insert_rowid()', (err, res) => {
        if (err) {
          reject(err)
        }
        db.run(`INSERT INTO ${DB_CONTENT_TABLE_NAME_MAP[type]}(clerk_id,${DB_CONTENT_COLUMN_MAP[type]},${DB_IMAGE_CHECKSUMS_COLUMN}) VALUES (?,?,?)`, [res['last_insert_rowid()'], content, imageChecksums], (err) => {
          if (err) {
            reject(err)
          }
        })
      })
      resolve()
    })
  })
}
export const addData = (content, type) => {
  const timestamp = Math.floor(Date.now() / 1000)
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ${DB_MAIN_TABLE_NAME}(create_time,update_time,type) VALUES (?,?,?)`, [timestamp, timestamp, type], (err) => {
      if (err) {
        reject(err)
      }
      db.get('SELECT last_insert_rowid()', (err, res) => {
        if (err) {
          reject(err)
        }
        db.run(`INSERT INTO ${DB_CONTENT_TABLE_NAME_MAP[type]}(clerk_id,${DB_CONTENT_COLUMN_MAP[type]}) VALUES (?,?)`, [res['last_insert_rowid()'], content], (err) => {
          if (err) {
            reject(err)
          }
        })
      })
      resolve()
    })
  })
}

export const updateUpdateTime = (id) => {
  const timestamp = Math.floor(Date.now() / 1000)
  return new Promise((resolve, reject) => {
    db.run(`UPDATE ${DB_MAIN_TABLE_NAME} SET update_time = ? WHERE id = ?`, [timestamp, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

const listDataWithSql = (sql, countSql, page) => {
  return new Promise((resolve, reject) => {
    db.all(`${sql} ORDER BY update_time DESC LIMIT ? OFFSET ?`, [page.limit, page.offset], async (err, rows) => {
      if (err) {
        reject(err)
      }
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
      })
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
      countSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME} WHERE collect = 'y'`
      break
    default:
      sql = `${sql} WHERE type = '${typeSelect}'`
      countSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME} WHERE type = '${typeSelect}'`
      break
  }
  console.log('listSql', sql)
  return listDataWithSql(sql, countSql, page)
}
export const queryData = (pageNumber, pageSize, content, typeSelect) => {
  const page = getPaginator(pageNumber, pageSize)
  let sql = `SELECT ${DB_MAIN_TABLE_NAME}.* FROM ${DB_MAIN_TABLE_NAME} LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.text} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.text}.clerk_id  LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.image} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.image}.clerk_id WHERE (${DB_CONTENT_TABLE_NAME_MAP.text}.${DB_CONTENT_COLUMN_MAP.text} LIKE '%${content}%' OR remarks LIKE '%${content}%')`
  let countSql = `SELECT COUNT(*) AS count FROM ${DB_MAIN_TABLE_NAME} LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.text} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.text}.clerk_id  LEFT JOIN ${DB_CONTENT_TABLE_NAME_MAP.image} ON ${DB_MAIN_TABLE_NAME}.id = ${DB_CONTENT_TABLE_NAME_MAP.image}.clerk_id WHERE (${DB_CONTENT_TABLE_NAME_MAP.text}.${DB_CONTENT_COLUMN_MAP.text} LIKE '%${content}%' OR remarks LIKE '%${content}%')`
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
  console.log('querySql', sql)
  return listDataWithSql(sql, countSql, page)
}

export const deleteData = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${DB_MAIN_TABLE_NAME} WHERE id = ?`, [id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const clearWithTime = (minTimestamp) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${DB_MAIN_TABLE_NAME} WHERE (collect != 'y' OR collect != NULL) AND update_time < ?`, [minTimestamp], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const clearWithNumber = (maxNumber) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${DB_MAIN_TABLE_NAME} WHERE id IN (SELECT id FROM ${DB_MAIN_TABLE_NAME} WHERE (collect != 'y' OR collect IS NULL) ORDER BY update_time DESC LIMIT -1 OFFSET ?)`, [maxNumber], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const updateCollect = (id, collect) => {
  return new Promise((resolve, reject) => {
    updateUpdateTime(id).then().catch(err => {
      reject(err)
    })
    db.run(`UPDATE ${DB_MAIN_TABLE_NAME} SET collect = ? WHERE id = ?`, [collect, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const updateRemarks = (id, remarks) => {
  return new Promise((resolve, reject) => {
    updateUpdateTime(id).then().catch(err => {
      reject(err)
    })
    db.run(`UPDATE ${DB_MAIN_TABLE_NAME} SET remarks = ? WHERE id = ?`, [remarks, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const vacuumDB = (id, remarks) => {
  return new Promise((resolve, reject) => {
    db.run('VACUUM', (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}
