import prisma from '../../config/prisma.js'
import authRepository from './auth.repository.js'

const authService = {
  async handleGitHubLogin(code) {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('GitHub token exchange failed')
    }

    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch GitHub profile')
    }

    const profile = await profileResponse.json()
    const result = await prisma.$transaction(async (tx) => {

      const user = await authRepository.upsertUser(tx, profile)

      await authRepository.upsertAccount(tx, user.id, profile, accessToken)

      await authRepository.ensureStreakExists(tx, user.id)

      return user
    })

    return result
  }
}

export default authService