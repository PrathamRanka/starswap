import prisma from '../../config/prisma.js';

const repoRepository = {
  async createRepo(data) {
    return prisma.repo.create({ data });
  },

  async findRepoByGithubId(githubId) {
    return prisma.repo.findUnique({
      where: { githubId }
    });
  },

  async findRepoById(id) {
    return prisma.repo.findUnique({
      where: { id }
    });
  },

  async updateRepoStars(id, newStars) {
    return prisma.repo.update({
      where: { id },
      data: { githubStars: newStars }
    });
  },

  async getFeed(userId, limit, cursorScore, cursorId) {
    // To achieve scalable feed generation without extensive left joins,
    // we use a cursor-based approach ordered by visibilityScore DESC, id DESC.
    // We also make sure the user is not the owner, and has not already swiped it.
    
    // For large scale, a left join / NOT EXISTS on SwipeAction can get slow,
    // but Prisma supports relational filters. We use `none` on the swipes relation.
    
    const whereClause = {
      isActive: true,
      ownerId: { not: userId },
      swipes: {
        none: { userId }
      }
    };

    let cursorObj = undefined;
    if (cursorId) {
      cursorObj = { id: cursorId };
    }

    return prisma.repo.findMany({
      where: whereClause,
      take: limit,
      skip: cursorObj ? 1 : 0,
      cursor: cursorObj,
      orderBy: [
        { visibilityScore: 'desc' },
        { id: 'desc' }
      ]
    });
  }
};

export default repoRepository;
