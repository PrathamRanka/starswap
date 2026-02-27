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

  async findUserRepos(userId) {
    return prisma.repo.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }
};

export default userRepository;
