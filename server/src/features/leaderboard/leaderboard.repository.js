const leaderboardRepository = {

  async findUsersByIds(prisma, userIds) {
    return prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        leaderboardScore: true
      }
    })
  },

  async findAllUsersForRecalc(prisma) {
    return prisma.user.findMany({
      select: {
        id: true,
        leaderboardScore: true
      }
    })
  }

}

export default leaderboardRepository