import express from 'express'
import {
  redirectToGitHub,
  githubCallback,
  logout
} from './auth.controller.js'

const router = express.Router()

router.get('/github', redirectToGitHub)
router.get('/github/callback', githubCallback)
router.post('/logout', logout)

export default router