import type { Player } from "../types/domain";

export function progressPlayers(players: Player[]): Player[] {
  return players.map((player) => {
    const ageCurve = player.age < 25 ? 2 : player.age < 29 ? 1 : player.age < 33 ? 0 : -2;
    const potentialGap = Math.max(0, player.potential - player.overall);
    const growth = Math.min(3, Math.round(potentialGap / 8)) + ageCurve;
    const nextOverall = Math.max(45, Math.min(player.potential, player.overall + growth));

    return {
      ...player,
      age: player.age + 1,
      overall: nextOverall,
      attributes: Object.fromEntries(
        Object.entries(player.attributes).map(([key, value]) => [
          key,
          key === "potential" ? value : Math.max(40, Math.min(99, Math.round(value + growth * 0.7))),
        ]),
      ) as Player["attributes"],
    };
  });
}
