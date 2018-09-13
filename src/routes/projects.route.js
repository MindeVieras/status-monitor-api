
import express from 'express'

import { isAuthed } from '../helpers/authenticate'
import {
  getList,
  create, refresh,
  // getOne,
  // _delete
} from '../models/projects.model'

const router = express.Router()

router.get('/', isAuthed, getList)
router.post('/', isAuthed, create)
router.get('/refresh/:id', isAuthed, refresh)
// router.get('/get-one/:id', isAuthed, getOne)
// router.delete('/delete/:id', isAuthed, _delete)

export default router
