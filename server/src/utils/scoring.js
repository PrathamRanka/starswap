export function calculateLeaderboardScore(user, owner) {
  const participationWeight = Math.log10(user.starsGiven + 1) * 0.4;
  const authorityWeight = Math.log2(owner.starsReceived + 1) * 0.6;
  const consistencyWeight = user.streakCount * 0.3;

  return (participationWeight + authorityWeight + consistencyWeight) * user.trustScore;
}

export function calculateVisibilityScore(engagementScore, createdAt) {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.log2(engagementScore + 1) / Math.pow(Math.max(1, ageInHours + 2), 1.5);
}