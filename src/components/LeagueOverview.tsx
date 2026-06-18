import { Trophy } from "lucide-react";
import { validateLeagueData } from "../game/data/leagueData";
import { formatTeam } from "../game/data/selectors";
import { standingsRows } from "../game/simulation/season";
import { useCareerStore } from "../store/careerStore";
import { pct } from "../utils/format";

export function LeagueOverview() {
  const teams = useCareerStore((state) => state.teams);
  const season = useCareerStore((state) => state.season);
  const validation = validateLeagueData();
  const rows = standingsRows(season)
    .slice(0, 10)
    .map((row) => ({ ...row, team: teams.find((team) => team.id === row.teamId)! }));

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded bg-chalk p-3 text-center">
          <div className="text-2xl font-black">{validation.teamCount}</div>
          <div className="text-[11px] font-bold uppercase text-slate-500">Teams</div>
        </div>
        <div className="rounded bg-chalk p-3 text-center">
          <div className="text-2xl font-black">{validation.playerCount}</div>
          <div className="text-[11px] font-bold uppercase text-slate-500">Players</div>
        </div>
        <div className="rounded bg-chalk p-3 text-center">
          <div className="text-2xl font-black">{season.year}</div>
          <div className="text-[11px] font-bold uppercase text-slate-500">Season</div>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-500">
          <Trophy size={15} />
          Top standings
        </div>
        <div className="overflow-hidden rounded border border-black/10">
          <table className="w-full text-sm">
            <thead className="bg-chalk text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">W</th>
                <th className="px-3 py-2 text-right">L</th>
                <th className="px-3 py-2 text-right">Pct</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teamId} className="border-t border-black/10">
                  <td className="px-3 py-2 font-bold">{formatTeam(row.team)}</td>
                  <td className="px-3 py-2 text-right">{row.wins}</td>
                  <td className="px-3 py-2 text-right">{row.losses}</td>
                  <td className="px-3 py-2 text-right">{pct(row.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
