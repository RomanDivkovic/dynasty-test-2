import { useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { getRoster, formatTeam } from "../game/data/selectors";
import { useCareerStore } from "../store/careerStore";
import type { Player } from "../game/types/domain";

export function TradeCenter() {
  const teams = useCareerStore((s) => s.teams);
  const players = useCareerStore((s) => s.players);
  const selectedTeamId = useCareerStore((s) => s.selectedTeamId);
  const scoutTeamId = useCareerStore((s) => s.scoutTeamId);
  const setScoutTeam = useCareerStore((s) => s.setScoutTeam);
  const proposeTrade = useCareerStore((s) => s.proposeTrade);
  const lastTradeResult = useCareerStore((s) => s.lastTradeResult);
  const clearTradeResult = useCareerStore((s) => s.clearTradeResult);

  const [offeredIds, setOfferedIds] = useState<string[]>([]);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  const otherTeams = teams.filter((t) => t.id !== selectedTeamId);
  const targetTeamId = scoutTeamId || otherTeams[0]?.id || "";
  const myRoster = getRoster(players, selectedTeamId);
  const theirRoster = getRoster(players, targetTeamId);
  const targetTeam = teams.find((t) => t.id === targetTeamId);

  const offered = players.filter((p) => offeredIds.includes(p.id));
  const requested = players.filter((p) => requestedIds.includes(p.id));
  const offerValue = offered.reduce((s, p) => s + p.overall, 0);
  const requestValue = requested.reduce((s, p) => s + p.overall, 0);
  const fairness = offerValue > 0 && requestValue > 0 ? requestValue - offerValue : null;

  const toggleOffered = (id: string) =>
    setOfferedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleRequested = (id: string) =>
    setRequestedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handlePropose = () => {
    proposeTrade(offeredIds, requestedIds, targetTeamId);
    setOfferedIds([]);
    setRequestedIds([]);
  };

  return (
    <div className="grid gap-4">
      {/* Trade result banner */}
      {lastTradeResult && (
        <div
          className={`flex items-start justify-between rounded-lg p-4 ${
            lastTradeResult.accepted ? "bg-mint text-pine" : "bg-red-50 text-red-800"
          }`}
        >
          <div className="text-sm font-bold">{lastTradeResult.message}</div>
          <button className="ml-3 shrink-0 opacity-60 hover:opacity-100" onClick={clearTradeResult}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Target team */}
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">Trade with Team</label>
        <select
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
          value={targetTeamId}
          onChange={(e) => { setScoutTeam(e.target.value); setOfferedIds([]); setRequestedIds([]); }}
        >
          {otherTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {formatTeam(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Trade builder */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
        {/* My players */}
        <PlayerPickerTable
          title="You Offer"
          players={myRoster}
          selected={offeredIds}
          onToggle={toggleOffered}
          totalValue={offerValue}
        />

        <div className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chalk text-slate-500">
            <ArrowLeftRight size={18} />
          </div>
        </div>

        {/* Their players */}
        <PlayerPickerTable
          title={`You Request (${targetTeam?.abbreviation ?? ""})`}
          players={theirRoster}
          selected={requestedIds}
          onToggle={toggleRequested}
          totalValue={requestValue}
        />
      </div>

      {/* Value indicator */}
      {fairness !== null && (
        <div
          className={`rounded-lg p-3 text-sm font-bold ${
            Math.abs(fairness) <= 8 ? "bg-mint text-pine" : fairness > 8 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
          }`}
        >
          {Math.abs(fairness) <= 8 && "✓ Fair deal — AI will likely accept."}
          {fairness > 8 && `✗ You're asking for ${fairness} more value than you're offering. AI will reject.`}
          {fairness < -8 && `↑ You're giving away ${Math.abs(fairness)} more value. Very favorable for them.`}
        </div>
      )}

      {/* Propose button */}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-pine px-4 py-3 text-sm font-black text-white transition hover:bg-ink disabled:opacity-40"
        disabled={!offeredIds.length || !requestedIds.length}
        onClick={handlePropose}
      >
        <ArrowLeftRight size={18} />
        Propose Trade
      </button>
    </div>
  );
}

function PlayerPickerTable({
  title,
  players,
  selected,
  onToggle,
  totalValue,
}: {
  title: string;
  players: Player[];
  selected: string[];
  onToggle: (id: string) => void;
  totalValue: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="flex items-center justify-between bg-chalk px-3 py-2">
        <span className="text-xs font-black uppercase text-slate-500">{title}</span>
        {totalValue > 0 && (
          <span className="text-xs font-black text-slate-600">Val: {totalValue}</span>
        )}
      </div>
      <div className="max-h-72 overflow-auto">
        {players.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              className={`flex w-full items-center gap-3 border-t border-black/10 px-3 py-2 text-left transition ${
                isSelected ? "bg-mint" : "bg-white hover:bg-chalk"
              }`}
              onClick={() => onToggle(p.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black">{p.name}</div>
                <div className="text-xs text-slate-500">{p.position} · {p.age}yr</div>
              </div>
              <div className="shrink-0 text-sm font-black text-slate-700">OVR {p.overall}</div>
              {isSelected && (
                <div className="shrink-0 h-4 w-4 rounded-full bg-pine" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
