import prisma from '../../config/prisma.js';

const adminRepository = {
  async getRecentAbuseLogs(limit, offset) {
    return prisma.abuseLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            trustScore: true,
            isBlocked: true
          }
        }
      }
    });
  },

  async getFlaggedUsers(limit) {
    // Users with low trust score or existing blocks
    return prisma.user.findMany({
      where: {
        OR: [
          { trustScore: { lt: 0.7 } },
          { isBlocked: true }
        ]
      },
      take: limit,
      orderBy: { trustScore: 'asc' },
      select: {
        id: true,
        username: true,
        trustScore: true,
        isBlocked: true,
        _count: {
          select: { abuseLogs: true }
        }
      }
    });
  },

  async updateUserBlockStatus(userId, isBlocked) {
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked }
    });
  },

  async resetUserTrustScore(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { trustScore: 1.0 }
    });
  },
  
  async findUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }
};

export default adminRepository;
