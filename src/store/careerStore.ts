import { create } from "zustand";
import { createAiGamePlan } from "../game/ai/coachAI";
import { loadPlayers, loadSeason, loadTeams } from "../game/data/leagueData";
import { getRoster } from "../game/data/selectors";
import { loadCareer, saveCareer } from "../game/saves/saveSystem";
import { createGame, simulatePossession, simulateToFinal } from "../game/simulation/engine";
import { createDefaultGamePlan } from "../game/simulation/gamePlan";
import { advanceSeasonDay, applyGameResult } from "../game/simulation/season";
import { SeededRandom } from "../game/simulation/random";
import type {
  CareerSave,
  Coach,
  CoachBackground,
  CoachingStyle,
  GameState,
  Player,
  PlayerAttributes,
  ScheduledGame,
  Season,
  Team,
  TeamGamePlan,
  TradeProposal,
  TrainingAttribute,
} from "../game/types/domain";

export type AppScreen = "welcome" | "setup" | "main";
export type MainTab = "game" | "roster" | "scout" | "trades" | "league";

interface CareerStore {
  // UI state
  screen: AppScreen;
  activeTab: MainTab;
  scoutTeamId: string;
  lastTradeResult?: { accepted: boolean; message: string };

  // Career data
  teams: Team[];
  players: Player[];
  selectedTeamId: string;
  coach: Coach;
  season: Season;
  activeGame?: GameState;
  lastSavedAt?: string;
  rng: SeededRandom;
  startingLineups: Record<string, string[]>;
  trainingSessionsUsed: Record<string, number>;

  // Navigation
  goToSetup: () => void;
  goToMain: (teamId: string, coachName: string, background: CoachBackground, style: CoachingStyle) => void;
  setActiveTab: (tab: MainTab) => void;
  setScoutTeam: (teamId: string) => void;
  clearTradeResult: () => void;

  // Roster management
  setStartingLineup: (playerIds: string[]) => void;

  // Training
  trainPlayer: (playerId: string, attribute: TrainingAttribute) => void;

  // Trading
  proposeTrade: (offered: string[], requested: string[], targetTeamId: string) => void;

  // Game
  startNextGame: () => void;
  simulateNextPossession: () => void;
  simulateGameToFinal: () => void;
  substitutePlayer: (outId: string, inId: string) => void;
  updateUserPlan: (plan: Partial<TeamGamePlan>) => void;
  updatePlayerInstruction: (playerId: string, instruction: TeamGamePlan["playerInstructions"][string]) => void;
  finalizeActiveGame: () => void;

  // Saves
  manualSave: () => void;
  loadSave: (id: string) => void;
}

const initialTeams = loadTeams();
const initialPlayers = loadPlayers();

function defaultStartingLineups(players: Player[], teams: Team[]): Record<string, string[]> {
  return Object.fromEntries(
    teams.map((team) => [
      team.id,
      getRoster(players, team.id)
        .slice(0, 5)
        .map((p) => p.id),
    ]),
  );
}

function defaultCoach(
  name = "Rookie Coach",
  background: CoachBackground = "Former college coach",
  coachingStyle: CoachingStyle = "Balanced",
): Coach {
  return {
    id: "user-coach",
    name,
    age: 38,
    background,
    coachingStyle,
    offensivePhilosophy: "Balanced",
    defensivePhilosophy: "Balanced",
    seasonsCompleted: 0,
    maxSeasons: 50,
  };
}

function nextPlayableGame(season: Season, teamId: string): ScheduledGame | undefined {
  return season.schedule.find((game) => !game.played && (game.homeTeamId === teamId || game.awayTeamId === teamId));
}

function careerFromState(state: CareerStore): CareerSave {
  return {
    id: "slot-1",
    name: `${state.coach.name} — ${state.selectedTeamId}`,
    savedAt: new Date().toISOString(),
    selectedTeamId: state.selectedTeamId,
    coach: state.coach,
    players: state.players,
    season: state.season,
    startingLineups: state.startingLineups,
    trainingSessionsUsed: state.trainingSessionsUsed,
  };
}

