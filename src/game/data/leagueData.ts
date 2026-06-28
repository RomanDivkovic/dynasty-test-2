import teamsJson from "../../data/teams.json";
import playersJson from "../../data/players.json";
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

// Seeded RNG for deterministic bench player generation
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h) || 1;
}

function makeRng(seed: number) {
  let state = seed;
  return {
    next(): number {
      state = (state * 1664525 + 1013904223) & 0x7fffffff;
      return state / 0x7fffffff;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
  };
}

const BENCH_FIRST = [
  "Marcus","Malik","Andre","Darius","Cameron","Isaiah","Jermaine","Marquise","Keon","Rashad",
  "Terrence","Corey","Xavier","Devon","Quincy","Reggie","Lance","Lamar","Trevon","Kendrick",
  "Monte","Preston","Dion","Kendall","Marvin","Javon","DeShawn","Cedric","Damien","Elijah",
  "Fletcher","Garrison","Hakeem","Jerome","Kieran","Lorenzo","Nate","Omar","Patrick","Quinton",
  "Ronnie","Sterling","Travis","Vernon","Winston","Alton","Barrett","Clayton","Dwayne","Emanuel",
  "Forrest","Grant","Henry","Irving","Julius","Kenneth","Lewis","Maxwell","Nathan","Otis",
  "Ricky","Samuel","Theodore","Ulysses","Victor","Walter","Xander","Yusuf","Zachariah","Alfonso",
];

const BENCH_LAST = [
  "Williams","Johnson","Davis","Brown","Wilson","Moore","Taylor","Jackson","Harris","Thomas",
  "White","Martin","Thompson","Robinson","Clark","Lewis","Lee","Walker","Hall","Allen",
  "Young","Hill","Scott","Green","Adams","Baker","Nelson","Carter","Mitchell","Perez",
  "Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins","Stewart","Morris",
  "Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson",
  "Cox","Howard","Ward","Torres","Peterson","Gray","James","Watson","Brooks","Kelly",
  "Sanders","Price","Bennett","Henderson","Coleman","Jenkins","Perry","Powell","Long","Patterson",
];

const BENCH_POSITIONS: Position[] = ["PG","SG","SG","SF","SF","PF","PF","C","PG","SF"];

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
  const stars = seed.stars.map((name, index) => {
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

  const rng = makeRng(hashStr(seed.teamId));
  const usedNames = new Set(seed.stars);

  const bench: Player[] = [];
  for (let i = 0; i < 10; i++) {
    const slot = i + seed.stars.length;
    const position = BENCH_POSITIONS[i];
    const overall = Math.max(58, Math.min(76, seed.base - 14 + Math.floor(rng.next() * 12)));
    const age = rng.int(19, 34);
    const potential = rating(overall, rng.int(0, 6));

    let firstName: string;
    let lastName: string;
    let fullName: string;
    let attempts = 0;
    do {
      firstName = BENCH_FIRST[rng.int(0, BENCH_FIRST.length - 1)];
      lastName = BENCH_LAST[rng.int(0, BENCH_LAST.length - 1)];
      fullName = `${firstName} ${lastName}`;
      attempts++;
    } while (usedNames.has(fullName) && attempts < 20);
    usedNames.add(fullName);

    bench.push({
      id: `${seed.teamId}-${slot + 1}`,
      name: fullName,
      age,
      height: heights[position],
      weight: weights[position] + rng.int(-5, 10),
      teamId: seed.teamId,
      position,
      overall,
      potential,
      attributes: attributesFor(position, overall, potential, slot),
    });
  }

  return [...stars, ...bench];
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
  const schedule = generateFullSeasonSchedule(teams, year);

  return {
    year,
    currentDay: 1,
    schedule,
    records,
  };
}

export function generateFullSeasonSchedule(teams: Team[], year: number): ScheduledGame[] {
  const games: Array<Omit<ScheduledGame, "id" | "day" | "played">> = [];
  const gameCounts = Object.fromEntries(teams.map((team) => [team.id, 0]));

  for (let homeIndex = 0; homeIndex < teams.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < teams.length; awayIndex += 1) {
      const homeTeamId = teams[homeIndex].id;
      const awayTeamId = teams[awayIndex].id;
      games.push({ homeTeamId, awayTeamId });
      games.push({ homeTeamId: awayTeamId, awayTeamId: homeTeamId });
      gameCounts[homeTeamId] += 2;
      gameCounts[awayTeamId] += 2;
    }
  }

  let rotation = 0;
  while (Object.values(gameCounts).some((count) => count < 82)) {
    const home = teams.find((team) => gameCounts[team.id] < 82);
    if (!home) break;

    const candidateOpponents = teams.filter((team) => team.id !== home.id && gameCounts[team.id] < 82);
    const away = candidateOpponents[rotation % Math.max(1, candidateOpponents.length)];
    if (!away) break;

    const flipHome = rotation % 2 === 0;
    games.push({
      homeTeamId: flipHome ? home.id : away.id,
      awayTeamId: flipHome ? away.id : home.id,
    });
    gameCounts[home.id] += 1;
    gameCounts[away.id] += 1;
    rotation += 1;
  }

  return games.map((game, index) => ({
    ...game,
    id: `${year}-${index + 1}`,
    day: Math.floor(index / 15) + 1,
    played: false,
  }));
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
