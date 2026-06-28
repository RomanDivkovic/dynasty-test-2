import { teamStrength } from "../data/selectors";
import type { GameState, Player, ScheduledGame, Season } from "../types/domain";
import type { RandomSource } from "./random";

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

export function applyScheduledGameResult(season: Season, game: ScheduledGame, homeScore: number, awayScore: number): Season {
  const homeWon = homeScore > awayScore;
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
      scheduled.id === game.id
        ? {
            ...scheduled,
            played: true,
            homeScore,
            awayScore,
          }
        : scheduled,
    ),
  };
}

export function quickSimScheduledGame(season: Season, game: ScheduledGame, players: Player[], rng: RandomSource): Season {
  const homeStrength = teamStrength(players, game.homeTeamId);
  const awayStrength = teamStrength(players, game.awayTeamId);
  const homeBase = 103 + (homeStrength - 78) * 0.7 + 2.5;
  const awayBase = 103 + (awayStrength - 78) * 0.7;
  let homeScore = Math.round(homeBase + (rng.next() - 0.5) * 28);
  let awayScore = Math.round(awayBase + (rng.next() - 0.5) * 28);

  if (homeScore === awayScore) {
    homeScore += rng.next() > 0.5 ? 3 : -2;
  }

  return applyScheduledGameResult(season, game, Math.max(78, homeScore), Math.max(78, awayScore));
}

export function quickSimSeasonToEnd(season: Season, players: Player[], rng: RandomSource): Season {
  return advanceSeasonDay(
    season.schedule
      .filter((game) => !game.played)
      .reduce((currentSeason, game) => quickSimScheduledGame(currentSeason, game, players, rng), season),
  );
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
