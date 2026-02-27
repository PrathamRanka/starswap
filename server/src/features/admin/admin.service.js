import adminRepository from './admin.repository.js';

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const adminService = {
  async fetchAbuseLogs(limit = 20, offset = 0) {
    const logs = await adminRepository.getRecentAbuseLogs(limit, offset);
    return logs;
  },

  async fetchFlaggedUsers(limit = 50) {
    const users = await adminRepository.getFlaggedUsers(limit);
    return users.map(u => ({
      id: u.id,
      username: u.username,
      trustScore: u.trustScore,
      isBlocked: u.isBlocked,
      abuseLogCount: u._count.abuseLogs
    }));
  },

  async toggleUserBlock(adminId, targetUserId) {
    const user = await adminRepository.findUserById(targetUserId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.role === 'ADMIN') {
      throw new CustomError('Cannot block another admin', 403);
    }

    const newStatus = !user.isBlocked;
    const updatedUser = await adminRepository.updateUserBlockStatus(targetUserId, newStatus);

    return {
      userId: updatedUser.id,
      isBlocked: updatedUser.isBlocked
    };
  },

  async resetUserTrust(adminId, targetUserId) {
    const user = await adminRepository.findUserById(targetUserId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const updatedUser = await adminRepository.resetUserTrustScore(targetUserId);

    return {
      userId: updatedUser.id,
      trustScore: updatedUser.trustScore
    };
  }
};

export default adminService;
