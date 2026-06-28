import type {
  GameState,
  PlayByPlayEvent,
  Player,
  PlayerBoxScore,
  Team,
  TeamGamePlan,
  TeamGameStats,
} from "../types/domain";
import { getRoster } from "../data/selectors";
import { createDefaultGamePlan } from "./gamePlan";
import { chance, clamp, pickWeighted, type RandomSource } from "./random";
import { emptyBoxScore, emptyTeamStats } from "./stats";

const QUARTER_SECONDS = 12 * 60;
const LAST_REGULATION_QUARTER = 4;

interface StartGameInput {
  season: number;
  gameNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  players: Player[];
  homeLineup?: string[];
  awayLineup?: string[];
  homePlan?: TeamGamePlan;
  awayPlan?: TeamGamePlan;
}

interface SimContext {
  teams: Team[];
  players: Player[];
  rng: RandomSource;
}

export function createGame(input: StartGameInput): GameState {
  const allById = Object.fromEntries(input.players.map((p) => [p.id, p]));
  const homeRoster = input.homeLineup
    ? input.homeLineup.map((id) => allById[id]).filter(Boolean).slice(0, 5)
    : getRoster(input.players, input.homeTeamId).slice(0, 5);
  const awayRoster = input.awayLineup
    ? input.awayLineup.map((id) => allById[id]).filter(Boolean).slice(0, 5)
    : getRoster(input.players, input.awayTeamId).slice(0, 5);
  const boxScores = Object.fromEntries(
    [...homeRoster, ...awayRoster].map((player) => [player.id, emptyBoxScore(player.id)]),
  );

  return {
    id: `${input.season}-${input.gameNumber}-${input.awayTeamId}-${input.homeTeamId}`,
    season: input.season,
    gameNumber: input.gameNumber,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    possessionTeamId: input.awayTeamId,
    quarter: 1,
    clockSeconds: QUARTER_SECONDS,
    possession: 0,
    momentum: 0,
    isFinal: false,
    homeStats: emptyTeamStats(),
    awayStats: emptyTeamStats(),
    boxScores,
    benchedIds: [],
    playByPlay: [],
    homePlan: input.homePlan ?? createDefaultGamePlan(homeRoster.map((player) => player.id)),
    awayPlan: input.awayPlan ?? createDefaultGamePlan(awayRoster.map((player) => player.id)),
  };
}

