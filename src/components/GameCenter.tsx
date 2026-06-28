import { useEffect, useRef, useState } from "react";
import { FastForward, Gauge, Pause, Play } from "lucide-react";
import { getTeam, formatTeam } from "../game/data/selectors";
import { formatClock, shootingLine } from "../game/simulation/engine";
import { useCareerStore } from "../store/careerStore";
import { Metric } from "./Metric";

type Speed = 1 | 2 | 4;
const SPEED_MS: Record<Speed, number> = { 1: 700, 2: 300, 4: 120 };

export function GameCenter() {
  const teams = useCareerStore((s) => s.teams);
  const season = useCareerStore((s) => s.season);
  const players = useCareerStore((s) => s.players);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const activeGame = useCareerStore((s) => s.activeGame);
  const startNextGame = useCareerStore((s) => s.startNextGame);
  const simulateNextPossession = useCareerStore((s) => s.simulateNextPossession);
  const simulateGameToFinal = useCareerStore((s) => s.simulateGameToFinal);
  const substitutePlayer = useCareerStore((s) => s.substitutePlayer);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [showSubs, setShowSubs] = useState(false);
  const [subOutId, setSubOutId] = useState<string | null>(null);

  const simRef = useRef(simulateNextPossession);
  useEffect(() => { simRef.current = simulateNextPossession; }, [simulateNextPossession]);

  // Auto-sim loop at chosen speed
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => simRef.current(), SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isPlaying, speed]);

  // Pause when game ends
  useEffect(() => {
    if (!activeGame) { setIsPlaying(false); setShowSubs(false); setSubOutId(null); }
    if (activeGame?.isFinal) setIsPlaying(false);
  }, [activeGame]);

  const nextGame = season.schedule.find(
    (g) => !g.played && (g.homeTeamId === selectedTeamId || g.awayTeamId === selectedTeamId),
  );

  const gamesPlayed = season.schedule.filter(
    (g) => g.played && (g.homeTeamId === selectedTeamId || g.awayTeamId === selectedTeamId),
  ).length;
  const totalGames = season.schedule.filter(
    (g) => g.homeTeamId === selectedTeamId || g.awayTeamId === selectedTeamId,
  ).length;

  if (!activeGame) {
    const record = season.records[selectedTeamId] ?? { wins: 0, losses: 0 };
    return (
      <div className="grid gap-4">
        {/* Season progress */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-chalk p-3 text-center">
            <div className="text-2xl font-black text-pine">{record.wins}</div>
            <div className="text-[11px] font-black uppercase text-slate-500">Wins</div>
          </div>
          <div className="rounded-lg bg-chalk p-3 text-center">
            <div className="text-2xl font-black text-red-500">{record.losses}</div>
            <div className="text-[11px] font-black uppercase text-slate-500">Losses</div>
          </div>
          <div className="rounded-lg bg-chalk p-3 text-center">
            <div className="text-2xl font-black">{totalGames - gamesPlayed}</div>
            <div className="text-[11px] font-black uppercase text-slate-500">Remaining</div>
          </div>
        </div>

        {/* Season progress bar */}
        <div>
          <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-500">
            <span>Season progress</span>
            <span>{gamesPlayed} / {totalGames} games</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-pine transition-all"
              style={{ width: `${totalGames ? (gamesPlayed / totalGames) * 100 : 0}%` }}
            />
          </div>
        </div>

        {nextGame ? (
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <div className="text-xs font-black uppercase text-slate-500">Next Matchup · Day {nextGame.day}</div>
            <div className="mt-1 text-2xl font-black">
              {getTeam(teams, nextGame.awayTeamId).city} {getTeam(teams, nextGame.awayTeamId).name}
              <span className="mx-2 text-slate-400">at</span>
              {getTeam(teams, nextGame.homeTeamId).city} {getTeam(teams, nextGame.homeTeamId).name}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-mint p-4 text-center">
            <div className="text-base font-black text-pine">Season Complete!</div>
            <div className="text-sm text-pine/70">Final record: {record.wins}–{record.losses}</div>
          </div>
        )}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-court px-4 py-3 text-sm font-black text-white transition hover:bg-ink disabled:opacity-40"
          disabled={!nextGame}
          onClick={startNextGame}
        >
          <Play size={18} />
          Start Next Game
        </button>
      </div>
    );
  }

  const homeTeam = getTeam(teams, activeGame.homeTeamId);
  const awayTeam = getTeam(teams, activeGame.awayTeamId);
  const scoreDiff = activeGame.homeStats.points - activeGame.awayStats.points;
  const leading =
    scoreDiff === 0
      ? "Tied"
      : scoreDiff > 0
      ? `${homeTeam.abbreviation} +${scoreDiff}`
      : `${awayTeam.abbreviation} +${Math.abs(scoreDiff)}`;

  // Active players for user team
  const userTeamId = selectedTeamId;
  const isHome = activeGame.homeTeamId === userTeamId;
  const activeIds = Object.keys(activeGame.boxScores).filter((id) => {
    const p = players.find((pl) => pl.id === id);
    return p?.teamId === userTeamId && !activeGame.benchedIds.includes(id);
  });

  // Full bench: players on user team NOT currently active
  const rosterIds = players.filter((p) => p.teamId === userTeamId).map((p) => p.id);
  const trullyBench = rosterIds.filter((id) => !activeIds.includes(id));

  return (
    <div className="grid gap-4">
      {/* Scoreboard */}
      <div className="overflow-hidden rounded-xl bg-pine p-5 text-white">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <ScoreBlock label={formatTeam(awayTeam)} score={activeGame.awayStats.points} align="left" />
          <div className="rounded-lg bg-white/10 px-5 py-3 text-center backdrop-blur">
            <div className="text-[10px] font-black uppercase text-white/60">
              {activeGame.isFinal ? "Final" : `Quarter ${activeGame.quarter}`}
            </div>
            <div className="text-2xl font-black tracking-tight">
              {activeGame.isFinal ? "—" : formatClock(activeGame.clockSeconds)}
            </div>
          </div>
          <ScoreBlock label={formatTeam(homeTeam)} score={activeGame.homeStats.points} align="right" />
        </div>
        <div className="mt-3 text-center text-sm font-bold text-white/70">
          {leading} · Possession #{activeGame.possession}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-2 sm:grid-cols-4">
        <Metric label={awayTeam.abbreviation} value={activeGame.awayStats.points} detail={shootingLine(activeGame.awayStats)} />
        <Metric label={homeTeam.abbreviation} value={activeGame.homeStats.points} detail={shootingLine(activeGame.homeStats)} />
        <Metric label="Reb" value={`${activeGame.awayStats.rebounds}–${activeGame.homeStats.rebounds}`} />
        <Metric label="TO" value={`${activeGame.awayStats.turnovers}–${activeGame.homeStats.turnovers}`} />
      </div>

      {/* Controls */}
      {!activeGame.isFinal ? (
        <div className="grid gap-2">
          {/* Play/Pause + speed */}
          <div className="flex items-center gap-2">
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black text-white transition ${
                isPlaying ? "bg-ink hover:bg-pine" : "bg-pine hover:bg-ink"
              }`}
              onClick={() => setIsPlaying((v) => !v)}
            >
              {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play</>}
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1 rounded-lg border border-black/10 bg-white p-1">
              <Gauge size={14} className="ml-1 text-slate-400" />
              {([1, 2, 4] as Speed[]).map((s) => (
                <button
                  key={s}
                  className={`rounded px-2.5 py-1.5 text-xs font-black transition ${
                    speed === s ? "bg-pine text-white" : "text-slate-500 hover:text-ink"
                  }`}
                  onClick={() => setSpeed(s)}
                >
                  {s}×
                </button>
              ))}
            </div>

            <button
              className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-3 text-sm font-black text-slate-600 transition hover:border-pine"
              title="Simulate to final"
              onClick={() => { setIsPlaying(false); simulateGameToFinal(); }}
            >
              <FastForward size={18} />
            </button>
          </div>

          {/* Substitution toggle */}
          <button
            className={`rounded-lg border px-3 py-2 text-sm font-black transition ${
              showSubs ? "border-court bg-court/10 text-court" : "border-black/10 bg-white text-slate-600 hover:border-court"
            }`}
            onClick={() => { setShowSubs((v) => !v); setSubOutId(null); }}
          >
            {showSubs ? "Close Substitution Panel" : "🔄 Make a Substitution"}
          </button>

          {/* Substitution panel */}
          {showSubs && (
            <div className="rounded-lg border border-black/10 bg-white p-3">
              <div className="mb-3 text-xs font-black uppercase text-slate-500">
                {subOutId ? "Choose player to bring IN" : "Choose player to take OUT"}
              </div>
              {!subOutId ? (
                <div className="grid gap-1">
                  {activeIds.map((id) => {
                    const p = players.find((pl) => pl.id === id);
                    if (!p) return null;
                    const box = activeGame.boxScores[id];
                    const fatiguePct = Math.round((box?.fatigue ?? 0) / 35 * 100);
                    return (
                      <button
                        key={id}
                        className="flex w-full items-center gap-3 rounded border border-black/10 px-3 py-2 text-left hover:border-court"
                        onClick={() => setSubOutId(id)}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-black">{p.name}</span>
                          <span className="ml-2 text-xs text-slate-500">{p.position} · OVR {p.overall}</span>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold text-slate-600">{box?.points ?? 0} pts / {box?.rebounds ?? 0} reb</div>
                          <div className={`font-bold ${fatiguePct > 60 ? "text-red-500" : fatiguePct > 30 ? "text-yellow-600" : "text-green-600"}`}>
                            Fatigue {fatiguePct}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-1">
                  <button
                    className="mb-1 text-left text-xs font-bold text-slate-500 hover:text-ink"
                    onClick={() => setSubOutId(null)}
                  >
                    ← Back
                  </button>
                  {trullyBench.map((id) => {
                    const p = players.find((pl) => pl.id === id);
                    if (!p) return null;
                    return (
                      <button
                        key={id}
                        className="flex w-full items-center gap-3 rounded border border-black/10 px-3 py-2 text-left hover:border-pine hover:bg-mint"
                        onClick={() => {
                          substitutePlayer(subOutId, id);
                          setSubOutId(null);
                          setShowSubs(false);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-black">{p.name}</span>
                          <span className="ml-2 text-xs text-slate-500">{p.position} · OVR {p.overall}</span>
                        </div>
                        <div className="text-xs font-bold text-pine">Sub IN ↑</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-chalk p-4 text-center">
          <div className="text-sm font-black text-slate-600">
            {isHome
              ? activeGame.homeStats.points > activeGame.awayStats.points ? "Victory!" : "Defeat."
              : activeGame.awayStats.points > activeGame.homeStats.points ? "Victory!" : "Defeat."}
            {" "}
            {activeGame.awayStats.points}–{activeGame.homeStats.points} · Press Start Next Game to continue the season.
          </div>
        </div>
      )}

      {/* Play-by-play */}
      <div className="max-h-[320px] overflow-auto rounded-lg border border-black/10">
        {activeGame.playByPlay.length ? (
          activeGame.playByPlay.map((event) => (
            <div
              key={event.id}
              className={`grid grid-cols-[72px_1fr_60px] gap-2 border-b border-black/10 px-3 py-2 text-sm last:border-b-0 ${
                event.importance === "swing"
                  ? "bg-mint"
                  : event.importance === "score"
                  ? "bg-chalk"
                  : "bg-white"
              }`}
            >
              <div className="text-xs font-black text-slate-500">Q{event.quarter} {event.clock}</div>
              <div className="font-semibold text-ink">{event.text}</div>
              <div className="text-right text-xs font-black">{event.score}</div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-slate-500">Press Play to start the game.</div>
        )}
      </div>
    </div>
  );
}

function ScoreBlock({ label, score, align }: { label: string; score: number; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="text-[11px] font-black uppercase text-white/60">{label}</div>
      <div className="text-5xl font-black leading-none">{score}</div>
    </div>
  );
}