function recalcOverall(attrs: PlayerAttributes): number {
  const vals = Object.values(attrs).filter((_, i) => i < 13); // exclude potential
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  screen: "welcome",
  activeTab: "game",
  scoutTeamId: initialTeams[0]?.id ?? "",
  lastTradeResult: undefined,

  teams: initialTeams,
  players: initialPlayers,
  selectedTeamId: "DEN",
  coach: defaultCoach(),
  season: loadSeason(),
  rng: new SeededRandom(20260618),
  startingLineups: defaultStartingLineups(initialPlayers, initialTeams),
  trainingSessionsUsed: {},

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToSetup: () => set({ screen: "setup" }),

  goToMain: (teamId, coachName, background, coachingStyle) => {
    const freshPlayers = loadPlayers();
    const freshTeams = loadTeams();
    set({
      screen: "main",
      activeTab: "game",
      selectedTeamId: teamId,
      coach: defaultCoach(coachName || "Rookie Coach", background, coachingStyle),
      season: loadSeason(),
      activeGame: undefined,
      rng: new SeededRandom(Date.now()),
      players: freshPlayers,
      teams: freshTeams,
      startingLineups: defaultStartingLineups(freshPlayers, freshTeams),
      trainingSessionsUsed: {},
      lastTradeResult: undefined,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setScoutTeam: (teamId) => set({ scoutTeamId: teamId }),

  clearTradeResult: () => set({ lastTradeResult: undefined }),

  // ── Roster management ──────────────────────────────────────────────────────

  setStartingLineup: (playerIds) => {
    const { selectedTeamId, startingLineups } = get();
    set({ startingLineups: { ...startingLineups, [selectedTeamId]: playerIds.slice(0, 5) } });
  },

  // ── Training ───────────────────────────────────────────────────────────────

  trainPlayer: (playerId, attribute) => {
    const { players, trainingSessionsUsed } = get();
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const sessionsUsed = trainingSessionsUsed[playerId] ?? 0;
    if (sessionsUsed >= 3) return; // max 3 sessions per player per season

    const potentialBonus = player.potential > 80 ? 2 : player.potential > 70 ? 1 : 0;
    const ageBonus = player.age < 25 ? 1 : 0;
    const gain = 1 + potentialBonus + ageBonus;

    const newAttrs: PlayerAttributes = {
      ...player.attributes,
      [attribute]: Math.min(99, player.attributes[attribute] + gain),
    };
    const newOverall = recalcOverall(newAttrs);

    set({
      players: players.map((p) =>
        p.id === playerId ? { ...p, attributes: newAttrs, overall: newOverall } : p,
      ),
      trainingSessionsUsed: { ...trainingSessionsUsed, [playerId]: sessionsUsed + 1 },
    });
  },

  // ── Trading ────────────────────────────────────────────────────────────────

  proposeTrade: (offeredIds, requestedIds, targetTeamId) => {
    const { players, selectedTeamId, startingLineups } = get();

    const offered = players.filter((p) => offeredIds.includes(p.id));
    const requested = players.filter((p) => requestedIds.includes(p.id));

    if (!offered.length || !requested.length) return;

    const offerValue = offered.reduce((s, p) => s + p.overall, 0);
    const requestValue = requested.reduce((s, p) => s + p.overall, 0);
    const diff = requestValue - offerValue;

    // AI accepts if the deal is reasonably fair (within 8 overall points total)
    const accepted = diff <= 8;

    if (accepted) {
      const updatedPlayers = players.map((p) => {
        if (offeredIds.includes(p.id)) return { ...p, teamId: targetTeamId };
        if (requestedIds.includes(p.id)) return { ...p, teamId: selectedTeamId };
        return p;
      });

      // Rebuild user starting lineup removing traded-away players and adding new ones
      const userLineup = startingLineups[selectedTeamId] ?? [];
      const newUserLineup = [
        ...userLineup.filter((id) => !offeredIds.includes(id)),
        ...requestedIds,
      ].slice(0, 5);

      // Pad to 5 if needed
      const remainingRoster = updatedPlayers
        .filter((p) => p.teamId === selectedTeamId && !newUserLineup.includes(p.id))
        .sort((a, b) => b.overall - a.overall);
      while (newUserLineup.length < 5 && remainingRoster.length) {
        newUserLineup.push(remainingRoster.shift()!.id);
      }

      set({
        players: updatedPlayers,
        startingLineups: { ...startingLineups, [selectedTeamId]: newUserLineup },
        lastTradeResult: { accepted: true, message: "Trade accepted! Players have been swapped." },
      });
    } else {
      const gap = Math.ceil(diff - 8);
      set({
        lastTradeResult: {
          accepted: false,
          message: `Trade rejected. You're asking for ${gap} more overall value than you're offering.`,
        },
      });
    }
  },

  // ── Game simulation ────────────────────────────────────────────────────────

  startNextGame: () => {
    const state = get();
    const nextGame = nextPlayableGame(state.season, state.selectedTeamId);
    if (!nextGame) return;

    const opponentId = nextGame.homeTeamId === state.selectedTeamId ? nextGame.awayTeamId : nextGame.homeTeamId;
    const userLineup = state.startingLineups[state.selectedTeamId] ?? getRoster(state.players, state.selectedTeamId).slice(0, 5).map((p) => p.id);
    const aiLineup = state.startingLineups[opponentId] ?? getRoster(state.players, opponentId).slice(0, 5).map((p) => p.id);

    const userPlan = createDefaultGamePlan(userLineup);
    const aiPlan = createAiGamePlan(state.players, opponentId, state.selectedTeamId);

    // Inject correct starting lineups into the ai plan too
    const aiPlanWithLineup = { ...aiPlan, playerInstructions: Object.fromEntries(aiLineup.map((id) => [id, "Neutral" as const])) };

    set({
      activeGame: createGame({
        season: state.season.year,
        gameNumber: state.season.schedule.findIndex((game) => game.id === nextGame.id) + 1,
        homeTeamId: nextGame.homeTeamId,
        awayTeamId: nextGame.awayTeamId,
        players: state.players,
        homeLineup: nextGame.homeTeamId === state.selectedTeamId ? userLineup : aiLineup,
        awayLineup: nextGame.awayTeamId === state.selectedTeamId ? userLineup : aiLineup,
        homePlan: nextGame.homeTeamId === state.selectedTeamId ? userPlan : aiPlanWithLineup,
        awayPlan: nextGame.awayTeamId === state.selectedTeamId ? userPlan : aiPlanWithLineup,
      }),
    });
  },

  simulateNextPossession: () => {
    const state = get();
    if (!state.activeGame || state.activeGame.isFinal) return;
    const activeGame = simulatePossession(state.activeGame, {
      teams: state.teams,
      players: state.players,
      rng: state.rng,
    });
    set({ activeGame });
    if (activeGame.isFinal) {
      get().finalizeActiveGame();
    }
  },

  simulateGameToFinal: () => {
    const state = get();
    if (!state.activeGame) return;
    const activeGame = simulateToFinal(state.activeGame, {
      teams: state.teams,
      players: state.players,
      rng: state.rng,
    });
    set({ activeGame });
    get().finalizeActiveGame();
  },

  substitutePlayer: (outId, inId) => {
    const state = get();
    const game = state.activeGame;
    if (!game || game.isFinal) return;

    // Keep the outgoing player's box score but bench them, init incoming player if needed
    const newBenchedIds = [...game.benchedIds.filter((id) => id !== inId), outId];
    const newBoxScores = { ...game.boxScores };
    if (!newBoxScores[inId]) {
      newBoxScores[inId] = { playerId: inId, minutes: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fga: 0, fgm: 0, threePa: 0, threePm: 0, fta: 0, ftm: 0, fatigue: 0 };
    }

    // Copy outgoing player's instruction to incoming in the relevant plan
    const isHome = game.homeTeamId === state.selectedTeamId;
    const planKey = isHome ? "homePlan" : "awayPlan";
    const plan = game[planKey];
    const outInstruction = plan.playerInstructions[outId] ?? "Neutral";
    const newPlan = {
      ...plan,
      playerInstructions: {
        ...plan.playerInstructions,
        [inId]: outInstruction,
      },
    };

    set({
      activeGame: {
        ...game,
        boxScores: newBoxScores,
        benchedIds: newBenchedIds,
        [planKey]: newPlan,
      },
    });
  },

  updateUserPlan: (plan) => {
    const state = get();
    const game = state.activeGame;
    if (!game) return;
    const isHome = game.homeTeamId === state.selectedTeamId;
    const key = isHome ? "homePlan" : "awayPlan";
    set({ activeGame: { ...game, [key]: { ...game[key], ...plan } } });
  },

  updatePlayerInstruction: (playerId, instruction) => {
    const state = get();
    const game = state.activeGame;
    if (!game) return;
    const isHome = game.homeTeamId === state.selectedTeamId;
    const key = isHome ? "homePlan" : "awayPlan";
    set({
      activeGame: {
        ...game,
        [key]: { ...game[key], playerInstructions: { ...game[key].playerInstructions, [playerId]: instruction } },
      },
    });
  },

  finalizeActiveGame: () => {
    const state = get();
    if (!state.activeGame?.isFinal) return;
    const season = advanceSeasonDay(applyGameResult(state.season, state.activeGame));
    set({ season, activeGame: undefined });
    const saved = saveCareer(careerFromState({ ...get(), season }));
    set({ lastSavedAt: saved.savedAt });
  },

  // ── Saves ──────────────────────────────────────────────────────────────────

  manualSave: () => {
    const saved = saveCareer(careerFromState(get()));
    set({ lastSavedAt: saved.savedAt });
  },

  loadSave: (id) => {
    const save = loadCareer(id);
    if (!save) return;
    set({
      screen: "main",
      selectedTeamId: save.selectedTeamId,
      coach: save.coach,
      players: save.players ?? loadPlayers(),
      season: save.season,
      activeGame: undefined,
      lastSavedAt: save.savedAt,
      startingLineups: save.startingLineups ?? defaultStartingLineups(save.players ?? loadPlayers(), loadTeams()),
      trainingSessionsUsed: save.trainingSessionsUsed ?? {},
    });
  },
}));

