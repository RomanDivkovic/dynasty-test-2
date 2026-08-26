import { X } from "lucide-react";
import { seasonAverages } from "../game/simulation/season";
import { useCareerStore } from "../store/careerStore";
import type { Player } from "../game/types/domain";

const ABILITY_ROWS: { label: string; key: keyof Player["attributes"] }[] = [
  { label: "Inside Scoring", key: "insideScoring" },
  { label: "Midrange", key: "midrange" },
  { label: "Three Point", key: "threePoint" },
  { label: "Passing", key: "passing" },
  { label: "Ball Handling", key: "ballHandling" },
  { label: "Rebounding", key: "rebounding" },
  { label: "Interior Defense", key: "interiorDefense" },
  { label: "Perimeter Defense", key: "perimeterDefense" },
  { label: "Steals", key: "steals" },
  { label: "Blocks", key: "blocks" },
  { label: "Athleticism", key: "athleticism" },
  { label: "Stamina", key: "stamina" },
];

export function PlayerBioModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const teams = useCareerStore((s) => s.teams);
  const season = useCareerStore((s) => s.season);
  const team = teams.find((t) => t.id === player.teamId);
  const averages = seasonAverages(season.playerSeasonStats[player.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 sm:pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 rounded-t-xl p-5 text-white"
          style={{ backgroundColor: team?.primaryColor ?? "#0f172a" }}
        >
          <div>
            <div className="text-xl font-black">{player.name}</div>
            <div className="text-xs font-bold uppercase text-white/70">
              {player.position} · Age {player.age} · {player.height} / {player.weight} lbs
            </div>
            {team && <div className="mt-1 text-xs font-bold text-white/60">{team.city} {team.name}</div>}
          </div>
          <button
            className="rounded-lg bg-white/15 p-1.5 text-white transition hover:bg-white/25"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          {/* Ratings */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBox label="OVR" value={player.overall} highlight />
            <StatBox label="POT" value={player.potential} />
            <StatBox label="3PT" value={player.attributes.threePoint} />
            <StatBox label="IQ" value={player.attributes.basketballIq} />
          </div>

          {/* Season stat line */}
          <div>
            <div className="mb-2 text-xs font-black uppercase text-slate-500">
              {season.year} Season Stats {averages.hasStats ? `(${averages.gamesPlayed} GP)` : ""}
            </div>
            {averages.hasStats ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <StatBox label="PPG" value={averages.ppg} highlight />
                <StatBox label="RPG" value={averages.rpg} />
                <StatBox label="APG" value={averages.apg} />
                <StatBox label="SPG" value={averages.spg} />
                <StatBox label="BPG" value={averages.bpg} />
                <StatBox label="FG%" value={averages.fgPct} />
              </div>
            ) : (
              <div className="rounded-lg bg-chalk p-3 text-xs font-bold text-slate-500">
                No games tracked yet this season. Stats appear here once this player takes the court in a simulated
                game.
              </div>
            )}
          </div>

          {/* Ability breakdown */}
          <div>
            <div className="mb-2 text-xs font-black uppercase text-slate-500">Ability Breakdown</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {ABILITY_ROWS.map((row) => (
                <AbilityRow key={row.key} label={row.label} value={player.attributes[row.key]} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${highlight ? "border-pine bg-mint" : "border-black/10 bg-chalk"}`}>
      <div className="text-[10px] font-black uppercase text-slate-500">{label}</div>
      <div className="text-lg font-black text-ink">{value}</div>
    </div>
  );
}

function AbilityRow({ label, value }: { label: string; value: number }) {
  const width = `${Math.max(5, Math.min(100, value))}%`;

  return (
    <div className="rounded-lg border border-black/10 bg-chalk px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-600">{label}</span>
        <span className="font-black text-ink">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-pine" style={{ width }} />
      </div>
    </div>
  );
}
