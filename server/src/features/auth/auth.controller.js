import authService from './auth.service.js'

export const redirectToGitHub = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = process.env.GITHUB_CALLBACK_URL

  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=read:user user:email`

  res.redirect(githubUrl)
}

export const githubCallback = async (req, res, next) => {
  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ message: 'Missing code' })
    }

    const user = await authService.handleGitHubLogin(code)

    req.session.userId = user.id
    req.session.username = user.username

    res.redirect(`${process.env.FRONTEND_URL}/user`)
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
}