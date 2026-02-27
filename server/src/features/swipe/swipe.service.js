import prisma from '../../config/prisma.js'
import redis from '../../config/redis.js'
import swipeRepository from './swipe.repository.js'
import { calculateLeaderboardScore } from '../../utils/scoring.js'

const swipeService = {

  async processSwipe(userId, repoId, type, ipAddress, userAgent) {
    const velocityKey = `swipe:velocity:${userId}`
    const current = await redis.incr(velocityKey)

    if (current === 1) {
      await redis.expire(velocityKey, 60)
    }

    if (current > 30) {
      throw new Error('Swipe rate limit exceeded')
    }

  
    const result = await prisma.$transaction(async (tx) => {

      const existing = await swipeRepository.findExistingSwipe(tx, userId, repoId)
      if (existing) {
        throw new Error('Already swiped this repository')
      }

      const swipe = await swipeRepository.createSwipe(
        tx,
        userId,
        repoId,
        type,
        ipAddress,
        userAgent
      )

      if (type === 'STAR') {

        const repo = await swipeRepository.incrementRepoStats(tx, repoId)
        const owner = await swipeRepository.incrementOwnerStars(tx, repo.ownerId)
        const user = await swipeRepository.incrementUserStars(tx, userId)

        const newScore = calculateLeaderboardScore(user, owner)

        await swipeRepository.updateLeaderboardScore(tx, userId, newScore)

        return { swipe, newScore }
      }

      return { swipe }
    })

    
    if (type === 'STAR') {
      await redis.zAdd('leaderboard', {
        score: result.newScore,
        value: userId
      })
    }

    return result
  }
}

export default swipeService