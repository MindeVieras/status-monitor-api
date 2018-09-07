
import mysql from 'mysql'
import logger from './winston'

const host = process.env.DB_HOST
const user = process.env.DB_USER
const pass = process.env.DB_PASS
const name = process.env.DB_NAME

const dbConfig = {
  host: host,
  user: user,
  password : pass,
  database: name,
  acquireTimeout: 1000000
}

export class Database {
  constructor() {
    this.connection = mysql.createConnection( dbConfig )
  }

  query( sql, args ) {
    return new Promise( ( resolve, reject ) => {
      this.connection.query( sql, args, ( err, rows ) => {
        if ( err ) {
          // Log db errors
          if (err.sqlMessage) {
            logger.error('database', {
              message: err.sqlMessage
            })
          }
          return reject( err )
        }
        resolve( rows )
      })
    })
  }
  close() {
    return new Promise( ( resolve, reject ) => {
      this.connection.end( err => {
        if ( err )
          return reject( err )
        resolve()
      })
    })
  }
}
