import type { GameState, Season } from "../types/domain";

export function applyGameResult(season: Season, game: GameState): Season {
  const homeWon = game.homeStats.points > game.awayStats.points;
  const winnerId = homeWon ? game.homeTeamId : game.awayTeamId;
  const loserId = homeWon ? game.awayTeamId : game.homeTeamId;

  return {
    ...season,
    records: {
      ...season.records,
      [winnerId]: {
        wins: (season.records[winnerId]?.wins ?? 0) + 1,
        losses: season.records[winnerId]?.losses ?? 0,
      },
      [loserId]: {
        wins: season.records[loserId]?.wins ?? 0,
        losses: (season.records[loserId]?.losses ?? 0) + 1,
      },
    },
    schedule: season.schedule.map((scheduled) =>
      scheduled.homeTeamId === game.homeTeamId && scheduled.awayTeamId === game.awayTeamId && !scheduled.played
        ? {
            ...scheduled,
            played: true,
            homeScore: game.homeStats.points,
            awayScore: game.awayStats.points,
          }
        : scheduled,
    ),
  };
}

export function advanceSeasonDay(season: Season): Season {
  const hasUnplayedToday = season.schedule.some((game) => game.day === season.currentDay && !game.played);
  if (hasUnplayedToday) return season;
  const remainingDays = season.schedule.filter((game) => !game.played).map((game) => game.day);
  return {
    ...season,
    currentDay: remainingDays.length ? Math.min(...remainingDays) : season.currentDay,
  };
}

export function standingsRows(season: Season) {
  return Object.entries(season.records)
    .map(([teamId, record]) => ({
      teamId,
      ...record,
      pct: record.wins + record.losses ? record.wins / (record.wins + record.losses) : 0,
    }))
    .sort((a, b) => b.pct - a.pct || b.wins - a.wins);
}
