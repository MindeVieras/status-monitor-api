
import bcrypt from 'bcrypt'
import validator from 'validator'
import moment from 'moment'

import { Database } from '../config/db'

import { usersConstants } from '../constants'
import { makeInitials } from '../helpers/utils'

let conn = new Database()

// Gets users list
export function getList(req, res){

  let users

  conn.query(`SELECT id, username, email FROM users`)
    .then( rows => {
      users = rows.map(u => {
        const { id, username, email } = u
        const initials = makeInitials(username, email)

        return { id, initials, username, email }
      })
      res.json({ack:`ok`, msg:`Users list`, list: users})
    })
    .catch( err => {
      let msg = err.sqlMessage ? err.sqlMessage : err
      res.json({ack:`err`, msg})
    })
}

// Creates user
export function create(req, res) {

  const { username, password, email } = req.body

  // vlaidate username
  if (!username || validator.isEmpty(username))
    res.json({ack:`err`, msg:`Username is required`})
  else if (!validator.isAlphanumeric(username))
    res.json({ack:`err`, msg:`Username must be alphanumeric only`})
  else if (validator.isLength(username, {min:0, max:4}))
    res.json({ack:`err`, msg:`Username must be at least 5 chars long`})

  // vlaidate password
  else if (!password || validator.isEmpty(password))
    res.json({ack:`err`, msg:`Password is required`})
  else if (validator.isLength(password, {min:0, max:4}))
    res.json({ack:`err`, msg:`Password must be at least 5 chars long`})

  // vlaidate email
  else if (!email || validator.isEmpty(email))
    res.json({ack:`err`, msg:`Email is required`})
  else if (email && !validator.isEmail(email))
    res.json({ack:`err`, msg:`Email must be valid`})

  else {

    let userData

    // check if user exists
    conn.query(`SELECT * FROM users WHERE username = ? LIMIT 1`, username)
      .then(rows => {
        if (rows.length)
          throw `Username already taken`

        else
          // hash password
          return bcrypt.hash(password, 10)
      })

      .then(hash => {

        // Save user to database
        userData = {
          username,
          email,
          password: hash
        }
        return conn.query(`INSERT INTO users set ? `, userData)
      })

      .then(row => {
        // remove password hash from response
        let { password, ...userCopy } = userData
        let initials = makeInitials(userData.username, userData.email)
        let user = { id: row.insertId, initials, ...userCopy }

        res.json({ack:`ok`, msg:`User saved`, user})
      })

      .catch( err => {
        let msg = err.sqlMessage ? err.sqlMessage : err
        res.json({ack:`err`, msg})
      })
  }
}

// Gets one user
export function getOne(req, res){


  const { username } = req.params

  conn.query(`SELECT * FROM users WHERE username = ?`, username)
    .then( rows => {
      if (rows.length) {

        let initials = require('../helpers/utils').makeInitials(rows[0].username, rows[0].display_name)

        let user = {
          id: rows[0].id,
          initials,
          username: rows[0].username,
          display_name: rows[0].display_name,
          email: rows[0].email
        }

        res.json({ack:'ok', msg: 'One user', data: user})

      }
      else {
        throw 'No such User'
      }
    })
    .catch(err => {
      let msg = err.sqlMessage ? err.sqlMessage : err
      res.json({ack:'err', msg})
    })
}

// Deletes user
export function _delete(req, res){
  if (typeof req.params.id != 'undefined' && !isNaN(req.params.id) && req.params.id > 0 && req.params.id.length) {

    const { id } = req.params

    conn.query(`DELETE FROM users WHERE id = ?`, id)
      .then( rows => {
        if (rows.affectedRows === 1)
          // Return success
          res.json({ack:`ok`, msg:`User deleted`, id})
        else
          throw `No such user`
      })
      .catch( err => {
        let msg = err.sqlMessage ? err.sqlMessage : err
        res.json({ack:`err`, msg})
      })

  } else {
    res.json({ack:`err`, msg:`bad parameter`})
  }
}
