import { useState } from "react";
import type {
  DefensivePhilosophy,
  DefensiveScheme,
  OffensivePhilosophy,
  OffensivePlay,
  PlayerInstruction,
} from "../game/types/domain";
import { getRoster } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";

const offensiveFocuses: OffensivePhilosophy[] = [
  "Balanced", "Shoot more threes", "Attack paint", "Push pace", "Slow pace",
];
const defensiveFocuses: DefensivePhilosophy[] = [
  "Balanced", "Protect rim", "Force turnovers", "Double star player", "Full court pressure",
];
const offensivePlays: OffensivePlay[] = [
  "Pick and Roll", "Isolation", "Post Up", "Motion Offense", "Quick Three",
];
const defensiveSchemes: DefensiveScheme[] = ["Man to Man", "Zone", "Half Court Trap"];
const instructions: PlayerInstruction[] = [
  "Neutral", "Shoot more", "Shoot less", "Be aggressive",
  "Be conservative", "Focus defense", "Crash boards", "Rest more",
];

type PanelTab = "tactics" | "lineup";

export function TacticsPanel() {
  const activeGame = useCareerStore((s) => s.activeGame);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const players = useCareerStore((s) => s.players);
  const updateUserPlan = useCareerStore((s) => s.updateUserPlan);
  const updatePlayerInstruction = useCareerStore((s) => s.updatePlayerInstruction);

  const [tab, setTab] = useState<PanelTab>("tactics");

  const plan = activeGame
    ? activeGame.homeTeamId === selectedTeamId ? activeGame.homePlan : activeGame.awayPlan
    : undefined;

  // Active players in game
  const activeIds = activeGame
    ? Object.keys(activeGame.boxScores).filter((id) => {
        const p = players.find((pl) => pl.id === id);
        return p?.teamId === selectedTeamId && !activeGame.benchedIds.includes(id);
      })
    : [];

  if (!plan || !activeGame) {
    return (
      <div className="rounded-lg bg-chalk p-4 text-sm text-slate-500">
        Start the next game to unlock live coaching controls.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg border border-black/10 bg-chalk p-1">
        {(["tactics", "lineup"] as PanelTab[]).map((t) => (
          <button
            key={t}
            className={`flex-1 rounded-md py-1.5 text-xs font-black transition ${
              tab === t ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "tactics" ? "🎯 Tactics" : "📋 Box Score"}
          </button>
        ))}
      </div>

      {tab === "tactics" && (
        <div className="grid gap-3">
          {/* Team scheme */}
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectControl
              label="Offensive Focus"
              value={plan.offensiveFocus}
              options={offensiveFocuses}
              onChange={(v) => updateUserPlan({ offensiveFocus: v as OffensivePhilosophy })}
            />
            <SelectControl
              label="Defensive Focus"
              value={plan.defensiveFocus}
              options={defensiveFocuses}
              onChange={(v) => updateUserPlan({ defensiveFocus: v as DefensivePhilosophy })}
            />
            <SelectControl
              label="Set Play"
              value={plan.offensivePlay}
              options={offensivePlays}
              onChange={(v) => updateUserPlan({ offensivePlay: v as OffensivePlay })}
            />
            <SelectControl
              label="Defense Scheme"
              value={plan.defensiveScheme}
              options={defensiveSchemes}
              onChange={(v) => updateUserPlan({ defensiveScheme: v as DefensiveScheme })}
            />
          </div>

          {/* Per-player instructions */}
          <div className="text-xs font-black uppercase text-slate-500">Player Instructions</div>
          <div className="grid gap-1.5">
            {activeIds.map((id) => {
              const p = players.find((pl) => pl.id === id);
              if (!p) return null;
              return (
                <div
                  key={id}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-black leading-tight">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.position} · {p.overall} OVR</div>
                  </div>
                  <select
                    className="rounded border border-black/10 bg-chalk px-2 py-1 text-xs font-bold outline-none focus:border-pine"
                    value={plan.playerInstructions[id] ?? "Neutral"}
                    onChange={(e) => updatePlayerInstruction(id, e.target.value as PlayerInstruction)}
                  >
                    {instructions.map((ins) => <option key={ins}>{ins}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "lineup" && (
        <div className="grid gap-2">
          <div className="text-xs font-black uppercase text-slate-500">On Court</div>
          {activeIds.map((id) => {
            const p = players.find((pl) => pl.id === id);
            const box = activeGame.boxScores[id];
            if (!p || !box) return null;
            const fatiguePct = Math.round((box.fatigue / 35) * 100);
            return (
              <div key={id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
                <div>
                  <div className="text-sm font-black">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.position}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-black">
                    {box.points}pts {box.rebounds}reb {box.assists}ast
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${fatiguePct > 60 ? "bg-red-400" : fatiguePct > 30 ? "bg-yellow-400" : "bg-green-400"}`}
                        style={{ width: `${fatiguePct}%` }}
                      />
                    </div>
                    <span className="text-slate-400">{fatiguePct}%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Benched */}
          {activeGame.benchedIds.filter((id) => players.find((p) => p.id === id)?.teamId === selectedTeamId).length > 0 && (
            <>
              <div className="mt-1 text-xs font-black uppercase text-slate-500">Benched This Game</div>
              {activeGame.benchedIds
                .filter((id) => players.find((p) => p.id === id)?.teamId === selectedTeamId)
                .map((id) => {
                  const p = players.find((pl) => pl.id === id);
                  const box = activeGame.boxScores[id];
                  if (!p) return null;
                  return (
                    <div key={id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-black/10 bg-chalk px-3 py-2 opacity-60">
                      <div>
                        <div className="text-sm font-black">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.position} · Benched</div>
                      </div>
                      {box && (
                        <div className="text-right text-xs font-black text-slate-500">
                          {box.points}pts {box.rebounds}reb
                        </div>
                      )}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SelectControl({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
      {label}
      <select
        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => <option key={opt}>{opt}</option>)}
      </select>
    </label>
  );
}
