export function calculateLeaderboardScore(user, owner) {
  return (
    user.starsGiven * 0.5 +
    owner.starsReceived * 2 +
    user.streakCount * 3 +
    user.trustScore * 5
  )
}