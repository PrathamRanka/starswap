import prisma from '../../config/prisma.js'
import redis from '../../config/redis.js'
import swipeRepository from './swipe.repository.js'
import { calculateLeaderboardScore } from '../../utils/scoring.js'
import { differenceInDaysUTC } from '../../utils/streak.js'
import { decrypt } from '../../utils/crypto.js'

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
        // Atomic multiply to avoid read-modify-write race conditions
        await tx.user.update({
          where: { id: userId },
          data: { trustScore: { multiply: 0.9 } }
        })

        await tx.abuseLog.create({
          data: {
            userId,
            reason: 'High swipe velocity (Trust decayed asymptotically)',
            severity: 0.2
          }
        })
      }

      const targetRepo = await tx.repo.findUnique({ where: { id: repoId } })
      if (!targetRepo) {
        throw new Error('Repository does not exist')
      }
      if (targetRepo.ownerId === userId) {
        throw new Error('Self-swiping interaction is forbidden.')
      }

      let swipe;
      try {
        swipe = await swipeRepository.createSwipe(
          tx,
          userId,
          repoId,
          type,
          ipAddress,
          userAgent
        )
      } catch (error) {
        if (error.code === 'P2002') {
          throw new Error('Already swiped this repository')
        }
        throw error;
      }

      if (type !== 'STAR') {
        return { swipe }
      }

      // Fetch user + streak + github account
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { 
          activityStreak: true,
          accounts: { where: { provider: 'github' } }
        }
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
          engagementScore: { increment: trustWeight },
          githubStars: type === 'STAR' ? { increment: 1 } : undefined
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

      return { 
        swipe, 
        newScore, 
        githubAccount: user.accounts?.[0], 
        targetRepo 
      }
    })

    if (type === 'STAR') {
      await redis.zAdd('leaderboard', {
        score: result.newScore,
        value: userId
      })

      // Official GitHub Star Sync
      const token = result.githubAccount?.accessToken;
      const fullName = result.targetRepo?.fullName;

      if (!token) {
        console.error('[GitHubSync] No access token found for user', userId);
      } else if (!fullName) {
        console.error('[GitHubSync] No fullName on targetRepo', repoId);
      } else {
        try {
          const rawToken = decrypt(token);
          if (!rawToken) {
            console.error('[GitHubSync] Token decryption returned null — user must re-login to refresh token');
          } else {
            const res = await fetch(`https://api.github.com/user/starred/${fullName}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${rawToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'StarSwap-App',
                'Content-Length': '0'
              }
            });
            if (res.ok || res.status === 204) {
              console.log(`[GitHubSync] Successfully starred ${fullName} for user ${userId}`);
            } else {
              const body = await res.text();
              console.error(`[GitHubSync] GitHub API returned ${res.status} for ${fullName}:`, body);
            }
          }
        } catch (err) {
          console.error('[GitHubSync] Unexpected error:', err.message);
        }
      }
    }

    return result
  },

  async syncStaleSwipes(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { accounts: true }
      });
      
      const token = user?.accounts?.[0]?.accessToken;
      if (!token) return;

      const rawToken = decrypt(token);
      if (!rawToken) return;

      // Sample 3 random 'STAR' swipes to check per feed generation
      const recentSwipes = await prisma.swipeAction.findMany({
        where: { userId, type: 'STAR' },
        take: 3,
        orderBy: { id: 'desc' },
        include: { repo: true }
      });

      for (const swipe of recentSwipes) {
        if (!swipe.repo?.fullName) continue;

        try {
          const res = await fetch(`https://api.github.com/user/starred/${swipe.repo.fullName}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${rawToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'StarSwap-App'
            }
          });

          // GitHub returns 404 if the repo is NOT starred by the user
          if (res.status === 404) {
            console.log(`[Reverse Sync] Repo ${swipe.repo.fullName} was unstarred on GitHub. Deleting local swipe...`);
            await prisma.swipeAction.delete({
              where: { id: swipe.id }
            });
            // Decrement the repo score slightly to reflect the un-star
            await prisma.repo.update({
              where: { id: swipe.repoId },
              data: {
                githubStars: { decrement: 1 }
              }
            });
          }
        } catch (apiErr) {
          console.error(`[Reverse Sync] Failed API ping for ${swipe.repo.fullName}`, apiErr.message);
        }
      }
    } catch (err) {
      console.error('[Reverse Sync] Critical worker error:', err.message);
    }
  }
}

export default swipeService