import teamsJson from "../../data/teams.json";
import playersJson from "../../data/players.json";
import scheduleJson from "../../data/schedule.json";
import type {
  Division,
  Player,
  PlayerAttributes,
  Position,
  ScheduledGame,
  Season,
  Team,
} from "../types/domain";

interface PlayerSeed {
  teamId: string;
  stars: string[];
  positions?: Position[];
  base: number;
}

const positions: Position[] = ["PG", "SG", "SF", "PF", "C"];

const heights: Record<Position, string> = {
  PG: "6'2\"",
  SG: "6'5\"",
  SF: "6'7\"",
  PF: "6'9\"",
  C: "6'11\"",
};

const weights: Record<Position, number> = {
  PG: 190,
  SG: 205,
  SF: 220,
  PF: 235,
  C: 255,
};

function rating(base: number, offset: number, floor = 52, ceiling = 99) {
  return Math.max(floor, Math.min(ceiling, Math.round(base + offset)));
}

function attributesFor(position: Position, overall: number, potential: number, index: number): PlayerAttributes {
  const guard = position === "PG" || position === "SG";
  const wing = position === "SF";
  const big = position === "PF" || position === "C";
  const starLift = index === 0 ? 6 : index === 1 ? 3 : 0;

  return {
    insideScoring: rating(overall, big ? 7 : wing ? 1 : -4),
    midrange: rating(overall, guard || wing ? 3 : -2),
    threePoint: rating(overall, guard ? 6 : wing ? 3 : -6),
    passing: rating(overall, position === "PG" ? 9 : guard ? 4 : -2 + starLift),
    ballHandling: rating(overall, guard ? 8 : wing ? 2 : -8),
    rebounding: rating(overall, big ? 9 : wing ? 2 : -7),
    interiorDefense: rating(overall, big ? 7 : wing ? 1 : -7),
    perimeterDefense: rating(overall, guard || wing ? 5 : -3),
    steals: rating(overall, guard || wing ? 4 : -4),
    blocks: rating(overall, big ? 8 : -8),
    athleticism: rating(overall, index <= 2 ? 4 : 0),
    stamina: rating(overall, index <= 2 ? 5 : -1),
    basketballIq: rating(overall, index === 0 ? 7 : index === 1 ? 4 : 0),
    potential,
  };
}

function expandPlayers(seed: PlayerSeed): Player[] {
  return seed.stars.map((name, index) => {
    const position = seed.positions?.[index] ?? positions[index] ?? "SF";
    const overall = rating(seed.base, 9 - index * 3);
    const age = Math.max(19, Math.min(40, 24 + index * 2 + (seed.base > 84 ? 2 : 0)));
    const potential = rating(overall, index <= 2 ? 5 : 2);

    return {
      id: `${seed.teamId}-${index + 1}`,
      name,
      age,
      height: heights[position],
      weight: weights[position] + index * 4,
      teamId: seed.teamId,
      position,
      overall,
      potential,
      attributes: attributesFor(position, overall, potential, index),
    };
  });
}

export function loadTeams(): Team[] {
  return (teamsJson as Team[]).map((team) => ({
    ...team,
    division: team.division as Division,
  }));
}

export function loadPlayers(): Player[] {
  const seeds = playersJson as PlayerSeed[];
  return seeds.flatMap(expandPlayers);
}

export function loadSeason(year = 2026): Season {
  const teams = loadTeams();
  const records = Object.fromEntries(teams.map((team) => [team.id, { wins: 0, losses: 0 }]));
  const schedule: ScheduledGame[] = scheduleJson.flatMap((dayEntry) =>
    dayEntry.games.map(([awayTeamId, homeTeamId], index) => ({
      id: `${year}-${dayEntry.day}-${index + 1}`,
      day: dayEntry.day,
      awayTeamId,
      homeTeamId,
      played: false,
    })),
  );

  return {
    year,
    currentDay: 1,
    schedule,
    records,
  };
}

export function validateLeagueData() {
  const teams = loadTeams();
  const players = loadPlayers();
  const teamIds = new Set(teams.map((team) => team.id));
  const missingPlayers = teams.filter((team) => !players.some((player) => player.teamId === team.id));
  const invalidPlayers = players.filter((player) => !teamIds.has(player.teamId));

  return {
    teamCount: teams.length,
    playerCount: players.length,
    missingPlayers,
    invalidPlayers,
    isValid: teams.length === 30 && missingPlayers.length === 0 && invalidPlayers.length === 0,
  };
}
