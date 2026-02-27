import { encrypt } from '../../utils/crypto.js'

const authRepository = {

  async upsertUser(tx, profile) {
    return tx.user.upsert({
      where: { githubId: profile.id.toString() },
      update: {
        username: profile.login,
        name: profile.name,
        avatarUrl: profile.avatar_url
      },
      create: {
        githubId: profile.id.toString(),
        username: profile.login,
        name: profile.name,
        avatarUrl: profile.avatar_url
      }
    })
  },

  async upsertAccount(tx, userId, profile, accessToken) {
    const encryptedToken = encrypt(accessToken);

    return tx.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'github',
          providerAccountId: profile.id.toString()
        }
      },
      update: {
        accessToken: encryptedToken
      },
      create: {
        userId,
        provider: 'github',
        providerAccountId: profile.id.toString(),
        accessToken: encryptedToken
      }
    })
  },

  async ensureStreakExists(tx, userId) {
    return tx.activityStreak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        current: 0,
        longest: 0
      }
    })
  }

}

export default authRepository