export function simulatePossession(state: GameState, context: SimContext): GameState {
  if (state.isFinal) return state;

  const next = structuredClone(state) as GameState;
  const offenseId = next.possessionTeamId;
  const defenseId = offenseId === next.homeTeamId ? next.awayTeamId : next.homeTeamId;
  const offensePlan = offenseId === next.homeTeamId ? next.homePlan : next.awayPlan;
  const defensePlan = defenseId === next.homeTeamId ? next.homePlan : next.awayPlan;
  const offenseStats = offenseId === next.homeTeamId ? next.homeStats : next.awayStats;
  const defenseStats = defenseId === next.homeTeamId ? next.homeStats : next.awayStats;
  const roster = Object.keys(next.boxScores)
    .map((id) => context.players.find((p) => p.id === id))
    .filter((p): p is Player => !!p && p.teamId === offenseId && !next.benchedIds.includes(p.id));
  const defenseRoster = Object.keys(next.boxScores)
    .map((id) => context.players.find((p) => p.id === id))
    .filter((p): p is Player => !!p && p.teamId === defenseId && !next.benchedIds.includes(p.id));
  const ballHandler = chooseShooter(roster, offensePlan, context.rng);
  const defenderQuality = averageDefense(defenseRoster);
  const fatigue = next.boxScores[ballHandler.id]?.fatigue ?? 0;
  const possessionSeconds = calculatePaceSeconds(offensePlan, defensePlan, context.rng);
  const eventQuarter = next.quarter;
  const eventClock = formatClock(next.clockSeconds - possessionSeconds);

  advanceClock(next, possessionSeconds);
  ensureBox(next.boxScores, ballHandler.id).minutes += possessionSeconds / 60;
  roster.forEach((player) => {
    const box = ensureBox(next.boxScores, player.id);
    const restFactor = offensePlan.playerInstructions[player.id] === "Rest more" ? 0.55 : 1;
    box.fatigue = clamp(box.fatigue + (100 - player.attributes.stamina) * 0.008 * restFactor, 0, 35);
  });

  const turnoverProbability = calculateTurnoverChance(ballHandler, offensePlan, defensePlan, defenderQuality, next.momentum);
  let eventText = "";
  let importance: PlayByPlayEvent["importance"] = "routine";

  if (chance(context.rng, turnoverProbability)) {
    offenseStats.turnovers += 1;
    defenseStats.steals += chance(context.rng, stealChance(defensePlan)) ? 1 : 0;
    ensureBox(next.boxScores, ballHandler.id).turnovers += 1;
    next.momentum += offenseId === next.homeTeamId ? -1 : 1;
    eventText = possessionLine(ballHandler.name, offensePlan.offensivePlay, "turnover", defensePlan.defensiveScheme);
    importance = "stop";
  } else {
    const shotType = chooseShotType(ballHandler, offensePlan, defensePlan, context.rng);
    const shotChance = calculateShotChance(ballHandler, shotType, offensePlan, defensePlan, defenderQuality, fatigue, next.momentum);
    const made = chance(context.rng, shotChance);
    const points = shotType === "three" ? 3 : 2;

    offenseStats.fga += 1;
    const box = ensureBox(next.boxScores, ballHandler.id);
    box.fga += 1;
    if (shotType === "three") {
      offenseStats.threePa += 1;
      box.threePa += 1;
    }

    if (made) {
      offenseStats.fgm += 1;
      offenseStats.points += points;
      box.fgm += 1;
      box.points += points;
      if (shotType === "three") {
        offenseStats.threePm += 1;
        box.threePm += 1;
      }

      const assister = chooseAssister(roster, ballHandler.id, context.rng);
      if (assister && chance(context.rng, assistChance(offensePlan))) {
        offenseStats.assists += 1;
        ensureBox(next.boxScores, assister.id).assists += 1;
      }

      next.momentum += offenseId === next.homeTeamId ? points * 0.45 : -points * 0.45;
      eventText = possessionLine(ballHandler.name, offensePlan.offensivePlay, "make", defensePlan.defensiveScheme, shotType);
      importance = points === 3 || Math.abs(scoreDiff(next)) <= 4 ? "swing" : "score";
    } else {
      const rebounder = chooseRebounder([...roster, ...defenseRoster], context.rng);
      const offensiveBoard = rebounder.teamId === offenseId;
      if (offensiveBoard) {
        offenseStats.rebounds += 1;
      } else {
        defenseStats.rebounds += 1;
      }
      ensureBox(next.boxScores, rebounder.id).rebounds += 1;
      next.momentum += offenseId === next.homeTeamId ? -0.35 : 0.35;
      eventText = possessionLine(ballHandler.name, offensePlan.offensivePlay, "miss", defensePlan.defensiveScheme, shotType, rebounder.name);
      importance = "routine";
    }
  }

  next.momentum = clamp(next.momentum, -10, 10);
  next.possession += 1;
  next.possessionTeamId = defenseId;
  next.playByPlay = [
    {
      id: `${next.id}-${next.possession}`,
      quarter: eventQuarter,
      clock: eventClock,
      possession: next.possession,
      teamId: offenseId,
      text: eventText,
      score: `${next.awayStats.points}-${next.homeStats.points}`,
      importance,
    },
    ...next.playByPlay,
  ].slice(0, 120);

  if (next.quarter > LAST_REGULATION_QUARTER && next.homeStats.points !== next.awayStats.points) {
    next.isFinal = true;
    next.clockSeconds = 0;
  }

  return next;
}

export function simulateToFinal(state: GameState, context: SimContext, maxPossessions = 500) {
  let next = state;
  let guard = 0;
  while (!next.isFinal && guard < maxPossessions) {
    next = simulatePossession(next, context);
    guard += 1;
  }
  return next;
}

function chooseShooter(roster: Player[], plan: TeamGamePlan, rng: RandomSource) {
  return pickWeighted(
    rng,
    roster.map((player) => {
      const instruction = plan.playerInstructions[player.id] ?? "Neutral";
      const usage =
        player.overall * 0.7 +
        player.attributes.ballHandling * 0.12 +
        player.attributes.basketballIq * 0.1 +
        player.attributes.stamina * 0.08;
      const instructionModifier =
        instruction === "Shoot more" || instruction === "Be aggressive"
          ? 18
          : instruction === "Shoot less" || instruction === "Be conservative" || instruction === "Rest more"
            ? -16
            : 0;
      return { item: player, weight: usage + instructionModifier };
    }),
  );
}

function chooseAssister(roster: Player[], shooterId: string, rng: RandomSource) {
  const passers = roster.filter((player) => player.id !== shooterId);
  if (!passers.length) return undefined;
  return pickWeighted(
    rng,
    passers.map((player) => ({ item: player, weight: player.attributes.passing + player.attributes.basketballIq * 0.35 })),
  );
}

function chooseRebounder(players: Player[], rng: RandomSource) {
  return pickWeighted(
    rng,
    players.map((player) => ({ item: player, weight: player.attributes.rebounding + player.attributes.athleticism * 0.25 })),
  );
}

function chooseShotType(player: Player, offense: TeamGamePlan, defense: TeamGamePlan, rng: RandomSource) {
  const threeBias =
    offense.offensiveFocus === "Shoot more threes" || offense.offensivePlay === "Quick Three"
      ? 26
      : defense.defensiveFocus === "Protect rim" || defense.defensiveScheme === "Zone"
        ? 12
        : 0;
  const paintBias =
    offense.offensiveFocus === "Attack paint" || offense.offensivePlay === "Post Up"
      ? 24
      : defense.defensiveFocus === "Double star player"
        ? -8
        : 0;

  return pickWeighted(rng, [
    { item: "three" as const, weight: player.attributes.threePoint + threeBias },
    { item: "midrange" as const, weight: player.attributes.midrange + 5 },
    { item: "inside" as const, weight: player.attributes.insideScoring + paintBias },
  ]);
}

