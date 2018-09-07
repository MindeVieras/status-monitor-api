
import express from 'express'

import authRoutes from './auth.route'
import usersRoutes from './users.route'
import frontRoutes from './front.route'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/front', frontRoutes)

export default router
