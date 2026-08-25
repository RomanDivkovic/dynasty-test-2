import { getTeam, teamStrength } from "../data/selectors";
import { createAiGamePlan } from "../ai/coachAI";
import type {
  Conference,
  GameState,
  PlayerBoxScore,
  PlayerSeasonStats,
  PlayoffBracket,
  PlayoffSeries,
  Player,
  ScheduledGame,
  Season,
  Team,
} from "../types/domain";
import type { RandomSource } from "./random";
import { createGame, simulateToFinal } from "./engine";

export function emptyPlayerSeasonStats(playerId: string): PlayerSeasonStats {
  return {
    playerId,
    gamesPlayed: 0,
    minutes: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fga: 0,
    fgm: 0,
    threePa: 0,
    threePm: 0,
    fta: 0,
    ftm: 0,
  };
}

export function accumulatePlayerSeasonStats(
  existing: Record<string, PlayerSeasonStats>,
  boxScores: Record<string, PlayerBoxScore>,
): Record<string, PlayerSeasonStats> {
  const next = { ...existing };
  for (const box of Object.values(boxScores)) {
    if (box.minutes <= 0) continue;
    const current = next[box.playerId] ?? emptyPlayerSeasonStats(box.playerId);
    next[box.playerId] = {
      playerId: box.playerId,
      gamesPlayed: current.gamesPlayed + 1,
      minutes: current.minutes + box.minutes,
      points: current.points + box.points,
      rebounds: current.rebounds + box.rebounds,
      assists: current.assists + box.assists,
      steals: current.steals + box.steals,
      blocks: current.blocks + box.blocks,
      turnovers: current.turnovers + box.turnovers,
      fga: current.fga + box.fga,
      fgm: current.fgm + box.fgm,
      threePa: current.threePa + box.threePa,
      threePm: current.threePm + box.threePm,
      fta: current.fta + box.fta,
      ftm: current.ftm + box.ftm,
    };
  }
  return next;
}

export function seasonAverages(stats?: PlayerSeasonStats) {
  const games = Math.max(1, stats?.gamesPlayed ?? 0);
  const has = !!stats && stats.gamesPlayed > 0;
  return {
    hasStats: has,
    gamesPlayed: stats?.gamesPlayed ?? 0,
    ppg: has ? Math.round(((stats?.points ?? 0) / games) * 10) / 10 : 0,
    rpg: has ? Math.round(((stats?.rebounds ?? 0) / games) * 10) / 10 : 0,
    apg: has ? Math.round(((stats?.assists ?? 0) / games) * 10) / 10 : 0,
    spg: has ? Math.round(((stats?.steals ?? 0) / games) * 10) / 10 : 0,
    bpg: has ? Math.round(((stats?.blocks ?? 0) / games) * 10) / 10 : 0,
    fgPct: has && stats!.fga > 0 ? Math.round((stats!.fgm / stats!.fga) * 1000) / 10 : 0,
    threePct: has && stats!.threePa > 0 ? Math.round((stats!.threePm / stats!.threePa) * 1000) / 10 : 0,
  };
}

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
    playerSeasonStats: accumulatePlayerSeasonStats(season.playerSeasonStats, game.boxScores),
  };
}

/** Simulates every other league game scheduled on `day` (excluding `excludeTeamId`'s game) at full possession detail so every player accrues real box stats. */
export function simulateOtherGamesForDay(
  season: Season,
  day: number,
  players: Player[],
  teams: Team[],
  rng: RandomSource,
  excludeTeamId?: string,
): Season {
  const dayGames = season.schedule.filter(
    (g) => g.day === day && !g.played && g.homeTeamId !== excludeTeamId && g.awayTeamId !== excludeTeamId,
  );

  return dayGames.reduce((currentSeason, game) => {
    const homePlan = createAiGamePlan(players, game.homeTeamId, game.awayTeamId);
    const awayPlan = createAiGamePlan(players, game.awayTeamId, game.homeTeamId);
    const simGame = createGame({
      season: currentSeason.year,
      gameNumber: 0,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      players,
      homePlan,
      awayPlan,
    });
    const final = simulateToFinal(simGame, { teams, players, rng });
    return applyScheduledGameSim(currentSeason, game, final);
  }, season);
}

