import { useState } from "react";
import { Dumbbell, Users } from "lucide-react";
import { getRoster } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";
import type { Player, TrainingAttribute } from "../game/types/domain";

const TRAINING_OPTIONS: { value: TrainingAttribute; label: string }[] = [
  { value: "threePoint", label: "3-Point Shooting" },
  { value: "midrange", label: "Mid-Range" },
  { value: "insideScoring", label: "Inside Scoring" },
  { value: "passing", label: "Passing" },
  { value: "rebounding", label: "Rebounding" },
  { value: "perimeterDefense", label: "Perimeter Defense" },
  { value: "interiorDefense", label: "Interior Defense" },
  { value: "athleticism", label: "Athleticism" },
  { value: "stamina", label: "Stamina" },
];

export function MyRoster() {
  const players = useCareerStore((s) => s.players);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const startingLineups = useCareerStore((s) => s.startingLineups);
  const trainingSessionsUsed = useCareerStore((s) => s.trainingSessionsUsed);
  const setStartingLineup = useCareerStore((s) => s.setStartingLineup);
  const trainPlayer = useCareerStore((s) => s.trainPlayer);

  const [activeView, setActiveView] = useState<"lineup" | "training">("lineup");
  const [trainingTarget, setTrainingTarget] = useState<Player | null>(null);

  const roster = getRoster(players, selectedTeamId);
  const starting = startingLineups[selectedTeamId] ?? roster.slice(0, 5).map((p) => p.id);

  const toggleStarter = (playerId: string) => {
    if (starting.includes(playerId)) {
      setStartingLineup(starting.filter((id) => id !== playerId));
    } else if (starting.length < 5) {
      setStartingLineup([...starting, playerId]);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
            activeView === "lineup" ? "bg-pine text-white" : "bg-chalk text-slate-600 hover:bg-pine/10"
          }`}
          onClick={() => setActiveView("lineup")}
        >
          <Users size={16} />
          Starting Lineup
        </button>
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
            activeView === "training" ? "bg-pine text-white" : "bg-chalk text-slate-600 hover:bg-pine/10"
          }`}
          onClick={() => setActiveView("training")}
        >
          <Dumbbell size={16} />
          Training
        </button>
      </div>

      {activeView === "lineup" && (
        <>
          <div className="rounded-lg bg-chalk p-3 text-sm text-slate-600">
            <span className="font-black text-pine">{starting.length}/5 starters selected.</span>{" "}
            Click players to toggle them in or out of your starting lineup.
          </div>
          <div className="overflow-hidden rounded-lg border border-black/10">
            <table className="w-full text-sm">
              <thead className="bg-chalk text-left text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Pos</th>
                  <th className="px-3 py-2 text-right">Age</th>
                  <th className="px-3 py-2 text-right">OVR</th>
                  <th className="px-3 py-2 text-right">POT</th>
                  <th className="px-3 py-2 text-center">Start</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player) => {
                  const isStarter = starting.includes(player.id);
                  return (
                    <tr
                      key={player.id}
                      className={`cursor-pointer border-t border-black/10 transition ${isStarter ? "bg-mint" : "hover:bg-chalk"}`}
                      onClick={() => toggleStarter(player.id)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-black">{player.name}</div>
                        <div className="text-xs text-slate-500">{player.height} · {player.weight} lbs</div>
                      </td>
                      <td className="px-3 py-2 font-bold">{player.position}</td>
                      <td className="px-3 py-2 text-right">{player.age}</td>
                      <td className="px-3 py-2 text-right font-black">{player.overall}</td>
                      <td className="px-3 py-2 text-right">{player.potential}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-black ${
                            isStarter ? "bg-pine text-white" : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isStarter ? "START" : "BENCH"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeView === "training" && (
        <>
          {trainingTarget ? (
            <TrainingPanel
              player={trainingTarget}
              sessionsUsed={trainingSessionsUsed[trainingTarget.id] ?? 0}
              onTrain={(attr) => {
                trainPlayer(trainingTarget.id, attr);
                setTrainingTarget(null);
              }}
              onBack={() => setTrainingTarget(null)}
            />
          ) : (
            <>
              <div className="rounded-lg bg-chalk p-3 text-sm text-slate-600">
                Each player can train up to <span className="font-black text-pine">3 times per season</span>. 
                Younger players and high-potential players improve more.
              </div>
              <div className="overflow-hidden rounded-lg border border-black/10">
                <table className="w-full text-sm">
                  <thead className="bg-chalk text-left text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Player</th>
                      <th className="px-3 py-2">Pos</th>
                      <th className="px-3 py-2 text-right">OVR</th>
                      <th className="px-3 py-2 text-right">POT</th>
                      <th className="px-3 py-2 text-right">Sessions</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((player) => {
                      const used = trainingSessionsUsed[player.id] ?? 0;
                      const remaining = 3 - used;
                      return (
                        <tr key={player.id} className="border-t border-black/10 hover:bg-chalk">
                          <td className="px-3 py-2">
                            <div className="font-black">{player.name}</div>
                          </td>
                          <td className="px-3 py-2 font-bold">{player.position}</td>
                          <td className="px-3 py-2 text-right font-black">{player.overall}</td>
                          <td className="px-3 py-2 text-right">{player.potential}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`font-bold ${remaining === 0 ? "text-red-500" : "text-pine"}`}>
                              {remaining} left
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              className="rounded bg-pine px-3 py-1 text-xs font-black text-white transition hover:bg-ink disabled:opacity-40"
                              disabled={remaining === 0}
                              onClick={() => setTrainingTarget(player)}
                            >
                              Train
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TrainingPanel({
  player,
  sessionsUsed,
  onTrain,
  onBack,
}: {
  player: Player;
  sessionsUsed: number;
  onTrain: (attr: TrainingAttribute) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<TrainingAttribute | null>(null);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-black">{player.name}</div>
          <div className="text-sm text-slate-500">
            {player.position} · OVR {player.overall} · POT {player.potential} · Age {player.age}
          </div>
        </div>
        <button className="text-sm font-bold text-slate-500 hover:text-ink" onClick={onBack}>
          ← Back
        </button>
      </div>
      <div className="rounded-lg bg-chalk p-3 text-sm text-slate-600">
        Session {sessionsUsed + 1} of 3. Choose a skill to focus on.
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TRAINING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
              selected === opt.value
                ? "border-pine bg-mint text-pine"
                : "border-black/10 bg-white text-slate-700 hover:border-pine"
            }`}
            onClick={() => setSelected(opt.value)}
          >
            <div>{opt.label}</div>
            <div className="mt-1 text-xs font-black text-slate-500">
              {player.attributes[opt.value]}
            </div>
          </button>
        ))}
      </div>
      <button
        className="rounded-lg bg-pine px-4 py-3 text-sm font-black text-white transition hover:bg-ink disabled:opacity-40"
        disabled={!selected}
        onClick={() => selected && onTrain(selected)}
      >
        Run Training Session
      </button>
    </div>
  );
}
