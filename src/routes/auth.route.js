
import express from 'express'

import * as authModel from '../models/auth.model'

const router = express.Router()

router.route('/')
  .post( (req, res) => {
    authModel.authenticate(req, res)
  })

export default router
