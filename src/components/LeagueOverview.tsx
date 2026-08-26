import { CalendarDays, ChevronRight, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { validateLeagueData } from "../game/data/leagueData";
import { formatTeam, getRoster } from "../game/data/selectors";
import { standingsRows } from "../game/simulation/season";
import { useCareerStore } from "../store/careerStore";
import { pct } from "../utils/format";

export function LeagueOverview() {
  const teams = useCareerStore((state) => state.teams);
  const players = useCareerStore((state) => state.players);
  const season = useCareerStore((state) => state.season);
  const setScoutTeam = useCareerStore((state) => state.setScoutTeam);
  const setActiveTab = useCareerStore((state) => state.setActiveTab);
  const validation = validateLeagueData();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      standingsRows(season).map((row) => ({ ...row, team: teams.find((team) => team.id === row.teamId)! })),
    [season, teams],
  );

  const focusTeam = selectedTeamId ? teams.find((team) => team.id === selectedTeamId) ?? null : null;
  const focusRoster = focusTeam ? getRoster(players, focusTeam.id).slice(0, 7) : [];
  const focusFixtures = focusTeam
    ? season.schedule
        .filter((game) => game.homeTeamId === focusTeam.id || game.awayTeamId === focusTeam.id)
        .sort((a, b) => a.day - b.day)
        .slice(0, 5)
    : [];

  const openTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setScoutTeam(teamId);
    setActiveTab("scout");
  };

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
                <th className="px-3 py-2 text-right">Go</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teamId} className="border-t border-black/10 hover:bg-chalk/60">
                  <td className="px-3 py-2">
                    <button
                      className="flex items-center gap-2 font-bold text-left text-ink transition hover:text-pine"
                      onClick={() => setSelectedTeamId(row.teamId)}
                    >
                      <span>{formatTeam(row.team)}</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">{row.wins}</td>
                  <td className="px-3 py-2 text-right">{row.losses}</td>
                  <td className="px-3 py-2 text-right">{pct(row.pct)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="rounded bg-pine px-2 py-1 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-ink"
                      onClick={() => openTeam(row.teamId)}
                    >
                      Go
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {focusTeam && (
        <div className="rounded-xl border border-black/10 bg-chalk p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase text-slate-500">Selected club</div>
              <div className="text-xl font-black">{formatTeam(focusTeam)}</div>
            </div>
            <button
              className="rounded-lg bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-ink ring-1 ring-black/10 transition hover:border-pine hover:text-pine"
              onClick={() => openTeam(focusTeam.id)}
            >
              View roster & fixtures
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-slate-500">
                <Users size={14} />
                Roster
              </div>
              <div className="space-y-2">
                {focusRoster.map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <div>
                      <div className="font-black">{player.name}</div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">{player.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-pine">OVR {player.overall}</div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">{player.age} yrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-slate-500">
                <CalendarDays size={14} />
                Fixtures
              </div>
              <div className="space-y-2">
                {focusFixtures.map((game) => {
                  const opponentId = game.homeTeamId === focusTeam.id ? game.awayTeamId : game.homeTeamId;
                  const opponent = teams.find((team) => team.id === opponentId);
                  const isHome = game.homeTeamId === focusTeam.id;
                  const result = game.played && game.homeScore !== undefined && game.awayScore !== undefined ? `${game.homeScore}-${game.awayScore}` : "—";
                  return (
                    <div key={game.id} className="rounded-lg bg-white px-3 py-2">
                      <div className="text-[10px] font-black uppercase text-slate-500">Day {game.day}</div>
                      <div className="mt-1 text-sm font-bold">
                        {isHome ? "vs" : "@"} {opponent ? formatTeam(opponent) : opponentId}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">{game.played ? `Final ${result}` : "Upcoming"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
