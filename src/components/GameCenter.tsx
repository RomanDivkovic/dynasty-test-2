import { FastForward, Play, SkipForward } from "lucide-react";
import { getTeam, formatTeam } from "../game/data/selectors";
import { formatClock, shootingLine } from "../game/simulation/engine";
import { useCareerStore } from "../store/careerStore";
import { Metric } from "./Metric";

export function GameCenter() {
  const teams = useCareerStore((state) => state.teams);
  const season = useCareerStore((state) => state.season);
  const selectedTeamId = useCareerStore((state) => state.selectedTeamId);
  const activeGame = useCareerStore((state) => state.activeGame);
  const startNextGame = useCareerStore((state) => state.startNextGame);
  const simulateNextPossession = useCareerStore((state) => state.simulateNextPossession);
  const simulateGameToFinal = useCareerStore((state) => state.simulateGameToFinal);
  const nextGame = season.schedule.find(
    (game) => !game.played && (game.homeTeamId === selectedTeamId || game.awayTeamId === selectedTeamId),
  );

  if (!activeGame) {
    return (
      <div className="grid gap-4">
        <div className="rounded bg-chalk p-4">
          {nextGame ? (
            <>
              <div className="text-xs font-black uppercase text-slate-500">Next game</div>
              <div className="mt-1 text-2xl font-black">
                {getTeam(teams, nextGame.awayTeamId).abbreviation} at {getTeam(teams, nextGame.homeTeamId).abbreviation}
              </div>
              <div className="text-sm text-slate-500">Day {nextGame.day} of the schedule</div>
            </>
          ) : (
            <div className="text-sm font-bold text-slate-600">No remaining scheduled games in this MVP season sample.</div>
          )}
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-court px-4 py-3 text-sm font-black text-white transition hover:bg-ink disabled:opacity-40"
          disabled={!nextGame}
          onClick={startNextGame}
        >
          <Play size={18} />
          Start next game
        </button>
      </div>
    );
  }

  const homeTeam = getTeam(teams, activeGame.homeTeamId);
  const awayTeam = getTeam(teams, activeGame.awayTeamId);
  const leading = activeGame.homeStats.points === activeGame.awayStats.points
    ? "Tied"
    : activeGame.homeStats.points > activeGame.awayStats.points
      ? `${homeTeam.abbreviation} leads`
      : `${awayTeam.abbreviation} leads`;

  return (
    <div className="grid gap-4">
      <div className="court-lines overflow-hidden rounded-md bg-pine p-4 text-white">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ScoreBlock label={formatTeam(awayTeam)} score={activeGame.awayStats.points} align="left" />
          <div className="rounded bg-white px-4 py-2 text-center text-ink">
            <div className="text-[11px] font-black uppercase text-slate-500">Q{activeGame.quarter}</div>
            <div className="text-xl font-black">{activeGame.isFinal ? "Final" : formatClock(activeGame.clockSeconds)}</div>
          </div>
          <ScoreBlock label={formatTeam(homeTeam)} score={activeGame.homeStats.points} align="right" />
        </div>
        <div className="mt-3 text-center text-sm font-bold text-white/80">
          {leading} · Possession {activeGame.possession} · Momentum {activeGame.momentum.toFixed(1)}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Metric label={awayTeam.abbreviation} value={activeGame.awayStats.points} detail={shootingLine(activeGame.awayStats)} />
        <Metric label={homeTeam.abbreviation} value={activeGame.homeStats.points} detail={shootingLine(activeGame.homeStats)} />
        <Metric label="Rebounds" value={`${activeGame.awayStats.rebounds}-${activeGame.homeStats.rebounds}`} />
        <Metric label="Turnovers" value={`${activeGame.awayStats.turnovers}-${activeGame.homeStats.turnovers}`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded bg-pine px-4 py-3 text-sm font-black text-white transition hover:bg-ink disabled:opacity-40"
          disabled={activeGame.isFinal}
          onClick={simulateNextPossession}
        >
          <SkipForward size={18} />
          Next possession
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded border border-black/10 bg-white px-4 py-3 text-sm font-black text-ink transition hover:border-pine disabled:opacity-40"
          disabled={activeGame.isFinal}
          onClick={simulateGameToFinal}
        >
          <FastForward size={18} />
          Sim to final
        </button>
      </div>
      <div className="max-h-[360px] overflow-auto rounded border border-black/10">
        {activeGame.playByPlay.length ? (
          activeGame.playByPlay.map((event) => (
            <div
              key={event.id}
              className={`grid grid-cols-[68px_1fr_64px] gap-3 border-b border-black/10 px-3 py-2 text-sm ${
                event.importance === "swing" ? "bg-mint" : event.importance === "score" ? "bg-chalk" : "bg-white"
              }`}
            >
              <div className="font-black text-slate-500">Q{event.quarter} {event.clock}</div>
              <div className="font-semibold text-ink">{event.text}</div>
              <div className="text-right font-black">{event.score}</div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-slate-500">Tipoff is ready. Simulate the first possession.</div>
        )}
      </div>
    </div>
  );
}

function ScoreBlock({ label, score, align }: { label: string; score: number; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="text-xs font-black uppercase text-white/70">{label}</div>
      <div className="text-5xl font-black leading-none">{score}</div>
    </div>
  );
}
