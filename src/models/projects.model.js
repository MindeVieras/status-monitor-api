
import validator from 'validator'
import moment from 'moment'

import { Database } from '../config/db'

import { projectsConstants } from '../constants'
import { getIp } from '../helpers/dns'

let conn = new Database()

// Gets projects list
export function getList(req, res){

  let projects

  let sql = `SELECT
                p.*, pip.ip AS ip
              FROM project AS p
                LEFT JOIN project_ip AS pip ON pip.id = p.ip_id`
  conn.query(sql)
    .then( rows => {
      projects = rows
      res.json({ack:`ok`, msg:`Projects list`, list: projects})
    })
    .catch( err => {
      let msg = err.sqlMessage ? err.sqlMessage : err
      res.json({ack:`err`, msg})
    })
}

// Creates project
export function create(req, res) {

  const { uid } = req.app.get('user')
  const { name, domain, interval, status } = req.body

  const minInterval = projectsConstants.MIN_INTERVAL
  const maxInterval = projectsConstants.MAX_INTERVAL

  // vlaidate name
  if (!name || validator.isEmpty(name))
    res.json({ack:`err`, msg:`Name is required`})

  // vlaidate domain
  else if (!domain || validator.isEmpty(domain))
    res.json({ack:`err`, msg:`Domain is required`})
  else if (domain && !validator.isFQDN(domain))
    res.json({ack:`err`, msg:`Domain must be valid`})

  // vlaidate interval
  else if (!interval || validator.isEmpty(interval))
    res.json({ack:`err`, msg:`Interval is required`})
  else if (interval && !validator.isInt(interval, {
    min: minInterval,
    max: maxInterval
  }))
    res.json({ack:`err`, msg:`Interval must be integer in seconds bteween ${minInterval} and ${maxInterval}`})

  else {

    let projectData

    // check if project name exists
    conn.query(`SELECT * FROM project WHERE name = ? LIMIT 1`, name)
      .then(rows => {
        if (rows.length)
          throw `Project name already exists`

        else {
          // Save project to database
          projectData = {
            name,
            domain,
            interval: parseInt(interval),
            author: uid,
            status: status ? 1 : 0,
            created: Math.round(Date.now() / 1000) // timestamp in seconds
          }
          return conn.query(`INSERT INTO project set ? `, projectData)
        }
      })

      .then(row => {

        projectData = { id: row.insertId, ...projectData }

        // Get ip from domain
        return getIp(domain)
      })

      .then(ip => {

        projectData = { ip, ...projectData }

        // Save IP to database
        let ipData = {
          project_id: projectData.id,
          ip,
          created: Math.round(Date.now() / 1000) // timestamp in seconds
        }

        return conn.query(`INSERT INTO project_ip set ? `, ipData)
      })

      .then(row => {

        const ip_id = row.insertId

        projectData = { ip_id, ...projectData }

        // Update project ip_id
        return conn.query(`UPDATE project SET ip_id = ? WHERE id = ?`, [ip_id, projectData.id])
      })

      .then(_ => {

        res.json({ack:`ok`, msg:`Project saved`, project: projectData})
      })

      .catch( err => {
        let msg = err.sqlMessage ? err.sqlMessage : err
        res.json({ack:`err`, msg})
      })
  }
}

// Refreshes project
export function refresh(req, res) {

  const { id } = req.params

  let projectData

  // Firstly check if project available
  let sql = `SELECT
                p.*, pip.ip AS ip
              FROM project AS p
                LEFT JOIN project_ip AS pip ON pip.id = p.ip_id
              WHERE p.id = ? LIMIT 1`

  conn.query(sql, id)
    .then( rows => {
      if (rows.length) {
        projectData = rows[0]

        // Refresh IP
        return refreshIp(id, projectData.domain, projectData.ip)
      }
      else {
        throw 'No such project'
      }
    })

    .then(data => {

      // if refresh IP
      if (data) {
        projectData.ip = data.ip
        projectData.ip_id = data.ip_id
      }

      res.json({ack:'ok', msg: 'Project refresh done', project: projectData})

    })

    .catch(err => {
      let msg = err.sqlMessage ? err.sqlMessage : err
      res.json({ack:'err', msg})
    })
}

// refresh project IP
export function refreshIp(project_id, domain, oldIp) {

  return new Promise((resolve, reject) => {

    let ipData = {
      project_id,
      ip: oldIp,
      created: Math.round(Date.now() / 1000) // timestamp in seconds
    }

    getIp(domain)
      .then(ip => {

        // Set new IP
        ipData.ip = ip

        // If IP's matches return false
        if (oldIp === ip) {
          resolve(false)
        }
        else {
          // update new IP
          let sql = `INSERT INTO project_ip set ?`
          return conn.query(sql, ipData)
        }
      })

      .then(row => {

        const ip_id = row.insertId

        ipData = { ip_id, ...ipData }

        // Update project ip_id
        let sql = `UPDATE project SET ip_id = ? WHERE id = ?`
        return conn.query(sql, [ip_id, project_id])
      })

      .then(row => {
        resolve({
          ip: ipData.ip,
          ip_id: ipData.ip_id
        })
      })

      .catch(err => {
        reject(err)
      })

  })
}

// // Gets one user
// export function getOne(req, res){


//   const { username } = req.params

//   conn.query(`SELECT * FROM users WHERE username = ?`, username)
//     .then( rows => {
//       if (rows.length) {

//         let initials = require('../helpers/utils').makeInitials(rows[0].username, rows[0].display_name)

//         let user = {
//           id: rows[0].id,
//           initials,
//           username: rows[0].username,
//           display_name: rows[0].display_name,
//           email: rows[0].email
//         }

//         res.json({ack:'ok', msg: 'One user', data: user})

//       }
//       else {
//         throw 'No such User'
//       }
//     })
//     .catch(err => {
//       let msg = err.sqlMessage ? err.sqlMessage : err
//       res.json({ack:'err', msg})
//     })
// }

// // Deletes user
// export function _delete(req, res){
//   if (typeof req.params.id != 'undefined' && !isNaN(req.params.id) && req.params.id > 0 && req.params.id.length) {

//     const { id } = req.params

//     conn.query(`DELETE FROM users WHERE id = ?`, id)
//       .then( rows => {
//         if (rows.affectedRows === 1)
//           // Return success
//           res.json({ack:`ok`, msg:`User deleted`, id})
//         else
//           throw `No such user`
//       })
//       .catch( err => {
//         let msg = err.sqlMessage ? err.sqlMessage : err
//         res.json({ack:`err`, msg})
//       })

//   } else {
//     res.json({ack:`err`, msg:`bad parameter`})
//   }
// }
