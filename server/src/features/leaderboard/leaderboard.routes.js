import express from 'express'
import { getTopUsers, getUserRank, getTopRepos } from './leaderboard.controller.js'

const router = express.Router()

router.get('/top', getTopUsers)
router.get('/rank/:userId', getUserRank)
router.get('/repos', getTopRepos)

export default router