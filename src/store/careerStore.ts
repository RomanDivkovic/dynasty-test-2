import { create } from "zustand";
import { createAiGamePlan } from "../game/ai/coachAI";
import { loadPlayers, loadSeason, loadTeams } from "../game/data/leagueData";
import { getRoster } from "../game/data/selectors";
import { loadCareer, saveCareer } from "../game/saves/saveSystem";
import { createGame, simulatePossession, simulateToFinal } from "../game/simulation/engine";
import { createDefaultGamePlan } from "../game/simulation/gamePlan";
import { advanceSeasonDay, applyGameResult } from "../game/simulation/season";
import { SeededRandom } from "../game/simulation/random";
import type { CareerSave, Coach, GameState, Player, ScheduledGame, Season, Team, TeamGamePlan } from "../game/types/domain";

interface CareerStore {
  teams: Team[];
  players: Player[];
  selectedTeamId: string;
  coach: Coach;
  season: Season;
  activeGame?: GameState;
  lastSavedAt?: string;
  rng: SeededRandom;
  startCareer: (teamId: string, coachName: string) => void;
  startNextGame: () => void;
  simulateNextPossession: () => void;
  simulateGameToFinal: () => void;
  updateUserPlan: (plan: Partial<TeamGamePlan>) => void;
  updatePlayerInstruction: (playerId: string, instruction: TeamGamePlan["playerInstructions"][string]) => void;
  finalizeActiveGame: () => void;
  manualSave: () => void;
  loadSave: (id: string) => void;
}

const teams = loadTeams();
const players = loadPlayers();
const defaultTeamId = "DEN";

function defaultCoach(name = "Rookie Coach"): Coach {
  return {
    id: "user-coach",
    name,
    age: 35,
    coachingStyle: "Balanced",
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
    name: `${state.coach.name} - ${state.selectedTeamId}`,
    savedAt: new Date().toISOString(),
    selectedTeamId: state.selectedTeamId,
    coach: state.coach,
    season: state.season,
  };
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  teams,
  players,
  selectedTeamId: defaultTeamId,
  coach: defaultCoach(),
  season: loadSeason(),
  rng: new SeededRandom(20260618),

  startCareer: (teamId, coachName) =>
    set({
      selectedTeamId: teamId,
      coach: defaultCoach(coachName || "Rookie Coach"),
      season: loadSeason(),
      activeGame: undefined,
      rng: new SeededRandom(Date.now()),
    }),

  startNextGame: () => {
    const state = get();
    const nextGame = nextPlayableGame(state.season, state.selectedTeamId);
    if (!nextGame) return;

    const userRoster = getRoster(state.players, state.selectedTeamId);
    const opponentId = nextGame.homeTeamId === state.selectedTeamId ? nextGame.awayTeamId : nextGame.homeTeamId;
    const userPlan = createDefaultGamePlan(userRoster.map((player) => player.id));
    const aiPlan = createAiGamePlan(state.players, opponentId, state.selectedTeamId);

    set({
      activeGame: createGame({
        season: state.season.year,
        gameNumber: state.season.schedule.findIndex((game) => game.id === nextGame.id) + 1,
        homeTeamId: nextGame.homeTeamId,
        awayTeamId: nextGame.awayTeamId,
        players: state.players,
        homePlan: nextGame.homeTeamId === state.selectedTeamId ? userPlan : aiPlan,
        awayPlan: nextGame.awayTeamId === state.selectedTeamId ? userPlan : aiPlan,
      }),
    });
  },

  simulateNextPossession: () => {
    const state = get();
    if (!state.activeGame) return;
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

  updateUserPlan: (plan) => {
    const state = get();
    const game = state.activeGame;
    if (!game) return;
    const isHome = game.homeTeamId === state.selectedTeamId;
    const key = isHome ? "homePlan" : "awayPlan";
    set({
      activeGame: {
        ...game,
        [key]: {
          ...game[key],
          ...plan,
        },
      },
    });
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
        [key]: {
          ...game[key],
          playerInstructions: {
            ...game[key].playerInstructions,
            [playerId]: instruction,
          },
        },
      },
    });
  },

  finalizeActiveGame: () => {
    const state = get();
    if (!state.activeGame?.isFinal) return;
    const season = advanceSeasonDay(applyGameResult(state.season, state.activeGame));
    set({ season });
    const saved = saveCareer({ ...careerFromState({ ...get(), season }), season });
    set({ lastSavedAt: saved.savedAt });
  },

  manualSave: () => {
    const saved = saveCareer(careerFromState(get()));
    set({ lastSavedAt: saved.savedAt });
  },

  loadSave: (id) => {
    const save = loadCareer(id);
    if (!save) return;
    set({
      selectedTeamId: save.selectedTeamId,
      coach: save.coach,
      season: save.season,
      activeGame: undefined,
      lastSavedAt: save.savedAt,
    });
  },
}));
