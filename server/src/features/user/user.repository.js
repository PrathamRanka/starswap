import prisma from '../../config/prisma.js';

const userRepository = {
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        activityStreak: true
      }
    });
  },

  async findUserRepos(userId, limit = 20, cursorId = null) {
    let cursorObj = undefined;
    if (cursorId) {
      cursorObj = { id: cursorId };
    }

    const repos = await prisma.repo.findMany({
      where: { ownerId: userId },
      take: limit,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      orderBy: { createdAt: 'desc' }
    });

    const nextCursor = repos.length === limit ? repos[repos.length - 1].id : null;
    return { repos, nextCursor };
  }
};

export default userRepository;
