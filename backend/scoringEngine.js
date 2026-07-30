const PLACEMENT_POINTS = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3,
  6: 2, 7: 1, 8: 1,
};

export function calculateTeamMatchScore(kills, placement) {
  const killPoints = kills;
  const placementPoints = PLACEMENT_POINTS[placement] ?? 0;
  return { killPoints, placementPoints, totalPoints: killPoints + placementPoints };
}

export function aggregateTournamentStandings(teams, matchResults, filterMap) {
  const filtered = filterMap ? matchResults.filter((m) => m.map === filterMap) : matchResults;
  const standings = teams.map((team) => {
    const teamMatches = filtered.filter((m) => m.teamId === team.id);
    let totalKills = 0;
    let totalPlacementPoints = 0;
    let wwcd = 0;

    for (const match of teamMatches) {
      const { killPoints, placementPoints } = calculateTeamMatchScore(match.kills, match.placement);
      totalKills += killPoints;
      totalPlacementPoints += placementPoints;
      if (match.placement === 1) wwcd++;
    }

    return {
      ...team,
      matchesPlayed: teamMatches.length,
      totalKills,
      totalPlacementPoints,
      totalPoints: totalKills + totalPlacementPoints,
      wwcd,
    };
  });

  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
    return b.wwcd - a.wwcd;
  });

  return standings;
}
