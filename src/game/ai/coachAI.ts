import type { Player, TeamGamePlan } from "../types/domain";
import { teamStrength } from "../data/selectors";

export function createAiGamePlan(players: Player[], teamId: string, opponentTeamId: string): TeamGamePlan {
  const ownStrength = teamStrength(players, teamId);
  const opponentStrength = teamStrength(players, opponentTeamId);
  const isUnderdog = ownStrength + 3 < opponentStrength;
  const roster = players.filter((player) => player.teamId === teamId);
  const bestShooter = roster.reduce((best, player) =>
    player.attributes.threePoint > best.attributes.threePoint ? player : best,
  );
  const bestBig = roster.reduce((best, player) =>
    player.attributes.rebounding + player.attributes.interiorDefense >
    best.attributes.rebounding + best.attributes.interiorDefense
      ? player
      : best,
  );

  return {
    offensiveFocus: bestShooter.attributes.threePoint > 85 ? "Shoot more threes" : isUnderdog ? "Push pace" : "Balanced",
    defensiveFocus: isUnderdog ? "Force turnovers" : "Protect rim",
    offensivePlay: bestBig.attributes.insideScoring > 86 ? "Post Up" : bestShooter.attributes.threePoint > 86 ? "Quick Three" : "Pick and Roll",
    defensiveScheme: isUnderdog ? "Half Court Trap" : "Man to Man",
    playerInstructions: Object.fromEntries(roster.map((player) => [player.id, player.id === bestShooter.id ? "Shoot more" : "Neutral"])),
  };
}
