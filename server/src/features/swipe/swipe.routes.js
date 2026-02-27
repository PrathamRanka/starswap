import express from 'express'
import { handleSwipe } from './swipe.controller.js'
import authMiddleware from '../../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', authMiddleware, handleSwipe)

export default router