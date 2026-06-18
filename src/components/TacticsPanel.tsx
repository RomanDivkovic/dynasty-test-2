import type {
  DefensivePhilosophy,
  DefensiveScheme,
  OffensivePhilosophy,
  OffensivePlay,
  PlayerInstruction,
} from "../game/types/domain";
import { getRoster } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";

const offensiveFocuses: OffensivePhilosophy[] = ["Balanced", "Shoot more threes", "Attack paint", "Push pace", "Slow pace"];
const defensiveFocuses: DefensivePhilosophy[] = ["Balanced", "Protect rim", "Force turnovers", "Double star player", "Full court pressure"];
const offensivePlays: OffensivePlay[] = ["Pick and Roll", "Isolation", "Post Up", "Motion Offense", "Quick Three"];
const defensiveSchemes: DefensiveScheme[] = ["Man to Man", "Zone", "Half Court Trap"];
const instructions: PlayerInstruction[] = [
  "Neutral",
  "Shoot more",
  "Shoot less",
  "Be aggressive",
  "Be conservative",
  "Focus defense",
  "Crash boards",
  "Rest more",
];

export function TacticsPanel() {
  const activeGame = useCareerStore((state) => state.activeGame);
  const selectedTeamId = useCareerStore((state) => state.selectedTeamId);
  const players = useCareerStore((state) => state.players);
  const updateUserPlan = useCareerStore((state) => state.updateUserPlan);
  const updatePlayerInstruction = useCareerStore((state) => state.updatePlayerInstruction);
  const roster = getRoster(players, selectedTeamId).slice(0, 5);
  const plan = activeGame ? (activeGame.homeTeamId === selectedTeamId ? activeGame.homePlan : activeGame.awayPlan) : undefined;

  if (!plan) {
    return <div className="text-sm text-slate-500">Start the next game to unlock live tactical controls.</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectControl
          label="Offensive focus"
          value={plan.offensiveFocus}
          options={offensiveFocuses}
          onChange={(value) => updateUserPlan({ offensiveFocus: value as OffensivePhilosophy })}
        />
        <SelectControl
          label="Defensive focus"
          value={plan.defensiveFocus}
          options={defensiveFocuses}
          onChange={(value) => updateUserPlan({ defensiveFocus: value as DefensivePhilosophy })}
        />
        <SelectControl
          label="Offensive play"
          value={plan.offensivePlay}
          options={offensivePlays}
          onChange={(value) => updateUserPlan({ offensivePlay: value as OffensivePlay })}
        />
        <SelectControl
          label="Defensive scheme"
          value={plan.defensiveScheme}
          options={defensiveSchemes}
          onChange={(value) => updateUserPlan({ defensiveScheme: value as DefensiveScheme })}
        />
      </div>
      <div className="grid gap-2">
        <div className="text-xs font-black uppercase text-slate-500">Individual instructions</div>
        {roster.map((player) => (
          <div key={player.id} className="grid grid-cols-[1fr_150px] items-center gap-2 rounded border border-black/10 px-3 py-2">
            <div>
              <div className="text-sm font-black">{player.name}</div>
              <div className="text-xs text-slate-500">
                {player.position} · {player.overall} OVR
              </div>
            </div>
            <select
              className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-pine"
              value={plan.playerInstructions[player.id] ?? "Neutral"}
              onChange={(event) => updatePlayerInstruction(player.id, event.target.value as PlayerInstruction)}
            >
              {instructions.map((instruction) => (
                <option key={instruction}>{instruction}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
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
        className="rounded border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
