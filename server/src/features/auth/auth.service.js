import axios from 'axios'
import prisma from '../../config/prisma.js'
import authRepository from './auth.repository.js'

const authService = {
  async handleGitHubLogin(code) {
    
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    )

    const accessToken = tokenRes.data.access_token

    if (!accessToken) {
      throw new Error('GitHub token exchange failed')
    }

    
    const profileRes = await axios.get(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const profile = profileRes.data


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