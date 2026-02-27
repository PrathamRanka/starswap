import express from 'express'
import { getTopUsers, getUserRank } from './leaderboard.controller.js'

const router = express.Router()

router.get('/top', getTopUsers)
router.get('/rank/:userId', getUserRank)

export default router