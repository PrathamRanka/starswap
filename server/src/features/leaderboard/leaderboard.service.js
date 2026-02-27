import redis from '../../config/redis.js'
import prisma from '../../config/prisma.js'
import leaderboardRepository from './leaderboard.repository.js'

const leaderboardService = {

  async fetchTopUsers(limit) {
    const results = await redis.zRangeWithScores(
      'leaderboard',
      0,
      limit - 1,
      { REV: true }
    )

    const userIds = results.map(r => r.value)

    const users = await leaderboardRepository.findUsersByIds(
      prisma,
      userIds
    )

    // Maintain Redis order
    const ordered = userIds.map(id =>
      users.find(u => u.id === id)
    )

    return ordered
  },

  async fetchUserRank(userId) {
    const rank = await redis.zRevRank('leaderboard', userId)

    if (rank === null) return { rank: null }

    return { rank: rank + 1 }
  },

  async fetchTopRepos(limit = 10) {
    const repos = await prisma.repo.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        githubStars: 'desc'
      },
      take: limit,
      include: {
        owner: {
          select: {
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    // Add a rank index for the frontend to consume
    return repos.map((repo, index) => ({
      ...repo,
      rank: index + 1
    }))
  }

}

export default leaderboardService