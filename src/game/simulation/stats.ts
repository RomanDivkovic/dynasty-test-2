import type { PlayerBoxScore, TeamGameStats } from "../types/domain";

export function emptyTeamStats(): TeamGameStats {
  return {
    points: 0,
    rebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    fga: 0,
    fgm: 0,
    threePa: 0,
    threePm: 0,
    fta: 0,
    ftm: 0,
  };
}

export function emptyBoxScore(playerId: string): PlayerBoxScore {
  return {
    playerId,
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
    fatigue: 0,
  };
}
