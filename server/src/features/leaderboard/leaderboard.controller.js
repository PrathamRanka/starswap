import leaderboardService from './leaderboard.service.js'

export const getTopUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    const result = await leaderboardService.fetchTopUsers(limit)

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const getUserRank = async (req, res, next) => {
  try {
    const { userId } = req.params

    const result = await leaderboardService.fetchUserRank(userId)

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}