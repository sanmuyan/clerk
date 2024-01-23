import sqlite3 from 'sqlite3'
import { getPaginator } from '@/utils/paginator'

const sqlite = sqlite3.verbose()
let db = null

export const initDB = (config) => {
  db = new sqlite.Database(config.user_config.db_file)

  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM clerk', (err, res) => {
      if (err) {
        db.exec(config.init_sql, (err) => {
          if (err) {
            console.log(err)
            reject(err)
          } else {
            console.log('数据库初始化成功')
            resolve()
          }
        })
      } else {
        console.log('数据库连接成功', res)
        resolve()
      }
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

export const getData = (content, type) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM clerk WHERE "content" = ? AND "type" = ?', [content, type], (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

export const addData = (current, timestamp, type) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO clerk("content", "timestamp","type") VALUES (?,?,?)', [current, timestamp, type], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const updateData = (id, timestamp) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE clerk SET "timestamp" = ? WHERE id = ?', [timestamp, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}
export const listData = (pageNumber, pageSize, typeSelect) => {
  const page = getPaginator(pageNumber, pageSize)
  let sql = 'SELECT * FROM clerk'
  let countSql = 'SELECT COUNT(*) AS count FROM clerk'
  switch (typeSelect) {
    case 'all':
      break
    case 'collect':
      sql = sql + ' WHERE "collect" = "y"'
      countSql = 'SELECT COUNT(*) AS count FROM clerk WHERE "collect" = "y"'
      break
    default:
      sql = sql + ' WHERE "type" = "' + typeSelect + '"'
      countSql = 'SELECT COUNT(*) AS count FROM clerk WHERE "type" = "' + typeSelect + '"'
      break
  }
  console.log('listSql', sql)
  return new Promise((resolve, reject) => {
    db.all(sql + ' ORDER BY timestamp DESC LIMIT ? OFFSET ?', [page.limit, page.offset], (err, rows) => {
      if (err) {
        reject(err)
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
export const queryData = (pageNumber, pageSize, content, typeSelect) => {
  const page = getPaginator(pageNumber, pageSize)
  let sql = 'SELECT * FROM clerk WHERE type != "image" AND "content" LIKE ' + '"%' + content + '%"'
  let countSql = 'SELECT COUNT(*) AS count FROM clerk WHERE type != "image" AND "content" LIKE ' + '"%' + content + '%"'
  switch (typeSelect) {
    case 'all':
      break
    case 'collect':
      sql = sql + ' AND "collect" = "y"'
      countSql = countSql + ' AND "collect" = "y"'
      break
    default:
      sql = sql + ' AND "type" = "' + typeSelect + '"'
      countSql = countSql + ' AND "type" = "' + typeSelect + '"'
      break
  }
  console.log('querySql', sql)
  return new Promise((resolve, reject) => {
    db.all(sql + ' ORDER BY timestamp DESC LIMIT ? OFFSET ?', [page.limit, page.offset], (err, rows) => {
      if (err) {
        reject(err)
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

export const deleteData = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM clerk WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const clearWithTime = (minTimestamp) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM clerk WHERE ("collect" != "y" OR "collect" IS NULL) AND timestamp < ?', [minTimestamp], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const clearWithNumber = (maxNumber) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM clerk WHERE id IN (SELECT id FROM clerk WHERE "collect" != "y" OR "collect" IS NULL ORDER BY timestamp DESC LIMIT -1 OFFSET ?)', [maxNumber], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const updateCollect = (id, collect) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE clerk SET "collect" = ? WHERE id = ?', [collect, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

export const updateRemarks = (id, remarks) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE clerk SET "remarks" = ? WHERE id = ?', [remarks, id], (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}
