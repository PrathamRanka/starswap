const swipeRepository = {

  findExistingSwipe(tx, userId, repoId) {
    return tx.swipeAction.findUnique({
      where: {
        userId_repoId: { userId, repoId }
      }
    })
  },

  createSwipe(tx, userId, repoId, type, ipAddress, userAgent) {
    return tx.swipeAction.create({
      data: {
        userId,
        repoId,
        type,
        ipAddress,
        userAgent
      }
    })
  },

  incrementRepoStats(tx, repoId) {
    return tx.repo.update({
      where: { id: repoId },
      data: {
        engagementScore: { increment: 1 },
        totalSwipeCount: { increment: 1 }
      }
    })
  },

  incrementOwnerStars(tx, ownerId) {
    return tx.user.update({
      where: { id: ownerId },
      data: {
        starsReceived: { increment: 1 }
      }
    })
  },

  incrementUserStars(tx, userId) {
    return tx.user.update({
      where: { id: userId },
      data: {
        starsGiven: { increment: 1 }
      }
    })
  },

  updateLeaderboardScore(tx, userId, score) {
    return tx.user.update({
      where: { id: userId },
      data: { leaderboardScore: score }
    })
  }
}

export default swipeRepository