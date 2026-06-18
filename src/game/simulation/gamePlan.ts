import type { TeamGamePlan } from "../types/domain";

export function createDefaultGamePlan(playerIds: string[] = []): TeamGamePlan {
  return {
    offensiveFocus: "Balanced",
    defensiveFocus: "Balanced",
    offensivePlay: "Pick and Roll",
    defensiveScheme: "Man to Man",
    playerInstructions: Object.fromEntries(playerIds.map((id) => [id, "Neutral"])),
  };
}
