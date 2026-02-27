import userRepository from './user.repository.js';
import { differenceInDaysUTC } from '../../utils/streak.js';

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const userService = {
  async getPrivateProfile(userId) {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Check if streak is broken
    let isStreakActive = false;
    let currentStreak = 0;
    
    if (user.activityStreak && user.activityStreak.lastActive) {
      const today = new Date();
      const diff = differenceInDaysUTC(today, user.activityStreak.lastActive);
      // If active today (0) or yesterday (1), streak is active
      if (diff <= 1) {
        isStreakActive = true;
        currentStreak = user.activityStreak.current;
      }
    }

    // Mask sensitive tokens/fields if any. Return exactly what the client needs.
    return {
      id: user.id,
      githubId: user.githubId,
      username: user.userName || user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      starsGiven: user.starsGiven,
      starsReceived: user.starsReceived,
      leaderboardScore: user.leaderboardScore,
      trustScore: user.trustScore,
      role: user.role,
      streak: {
        active: isStreakActive,
        current: currentStreak,
        longest: user.activityStreak?.longest || 0,
        lastActive: user.activityStreak?.lastActive || null
      },
      createdAt: user.createdAt
    };
  },

  async getUserRepositories(userId) {
    // Already ordered by createdAt DESC in repository layer
    return userRepository.findUserRepos(userId);
  },

  async getPublicProfileById(targetId) {
    const user = await userRepository.findUserById(targetId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    let currentStreak = 0;
    if (user.activityStreak && user.activityStreak.lastActive) {
      const diff = differenceInDaysUTC(new Date(), user.activityStreak.lastActive);
      if (diff <= 1) {
        currentStreak = user.activityStreak.current;
      }
    }

    // Mask explicit private fields (id, email, trustScore, exact streak breakdown)
    return {
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      starsReceived: user.starsReceived,
      leaderboardScore: user.leaderboardScore,
      currentStreak: currentStreak,
      joinedAt: user.createdAt
    };
  }
};

export default userService;
