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
      if (current > 20) {
        const penaltyUser = await tx.user.findUnique({
          where: { id: userId },
          select: { trustScore: true }
        })

        const newTrust = Math.max(penaltyUser.trustScore - 0.05, 0.1)

        await tx.user.update({
          where: { id: userId },
          data: { trustScore: newTrust }
        })

        await tx.abuseLog.create({
          data: {
            userId,
            reason: 'High swipe velocity',
            severity: 0.2
          }
        })
      }

      // Prevent duplicate swipe
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

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            trustScore: true,
            starsGiven: true,
            streakCount: true
          }
        })

        const trustWeight = user.trustScore

        const repo = await tx.repo.update({
          where: { id: repoId },
          data: {
            engagementScore: { increment: trustWeight }
          }
        })

        const owner = await tx.user.update({
          where: { id: repo.ownerId },
          data: {
            starsReceived: { increment: 1 }
          }
        })

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            starsGiven: { increment: 1 },
            lastSwipeAt: new Date()
          }
        })

        const newScore = calculateLeaderboardScore(updatedUser, owner)

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