function calculateShotChance(
  player: Player,
  shotType: "three" | "midrange" | "inside",
  offense: TeamGamePlan,
  defense: TeamGamePlan,
  defenderQuality: number,
  fatigue: number,
  momentum: number,
) {
  const attribute =
    shotType === "three" ? player.attributes.threePoint : shotType === "inside" ? player.attributes.insideScoring : player.attributes.midrange;
  const base = shotType === "three" ? 0.27 : shotType === "inside" ? 0.46 : 0.38;
  const playBonus =
    (offense.offensivePlay === "Pick and Roll" && shotType !== "three") ||
    (offense.offensivePlay === "Quick Three" && shotType === "three") ||
    (offense.offensivePlay === "Post Up" && shotType === "inside") ||
    offense.offensivePlay === "Motion Offense"
      ? 0.035
      : 0;
  const defensivePenalty =
    (defense.defensiveFocus === "Protect rim" && shotType === "inside") ||
    (defense.defensiveScheme === "Zone" && shotType !== "inside") ||
    (defense.defensiveFocus === "Double star player" && player.overall >= 88)
      ? 0.04
      : 0.015;
  const ratingLift = (attribute - defenderQuality) / 210;
  return clamp(base + ratingLift + playBonus - defensivePenalty - fatigue / 280 + momentum / 950, 0.22, 0.72);
}

function calculateTurnoverChance(
  player: Player,
  offense: TeamGamePlan,
  defense: TeamGamePlan,
  defenderQuality: number,
  momentum: number,
) {
  const pressure =
    defense.defensiveFocus === "Force turnovers" || defense.defensiveScheme === "Half Court Trap"
      ? 0.035
      : defense.defensiveFocus === "Full court pressure"
        ? 0.048
        : 0;
  const paceRisk = offense.offensiveFocus === "Push pace" ? 0.016 : offense.offensiveFocus === "Slow pace" ? -0.012 : 0;
  return clamp(0.105 + pressure + paceRisk + (defenderQuality - player.attributes.ballHandling) / 500 - momentum / 1100, 0.045, 0.23);
}

function calculatePaceSeconds(offense: TeamGamePlan, defense: TeamGamePlan, rng: RandomSource) {
  const base = offense.offensiveFocus === "Push pace" ? 13 : offense.offensiveFocus === "Slow pace" ? 21 : 17;
  const pressure = defense.defensiveFocus === "Full court pressure" || defense.defensiveScheme === "Half Court Trap" ? -2 : 0;
  return clamp(Math.round(base + pressure + rng.next() * 8), 7, 24);
}

function averageDefense(roster: Player[]) {
  return (
    roster.reduce(
      (sum, player) => sum + player.attributes.perimeterDefense * 0.45 + player.attributes.interiorDefense * 0.4 + player.attributes.basketballIq * 0.15,
      0,
    ) / Math.max(1, roster.length)
  );
}

function stealChance(defense: TeamGamePlan) {
  return defense.defensiveFocus === "Force turnovers" || defense.defensiveScheme === "Half Court Trap" ? 0.52 : 0.34;
}

function assistChance(offense: TeamGamePlan) {
  return offense.offensivePlay === "Motion Offense" ? 0.72 : offense.offensivePlay === "Isolation" ? 0.38 : 0.58;
}

function possessionLine(
  playerName: string,
  play: string,
  outcome: "make" | "miss" | "turnover",
  defense: string,
  shotType?: "three" | "midrange" | "inside",
  rebounderName?: string,
) {
  const shotText = shotType === "three" ? "from three" : shotType === "inside" ? "at the rim" : "from the elbow";
  if (outcome === "turnover") {
    return `${playerName} initiates ${play}. ${defense} closes the gap and forces a turnover.`;
  }
  if (outcome === "make") {
    return `${playerName} works out of ${play}, rises ${shotText}, and the shot is good.`;
  }
  return `${playerName} gets a look ${shotText} from ${play}, misses, and ${rebounderName} controls the rebound.`;
}

function advanceClock(state: GameState, seconds: number) {
  state.clockSeconds -= seconds;
  while (state.clockSeconds <= 0) {
    state.quarter += 1;
    state.clockSeconds += QUARTER_SECONDS;
  }
}

function ensureBox(boxScores: Record<string, PlayerBoxScore>, playerId: string) {
  boxScores[playerId] ??= emptyBoxScore(playerId);
  return boxScores[playerId];
}

function scoreDiff(state: GameState) {
  return state.homeStats.points - state.awayStats.points;
}

export function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function shootingLine(stats: TeamGameStats) {
  const fg = stats.fga ? `${stats.fgm}/${stats.fga}` : "0/0";
  const three = stats.threePa ? `${stats.threePm}/${stats.threePa}` : "0/0";
  return `${fg} FG, ${three} 3PT`;
}
