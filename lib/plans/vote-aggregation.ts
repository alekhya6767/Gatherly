export type VoteLike = {
  eventSlug: string;
  value: 1 | -1;
};

export function aggregateVoteTotal(votes: readonly VoteLike[], eventSlug: string) {
  return votes
    .filter((v) => v.eventSlug === eventSlug)
    .reduce((sum, v) => sum + v.value, 0);
}

export function aggregateVoteCounts(votes: readonly VoteLike[], eventSlug: string) {
  const filtered = votes.filter((v) => v.eventSlug === eventSlug);
  return {
    up: filtered.filter((v) => v.value === 1).length,
    down: filtered.filter((v) => v.value === -1).length,
  };
}
