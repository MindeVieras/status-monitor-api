
import express from 'express'

import { isAuthed } from '../helpers/authenticate'
import {
  create,
  getList,
  getOne,
  _delete
} from '../models/users.model'

const router = express.Router()

router.post('/create', isAuthed, create)
router.get('/get-list', isAuthed, getList)
router.get('/get-one/:username', isAuthed, getOne)
router.delete('/delete/:id', isAuthed, _delete)

export default router
