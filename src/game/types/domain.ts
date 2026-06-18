export type Conference = "East" | "West";

export type Division =
  | "Atlantic"
  | "Central"
  | "Southeast"
  | "Northwest"
  | "Pacific"
  | "Southwest";

export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type CoachingStyle = "Balanced" | "Defensive" | "Offensive" | "Development" | "Pace and Space";

export type OffensivePhilosophy =
  | "Balanced"
  | "Shoot more threes"
  | "Attack paint"
  | "Push pace"
  | "Slow pace";

export type DefensivePhilosophy =
  | "Balanced"
  | "Protect rim"
  | "Force turnovers"
  | "Double star player"
  | "Full court pressure";

export type OffensivePlay = "Pick and Roll" | "Isolation" | "Post Up" | "Motion Offense" | "Quick Three";

export type DefensiveScheme = "Man to Man" | "Zone" | "Half Court Trap";

export type PlayerInstruction =
  | "Neutral"
  | "Shoot more"
  | "Shoot less"
  | "Be aggressive"
  | "Be conservative"
  | "Focus defense"
  | "Crash boards"
  | "Rest more";

export interface PlayerAttributes {
  insideScoring: number;
  midrange: number;
  threePoint: number;
  passing: number;
  ballHandling: number;
  rebounding: number;
  interiorDefense: number;
  perimeterDefense: number;
  steals: number;
  blocks: number;
  athleticism: number;
  stamina: number;
  basketballIq: number;
  potential: number;
}

export interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
  primaryColor: string;
  secondaryColor: string;
}

export interface TeamRecord {
  wins: number;
  losses: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  height: string;
  weight: number;
  teamId: string;
  position: Position;
  overall: number;
  potential: number;
  attributes: PlayerAttributes;
}

export interface Coach {
  id: string;
  name: string;
  age: number;
  coachingStyle: CoachingStyle;
  offensivePhilosophy: OffensivePhilosophy;
  defensivePhilosophy: DefensivePhilosophy;
  seasonsCompleted: number;
  maxSeasons: number;
}

export interface TeamGamePlan {
  offensiveFocus: OffensivePhilosophy;
  defensiveFocus: DefensivePhilosophy;
  offensivePlay: OffensivePlay;
  defensiveScheme: DefensiveScheme;
  playerInstructions: Record<string, PlayerInstruction>;
}

export interface PlayerBoxScore {
  playerId: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fga: number;
  fgm: number;
  threePa: number;
  threePm: number;
  fta: number;
  ftm: number;
  fatigue: number;
}

export interface TeamGameStats {
  points: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fga: number;
  fgm: number;
  threePa: number;
  threePm: number;
  fta: number;
  ftm: number;
}

export interface PlayByPlayEvent {
  id: string;
  quarter: number;
  clock: string;
  possession: number;
  teamId: string;
  text: string;
  score: string;
  importance: "routine" | "score" | "stop" | "swing";
}

export interface GameState {
  id: string;
  season: number;
  gameNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  possessionTeamId: string;
  quarter: number;
  clockSeconds: number;
  possession: number;
  momentum: number;
  isFinal: boolean;
  homeStats: TeamGameStats;
  awayStats: TeamGameStats;
  boxScores: Record<string, PlayerBoxScore>;
  playByPlay: PlayByPlayEvent[];
  homePlan: TeamGamePlan;
  awayPlan: TeamGamePlan;
}

export interface ScheduledGame {
  id: string;
  day: number;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface Season {
  year: number;
  currentDay: number;
  schedule: ScheduledGame[];
  records: Record<string, TeamRecord>;
  championTeamId?: string;
}

export interface CareerSave {
  id: string;
  name: string;
  savedAt: string;
  selectedTeamId: string;
  coach: Coach;
  season: Season;
}
