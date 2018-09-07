
import jwt from 'jsonwebtoken'

import { token_secret_key } from '../config'

// check if user authenticated
export function isAuthed(req, res, next) {
  doAuth(req, res, next)
}

function doAuth(req, res, next) {

  const bearerHeader = req.headers['authorization']

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    jwt.verify(bearerToken, token_secret_key, (err, decoded) => {

      if (err)
        res.json({ack:'err', msg: err.message})

      else {

        const { id } = decoded

        req.app.set('user', { uid: id })
        next()

      }
    })
  }
  else {
    res.json({ack:'err', msg: 'Not authorized'})
  }
}
