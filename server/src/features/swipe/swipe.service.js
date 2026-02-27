import prisma from '../../config/prisma.js'
import redis from '../../config/redis.js'
import swipeRepository from './swipe.repository.js'
import { calculateLeaderboardScore } from '../../utils/scoring.js'
import { differenceInDaysUTC } from '../../utils/streak.js'

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

        // Asymptotic curve instead of direct linear drop
        const newTrust = Math.max(0.05, penaltyUser.trustScore * 0.9)

        await tx.user.update({
          where: { id: userId },
          data: { trustScore: newTrust }
        })

        await tx.abuseLog.create({
          data: {
            userId,
            reason: 'High swipe velocity (Trust decayed asymptotically)',
            severity: 0.2
          }
        })
      }

      const existing = await swipeRepository.findExistingSwipe(tx, userId, repoId)
      if (existing) {
        throw new Error('Already swiped this repository')
      }
      const targetRepo = await tx.repo.findUnique({ where: { id: repoId } })
      if (!targetRepo) {
        throw new Error('Repository does not exist')
      }
      if (targetRepo.ownerId === userId) {
        throw new Error('Self-swiping interaction is forbidden.')
      }

      const swipe = await swipeRepository.createSwipe(
        tx,
        userId,
        repoId,
        type,
        ipAddress,
        userAgent
      )

      if (type !== 'STAR') {
        return { swipe }
      }

      // Fetch user + streak
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { activityStreak: true }
      })

      const today = new Date()

      let streakIncrement = false

      if (!user.activityStreak) {
        await tx.activityStreak.create({
          data: {
            userId,
            current: 1,
            longest: 1,
            lastActive: today
          }
        })
        streakIncrement = true
      } else {
        const diff = user.activityStreak.lastActive
          ? differenceInDaysUTC(today, user.activityStreak.lastActive)
          : null

        if (diff === 1) {
          const newCurrent = user.activityStreak.current + 1
          const newLongest = Math.max(newCurrent, user.activityStreak.longest)

          await tx.activityStreak.update({
            where: { userId },
            data: {
              current: newCurrent,
              longest: newLongest,
              lastActive: today
            }
          })

          streakIncrement = true
        }

        if (diff > 1) {
          await tx.activityStreak.update({
            where: { userId },
            data: {
              current: 1,
              lastActive: today
            }
          })

          streakIncrement = true
        }

        if (diff === 0) {
          // Already counted today — do nothing
        }
      }

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
          lastSwipeAt: today,
          streakCount: streakIncrement
            ? { increment: 1 }
            : undefined
        }
      })

      const finalUser = await tx.user.findUnique({
        where: { id: userId }
      })

      const newScore = calculateLeaderboardScore(finalUser, owner)

      await tx.user.update({
        where: { id: userId },
        data: { leaderboardScore: newScore }
      })

      return { swipe, newScore }
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