function applyScheduledGameSim(season: Season, game: ScheduledGame, final: GameState): Season {
  const homeWon = final.homeStats.points > final.awayStats.points;
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
        ? { ...scheduled, played: true, homeScore: final.homeStats.points, awayScore: final.awayStats.points }
        : scheduled,
    ),
    playerSeasonStats: accumulatePlayerSeasonStats(season.playerSeasonStats, final.boxScores),
  };
}

export function isRegularSeasonComplete(season: Season): boolean {
  return season.schedule.every((game) => game.played);
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

export function conferenceStandings(season: Season, teams: Team[], conference: Conference) {
  const conferenceTeamIds = new Set(teams.filter((team) => team.conference === conference).map((team) => team.id));
  return standingsRows(season).filter((row) => conferenceTeamIds.has(row.teamId));
}

// ── Playoffs ─────────────────────────────────────────────────────────────────

const PLAYOFF_SEED_PAIRS: Array<[number, number]> = [
  [0, 7],
  [3, 4],
  [2, 5],
  [1, 6],
];

export function generatePlayoffBracket(season: Season, teams: Team[]): PlayoffBracket {
  const east = conferenceStandings(season, teams, "East").slice(0, 8).map((row) => row.teamId);
  const west = conferenceStandings(season, teams, "West").slice(0, 8).map((row) => row.teamId);

  const round1 = (seeds: string[], conference: Conference): PlayoffSeries[] =>
    PLAYOFF_SEED_PAIRS.map(([a, b], idx) => ({
      id: `${season.year}-${conference}-R1-${idx}`,
      round: 1,
      conference,
      homeTeamId: seeds[a],
      awayTeamId: seeds[b],
      homeWins: 0,
      awayWins: 0,
      winsRequired: 2,
      completed: false,
    }));

  return {
    year: season.year,
    series: [...round1(east, "East"), ...round1(west, "West")],
  };
}

export function recordPlayoffGameResult(bracket: PlayoffBracket, seriesId: string, winnerTeamId: string): PlayoffBracket {
  const series = bracket.series.map((s) => {
    if (s.id !== seriesId || s.completed) return s;
    const homeWins = winnerTeamId === s.homeTeamId ? s.homeWins + 1 : s.homeWins;
    const awayWins = winnerTeamId === s.awayTeamId ? s.awayWins + 1 : s.awayWins;
    const completed = homeWins >= s.winsRequired || awayWins >= s.winsRequired;
    return {
      ...s,
      homeWins,
      awayWins,
      completed,
      winnerTeamId: completed ? (homeWins >= s.winsRequired ? s.homeTeamId : s.awayTeamId) : undefined,
    };
  });
  return progressPlayoffs({ ...bracket, series });
}

function pairWinners(round: PlayoffSeries[], nextRound: number, conference: Conference | "Finals", year: number): PlayoffSeries[] {
  const winners = round.map((s) => s.winnerTeamId).filter((id): id is string => !!id);
  const pairs: PlayoffSeries[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push({
      id: `${year}-${conference}-R${nextRound}-${i / 2}`,
      round: nextRound,
      conference,
      homeTeamId: winners[i],
      awayTeamId: winners[i + 1],
      homeWins: 0,
      awayWins: 0,
      winsRequired: nextRound === 4 ? 3 : 2,
      completed: false,
    });
  }
  return pairs;
}

export function progressPlayoffs(bracket: PlayoffBracket): PlayoffBracket {
  const maxRound = Math.max(...bracket.series.map((s) => s.round));
  const currentRoundSeries = bracket.series.filter((s) => s.round === maxRound);
  if (!currentRoundSeries.every((s) => s.completed)) return bracket;

  if (maxRound === 4) {
    return { ...bracket, champion: currentRoundSeries[0].winnerTeamId };
  }

  if (maxRound === 3) {
    const alreadyHasFinals = bracket.series.some((s) => s.round === 4);
    if (alreadyHasFinals) return bracket;
    const eastChamp = currentRoundSeries.find((s) => s.conference === "East")?.winnerTeamId;
    const westChamp = currentRoundSeries.find((s) => s.conference === "West")?.winnerTeamId;
    if (!eastChamp || !westChamp) return bracket;
    const finals: PlayoffSeries = {
      id: `${bracket.year}-Finals`,
      round: 4,
      conference: "Finals",
      homeTeamId: eastChamp,
      awayTeamId: westChamp,
      homeWins: 0,
      awayWins: 0,
      winsRequired: 3,
      completed: false,
    };
    return { ...bracket, series: [...bracket.series, finals] };
  }

  const nextRound = maxRound + 1;
  const alreadyHasNextRound = bracket.series.some((s) => s.round === nextRound);
  if (alreadyHasNextRound) return bracket;

  const east = currentRoundSeries.filter((s) => s.conference === "East");
  const west = currentRoundSeries.filter((s) => s.conference === "West");
  const newSeries = [
    ...pairWinners(east, nextRound, "East", bracket.year),
    ...pairWinners(west, nextRound, "West", bracket.year),
  ];
  return { ...bracket, series: [...bracket.series, ...newSeries] };
}

export function findActiveSeriesForTeam(bracket: PlayoffBracket, teamId: string): PlayoffSeries | undefined {
  const maxRound = Math.max(...bracket.series.map((s) => s.round));
  return bracket.series.find(
    (s) => s.round === maxRound && !s.completed && (s.homeTeamId === teamId || s.awayTeamId === teamId),
  );
}

/** Instantly simulates every unresolved series in the bracket (used for teams the user isn't part of, or to fast-forward once eliminated). */
export function simulatePlayoffsToChampion(
  bracket: PlayoffBracket,
  players: Player[],
  teams: Team[],
  rng: RandomSource,
  skipTeamId?: string,
): PlayoffBracket {
  let current = bracket;
  let guard = 0;
  while (!current.champion && guard < 30) {
    guard += 1;
    const maxRound = Math.max(...current.series.map((s) => s.round));
    const activeSeries = current.series.filter((s) => s.round === maxRound && !s.completed);
    const simulatable = activeSeries.filter(
      (s) => !skipTeamId || (s.homeTeamId !== skipTeamId && s.awayTeamId !== skipTeamId),
    );

    if (!simulatable.length) {
      if (!activeSeries.length) {
        current = progressPlayoffs(current);
        continue;
      }
      break; // only the user's own series remains pending at this round
    }

    for (const series of simulatable) {
      let working = series;
      while (!working.completed) {
        const homePlan = createAiGamePlan(players, working.homeTeamId, working.awayTeamId);
        const awayPlan = createAiGamePlan(players, working.awayTeamId, working.homeTeamId);
        const simGame = createGame({
          season: bracket.year,
          gameNumber: 0,
          homeTeamId: working.homeTeamId,
          awayTeamId: working.awayTeamId,
          players,
          homePlan,
          awayPlan,
        });
        const final = simulateToFinal(simGame, { teams, players, rng });
        const winnerId = final.homeStats.points > final.awayStats.points ? working.homeTeamId : working.awayTeamId;
        current = recordPlayoffGameResult(current, working.id, winnerId);
        working = current.series.find((s) => s.id === working.id)!;
      }
    }
  }
  return current;
}

export function teamName(teams: Team[], teamId: string) {
  return getTeam(teams, teamId).abbreviation;
}
