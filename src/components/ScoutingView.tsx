import { getRoster, formatTeam } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";

export function ScoutingView() {
  const teams = useCareerStore((s) => s.teams);
  const players = useCareerStore((s) => s.players);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const scoutTeamId = useCareerStore((s) => s.scoutTeamId);
  const setScoutTeam = useCareerStore((s) => s.setScoutTeam);
  const setActiveTab = useCareerStore((s) => s.setActiveTab);

  // Default to first opponent team
  const effectiveScoutId = scoutTeamId || teams.find((t) => t.id !== selectedTeamId)?.id || "";
  const scoutTeam = teams.find((t) => t.id === effectiveScoutId);
  const roster = getRoster(players, effectiveScoutId);

  const otherTeams = teams.filter((t) => t.id !== selectedTeamId);

  return (
    <div className="grid gap-4">
      {/* Team picker */}
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">Scout Team</label>
        <select
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
          value={effectiveScoutId}
          onChange={(e) => setScoutTeam(e.target.value)}
        >
          {otherTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {formatTeam(t)} ({t.abbreviation})
            </option>
          ))}
        </select>
      </div>

      {scoutTeam && (
        <>
          {/* Team header */}
          <div
            className="flex items-center gap-3 rounded-lg p-4 text-white"
            style={{ backgroundColor: scoutTeam.primaryColor }}
          >
            <div>
              <div className="text-lg font-black">{formatTeam(scoutTeam)}</div>
              <div className="text-sm text-white/70">{scoutTeam.conference} · {scoutTeam.division}</div>
            </div>
            <div className="ml-auto">
              <button
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/30"
                onClick={() => setActiveTab("trades")}
              >
                Propose Trade →
              </button>
            </div>
          </div>

          {/* Roster table */}
          <div className="overflow-hidden rounded-lg border border-black/10">
            <table className="w-full text-sm">
              <thead className="bg-chalk text-left text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Pos</th>
                  <th className="px-3 py-2 text-right">Age</th>
                  <th className="px-3 py-2 text-right">OVR</th>
                  <th className="px-3 py-2 text-right">POT</th>
                  <th className="px-3 py-2 text-right">3PT</th>
                  <th className="px-3 py-2 text-right">REB</th>
                  <th className="px-3 py-2 text-right">DEF</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player, i) => (
                  <tr key={player.id} className={`border-t border-black/10 ${i < 5 ? "bg-white" : "bg-chalk/50"}`}>
                    <td className="px-3 py-2">
                      <div className="font-black">{player.name}</div>
                      {i < 5 && (
                        <div className="text-[10px] font-bold uppercase text-court">Starter</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-bold">{player.position}</td>
                    <td className="px-3 py-2 text-right">{player.age}</td>
                    <td className="px-3 py-2 text-right font-black">{player.overall}</td>
                    <td className="px-3 py-2 text-right">{player.potential}</td>
                    <td className="px-3 py-2 text-right">{player.attributes.threePoint}</td>
                    <td className="px-3 py-2 text-right">{player.attributes.rebounding}</td>
                    <td className="px-3 py-2 text-right">{player.attributes.perimeterDefense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
