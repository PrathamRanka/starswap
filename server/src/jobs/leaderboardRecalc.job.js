import prisma from '../config/prisma.js'
import redis from '../config/redis.js'

export const reconcileLeaderboard = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, leaderboardScore: true }
  })

  const pipeline = redis.multi()

  for (const user of users) {
    pipeline.zAdd('leaderboard', {
      score: user.leaderboardScore,
      value: user.id
    })
  }

  await pipeline.exec()

  console.log('Leaderboard reconciled')
}