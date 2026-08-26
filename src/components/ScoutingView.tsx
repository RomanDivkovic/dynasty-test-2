import { useState } from "react";
import { getRoster, formatTeam } from "../game/data/selectors";
import { seasonAverages } from "../game/simulation/season";
import { useCareerStore } from "../store/careerStore";
import { PlayerBioModal } from "./PlayerBioModal";

export function ScoutingView() {
  const teams = useCareerStore((s) => s.teams);
  const players = useCareerStore((s) => s.players);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const scoutTeamId = useCareerStore((s) => s.scoutTeamId);
  const setScoutTeam = useCareerStore((s) => s.setScoutTeam);
  const setActiveTab = useCareerStore((s) => s.setActiveTab);
  const season = useCareerStore((s) => s.season);
  const [viewPlayerId, setViewPlayerId] = useState<string | null>(null);

  // Default to first opponent team
  const effectiveScoutId = scoutTeamId || teams.find((t) => t.id !== selectedTeamId)?.id || "";
  const scoutTeam = teams.find((t) => t.id === effectiveScoutId);
  const roster = getRoster(players, effectiveScoutId);
  const viewPlayer = roster.find((p) => p.id === viewPlayerId);
  const upcomingFixtures = season.schedule
    .filter((game) => game.homeTeamId === effectiveScoutId || game.awayTeamId === effectiveScoutId)
    .sort((a, b) => a.day - b.day)
    .slice(0, 6);

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
                  <th className="px-3 py-2 text-right">PPG</th>
                  <th className="px-3 py-2 text-right">3PT</th>
                  <th className="px-3 py-2 text-right">REB</th>
                  <th className="px-3 py-2 text-right">DEF</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player, i) => {
                  const averages = seasonAverages(season.playerSeasonStats[player.id]);
                  return (
                    <tr
                      key={player.id}
                      className={`cursor-pointer border-t border-black/10 transition ${
                        i < 5 ? "bg-white hover:bg-chalk" : "bg-chalk/50 hover:bg-chalk"
                      }`}
                      onClick={() => setViewPlayerId(player.id)}
                    >
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
                      <td className="px-3 py-2 text-right font-bold">
                        {averages.hasStats ? averages.ppg : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{player.attributes.threePoint}</td>
                      <td className="px-3 py-2 text-right">{player.attributes.rebounding}</td>
                      <td className="px-3 py-2 text-right">{player.attributes.perimeterDefense}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {upcomingFixtures.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-chalk p-4">
              <div className="mb-2 text-xs font-black uppercase text-slate-500">Upcoming fixtures</div>
              <div className="space-y-2">
                {upcomingFixtures.map((game) => {
                  const opponentId = game.homeTeamId === effectiveScoutId ? game.awayTeamId : game.homeTeamId;
                  const opponent = teams.find((team) => team.id === opponentId);
                  const isHome = game.homeTeamId === effectiveScoutId;
                  return (
                    <div key={game.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-500">Day {game.day}</div>
                        <div className="font-bold">
                          {isHome ? "vs" : "@"} {opponent ? formatTeam(opponent) : opponentId}
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-500">
                        {game.played ? (game.homeScore !== undefined && game.awayScore !== undefined ? `${game.homeScore}-${game.awayScore}` : "Final") : "Upcoming"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[11px] font-bold text-slate-500">
            Click a player to view full bio, real tracked season stats, and abilities. PPG shows "—" until they've
            appeared in a simulated game this season.
          </div>
        </>
      )}

      {viewPlayer && <PlayerBioModal player={viewPlayer} onClose={() => setViewPlayerId(null)} />}
    </div>
  );
}

