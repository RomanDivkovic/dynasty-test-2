import { Save, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { listSaveSlots } from "../game/saves/saveSystem";
import { formatTeam } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";
import { shortTime } from "../utils/format";

export function CoachSetup() {
  const teams = useCareerStore((state) => state.teams);
  const selectedTeamId = useCareerStore((state) => state.selectedTeamId);
  const coach = useCareerStore((state) => state.coach);
  const startCareer = useCareerStore((state) => state.startCareer);
  const manualSave = useCareerStore((state) => state.manualSave);
  const loadSave = useCareerStore((state) => state.loadSave);
  const lastSavedAt = useCareerStore((state) => state.lastSavedAt);
  const [coachName, setCoachName] = useState(coach.name);
  const [teamId, setTeamId] = useState(selectedTeamId);
  const [saveRefresh, setSaveRefresh] = useState(0);
  const slots = useMemo(() => listSaveSlots(), [saveRefresh]);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
        Coach name
        <input
          className="rounded border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
          value={coachName}
          onChange={(event) => setCoachName(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
        Team
        <select
          className="rounded border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {formatTeam(team)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-pine px-3 py-2 text-sm font-black text-white transition hover:bg-ink"
          onClick={() => startCareer(teamId, coachName)}
        >
          <UserRound size={16} />
          Start
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded border border-black/10 bg-white px-3 py-2 text-sm font-black text-ink transition hover:border-pine"
          onClick={() => {
            manualSave();
            setSaveRefresh((value) => value + 1);
          }}
        >
          <Save size={16} />
          Save
        </button>
      </div>
      <div className="text-xs text-slate-500">Last save: {shortTime(lastSavedAt)}</div>
      {slots.length ? (
        <div className="grid gap-2 border-t border-black/10 pt-3">
          {slots.map((slot) => (
            <button
              key={slot.id}
              className="rounded border border-black/10 px-3 py-2 text-left text-xs transition hover:border-pine"
              onClick={() => loadSave(slot.id)}
            >
              <div className="font-black text-ink">{slot.name}</div>
              <div className="text-slate-500">
                {slot.seasonYear} season, saved {shortTime(slot.savedAt)}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
