import type { Player, Team } from "../types/domain";

export function getTeam(teams: Team[], teamId: string) {
  const team = teams.find((entry) => entry.id === teamId);
  if (!team) throw new Error(`Unknown team id: ${teamId}`);
  return team;
}

export function getRoster(players: Player[], teamId: string) {
  return players
    .filter((player) => player.teamId === teamId)
    .sort((a, b) => b.overall - a.overall);
}

export function teamStrength(players: Player[], teamId: string) {
  const roster = getRoster(players, teamId).slice(0, 5);
  return roster.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, roster.length);
}

export function formatTeam(team: Team) {
  return `${team.city} ${team.name}`;
}
